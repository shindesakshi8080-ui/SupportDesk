# Week 3 Report – SupportDesk

Date: 27 November 2026
Branch: feat/day17-ai-guardrails

## Completed Work
- Implemented PII masking for email and phone numbers.
- Added AI input length validation.
- Strengthened versioned prompts against prompt injection.
- Added tests for trusted prompt separation.
- Verified Zod output validation and provider error handling.

## Test Evidence
Backend:
- Typecheck: PASS
- Tests: 38 passed, 0 failed

Frontend:
- Tests: 27 passed, 0 failed
- Production build: PASS

Total: 65 tests passed.

## AI Features
- Suggest Reply: implementation available; final UI demo pending.
- Auto-categorisation and priority prediction: implementation available; final UI demo pending.
- Prompt injection: trusted prompt instructions implemented; live demonstration pending.
- PII masking: implemented and tested.

## Evaluation
20-ticket evaluation: Pending verification.
Accuracy: Not yet established.

## Key Learnings
1. Trusted prompt instructions must remain separate from untrusted ticket content.
2. PII should be masked before sending ticket information to an AI provider.

## Retrospective

### Start
- Add more security and failure-path tests.
- Maintain clear implementation documentation.

### Stop
- Avoid claiming features as completed without test evidence.
- Avoid unnecessary changes outside the assigned scope.

### Continue
- Use versioned prompts.
- Run backend and frontend tests regularly.

## Improvement Action
Complete rate limiting, moderation, timeout handling and a labelled 20-ticket evaluation.

## Pending Issues
- Verify full-stack UI workflow.
- Demonstrate both AI features.
- Perform live prompt injection test.
- Verify rate limiting and moderation.
- Verify timeout and manual fallback.
- Complete 20-ticket evaluation.
- Complete lead's Week 3 quiz.
- Review and submit PRs.

## Week 3 Sign-off
Needs follow-up. Full acceptance criteria have not yet been demonstrated.
