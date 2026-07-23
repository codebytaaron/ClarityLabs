# Audience Board QA

## Intended flow

- Audience members open `audience.html` directly.
- There is no login, Join button, room code, or nickname.
- The audience page is blank between question slides.
- When the presenter advances to a prompt, the question and one short-answer field appear automatically.
- Answers are limited to 100 characters.
- Each browser can submit or update one answer per prompt.
- Submitted answers appear on the presenter board.

## Backend

- Vercel API routes are the only clients allowed to access Supabase.
- Supabase URL and secret key are read from server environment variables.
- The secret/service-role key is never included in frontend HTML or JavaScript.
- `PRESENTATION_HOST_KEY` protects slide-state changes and answer clearing.
- SQL setup enables RLS and grants table access only to `service_role`.

## Functional verification

Tested with separate presenter and audience tabs against an in-memory API stand-in:

1. Audience page opened with no join step and stayed blank on slide 1.
2. Presenter advanced to slide 2.
3. `What makes skincare advice hardest?` appeared automatically on the audience page.
4. Audience submitted `Knowing which products actually match the scan`.
5. The presenter board displayed the answer and count `1`.
6. Presenter advanced to the next non-question slide.
7. Audience page returned to its blank state.

The Vercel API handlers were also tested directly with mocked Supabase REST responses:

- Presenter state GET and authenticated POST passed.
- Response GET and validated upsert POST passed.
- All frontend and server scripts parse successfully.
- All nine presentation slides fit at 1280 × 720 without overflow.
- No browser warnings or errors were reported during the two-page flow.

## Public website

- Navigation includes an **Audience** link to `audience.html`.
- The team section still displays only `IMG_6166.jpeg`.

final code result: passed
deployment dependency: Supabase environment variables and SQL setup
