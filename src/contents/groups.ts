document.addEventListener('keydown', event => {
  if (event.altKey && event.keyCode < 60 && event.keyCode > 48) {
    chrome.runtime.sendMessage({ command: 'toggleIndex', params: [event.keyCode - 49] });
  }
});
