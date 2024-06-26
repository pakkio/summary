let controller;

document.getElementById('summarizeButton').addEventListener('click', () => {
    const prompt = document.getElementById('prompt').value || 'summarize this page in English';
    const temperature = parseFloat(document.getElementById('temperature').value);
    const fontSize = document.getElementById('fontSize').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const summaryElement = document.getElementById('summary');
    const stopButton = document.getElementById('stopButton');
    const loadingIndicator = document.getElementById('loading-indicator');

    summaryElement.style.fontSize = fontSize === 'small' ? '12px' : fontSize === 'medium' ? '14px' : '18px';
    summaryElement.style.fontFamily = fontFamily;

    stopButton.disabled = false;
    stopButton.classList.remove('disabled');
    loadingIndicator.style.display = 'block';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                function: getPageContent,
            },
            async (results) => {
                if (results && results[0] && results[0].result) {
                    const pageContent = results[0].result;
                    summaryElement.textContent = ''; 

                    controller = new AbortController();
                    const signal = controller.signal;

                    try {
                        const response = await fetch('http://localhost:1234/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer YOUR_LMStudio_API_KEY' // Replace with your actual API key
                            },
                            body: JSON.stringify({
                                model: 'behnamoh/Phi-3-medium-4k-instruct-Q4_0-GGUF', 
                                messages: [
                                    { role: 'system', content: prompt },
                                    { role: 'user', content: pageContent }
                                ],
                                temperature: temperature,
                                stream: true
                            }),
                            signal: signal
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
                                    if (message.choices && message.choices[0] && message.choices[0].delta && message.choices[0].delta.content) {
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
                        }
                    } finally {
                        stopButton.disabled = true;
                        stopButton.classList.add('disabled');
                        loadingIndicator.style.display = 'none'; 
                    }
                } else {
                    console.error('Error getting page content:', results);
                    stopButton.disabled = true;
                    stopButton.classList.add('disabled');
                    loadingIndicator.style.display = 'none';
                }
            }
        );
    });
});

document.getElementById('stopButton').addEventListener('click', () => {
    if (controller) {
        controller.abort();
        document.getElementById('stopButton').disabled = true;
        document.getElementById('stopButton').classList.add('disabled');
    }
});

document.getElementById('evaluateButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript(
            {
                target: { tabId: tabs[0].id },
                function: getPageContent,
            },
            (results) => {
                if (results && results[0] && results[0].result) {
                    const pageContent = results[0].result;
                    const evaluationElement = document.getElementById('evaluation');
                    const charCount = pageContent.length;
                    const tokens = pageContent.split(/\s+/).reduce((acc, word) => acc + Math.ceil(word.length / 3), 0) + (pageContent.match(/\s+/g) || []).length + (pageContent.match(/\d+/g) || []).length;

                    evaluationElement.innerHTML = `Character count: ${charCount}<br>Token count: ${tokens}`;
                } else {
                    console.error('Error getting page content:', results);
                }
            }
        );
    });
});

function getPageContent() {
    return document.body.innerText;
}

// Clear button functionality
document.getElementById('clearButton').addEventListener('click', () => {
    document.getElementById('summary').textContent = '';
});

// Resize handle functionality (from previous response)
const resizeHandle = document.getElementById('resize-handle');
let isResizing = false;

resizeHandle.addEventListener('mousedown', (e) => {
  isResizing = true;
});

document.addEventListener('mousemove', (e) => {
  if (isResizing) {
    const popup = document.documentElement;
    popup.style.width = e.clientX + 'px';
    popup.style.height = e.clientY + 'px';
  }
});

document.addEventListener('mouseup', (e) => {
  isResizing = false;
});
