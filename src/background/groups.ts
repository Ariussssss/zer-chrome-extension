class GroupManagerApp {
  constructor() {}

  init() {
    this.listenForCommands();
    console.clear();
  }

  async toggleIndex(index: number) {
    let group = await this.getGroupByIndex(index);
    if (group) {
      // Toggle the current group open/closed.
      this.toggle(group.id, { collapsed: !group.collapsed });

      // Clase all other open groups except the current one.
      this.closeAllOpenGroups({ except: group.id });
      this.fixGlitch();

      // If all groups are collapsed, switch to the default group.
      const tabId = (await chrome.tabs.query({ groupId: group.id }))?.[0]?.id;
      if (tabId) chrome.tabs.update(tabId, { active: true });
    } else {
      const tabId = (await chrome.tabs.query({ windowId: chrome.windows.WINDOW_ID_CURRENT }))?.[index]?.id;
      if (tabId) chrome.tabs.update(tabId, { active: true });
    }
  }

  listenForCommands() {
    // 背景脚本中
    chrome.runtime.onMessage.addListener(request => {
      console.info('request', request);
      this?.[request.command]?.(...(request?.params ?? []));
    });
  }

  getGroupByIndex(index) {
    return chrome.tabGroups
      .query({
        windowId: chrome.windows.WINDOW_ID_CURRENT
      })
      .then(g => g[index]);
  }

  async toggle(id, { collapsed = false } = {}) {
    return await chrome.tabGroups.update(id, { collapsed });
  }

  // https://developer.chrome.com/docs/extensions/reference/tabGroups/#method-query
  async closeAllOpenGroups({ except }: { except?: number } = {}) {
    const openGroups = await chrome.tabGroups.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
      collapsed: false
    });

    openGroups.map(async group => {
      if (except !== group.id) {
        await this.toggle(group.id, { collapsed: true });
      }
    });
  }

  /**
   * Trigger all closed groups to close again to fix a weird glitch in Chrome.
   */
  fixGlitch() {
    setTimeout(
      () =>
        chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT, collapsed: true }, groups => {
          groups.map(group => this.toggle(group.id, { collapsed: true }));
        }),
      300
    );
  }
}

new GroupManagerApp().init();
