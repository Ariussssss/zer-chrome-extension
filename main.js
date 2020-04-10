const ZER_CONFIG = {
  regUri: {
    b: {
      description: "b: bilibili",
      uri:
        "https://search.bilibili.com/all?keyword=__keyword__&from_source=nav_search_new"
    },
    bf: {
      description: "bf: bilibili new",
      uri: "https://t.bilibili.com/?tab=8"
    },
    e: {
      description: "e: chrome extensions",
      uri: "chrome://extensions/"
    },
    es: {
      description: "es: chrome extensions shop",
      uri: "https://chrome.google.com/webstore/category/extensions?hl=en-US"
    },
    g: {
      description: "g: github",
      uri: "https://github.com/search?q=__keyword__&ref=opensearch"
    },
    p: {
      description: "p: pix",
      uri: "https://www.pixiv.net/en/"
    },
    s: {
      description: "s: staroverflow",
      uri: "https://stackoverflow.com/search?q=__keyword__"
    },
    tc: {
      description: "tc: google translate",
      uri:
        "https://translate.google.cn/#view=home&op=translate&sl=en&tl=zh-CN&text=__keyword__"
    },
    te: {
      description: "te: gooogle translate to English",
      uri:
      "https://translate.google.cn/#view=home&op=translate&sl=zh-CN&tl=en&text=__keyword__"
    },
    v: {
      description: "v: v2ex"
      uri: "https://www.v2ex.com/"
    },
    y: {
      description: "y: youtube",
      uri:
        "https://www.youtube.com/results?search_query=__keyword__&page=&utm_source=opensearch"
    },
    z: {
      description: "z: zhihu",
      uri: "https://www.zhihu.com/search?type=content&q=__keyword__"
    },
    default: {
      description: "default: google",
      uri: "https://www.google.com/search?q=__keyword__&oq=__keyword__"
    }
  }
};

const KEYWORD = "__keyword__";

const replaceAll = (base, text, feature = KEYWORD) => {
  return base.split(feature).join(text);
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
    if (cfg.uri.includes(KEYWORD)) {
      if (val) redirect(replaceAll(cfg.uri, val));
    } else {
      redirect(cfg.uri);
    }
  } else {
    redirect(ZER_CONFIG.regUri.default.handler(text));
  }
});
