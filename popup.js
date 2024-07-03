let controller;

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  setupEventListeners();
});

function loadSettings() {
  chrome.storage.sync.get(['fontSize', 'fontFamily', 'temperature', 'defaultPrompt', 'apiKey', 'serverUrl', 'defaultModel'], (result) => {
    if (result.fontSize) document.getElementById('fontSize').value = result.fontSize;
    if (result.fontFamily) document.getElementById('fontFamily').value = result.fontFamily;
    if (result.temperature) document.getElementById('temperature').value = result.temperature;
    if (result.defaultPrompt) document.getElementById('prompt').value = result.defaultPrompt;
    updateSummaryStyle();
  });
}

function setupEventListeners() {
  document.getElementById('summarizeButton').addEventListener('click', summarize);
  document.getElementById('stopButton').addEventListener('click', stopSummarization);
  document.getElementById('evaluateButton').addEventListener('click', evaluateContent);
  document.getElementById('clearButton').addEventListener('click', clearSummary);
  document.getElementById('fontSize').addEventListener('change', updateSummaryStyle);
  document.getElementById('fontFamily').addEventListener('change', updateSummaryStyle);
  document.getElementById('optionsLink').addEventListener('click', openOptions);
  setupResizeHandle();
}

function openOptions() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
}

async function summarize() {
  const summaryElement = document.getElementById('summary');
  const stopButton = document.getElementById('stopButton');
  const loadingIndicator = document.getElementById('loading-indicator');

  updateSummaryStyle();
  saveSettings();

  stopButton.disabled = false;
  loadingIndicator.hidden = false;

  try {
    const { apiKey, serverUrl, defaultModel } = await getStoredOptions();
    const prompt = document.getElementById('prompt').value || 'summarize this page in English';
    const temperature = parseFloat(document.getElementById('temperature').value);
    
    const pageContent = await getPageContent();
    summaryElement.textContent = '';

    controller = new AbortController();
    const response = await fetch(`${serverUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: defaultModel,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: pageContent }
        ],
        temperature: temperature,
        stream: true
      }),
      signal: controller.signal
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      partialMessage += decoder.decode(value, { stream: true });
      const messages = partialMessage.split('\n');
      
      for (let i = 0; i < messages.length - 1; i++) {
        if (messages[i].startsWith('data: ')) {
          const message = JSON.parse(messages[i].substring(6));
          if (message.choices?.[0]?.delta?.content) {
            summaryElement.textContent += message.choices[0].delta.content;
            summaryElement.scrollTop = summaryElement.scrollHeight;
          }
        }
      }
      partialMessage = messages[messages.length - 1];
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching summary:', error);
      summaryElement.textContent = 'Error generating summary. Please check your options and try again.';
    }
  } finally {
    stopButton.disabled = true;
    loadingIndicator.hidden = true;
  }
}

function stopSummarization() {
  if (controller) {
    controller.abort();
    document.getElementById('stopButton').disabled = true;
  }
}

async function evaluateContent() {
  try {
    const pageContent = await getPageContent();
    const evaluationElement = document.getElementById('evaluation');
    const charCount = pageContent.length;
    const tokens = pageContent.split(/\s+/).reduce((acc, word) => acc + Math.ceil(word.length / 3), 0) + (pageContent.match(/\s+/g) || []).length + (pageContent.match(/\d+/g) || []).length;

    evaluationElement.innerHTML = `Character count: ${charCount}<br>Token count: ${tokens}`;
  } catch (error) {
    console.error('Error evaluating content:', error);
  }
}

function clearSummary() {
  document.getElementById('summary').textContent = '';
  document.getElementById('evaluation').textContent = '';
}

function updateSummaryStyle() {
  const summaryElement = document.getElementById('summary');
  const fontSize = document.getElementById('fontSize').value;
  const fontFamily = document.getElementById('fontFamily').value;

  summaryElement.style.fontSize = fontSize === 'small' ? '12px' : fontSize === 'medium' ? '14px' : '18px';
  summaryElement.style.fontFamily = fontFamily;
}

function saveSettings() {
  chrome.storage.sync.set({
    fontSize: document.getElementById('fontSize').value,
    fontFamily: document.getElementById('fontFamily').value,
    temperature: document.getElementById('temperature').value
  });
}

function getPageContent() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          function: () => document.body.innerText,
        },
        (results) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            reject(new Error('Failed to get page content'));
          }
        }
      );
    });
  });
}

function getStoredOptions() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      apiKey: '',
      serverUrl: 'http://localhost:1234',
      defaultModel: 'behnamoh/Phi-3-medium-4k-instruct-Q4_0-GGUF'
    }, resolve);
  });
}

function setupResizeHandle() {
  const resizeHandle = document.getElementById('resize-handle');
  let isResizing = false;

  resizeHandle.addEventListener('mousedown', () => isResizing = true);

  document.addEventListener('mousemove', (e) => {
    if (isResizing) {
      document.documentElement.style.width = `${e.clientX}px`;
      document.documentElement.style.height = `${e.clientY}px`;
    }
  });

  document.addEventListener('mouseup', () => isResizing = false);
}