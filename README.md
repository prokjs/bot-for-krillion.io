# Krillion Deep Cuts

A Chrome/Edge Manifest V3 extension that reads the visible Krillion question and asks OpenAI for up to five obscure, factual answers with explanations. No build step or dependencies.

## Install

1. Open `chrome://extensions` (Chrome) or `edge://extensions` (Edge).
2. Turn on **Developer mode**, choose **Load unpacked**, and select this repository folder (the one containing `manifest.json`).
3. Click the extension's toolbar icon, or open its **Extension options**.
4. Enter your OpenAI API key and save. The default model is `gpt-4.1-mini`; you can choose another model available to your account that supports the Responses API and structured outputs.
5. Open or reload https://krillion.io/. A **Deep Cuts** panel appears on the right.

API usage costs money and is separate from a ChatGPT subscription. Do not put your API key into source files or commit it.

## Use

- Start a round. The panel reads the game's visible `.prompt` text automatically.
- Click **Find deep cuts** for ranked suggestions. Each includes what the answer is, why it fits, why it may be obscure, factual-fit confidence, and any caveat.
- Click **Copy answer** and enter it yourself. The extension never submits answers or modifies game inputs.
- Enable **Automatically suggest on new prompts** to request answers when the visible question changes. This is off by default, resets on page reload, and makes paid API requests when enabled.
- Use **Read question** to rescan, or edit/paste a question if automatic detection misses it. Manual edits remain until the visible game prompt changes or you rescan.
- Collapse the panel with **−**. Automatic suggestions continue if enabled.

Requests have a 20-second network limit; the game normally allows 25 seconds per prompt. API latency, model processing, and response decoding can still make suggestions arrive too late. Changing the question clears old suggestions and discards late responses, but does not cancel an already submitted paid request.

## Accuracy and limits

Krillion uses curated answer sets and its own rarity scoring, with a special gem not chosen solely on rarity ([FAQ](https://krillion.io/faq)). The extension does not inspect hidden answers or game APIs. It cannot guarantee acceptance, scores, or the rarest answer. Obscurity is a model estimate; confidence describes factual category fit only. Explanations can be wrong. No web lookup or independent fact-check is performed.

Question detection currently targets the live game's visible `.prompt` elements. A site redesign or a different game mode may need a selector update. Paste the exact prompt and any additional constraints into the editable field when needed. Use assistance only where the game's rules permit it.

## Privacy

The API key is stored in `chrome.storage.local`, not synced or encrypted. Storage access is limited to trusted extension contexts; content scripts obtain suggestions through the background worker and cannot read the saved key. Delete it through Settings when no longer needed.

Only question text is sent to `https://api.openai.com/v1/responses`, with `store: false`. The extension sends no screenshots, game credentials, cookies, or browsing history. OpenAI's applicable API retention policies still apply. Suggestions are not persisted.

## Verification

- Injected the actual content script into a managed browser on the live Krillion site: read the visible prompt `Name a noodle dish`, sent that exact question through a simulated extension message bridge, and visually checked the panel and missing-key error.
- Exercised answer explanations, rarity reasons, caveats, collapsing, and stale-response rejection using fixture responses in that browser.
- Exercised the actual background module with fixture HTTP responses: structured Responses API request, JSON parsing, missing API key, duplicate-answer rejection, and quota errors.
- No real API key was available. Live model generation, answer quality, game acceptance, and unpacked-extension integration were not verified. The smoke checks above do not establish those results.
