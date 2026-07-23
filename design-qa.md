# Synchronized Presentation QA

## Simplified audience flow

- Public navigation now says **Join Slideshow**.
- The presenter route remains unlisted.
- The audience enters only a nickname; there is no room code.
- Between interaction slides, the audience stage is intentionally empty.
- Polls, Q&A, and feedback appear only when the presenter reaches those slides.
- User-facing “live,” connection-status, and “Eyes on the screen” messaging was removed.

## Interaction test

Tested with separate presenter and audience tabs:

1. `Test Person` joined with no room code.
2. The presenter showed `Audience: 1`.
3. The audience stage was empty on the opening and join slides.
4. Advancing to the first poll made the poll appear automatically.
5. Selecting `Choosing products` updated the presenter to `100% (1)`.

The existing presenter-controlled Q&A and feedback routes continue to use the same synchronized state and submission channel.

## Presentation layout

- All 11 slides fit at 1280 × 720 without overflow.
- Previous, Next, keyboard navigation, progress, direct slide URLs, and full-screen mode remain available.
- Only one presenter should open the unlisted host route at a time.

## Team photo carousel

- The team section now uses a touch-scrollable, scroll-snapping carousel with previous/next controls and position dots.
- `team.jpg` loads correctly.
- `IMG_6166.jpeg` loads correctly as the second slide.
- The carousel reports two slides, two position dots, and visible previous/next controls.
- Selecting **Next team photo** moved exactly one carousel width and activated the second position dot.
- Touch scrolling uses native horizontal overflow and scroll snapping.

## Privacy

- Poll answers remain anonymous.
- Nicknames appear only with questions and optional feedback.
- Audience text is escaped and length-limited before appearing on the presenter screen.

final result: passed
