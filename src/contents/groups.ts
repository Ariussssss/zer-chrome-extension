document.addEventListener('keydown', event => {
  console.info("event", event);

  if (event.altKey && event.keyCode < 60 && event.keyCode > 48) {
    chrome.runtime.sendMessage({
      command: event.shiftKey ? 'moveToIndexGroup' : 'toggleIndex',
      params: [event.keyCode - 49]
    });
  }
});
