import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { demoResult, type Evidence, type VerifyResult, type CheckStatus } from "./verify-types";

const Input = z.object({
  claim: z.string().trim().min(5).max(1000),
  mediaType: z.enum(["image", "video", "none"]),
  mediaName: z.string().max(300).nullable().optional(),
  demo: z.boolean().optional(),
});

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";

function extractFacts(claim: string) {
  const year = claim.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
  const month = claim.match(new RegExp(`\\b(${MONTHS})\\b`, "i"))?.[0] ?? null;
  const rel = claim.match(/\b(today|yesterday|this week|last week|this month|recently)\b/i)?.[0] ?? null;
  const when = [month, year].filter(Boolean).join(" ") || rel;
  const where = claim.match(/\b(?:in|at|near|from)\s+([A-Z][\w'’]+(?:\s+[A-Z][\w'’]+){0,3})/)?.[1] ?? null;
  const caps = claim.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) ?? [];
  const who = caps.find((c) => c !== where) ?? null;
  const keywords = claim
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^(this|that|shows|video|image|photo|with|from|during|week|were|have|been|there)$/i.test(w))
    .slice(0, 7)
    .join(" ");
  return { who, what: keywords || null, where, when: when || null, year, keywords };
}

async function serp(params: Record<string, string>, key: string) {
  const url = new URL("https://serpapi.com/search.json");
  Object.entries({ ...params, api_key: key, gl: "in", hl: "en" }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) {
    console.error("SerpApi error", res.status, await res.text());
    return null;
  }
  return res.json() as Promise<any>;
}

function domainOf(u: string) {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
}

export const verifyClaim = createServerFn({ method: "POST" })
  .inputValidator((d) => Input.parse(d))
  .handler(async ({ data }): Promise<VerifyResult> => {
    const key = process.env['SERPAPI_KEY'];
    if (data.demo || !key) return demoResult(data.claim);

    const f = extractFacts(data.claim);
    const base = [f.who, f.where, f.what].filter(Boolean).join(" ").slice(0, 120) || data.claim.slice(0, 120);
    const queries = [
      { label: `"${data.claim.slice(0, 90)}"`, p: { engine: "google", q: data.claim.slice(0, 200), num: "6" }, kind: "exact" },
      { label: `${base} ${f.when ?? ""}`.trim(), p: { engine: "google_news", q: `${base} ${f.when ?? ""}`.trim() }, kind: "news" },
      { label: `${base} old video fact check`, p: { engine: "google", q: `${base} old video fact check`, num: "6" }, kind: "history" },
    ];

    try {
      const results = await Promise.all(queries.map((q) => serp(q.p, key)));
      const evidence: (Evidence & { kind: string })[] = [];
      results.forEach((r, i) => {
        if (!r) return;
        const items = (r.organic_results ?? r.news_results ?? []).slice(0, 4);
        for (const it of items) {
          const link = it.link ?? it.stories?.[0]?.link;
          if (!link) continue;
          evidence.push({
            title: it.title ?? "Untitled",
            url: link,
            source: it.source?.name ?? it.source ?? domainOf(link),
            date: it.date ?? null,
            snippet: it.snippet ?? it.stories?.[0]?.title ?? "",
            relevance: i === 0 ? "high" : "medium",
            kind: queries[i]?.kind ?? "web",
          });
        }
      });

      const seen = new Set<string>();
      const uniq = evidence.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
      const text = uniq.map((e) => `${e.title} ${e.snippet}`.toLowerCase()).join(" ");
      const factMarkers = /(fact.?check|false|fake|misleading|old video|old clip|resurface|not recent|recycled|unrelated)/;
      const flaggedOld = uniq.some((e) => factMarkers.test(`${e.title} ${e.snippet}`.toLowerCase()));
      const yearsSeen = [...text.matchAll(/\b(20\d{2})\b/g)].map((m) => m[1]);
      const dateMatch: CheckStatus = !f.year ? "unclear" : yearsSeen.includes(f.year) ? "pass" : yearsSeen.length ? "fail" : "unclear";
      const locationMatch: CheckStatus = !f.where ? "unclear" : text.includes(f.where.toLowerCase()) ? "pass" : "fail";
      const newsCount = uniq.filter((e) => e.kind === "news").length;
      const corroboration: CheckStatus = newsCount >= 2 ? "pass" : newsCount === 0 ? "unclear" : "unclear";
      const earlierOccurrence: CheckStatus = flaggedOld || dateMatch === "fail" ? "fail" : uniq.length ? "pass" : "unclear";

      let verdict: VerifyResult["verdict"] = "UNVERIFIED";
      let confidence = 0.35;
      let summary = "Not enough indexed evidence was found to support or refute this claim. This is not proof that it is false.";
      if (flaggedOld && locationMatch !== "fail") {
        verdict = "MISCONTEXTUALIZED"; confidence = 0.72;
        summary = "Sources suggest the event is real but the media is being shared out of context — likely from an earlier date or different situation.";
      } else if (flaggedOld) {
        verdict = "CONTRADICTED"; confidence = 0.68;
        summary = "Fact-check or news sources appear to contradict key details of this claim.";
      } else if (corroboration === "pass" && dateMatch !== "fail" && locationMatch !== "fail") {
        verdict = "SUPPORTED"; confidence = 0.7;
        summary = "Multiple news sources report an event consistent with the claimed who, where and when.";
      } else if (dateMatch === "fail") {
        verdict = "MISCONTEXTUALIZED"; confidence = 0.55;
        summary = "Matching coverage exists, but it points to a different time period than claimed.";
      }

      return {
        verdict, confidence, summary,
        claimFacts: { who: f.who, what: f.what, where: f.where, when: f.when },
        checks: { corroboration, dateMatch, locationMatch, earlierOccurrence },
        evidence: uniq.slice(0, 8).map(({ kind: _k, ...e }) => e),
        searchedQueries: queries.map((q) => q.label),
        isDemo: false,
      };
    } catch (e) {
      console.error(e);
      return { ...demoResult(data.claim), summary: "Live search failed, showing DEMO DATA — not a live verification." };
    }
  });
