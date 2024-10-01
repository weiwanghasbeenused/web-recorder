let isActive = false; // Keeps track of whether the extension is active or not

// Listener for the icon click
chrome.action.onClicked.addListener((tab) => {
  isActive = !isActive; // Toggle the active state

  // Send a message to the content script
  chrome.tabs.sendMessage(tab.id, { toggleState: isActive });
  
  // Optionally, change the icon to reflect the toggle state
//   const newIcon = isActive ? "images/icon-active.png" : "images/icon-inactive.png";
//   chrome.action.setIcon({ path: newIcon });
});