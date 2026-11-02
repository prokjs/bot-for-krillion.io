const key = document.querySelector('#key');
const model = document.querySelector('#model');
const status = document.querySelector('#status');
async function load() {
  try {
    const settings = await chrome.storage.local.get(['apiKey', 'model']);
    model.value = settings.model || 'gpt-4.1-mini';
    status.textContent = settings.apiKey ? 'An API key is saved.' : 'No API key saved yet.';
  } catch (error) { status.textContent = error.message; }
}
document.querySelector('#settings').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    if (!model.value.trim()) throw new Error('Enter a model name.');
    const settings = { model: model.value.trim() };
    if (key.value.trim()) settings.apiKey = key.value.trim();
    await chrome.storage.local.set(settings);
    key.value = '';
    status.textContent = 'Settings saved. Return to Krillion to request suggestions.';
  } catch (error) { status.textContent = error.message; }
});
document.querySelector('#remove').addEventListener('click', async () => {
  try {
    await chrome.storage.local.remove('apiKey');
    key.value = '';
    status.textContent = 'Saved API key deleted.';
  } catch (error) { status.textContent = error.message; }
});
load();
