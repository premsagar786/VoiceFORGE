const steps = [
  {
    title: "1. Describe",
    body: "One sentence: \u201cA friendly dental receptionist that books appointments\u201d — VoiceForge drafts the whole agent config.",
  },
  {
    title: "2. Talk",
    body: "Speak to your agent live in the browser. English and Hindi, with live transcript and latency badges.",
  },
  {
    title: "3. Refine",
    body: "\u201cMake it friendlier\u201d — natural-language instructions become config patches with version history and undo.",
  },
  {
    title: "4. Ship",
    body: "Deploy as a shareable link or drop-in widget script. Every call lands in your dashboard with transcript and outcome tags.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Hackathon MVP
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
          VoiceForge
        </h1>
        <p className="text-lg text-neutral-600">
          Describe a voice AI agent in one sentence. Talk to it. Refine it. Ship it.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.title}
            className="rounded-xl border border-neutral-200 bg-white p-5 text-left shadow-sm"
          >
            <h2 className="mb-1 font-semibold text-neutral-900">{step.title}</h2>
            <p className="text-sm text-neutral-600">{step.body}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-neutral-500">
        Demo login (after <code className="rounded bg-neutral-100 px-1.5 py-0.5">pnpm db:seed</code>):
        <span className="mx-1 font-mono text-neutral-800">demo@voiceforge.app</span>/
        <span className="ml-1 font-mono text-neutral-800">voiceforge-demo</span>
      </p>
    </main>
  );
}
