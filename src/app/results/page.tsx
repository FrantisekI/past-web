import Link from "next/link";

export default function ResultsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center p-8">
      <div className="max-w-xl w-full border-8 border-black bg-white p-12 text-center shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        <div className="font-mono text-sm font-black tracking-widest bg-black text-white px-4 py-1 uppercase inline-block mb-8">
          results
        </div>
        <h1 className="font-mono text-5xl font-black text-black uppercase mb-8 border-b-8 border-black pb-4">
          Results Coming Soon
        </h1>
        <p className="text-xl font-serif font-medium text-black leading-relaxed mb-12">
          We are currently processing the data. Once the study is complete, the aggregated results will be displayed here.
        </p>
        <Link 
          href="/"
          className="inline-block font-mono text-xl font-black tracking-widest uppercase px-10 py-5 border-4 border-black bg-black text-white hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
