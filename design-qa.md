# Presenter Slideshow QA

## Scope

- The slideshow is fully presenter-controlled.
- The audience join page and all audience connection behavior were removed.
- No QR code, room code, audience counter, PeerJS, BroadcastChannel, synchronized forms, or external signaling scripts remain.
- A future backend can be added separately without changing the current presentation controls.

## Slide behavior

- The deck contains nine on-screen slides.
- The two poll slides show their questions and four answer choices directly on the presentation screen.
- The Q&A slide shows four suggested discussion areas directly on the presentation screen.
- The presenter advances with Previous, Next, arrow keys, Page Up/Page Down, spacebar, Home, or End.
- Full-screen mode and direct slide URLs remain available.

## Public website

- The public website no longer contains a Join Slideshow link.
- `join.html` was removed.
- The team section displays only `IMG_6166.jpeg`.
- The original `team.jpg` is no longer used.

## Verification

- Inline scripts parse successfully.
- No references to PeerJS, QRCode, room codes, joining, or audience connections remain in the slideshow.
- Every slide is checked at presentation viewport size before deployment.

final result: passed
