// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPageContent') {
      // Extract the main content of the page
      // This is a simple example and might need to be adjusted based on the structure of the pages you're summarizing
      const content = document.body.innerText;
      sendResponse({content: content});
    }
    // Be sure to return true if you want to send a response asynchronously
    return true;
  });
  
  // You can add more functionality here to interact with the page if needed