(() => {
  if (document.getElementById('krillion-deep-cuts')) return;
  const host = document.createElement('div');
  host.id = 'krillion-deep-cuts';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { all: initial; position: fixed; right: 16px; top: 70px; z-index: 2147483647; color-scheme: dark; }
      * { box-sizing: border-box; }
      section { width: min(360px, calc(100vw - 32px)); max-height: calc(100dvh - 90px); overflow: auto;
        background: #101c2b; color: #edf4ff; border: 1px solid #52647a; border-radius: 12px;
        padding: 16px; font: 14px/1.5 system-ui, sans-serif; box-shadow: 0 8px 32px #0008; }
      header { display: flex; align-items: center; gap: 8px; } strong { flex: 1; font-size: 16px; }
      button { font: inherit; cursor: pointer; color: #edf4ff; background: #253c57;
        border: 1px solid #7890ab; border-radius: 6px; padding: 6px 10px; }
      button:disabled { opacity: .55; cursor: wait; } button:focus-visible, textarea:focus-visible { outline: 2px solid #7ce5e4; }
      textarea { width: 100%; min-height: 78px; resize: vertical; margin: 6px 0; padding: 8px;
        font: inherit; background: #09111c; color: #edf4ff; border: 1px solid #7890ab; border-radius: 6px; }
      .row { display: flex; gap: 8px; margin: 8px 0; } p { margin: 8px 0; }
      .muted, small { color: #bacada; } small { display: block; }
      ol { padding-left: 22px; } li { margin: 14px 0; } h3 { font-size: 16px; margin: 0; }
      .copy { margin-top: 6px; } [hidden] { display: none !important; }
    </style>
    <section aria-label="Krillion answer assistant">
      <header><strong>Deep Cuts</strong><button id="settings">Settings</button><button id="toggle" aria-expanded="true" aria-label="Collapse assistant">−</button></header>
      <div id="body">
        <p class="muted">Obscurity estimates, not verified game scores.</p>
        <label for="question">Question (editable)</label>
        <textarea id="question" maxlength="2000" placeholder="Waiting for a visible game prompt…"></textarea>
        <label><input id="auto" type="checkbox"> Automatically suggest on new prompts</label>
        <div class="row"><button id="scan">Read question</button><button id="suggest">Find deep cuts</button></div>
        <p id="status" role="status" aria-live="polite">Start a round, or paste a question.</p>
        <ol id="answers"></ol>
        <small>Only question text is sent to OpenAI. Requests use your API credits. Copy an answer to play it yourself.</small>
      </div>
    </section>`;
  document.documentElement.append(host);
  const $ = selector => root.querySelector(selector);
  let detected = '', generation = 0, busy = false;
  function invalidate() {
    generation++;
    busy = false;
    $('#suggest').disabled = false;
    $('#answers').replaceChildren();
  }
  function readQuestion() {
    // .prompt is the live game's visible question, not the round counter or menu.
    return Array.from(document.querySelectorAll('.prompt')).filter(element =>
      element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' &&
      getComputedStyle(element).display !== 'none'
    ).map(element => element.textContent.trim()).filter(Boolean).at(-1) ?? '';
  }
  async function request() {
    const question = $('#question').value.trim();
    if (!question) { $('#status').textContent = 'No question found. Read or paste one first.'; return; }
    if (busy) return;
    const current = ++generation;
    busy = true;
    $('#suggest').disabled = true;
    $('#answers').replaceChildren();
    $('#status').textContent = 'Finding obscure answers… (20-second request limit)';
    try {
      const result = await chrome.runtime.sendMessage({ type: 'suggest', question });
      if (current !== generation) return;
      if (!result || result.error) throw new Error(result?.error || 'The extension did not respond. Reload this tab.');
      for (const item of result.answers) {
        const li = document.createElement('li');
        const title = document.createElement('h3'); title.textContent = item.answer;
        const explanation = document.createElement('p'); explanation.textContent = item.explanation;
        const rarity = document.createElement('small'); rarity.textContent = `Why niche: ${item.rarityReason}`;
        const confidence = document.createElement('small'); confidence.textContent = `Factual fit: ${item.confidence}. Acceptance unverified.`;
        li.append(title, explanation, rarity, confidence);
        if (item.caveat) { const caveat = document.createElement('p'); caveat.textContent = `Caution: ${item.caveat}`; li.append(caveat); }
        const copy = document.createElement('button'); copy.className = 'copy'; copy.textContent = 'Copy answer';
        copy.addEventListener('click', async () => {
          try { await navigator.clipboard.writeText(item.answer); copy.textContent = 'Copied'; }
          catch { $('#status').textContent = 'Clipboard unavailable. Select the answer text to copy it.'; }
        });
        li.append(copy); $('#answers').append(li);
      }
      $('#status').textContent = result.answers.length ? 'Most obscure estimate first. Check the explanation before playing.' : 'No confident suggestions. Try clarifying the question.';
    } catch (error) {
      if (current === generation) $('#status').textContent = error.message;
    } finally {
      if (current === generation) { busy = false; $('#suggest').disabled = false; }
    }
  }
  function scan(force = false) {
    const question = readQuestion();
    if (question === detected && !force) return;
    detected = question;
    invalidate();
    $('#question').value = question;
    $('#status').textContent = question ? 'Question detected. Ready to suggest.' : 'No visible prompt. Paste a question or start a round.';
    if (question && $('#auto').checked) request();
  }
  $('#suggest').addEventListener('click', request);
  $('#scan').addEventListener('click', () => scan(true));
  $('#question').addEventListener('input', () => { invalidate(); $('#status').textContent = 'Question edited. Ready to suggest.'; });
  $('#settings').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'settings' }));
  $('#auto').addEventListener('change', () => { if ($('#auto').checked) scan(true); });
  $('#toggle').addEventListener('click', () => {
    const hidden = !$('#body').hidden;
    $('#body').hidden = hidden;
    $('#toggle').textContent = hidden ? '+' : '−';
    $('#toggle').setAttribute('aria-expanded', String(!hidden));
    $('#toggle').setAttribute('aria-label', hidden ? 'Expand assistant' : 'Collapse assistant');
  });
  // Observe only game DOM changes; shadow-root updates do not retrigger this observer.
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; scan(); }, 100);
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
  scan();
})();
