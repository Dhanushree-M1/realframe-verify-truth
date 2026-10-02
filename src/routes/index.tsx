import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Upload, FileVideo, ImageIcon, X, Check, Loader2, ExternalLink, ArrowLeft, Sparkles,
  CircleCheck, CircleX, CircleHelp, Search, ScanText, GitCompare, MessageSquareText,
} from "lucide-react";
import { verifyClaim } from "@/lib/verify.functions";
import { DEMO_CLAIM, type VerifyResult, type CheckStatus, type Verdict } from "@/lib/verify-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "REALFRAME — Verify the story, not just the pixels" },
      { name: "description", content: "Upload viral media, enter the claim, and get an explainable verdict backed by web and news evidence." },
      { property: "og:title", content: "REALFRAME — Contextual media verification" },
      { property: "og:description", content: "When the pixels are real, but the story isn't." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STAGES = ["Understanding claim", "Searching the web", "Comparing evidence", "Preparing explanation"];

function Index() {
  const verify = useServerFn(verifyClaim);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [claim, setClaim] = useState("");
  const [phase, setPhase] = useState<"input" | "loading" | "result">("input");
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  async function run(demo = false, claimText = claim) {
    if (claimText.trim().length < 5) return setError("Enter the claim made about this media.");
    setError(null);
    setPhase("loading");
    setStage(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900);
    try {
      const mediaType = file ? (file.type.startsWith("video") ? "video" : "image") : "none";
      const [r] = await Promise.all([
        verify({ data: { claim: claimText, mediaType, mediaName: file?.name ?? null, demo } }),
        new Promise((res) => setTimeout(res, 3600)),
      ]);
      setResult(r);
      setPhase("result");
    } catch (e) {
      console.error(e);
      setError("Verification failed. Please try again.");
      setPhase("input");
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <button onClick={() => setPhase("input")} className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md border-2 border-foreground">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          </span>
          <span className="font-mono text-sm font-medium tracking-[0.2em]">REALFRAME</span>
        </button>
        <span className="hidden font-mono text-xs text-muted-foreground sm:block">SerpApi India Hackathon · MVP</span>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-20">
        {phase === "loading" && <LoadingView stage={stage} />}
        {phase === "result" && result && (
          <ResultView result={result} claim={claim} preview={preview} file={file} onBack={() => setPhase("input")} />
        )}
        {phase === "input" && (
          <>
            <section className="grid gap-10 pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-12">
              <div className="animate-rise">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Verify the story, not just the pixels</p>
                <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
                  When the pixels are real, <em className="text-primary">but the story isn't.</em>
                </h1>
                <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                  Most viral misinformation isn't a deepfake — it's genuine footage with a false caption.
                  REALFRAME checks the <strong className="text-foreground">context</strong>: who, where and when, against what the web actually reports.
                </p>
                <div className="mt-8 flex flex-wrap gap-6 font-mono text-xs text-muted-foreground">
                  <span>↳ Web + news search</span><span>↳ Date & location checks</span><span>↳ Earlier-occurrence lookup</span>
                </div>
              </div>

              <div className="animate-rise rounded-2xl border bg-card p-5 shadow-card sm:p-6" style={{ animationDelay: "80ms" }}>
                <Dropzone file={file} preview={preview} onFile={setFile} />
                <label className="mt-5 block text-sm font-semibold">What is the claim?</label>
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  rows={4}
                  placeholder='e.g. "This video shows flooding in Mumbai this week."'
                  className="mt-2 w-full resize-none rounded-lg border bg-background px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20"
                />
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button size="lg" className="flex-1" onClick={() => run(false)}>
                    <Search /> Verify claim
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => { setClaim(DEMO_CLAIM); run(true, DEMO_CLAIM); }}>
                    <Sparkles /> Try demo case
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Media is optional for the demo. Files stay in your browser.</p>
              </div>
            </section>
            <HowItWorks />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function Dropzone({ file, preview, onFile }: { file: File | null; preview: string | null; onFile: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  if (file && preview) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-muted">
        {file.type.startsWith("video") ? (
          <video src={preview} className="aspect-video w-full object-cover" controls muted />
        ) : (
          <img src={preview} alt="Uploaded media" className="aspect-video w-full object-cover" />
        )}
        <div className="flex items-center justify-between gap-2 border-t bg-card px-3 py-2 text-xs">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            {file.type.startsWith("video") ? <FileVideo className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
            <span className="truncate">{file.name}</span>
          </span>
          <button onClick={() => onFile(null)} aria-label="Remove file" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-10 text-center transition",
        over ? "border-primary bg-accent" : "hover:border-primary/50 hover:bg-muted/60",
      )}
    >
      <Upload className="h-6 w-6 text-primary" />
      <span className="text-sm font-semibold">Drop an image or video</span>
      <span className="text-xs text-muted-foreground">or click to browse · JPG, PNG, MP4, MOV</span>
      <input ref={ref} type="file" accept="image/*,video/*" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </button>
  );
}

function LoadingView({ stage }: { stage: number }) {
  return (
    <div className="mx-auto max-w-md animate-rise pt-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Verifying</p>
      <h2 className="mt-3 font-display text-4xl">Checking the story…</h2>
      <ol className="mt-8 space-y-3">
        {STAGES.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition", i > stage && "opacity-40")}>
            {i < stage ? <Check className="h-4 w-4 text-success" /> : i === stage ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <span className="h-4 w-4 rounded-full border" />}
            <span className={i === stage ? "font-semibold" : ""}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const VERDICT_STYLE: Record<Verdict, { cls: string; label: string; desc: string }> = {
  SUPPORTED: { cls: "bg-success/10 text-success border-success/30", label: "Supported", desc: "Evidence matches the claimed context." },
  CONTRADICTED: { cls: "bg-destructive/10 text-destructive border-destructive/30", label: "Contradicted", desc: "Evidence disputes key details." },
  MISCONTEXTUALIZED: { cls: "bg-warning/15 text-foreground border-warning/40", label: "Miscontextualized", desc: "Real media, wrong context." },
  UNVERIFIED: { cls: "bg-muted text-muted-foreground border-border", label: "Unverified", desc: "Not enough indexed evidence." },
};

const CHECK_LABELS: Record<keyof VerifyResult["checks"], [string, string]> = {
  corroboration: ["News corroboration", "Independent outlets report this event"],
  dateMatch: ["Date match", "Coverage dates align with the claimed time"],
  locationMatch: ["Location match", "Coverage refers to the claimed place"],
  earlierOccurrence: ["No earlier occurrence", "Media hasn't circulated before with another story"],
};

function StatusIcon({ s }: { s: CheckStatus }) {
  if (s === "pass") return <CircleCheck className="h-5 w-5 shrink-0 text-success" />;
  if (s === "fail") return <CircleX className="h-5 w-5 shrink-0 text-destructive" />;
  return <CircleHelp className="h-5 w-5 shrink-0 text-muted-foreground" />;
}

function ResultView({ result, claim, preview, file, onBack }: { result: VerifyResult; claim: string; preview: string | null; file: File | null; onBack: () => void }) {
  const v = VERDICT_STYLE[result.verdict];
  return (
    <div className="animate-rise pt-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> New verification</button>

      {result.isDemo && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <strong>Demo data — not a live verification.</strong> Sources below are illustrative. Configure a SerpApi key on the server for live results.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border bg-card p-6 shadow-card">
          <span className={cn("inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs font-medium tracking-wider", v.cls)}>{result.verdict}</span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">{v.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
          <div className="mt-5">
            <div className="flex justify-between font-mono text-xs text-muted-foreground"><span>Confidence</span><span>{Math.round(result.confidence * 100)}%</span></div>
            <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${result.confidence * 100}%` }} /></div>
          </div>
          <p className="mt-6 leading-relaxed">{result.summary}</p>
          <div className="mt-6 rounded-lg bg-muted px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Original claim</p>
            <p className="mt-1 text-sm italic">"{claim}"</p>
          </div>
        </div>

        <div className="space-y-6">
          {preview && file && (
            <div className="overflow-hidden rounded-2xl border bg-card">
              {file.type.startsWith("video") ? <video src={preview} className="aspect-video w-full object-cover" muted controls /> : <img src={preview} alt="Submitted media" className="aspect-video w-full object-cover" />}
            </div>
          )}
          <div className="rounded-2xl border bg-card p-5">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Extracted claim facts</p>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              {(["who", "what", "where", "when"] as const).map((k) => (
                <div key={k} className="contents"><dt className="font-mono text-xs uppercase text-muted-foreground">{k}</dt><dd>{result.claimFacts[k] ?? "—"}</dd></div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <h3 className="font-display text-3xl">Why this verdict?</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(Object.keys(CHECK_LABELS) as (keyof VerifyResult["checks"])[]).map((k) => (
            <div key={k} className="flex gap-3 rounded-xl border bg-card p-4">
              <StatusIcon s={result.checks[k]} />
              <div><p className="text-sm font-semibold">{CHECK_LABELS[k][0]}</p><p className="text-xs text-muted-foreground">{CHECK_LABELS[k][1]} · <span className="font-mono">{result.checks[k]}</span></p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h3 className="font-display text-3xl">Evidence <span className="text-muted-foreground">({result.evidence.length})</span></h3>
        {result.evidence.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No relevant indexed sources found. This does not mean the claim is false.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.evidence.map((e) => (
              <a key={e.url} href={e.url} target="_blank" rel="noopener noreferrer" className="group rounded-xl border bg-card p-4 transition hover:border-primary/50 hover:shadow-card">
                <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-muted-foreground">
                  <span className="truncate">{e.source}{e.date ? ` · ${e.date}` : ""}</span>
                  <span className={cn("rounded px-1.5 py-0.5 uppercase", e.relevance === "high" ? "bg-accent text-accent-foreground" : "bg-muted")}>{e.relevance}</span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug group-hover:text-primary">{e.title} <ExternalLink className="inline h-3 w-3" /></p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{e.snippet}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-xl border bg-card p-5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Searched queries</p>
        <ul className="mt-2 space-y-1 font-mono text-xs">{result.searchedQueries.map((q) => <li key={q}>› {q}</li>)}</ul>
      </section>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: ScanText, t: "Claim extraction", d: "Pull out who, what, where and when from the caption." },
    { icon: Search, t: "SerpApi evidence retrieval", d: "Exact-claim, news and earlier-occurrence searches." },
    { icon: GitCompare, t: "Context comparison", d: "Check dates, locations and prior circulation." },
    { icon: MessageSquareText, t: "Explainable verdict", d: "A verdict with the sources and reasons behind it." },
  ];
  return (
    <section className="mt-24">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">How it works</p>
      <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.t} className="bg-card p-6">
            <div className="flex items-center justify-between"><s.icon className="h-5 w-5 text-primary" /><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span></div>
            <p className="mt-6 font-semibold">{s.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 text-xs text-muted-foreground sm:grid-cols-[1fr_auto]">
        <p className="max-w-2xl leading-relaxed">
          <strong className="text-foreground">Methodology.</strong> REALFRAME performs contextual claim verification — it does not prove whether media is AI-generated.
          Absence of search results is not proof that a claim is false; results depend on available indexed sources.
        </p>
        <span className="self-start rounded-full border px-3 py-1 font-mono">SerpApi-powered evidence search</span>
      </div>
    </footer>
  );
}
