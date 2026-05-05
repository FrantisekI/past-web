"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

type Lang = "en" | "cz";

type ComparisonQuestion = {
  type: "comparison+estimate";
  title: string;
  context?: string;
  comparison: string;
  comparison_labels: [string, string];
  estimate: string;
  units: string;
};

type EstimateQuestion = {
  type?: "estimate";
  title: string;
  context?: string;
  estimate?: string;
  text?: string;
  units?: string;
};

type SourceQuestion = ComparisonQuestion | EstimateQuestion;

type Step =
  | { kind: "comparison"; sourceIndex: number; question: ComparisonQuestion }
  | { kind: "estimate"; sourceIndex: number; question: SourceQuestion };

type AnswerMap = {
  [sourceIndex: number]: {
    comparison?: string | null;
    estimate?: string;
  };
};

// ── UI strings ─────────────────────────────────────────────────────────────────

const UI = {
  en: {
    breadcrumb: "survey",
    heading: "Questionnaire",
    step: (cur: number, total: number) => `Step ${cur} of ${total}`,
    start: "Start →",
    next: "Next →",
    submit: "Submit",
    selectHint: "select an option to continue",
    valueHint: "enter a value to continue",
    emailLabel: "Email address",
    emailPlaceholder: "your@email.com",
    emailNote: "Optional. Leave it if you'd like to receive the results of the study once it's complete.",
    introPitch: "This is a short study on estimation. There are no right or wrong answers — just go with your gut feeling. It takes about 3 minutes.",
    thanksHeading: "Thank you.",
    thanksWithEmail: (e: string) => `Your responses have been recorded. We'll send the results to ${e}.`,
    thanksAnon: "Your responses have been recorded anonymously.",
    alreadyFilled: "Already filled out? →",
    confirmHeading: "Are you sure?",
    confirmText: "The results page might contain spoilers for the study. We recommend viewing it only after completing the questionnaire.",
    confirmYes: "Yes, show results",
    confirmNo: "No, take me back",
    done: "✓",
    partA: " — A",
    partB: " — B",
    viewResults: "View Results →",
    errorLoading: "Failed to load survey. Please try refreshing the page.",
    lastQuestionTitle: "Final Thoughts",
    lastQuestionText: "Any other comments or observations about the survey?",
  },
  cz: {
    breadcrumb: "dotazník",
    heading: "Dotazník",
    step: (cur: number, total: number) => `Krok ${cur} z ${total}`,
    start: "Začít →",
    next: "Další →",
    submit: "Odeslat",
    selectHint: "vyberte možnost pro pokračování",
    valueHint: "zadejte hodnotu pro pokračování",
    emailLabel: "E-mailová adresa",
    emailPlaceholder: "vas@email.cz",
    emailNote: "Nepovinné. Zadejte, pokud chcete obdržet výsledky studie po jejím dokončení.",
    introPitch: "Toto je krátká studie o odhadování. Neexistují správné ani špatné odpovědi — jen se řiďte svým instinktem. Zabere přibližně 3 minuty.",
    thanksHeading: "Děkujeme.",
    thanksWithEmail: (e: string) => `Vaše odpovědi byly zaznamenány. Výsledky zašleme na ${e}.`,
    thanksAnon: "Vaše odpovědi byly zaznamenány anonymně.",
    alreadyFilled: "Již jste vyplnili? →",
    confirmHeading: "Jste si jistí?",
    confirmText: "Stránka s výsledky může obsahovat informace, které by mohly ovlivnit vaše odpovědi. Doporučujeme ji zobrazit až po vyplnění dotazníku.",
    confirmYes: "Ano, zobrazit výsledky",
    confirmNo: "Ne, zpět",
    done: "✓",
    partA: " — A",
    partB: " — B",
    viewResults: "Zobrazit výsledky →",
    errorLoading: "Nepodařilo se načíst dotazník. Zkuste prosím obnovit stránku.",
    lastQuestionTitle: "Závěrečné postřehy",
    lastQuestionText: "Máte nějaké další komentáře nebo postřehy k dotazníku?",
  },
} as const;

// ── Question data ──────────────────────────────────────────────────────────────

// Dynamic loading via API
type QuestionId = string;

// ── Build flat step list ───────────────────────────────────────────────────────

function buildSteps(ids: QuestionId[], questions: Record<QuestionId, SourceQuestion>): Step[] {
  const steps: Step[] = [];
  ids.forEach((id, i) => {
    const q = questions[id];
    if (!q) return;
    if ("comparison" in q && q.comparison) {
      steps.push({ kind: "comparison", sourceIndex: i, question: q as ComparisonQuestion });
      steps.push({ kind: "estimate", sourceIndex: i, question: q as ComparisonQuestion });
    } else {
      steps.push({ kind: "estimate", sourceIndex: i, question: q as EstimateQuestion });
    }
  });
  return steps;
}

function stepComplete(step: Step, answers: AnswerMap, isLast: boolean): boolean {
  const a = answers[step.sourceIndex];
  if (step.kind === "comparison") return typeof a?.comparison !== 'undefined' && a.comparison !== null;
  // Only the very last step is optional
  if (step.kind === "estimate") return isLast || !!(a?.estimate?.trim());
  return false;
}

// ── Language switcher ─────────────────────────────────────────────────────────

function LangSwitcher({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex gap-1 font-mono text-xs font-bold">
      {(["en", "cz"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 border tracking-widest uppercase transition-colors duration-150
            ${lang === l
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-400 hover:border-neutral-600 hover:text-neutral-700"
            }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

// ── Intro screen ───────────────────────────────────────────────────────────────

function IntroScreen({
  lang,
  setLang,
  onStart,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onStart: (email: string, id: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [id, setId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const t = UI[lang];

  useEffect(() => {
    // Generate a random 6-character alphanumeric ID
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setId(randomId);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-8">
          <div className="font-mono text-xs tracking-widest text-neutral-400 uppercase">
            {t.breadcrumb}
          </div>
          <LangSwitcher lang={lang} setLang={setLang} />
        </div>

        <h1 className="font-mono text-3xl font-black text-neutral-900 tracking-tight mb-3">
          {t.heading}
        </h1>
        <p className="text-lg font-semibold text-neutral-600 leading-relaxed mb-10">
          {t.introPitch}
        </p>

        <div className="space-y-6 mb-10">
          <div className="border-2 border-neutral-900 p-6 bg-white">
            <label className="font-mono text-sm font-bold tracking-widest uppercase text-neutral-500 block mb-3">
              {t.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full border-b-4 border-neutral-400 bg-transparent font-mono text-xl font-bold py-2 px-1 focus:outline-none focus:border-neutral-900 placeholder-neutral-300"
            />
            <p className="font-mono text-sm text-neutral-400 mt-3 leading-relaxed">
              {t.emailNote}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            disabled={!id}
            onClick={() => onStart(email.trim(), id)}
            className="font-mono text-base font-black tracking-widest uppercase px-8 py-4 border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900 transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t.start}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="font-mono text-base font-black tracking-widest uppercase px-8 py-4 border-2 border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-900 hover:text-white transition-all duration-150 cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {t.alreadyFilled}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-sm">
          <div className="max-w-md w-full border-4 border-neutral-900 bg-white p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
            <h2 className="font-mono text-2xl font-black text-neutral-900 uppercase mb-4 border-b-4 border-neutral-900 pb-2">
              {t.confirmHeading}
            </h2>
            <p className="text-lg font-semibold text-neutral-600 leading-relaxed mb-8">
              {t.confirmText}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                href="/results"
                className="w-full text-center font-mono text-base font-black tracking-widest uppercase px-6 py-4 border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900 transition-all duration-150"
              >
                {t.confirmYes}
              </Link>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="w-full text-center font-mono text-base font-black tracking-widest uppercase px-6 py-4 border-2 border-neutral-300 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900 transition-all duration-150"
              >
                {t.confirmNo}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step card ─────────────────────────────────────────────────────────────────

function StepCard({
  step,
  stepNumber,
  totalSteps,
  answers,
  onChange,
  isActive,
  isDone,
  lang,
}: {
  step: Step;
  stepNumber: number;
  totalSteps: number;
  answers: AnswerMap;
  onChange: (sourceIndex: number, patch: Partial<AnswerMap[number]>) => void;
  isActive: boolean;
  isDone: boolean;
  lang: Lang;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = UI[lang];

  useEffect(() => {
    if (isActive && ref.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  }, [isActive]);

  const a = answers[step.sourceIndex] ?? {};
  const titleSuffix =
    step.kind === "comparison"
      ? t.partA
      : "comparison" in step.question
      ? t.partB
      : "";
  
  const isLast = stepNumber === totalSteps;

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ${isDone && !isActive ? "opacity-30" : "opacity-100"}`}
    >
      <div className="flex items-baseline gap-4 mb-3">
        <span className="font-mono text-sm font-bold text-neutral-400 tabular-nums select-none">
          {String(stepNumber).padStart(2, "0")}&nbsp;/&nbsp;{String(totalSteps).padStart(2, "0")}
        </span>
        <span className="font-mono text-sm font-bold tracking-widest uppercase text-neutral-500">
          {step.question.title}{titleSuffix}
        </span>
        {isDone && !isActive && (
          <span className="ml-auto font-mono text-sm text-emerald-700 font-bold">{t.done}</span>
        )}
      </div>

      <div
        className={`border-2 transition-colors duration-300 p-6 bg-white ${
          isActive ? "border-neutral-900" : "border-neutral-200"
        }`}
      >
        {"context" in step.question && step.question.context && step.kind !== "estimate" && (
          <p className="font-mono text-base text-neutral-500 mb-5 leading-relaxed border-l-4 border-neutral-300 pl-4">
            {step.question.context}
          </p>
        )}

        {step.kind === "comparison" && (
          <ComparisonField
            question={step.question as ComparisonQuestion}
            selected={a.comparison ?? null}
            onChange={(v) => onChange(step.sourceIndex, { comparison: v })}
            isActive={isActive}
          />
        )}

        {step.kind === "estimate" && (
          <EstimateField
            question={step.question}
            value={a.estimate ?? ""}
            onChange={(v) => onChange(step.sourceIndex, { estimate: v })}
            isActive={isActive}
            isLast={isLast}
          />
        )}
      </div>
    </div>
  );
}

// ── Field components ──────────────────────────────────────────────────────────

function ComparisonField({
  question,
  selected,
  onChange,
  isActive,
}: {
  question: ComparisonQuestion;
  selected: string | null;
  onChange: (v: string) => void;
  isActive: boolean;
}) {
  return (
    <div className="space-y-6">
      <p className="text-xl font-semibold leading-snug text-neutral-900">
        {question.comparison}
      </p>
      <div className="flex gap-4 flex-wrap">
        {question.comparison_labels.map((label, idx) => {
          // Use index as normalized value for selection stability across languages
          const val = String(idx);
          const isSelected = selected === val;
          return (
            <button
              key={val}
              type="button"
              disabled={!isActive}
              onClick={() => onChange(val)}
              className={`flex items-center gap-3 px-6 py-4 border-2 font-mono text-lg font-bold tracking-wider transition-all duration-150 disabled:cursor-default min-w-[130px]
                ${isSelected
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-400 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50"
                }`}
            >
              <span
                className={`w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center
                  ${isSelected ? "border-white" : "border-neutral-500"}`}
              >
                {isSelected && <span className="w-2 h-2 bg-white block" />}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EstimateField({
  question,
  value,
  onChange,
  isActive,
  isLast,
}: {
  question: SourceQuestion;
  value: string;
  onChange: (v: string) => void;
  isActive: boolean;
  isLast: boolean;
}) {
  const qText = ("estimate" in question ? question.estimate : "") || ("text" in question ? question.text : "");

  return (
    <div className="space-y-5">
      {"context" in question && question.context && (
        <p className="font-mono text-base text-neutral-500 leading-relaxed border-l-4 border-neutral-300 pl-4">
          {question.context}
        </p>
      )}
      <p className="text-xl font-semibold leading-snug text-neutral-900">
        {qText}
      </p>
      <div className="flex items-center gap-4">
        <input
          type={isLast ? "text" : "number"}
          disabled={!isActive}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="?"
          className={`${isLast ? "w-full max-w-md" : "w-44"} border-b-4 border-neutral-400 bg-transparent font-mono text-2xl font-bold py-2 px-1 focus:outline-none focus:border-neutral-900 placeholder-neutral-300 disabled:opacity-40`}
        />
        {question.units && (
          <span className="font-mono text-base font-bold text-neutral-500">
            {question.units}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StatProjPage() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [email, setEmail] = useState<string | null>(null);
  const [contestantId, setContestantId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  
  const [assignedIds, setAssignedIds] = useState<QuestionId[]>([]);
  const [allQuestions, setAllQuestions] = useState<Record<QuestionId, SourceQuestion>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [activeStep, setActiveStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Fetch questions whenever language changes
  useEffect(() => {
    if (contestantId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetch(`/api/questions?lang=${lang}`)
        .then(res => res.json())
        .then(data => {
          setAllQuestions(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setError(true);
          setLoading(false);
        });
    }
  }, [lang, contestantId]);

  const handleStart = async (userEmail: string, userId: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/survey?id=${userId}`);
      const data = await res.json();
      if (data.assignment) {
        setAssignedIds(data.assignment);
        setContestantId(userId);
        setEmail(userEmail);
        setStartedAt(new Date().toISOString());
      } else {
        setError(true);
      }
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const steps = buildSteps(assignedIds, allQuestions);

  const patch = (sourceIndex: number, p: Partial<AnswerMap[number]>) => {
    setAnswers((prev) => ({ ...prev, [sourceIndex]: { ...prev[sourceIndex], ...p } }));
  };

  const isLast = activeStep === steps.length - 1;
  const canProceed = steps[activeStep] ? stepComplete(steps[activeStep], answers, isLast) : false;
  const t = UI[lang];

  const proceed = () => {
    if (!isLast) setActiveStep((i) => i + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contestantId,
          email,
          language: lang,
          answers,
          startedAt,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (contestantId === null) {
    return (
      <div className="relative">
        {loading && (
          <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center font-mono font-bold uppercase tracking-widest">
            Loading...
          </div>
        )}
        <IntroScreen
          lang={lang}
          setLang={setLang}
          onStart={handleStart}
        />
        {error && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-100 border-2 border-red-900 p-4 font-mono text-red-900 font-bold">
            {t.errorLoading}
          </div>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-8">
        <div className="max-w-lg text-center space-y-8">
          <div className="font-mono text-sm tracking-widest text-neutral-400 uppercase">
            survey
          </div>
          <h1 className="font-mono text-4xl font-black text-neutral-900">{t.thanksHeading}</h1>
          <p className="text-lg font-semibold text-neutral-600 leading-relaxed">
            {email ? t.thanksWithEmail(email) : t.thanksAnon}
          </p>
          <div className="pt-4">
            <Link 
              href="/results"
              className="font-mono text-base font-black tracking-widest uppercase px-8 py-4 border-2 border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900 transition-all duration-150 cursor-pointer"
            >
              {t.viewResults}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {loading && (
        <div className="fixed inset-0 bg-white/20 z-50 flex items-center justify-center font-mono font-bold uppercase tracking-widest">
          Loading...
        </div>
      )}
      
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-200 z-50">
        <div
          className="h-full bg-neutral-900 transition-all duration-500"
          style={{ width: `${((activeStep + 1) / Math.max(steps.length, 1)) * 100}%` }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-14">
          <div>
            <div className="font-mono text-xs tracking-widest text-neutral-400 uppercase mb-3">
              {t.breadcrumb}
            </div>
            <h1 className="font-mono text-2xl font-black text-neutral-900 tracking-tight">
              {t.heading}
            </h1>
            <p className="font-mono text-base font-bold text-neutral-500 mt-1">
              {t.step(activeStep + 1, steps.length)}
            </p>
          </div>
          <div className="mt-1">
            <LangSwitcher lang={lang} setLang={setLang} />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-10">
          {steps.slice(0, activeStep + 1).map((step, i) => (
            <StepCard
              key={i}
              step={step}
              stepNumber={i + 1}
              totalSteps={steps.length}
              answers={answers}
              onChange={patch}
              isActive={i === activeStep}
              isDone={i < activeStep || stepComplete(step, answers, i === steps.length - 1)}
              lang={lang}
            />
          ))}
        </div>

        {/* Next / Submit */}
        {steps.length > 0 && (
          <div className="mt-10 flex items-center gap-6">
            <button
              type="button"
              onClick={proceed}
              disabled={!canProceed}
              className={`font-mono text-base font-black tracking-widest uppercase px-8 py-4 border-2 transition-all duration-150
                ${canProceed
                  ? "border-neutral-900 bg-neutral-900 text-white hover:bg-white hover:text-neutral-900 cursor-pointer"
                  : "border-neutral-200 text-neutral-300 cursor-not-allowed"
                }`}
            >
              {isLast ? t.submit : t.next}
            </button>

            {!canProceed && (
              <span className="font-mono text-sm font-bold text-neutral-400">
                {steps[activeStep].kind === "comparison" ? t.selectHint : t.valueHint}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
