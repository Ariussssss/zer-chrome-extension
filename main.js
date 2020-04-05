const ZER_CONFIG = {
  regUri: {
    b: {
      description: "b: bilibili",
      handler: keyword =>
        `https://search.bilibili.com/all?keyword=${keyword}&from_source=nav_search_new`
    },
    ba: {
      description: "ba: bilibili new",
      uri: "https://t.bilibili.com/?tab=8"
    },
    g: {
      description: "g: github",
      handler: keyword =>
        `https://github.com/search?q=${keyword}&ref=opensearch`
    },
    s: {
      description: "s: staroverflow",
      handler: keyword => `https://stackoverflow.com/search?q=${keyword}`
    },
    y: {
      description: "y: youtube",
      handler: keyword =>
        `https://www.youtube.com/results?search_query=${keyword}&page=&utm_source=opensearch`
    },
    z: {
      description: "z: zhihu",
      handler: keyword =>
        `https://www.zhihu.com/search?type=content&q=${keyword}`
    },
    default: {
      description: "default: google",
      handler: keyword =>
        `https://www.google.com/search?q=${keyword}&oq=${keyword}`
    },
  }
};

const getKeyFromText = text => {
  const res = text.match(/^((\w)+(:|\s|$))/i);
  if (res) {
    const [regText] = res;
    const value = text.replace(regText, "");
    const key = regText.replace(/(\s|:)/i, "");
    return key in ZER_CONFIG.regUri ? [ZER_CONFIG.regUri[key], value] : false;
  }
  return false;
};

const redirect = url => {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    var tab = tabs[0];
    chrome.tabs.update(tab.id, { url });
  });
};

chrome.omnibox.onInputChanged.addListener(function(text, suggest) {
  suggest(
    Object.entries(ZER_CONFIG.regUri)
      .filter(([e]) => text.indexOf(e) === 0 || !text)
      .map(([key, val]) => {
        return { description: val.description, content: key + ":" };
      })
  );
});

chrome.omnibox.onInputEntered.addListener(function(text) {
  const res = getKeyFromText(text);
  if (res) {
    const [cfg, val] = res;
    if (cfg.uri) {
      redirect(cfg.uri);
    } else {
      if (val) redirect(cfg.handler(val));
    }
  } else {
    redirect(ZER_CONFIG.regUri.default.handler(text));
  }
});
