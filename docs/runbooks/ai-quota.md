# Gemini routine assistant unavailable or over quota

The assistant is an opt-in routine-planning helper. The user must consent before their routine titles, times, categories, and priorities are sent to Google Gemini. It does not send account identity or notes, and app prompts are not stored.

## Detect
- The assistant returns "unavailable", or the per-user request limit is reached.
- Google Cloud billing shows a sudden increase.

## First steps
1. Check Google Cloud billing and quota. Look for a spike in requests.
2. Check that the server-side `GEMINI_API_KEY` is configured and valid. Never put it in client environment variables or source control.
3. Check for abuse: many requests from one user or one IP. Block that user with a role change or a session revoke, not by deleting data.

## Confirm it is fixed
- The assistant answers a test request. The per-user rate limit still applies.
- The monthly spend is under the cap.

## Do not
- Do not raise the cap without knowing the cause of the spike.
