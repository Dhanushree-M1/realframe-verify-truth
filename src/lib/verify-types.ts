export type Verdict = "SUPPORTED" | "CONTRADICTED" | "MISCONTEXTUALIZED" | "UNVERIFIED";
export type CheckStatus = "pass" | "fail" | "unclear";

export interface Evidence {
  title: string;
  url: string;
  source: string;
  date: string | null;
  snippet: string;
  relevance: "high" | "medium" | "low";
}

export interface VerifyResult {
  verdict: Verdict;
  confidence: number;
  summary: string;
  claimFacts: { who: string | null; what: string | null; where: string | null; when: string | null };
  checks: {
    corroboration: CheckStatus;
    dateMatch: CheckStatus;
    locationMatch: CheckStatus;
    earlierOccurrence: CheckStatus;
  };
  evidence: Evidence[];
  searchedQueries: string[];
  isDemo: boolean;
}

export const DEMO_CLAIM =
  "This video shows massive flooding in Mumbai's Andheri subway during the monsoon this week, July 2026.";

export function demoResult(claim: string): VerifyResult {
  return {
    verdict: "MISCONTEXTUALIZED",
    confidence: 0.82,
    summary:
      "DEMO DATA — not a live verification. The footage appears to be genuine, but matching coverage dates it to an earlier monsoon event, not the week claimed. Real media, wrong context.",
    claimFacts: {
      who: "Residents / commuters",
      what: "Severe flooding of a subway underpass",
      where: "Andheri subway, Mumbai",
      when: "This week (July 2026)",
    },
    checks: {
      corroboration: "pass",
      dateMatch: "fail",
      locationMatch: "pass",
      earlierOccurrence: "fail",
    },
    evidence: [
      {
        title: "Andheri subway shut after heavy rain; videos show waist-deep water",
        url: "https://example.com/demo/andheri-subway-2023",
        source: "example-news.in (demo)",
        date: "2023-07-24",
        snippet:
          "Visuals circulating on social media show vehicles stranded as Andheri subway flooded following intense overnight rainfall…",
        relevance: "high",
      },
      {
        title: "Same flooding clip resurfaces every monsoon, fact-checkers note",
        url: "https://example.com/demo/factcheck-recycled-clip",
        source: "demo-factcheck.org (demo)",
        date: "2025-06-30",
        snippet:
          "The viral clip, first uploaded in July 2023, has been reshared with new captions claiming it is recent…",
        relevance: "high",
      },
      {
        title: "Mumbai rains: IMD issues yellow alert, light waterlogging reported",
        url: "https://example.com/demo/mumbai-weather-2026",
        source: "demo-weather.in (demo)",
        date: "2026-07-14",
        snippet:
          "Moderate rainfall this week; civic body reports minor waterlogging but Andheri subway remained open to traffic…",
        relevance: "medium",
      },
    ],
    searchedQueries: [
      `"${claim.slice(0, 80)}"`,
      "Andheri subway flooding July 2026",
      "Andheri subway flood news",
      "Andheri subway flood video old viral",
    ],
    isDemo: true,
  };
}
