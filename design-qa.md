# Interactive Presentation Design QA

## Scope

- Presenter screen: `presentation.html`
- Audience screen: `join.html`
- Existing detector: unchanged
- Visual source: the existing Clarity Labs website

## Presentation checks

- All 10 slides use short, audience-facing copy with no speaker notes.
- The slides cover the problem, product, technology, live demo, safety, and next steps.
- At a 1280 × 720 browser viewport, every slide reports `scrollHeight === clientHeight`.
- The deck retains the existing Fraunces and Inter typography, paper background, accent colors, borders, and rounded-card system.
- Previous, Next, keyboard navigation, progress, direct slide URLs, and full-screen controls work.
- The room code, QR code, join URL, and connected-audience count remain visible where needed.

## Live interaction checks

Tested locally with separate presenter and audience tabs:

1. The presenter created room `P6PF7`.
2. The audience joined with the name `Test Audience`.
3. The presenter count changed to `1 audience connected`.
4. Advancing to the first poll made its answers appear on the audience screen.
5. Selecting `Choosing products` updated the presenter result to `100% (1)`.
6. The audience submitted `How does the model personalize each result?`.
7. The question and audience name appeared on the presenter Q&A slide.

The same-browser rehearsal path uses `BroadcastChannel`. Different devices use PeerJS signaling and WebRTC data channels. The presentation is intentionally optimized for a small live room of roughly 10 audience devices.

## Safety and accessibility

- Poll votes are anonymous.
- Names are optional and are shown only with submitted questions.
- Audience text is escaped before display and limited to 140 characters.
- Inactive slides are hidden from assistive technology.
- Native form controls and buttons are keyboard accessible.
- Reduced-motion preferences are respected.
- The product remains described as educational guidance, not a diagnosis.

## Operational note

Before the event, rehearse the deployed presenter and audience pages with two phones on the venue Wi-Fi. The PeerJS cloud service provides signaling; live answers then travel over direct browser data connections.

final result: passed
