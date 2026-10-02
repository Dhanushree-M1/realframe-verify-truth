# Real Frame Verification

Build a hackathon MVP called REALFRAME — "Verify the story, not just the pixels." This is a 2-person SerpApi India Hackathon project for contextual verification of viral images/videos.

IMPORTANT SCOPE: Keep it simple and demo-ready. Do NOT build authentication, user accounts, complex database, training, or a custom deepfake model. The core product is: user uploads an image/video and enters the claim; the app sends the claim to a backend verification endpoint; backend uses SerpApi web/news/image search and an LLM-style evidence analysis layer to return an explainable verdict. The UI should work even before a SerpApi key is configured by using clearly labeled demo/mock evidence data for preview, but production verification must be designed around SERPAPI_KEY environment secret.

Build a polished responsive web app with:
1) Landing/home screen: REALFRAME logo/name, tagline "When the pixels are real, but the story isn't.", short explanation that the app verifies the context around media, upload dropzone for image/video, claim textarea, Verify button.
2) Verification loading state showing stages: Understanding claim → Searching the web → Comparing evidence → Preparing explanation.
3) Results screen with verdict states: SUPPORTED, CONTRADICTED, MISCONTEXTUALIZED, UNVERIFIED. Show the original claim, concise explanation, evidence cards with source title/domain/date/snippet and clickable source URL, plus a clear "Why this verdict?" section.
4) Include a strong demo case for a genuine media + false context scenario. The mock/demo result should explicitly say it is demo data, not a live verification.
5) Add a compact "How it works" section explaining Claim extraction → SerpApi evidence retrieval → Context comparison → Explainable verdict.
6) Include a small methodology/disclaimer: absence of search results is not proof that a claim is false; results depend on available indexed sources.
7) Visual design: premium hackathon aesthetic, light/off-white background, dark charcoal text, restrained blue accent, clean cards, subtle motion, no excessive gradients, no neon, no clutter. Mobile responsive.
8) Architecture: TypeScript/Tailwind/shadcn. Create a server-side verification endpoint/function that reads SERPAPI_KEY from environment and never exposes the key client-side. It should accept {claim, mediaType, mediaName} and return a stable JSON shape:
{verdict, confidence, summary, claimFacts:{who,what,where,when}, checks:{corroboration,dateMatch,locationMatch,earlierOccurrence}, evidence:[{title,url,source,date,snippet,relevance}], searchedQueries:string[], isDemo:boolean}
9) SerpApi integration: implement the backend search layer using SerpApi's Google/News/Image search APIs as appropriate. Search the exact claim, claim entities + date/location, news corroboration, and historical/earlier occurrence queries. Keep query count small and explicit to conserve credits. If no key exists, return a safe demo response rather than crashing.
10) Do not claim the system can definitively prove a video is AI-generated. Position it as contextual claim verification. Make the main differentiator real media + false context.
11) Include a visible "SerpApi-powered evidence search" label in the methodology/footer.
12) Make the demo path easy: clicking Verify with empty/no uploaded media but a filled claim can still run demo mode. Add a "Try demo case" button that populates a sample claim and demo result.
Create all necessary frontend and backend files. Do not ask me questions; make reasonable choices and finish a working MVP.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/eca52b04-1898-462f-8c49-6f339e47bb5e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
