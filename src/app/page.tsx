import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

export default async function HomePage() {
  const filePath = path.join(process.cwd(), "content", "cv.md");
  let content = "";
  
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch {
    content = "# Welcome\nContent not found.";
  }

  return (
    <main className="min-h-screen bg-neutral-50 p-8 md:p-24 font-serif">
      <div className="max-w-3xl mx-auto border-2 border-neutral-900 bg-white p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
        <header className="mb-12 flex justify-between items-start">
          <div className="font-mono text-xs uppercase tracking-widest bg-neutral-900 text-white px-3 py-1">
            Portfolio / CV
          </div>
          <Link 
            href="/stat-proj"
            className="font-mono text-xs uppercase tracking-widest border-2 border-neutral-900 px-4 py-2 hover:bg-neutral-900 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Go to Survey →
          </Link>
        </header>

        <article className="prose prose-neutral max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="font-mono text-4xl font-black uppercase mb-8 border-b-4 border-neutral-900 pb-4">{children}</h1>,
              h2: ({ children }) => <h2 className="font-mono text-xl font-bold uppercase mb-4 mt-12 text-neutral-500 tracking-widest">{children}</h2>,
              h3: ({ children }) => <h3 className="font-mono text-lg font-bold uppercase mb-2 mt-8">{children}</h3>,
              p: ({ children }) => <p className="text-lg leading-relaxed mb-6 text-neutral-800">{children}</p>,
              ul: ({ children }) => <ul className="list-square pl-6 mb-6 space-y-3">{children}</ul>,
              li: ({ children }) => <li className="text-lg text-neutral-700">{children}</li>,
              strong: ({ children }) => <strong className="font-bold text-neutral-900">{children}</strong>,
            }}
          >
            {content}
          </ReactMarkdown>
        </article>
      </div>
    </main>
  );
}
