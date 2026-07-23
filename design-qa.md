# Live Presentation QA

## Public and presenter routes

- `presentation.html` is unlisted and no longer appears in public website navigation.
- The public website navigation links to `join.html` as **Join Live**.
- The Join Live link remains visible on mobile.
- Opening the unlisted presenter route immediately starts the fixed one-time live session.
- The audience never enters or sees a room code.

## Audience state synchronization

Tested with separate local presenter and audience tabs:

1. Audience entered only the nickname `Teddy Test`.
2. Presenter changed to `1 audience connected`.
3. On ordinary slides, the audience screen showed `Eyes on the screen`.
4. On the first poll slide, the poll appeared automatically.
5. Selecting `Choosing products` updated the presenter to `100% (1)`.
6. On the Q&A slide, the audience question form appeared automatically.
7. `Can the system explain uncertainty?` appeared on the presenter screen with `Teddy Test`.
8. On the closing slide, the audience returned to `Eyes on the screen`.
9. On the feedback slide, the audience rating form appeared automatically.
10. A 5-star rating and comment updated the presenter to `5.0`, `1 response`, and displayed the comment live.

## Presentation checks

- All 11 slides fit at 1280 × 720 without overflow.
- No browser warnings or errors were reported in the presenter or audience tabs.
- Previous, Next, keyboard navigation, progress, direct slide URLs, and full-screen mode remain functional.
- Poll resets, question display, audience count, and feedback summaries update in real time.

## Audience safety and privacy

- A nickname is required to discourage duplicate anonymous sessions.
- Poll answers remain anonymous.
- Nicknames appear only with questions and optional feedback.
- Audience text is escaped before display and length-limited.
- The experience remains educational and non-diagnostic.

## Transport

- Different devices use PeerJS signaling and WebRTC data channels.
- Same-browser rehearsals use `BroadcastChannel`.
- The fixed event channel is optimized for one active presenter and a small live audience.

## Event checklist

- Open the unlisted presenter URL on the presentation computer first.
- Ask the audience to choose **Join Live** on the website or scan the QR code.
- Rehearse once with two phones on the venue Wi-Fi.

final result: passed
