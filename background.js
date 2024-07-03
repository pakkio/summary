// Listen for installation or update of the extension
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('LMStudio Summarizer has been installed');
      // You can add initialization logic here, like setting default options
    } else if (details.reason === 'update') {
      console.log('LMStudio Summarizer has been updated');
      // You can add update logic here, like migrating settings
    }
  });
  
  // Listen for messages from content scripts or popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'summarize') {
      // You can add logic here to handle summarization requests
      // For now, we'll just log the request
      console.log('Summarization requested for:', request.url);
      sendResponse({status: 'acknowledged'});
    }
    // Be sure to return true if you want to send a response asynchronously
    return true;
  });// Empty background script
