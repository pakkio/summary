let controller;

document.addEventListener('DOMContentLoaded', () => {
    // Set initial size
    document.body.style.width = '400px';
    document.body.style.height = '600px';
    
    // Force a redraw
    document.body.offsetHeight;

    loadSettings();
    setupEventListeners();
    makePopupDraggable();
    makePopupResizable();
    loadPopupSize();
});

function loadSettings() {
    chrome.storage.sync.get(['fontSize', 'fontFamily', 'temperature', 'defaultPrompt', 'apiKey', 'serverUrl', 'defaultModel'], (result) => {
        const fontSizeSelect = document.getElementById('fontSize');
        const fontFamilySelect = document.getElementById('fontFamily');
        const temperatureSelect = document.getElementById('temperature');
        const promptTextarea = document.getElementById('prompt');

        if (fontSizeSelect && result.fontSize) fontSizeSelect.value = result.fontSize;
        if (fontFamilySelect && result.fontFamily) fontFamilySelect.value = result.fontFamily;
        if (temperatureSelect && result.temperature) temperatureSelect.value = result.temperature;
        if (promptTextarea && result.defaultPrompt) promptTextarea.value = result.defaultPrompt;

        updateSummaryStyle();
    });
}

function setupEventListeners() {
    document.getElementById('summarizeButton').addEventListener('click', summarize);
    document.getElementById('stopButton').addEventListener('click', stopSummarization);
    document.getElementById('evaluateButton').addEventListener('click', evaluateContent);
    document.getElementById('clearButton').addEventListener('click', clearSummary);
    document.getElementById('copyButton').addEventListener('click', copyToClipboard);
    document.getElementById('fontSize').addEventListener('change', updateSummaryStyle);
    document.getElementById('fontFamily').addEventListener('change', updateSummaryStyle);
    document.getElementById('close-popup').addEventListener('click', closePopup);
    
    const temperatureSelect = document.getElementById('temperature');
    if (temperatureSelect) {
        temperatureSelect.addEventListener('change', saveSettings);
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

function copyToClipboard() {
    const summaryElement = document.getElementById('summary');
    const range = document.createRange();
    range.selectNode(summaryElement);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
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

function makePopupDraggable() {
    const popupContainer = document.getElementById('popup-container');
    const header = document.getElementById('popup-header');
    let isDragging = false;
    let startX, startY;

    header.addEventListener('mousedown', startDragging);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDragging);

    function startDragging(e) {
        isDragging = true;
        startX = e.clientX - popupContainer.offsetLeft;
        startY = e.clientY - popupContainer.offsetTop;
    }

    function drag(e) {
        if (!isDragging) return;
        let newX = e.clientX - startX;
        let newY = e.clientY - startY;
        
        // Ensure the popup stays within the viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth - popupContainer.offsetWidth));
        newY = Math.max(0, Math.min(newY, window.innerHeight - popupContainer.offsetHeight));
        
        popupContainer.style.left = newX + 'px';
        popupContainer.style.top = newY + 'px';
    }

    function stopDragging() {
        isDragging = false;
    }
}

function makePopupResizable() {
    const popupContainer = document.getElementById('popup-container');
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    popupContainer.addEventListener('mousedown', startResizing);
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);

    function startResizing(e) {
        // Check if the mouse is near the bottom-right corner
        const threshold = 10;
        if (popupContainer.offsetWidth - e.offsetX > threshold || popupContainer.offsetHeight - e.offsetY > threshold) {
            return;
        }
        
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(document.defaultView.getComputedStyle(popupContainer).width, 10);
        startHeight = parseInt(document.defaultView.getComputedStyle(popupContainer).height, 10);
        e.preventDefault();
    }

    function resize(e) {
        if (!isResizing) return;
        
        const newWidth = startWidth + e.clientX - startX;
        const newHeight = startHeight + e.clientY - startY;
        
        // Set minimum size
        popupContainer.style.width = Math.max(300, newWidth) + 'px';
        popupContainer.style.height = Math.max(200, newHeight) + 'px';

        // Update body size
        document.body.style.width = popupContainer.style.width;
        document.body.style.height = popupContainer.style.height;
    }

    function stopResizing() {
        isResizing = false;
        savePopupSize();
    }
}

function closePopup() {
    window.close();
}

function savePopupSize() {
    chrome.storage.local.set({
        popupWidth: document.body.style.width,
        popupHeight: document.body.style.height
    });
}

function loadPopupSize() {
    chrome.storage.local.get(['popupWidth', 'popupHeight'], (result) => {
        if (result.popupWidth && result.popupHeight) {
            document.body.style.width = result.popupWidth;
            document.body.style.height = result.popupHeight;
            const popupContainer = document.getElementById('popup-container');
            popupContainer.style.width = result.popupWidth;
            popupContainer.style.height = result.popupHeight;
        }
        // Force a redraw
        document.body.offsetHeight;
    });
}