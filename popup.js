document.getElementById('summarizeButton').addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: getPageContent,
      },
      async (results) => {
        if (results && results[0] && results[0].result) {
          const pageContent = results[0].result;
          const summaryElement = document.getElementById('summary');
          summaryElement.textContent = ''; // Clear previous summary

          const response = await fetch('http://localhost:1234/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer lm-studio'
            },
            body: JSON.stringify({
              model: 'behnamoh/Phi-3-medium-4k-instruct-Q4_0-GGUF',
              messages: [
                { role: 'system', content: 'Summarize the following text:' },
                { role: 'user', content: pageContent }
              ],
              temperature: 0.7,
              stream: true // Ensure streaming is enabled on the server-side
            })
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
                  summaryElement.scrollTop = summaryElement.scrollHeight; // Scroll to the bottom
                }
              }
            }
            partialMessage = messages[messages.length - 1];
          }
        }
      }
    );
  });
});

function getPageContent() {
  return document.body.innerText;
}
