// Saves options to chrome.storage
function saveOptions() {
    const apiKey = document.getElementById('apiKey').value;
    const serverUrl = document.getElementById('serverUrl').value;
    const defaultModel = document.getElementById('defaultModel').value;
    const defaultPrompt = document.getElementById('defaultPrompt').value;
  
    chrome.storage.sync.set({
      apiKey: apiKey,
      serverUrl: serverUrl,
      defaultModel: defaultModel,
      defaultPrompt: defaultPrompt
    }, () => {
      // Update status to let user know options were saved.
      const status = document.createElement('div');
      status.textContent = 'Options saved.';
      document.body.appendChild(status);
      setTimeout(() => {
        status.remove();
      }, 3000);
    });
  }
  
  // Restores select box and checkbox state using the preferences
  // stored in chrome.storage.
  function restoreOptions() {
    chrome.storage.sync.get({
      apiKey: '',
      serverUrl: 'http://localhost:1234',
      defaultModel: 'behnamoh/Phi-3-medium-4k-instruct-Q4_0-GGUF',
      defaultPrompt: 'summarize this page in English'
    }, (items) => {
      document.getElementById('apiKey').value = items.apiKey;
      document.getElementById('serverUrl').value = items.serverUrl;
      document.getElementById('defaultModel').value = items.defaultModel;
      document.getElementById('defaultPrompt').value = items.defaultPrompt;
    });
  }
  
  document.addEventListener('DOMContentLoaded', restoreOptions);
  document.getElementById('saveOptions').addEventListener('click', saveOptions);