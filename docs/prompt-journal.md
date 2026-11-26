# SupportDesk - Prompt Journal

## Date: 07 November 2026

### Prompt 1: Database
**Weak Prompt:** Explain database.

**Improved Prompt:** Explain Database in simple English. Include its meaning, a real-life example, advantages and disadvantages. Use headings and bullet points.

### Prompt 2: Python
**Weak Prompt:** Write about Python.

**Improved Prompt:** Write a brief introduction to Python in simple English. Explain its important features and real-life applications. Give at least 3 simple Python code examples.

### Prompt 3: API
**Weak Prompt:** Explain API.

**Improved Prompt:** Explain API in simple English. Include its meaning, how it works, real-life examples, uses, advantages and disadvantages.

### Prompt 4: Resume
**Weak Prompt:** Write a resume.

**Improved Prompt:** Create a simple and professional resume for a fresher applying for a software developer position. Include career objective, education, technical skills, projects, certifications and achievements. Do not add fake information.

### Prompt 5: Machine Learning
**Weak Prompt:** Explain machine learning.

**Improved Prompt:** Explain Machine Learning in simple English for beginners. Include its meaning, working, types, real-life examples, advantages and limitations.

## Self-Review
- Rewrote 5 weak prompts.
- Added clear instructions and specific requirements.
- Used simple language and structured output formats.
- Learned how better prompts improve AI responses.

## Day 4: Versioned AI Prompts and OpenAI Client

### Prompt planning
- Keep stable support-reply and ticket-categorization policies in separate, versioned prompt templates.
- Pass serialized ticket details, comments, and category data through the provider's input field as untrusted data; do not combine ticket content with trusted instructions.
- Keep server credentials and OpenAI client construction in backend-only code.
- Record token counts only when returned by the provider, and calculate an estimated cost only when both configured prices and actual usage are present.

### Implementation
- Added `src/ai/prompts/v1/suggestReply.ts` and `src/ai/prompts/v1/categorization.ts`, and wired each into its corresponding OpenAI request.
- Added `src/ai/openAiClient.ts` for lazy, server-side OpenAI client construction; it does not log or return the API key.
- Kept provider selection, request inputs, structured categorization, streaming, and cancellation behavior unchanged.
- Kept mock mode independent of external providers and provider usage; no token counts or costs are fabricated.

### Verification
- Backend: `npm.cmd run typecheck` passed; `npm.cmd run build` passed; all 27 backend Node tests passed.
- Frontend: `npm.cmd run typecheck` passed; `npm.cmd run test:run` passed (27 tests across 4 files); `npm.cmd run build` passed.
- Provider tests use a local mock client to verify request separation, prompts, stream handling, and reported usage. No live OpenAI or Gemini calls were made; paid API behavior was not verified.