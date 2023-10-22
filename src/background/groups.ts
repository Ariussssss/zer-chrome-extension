class GroupManagerApp {
  private groups: Record<number, { lastActive?: number }>;
  constructor() {
    this.groups = {};
  }

  init() {
    this.listenForCommands();
    this.watchTabsAndGroups();
    console.clear();
  }

  async moveToIndexGroup(index: number) {
    console.info('this.groups', this.groups);

    let group = await this.getGroupByIndex(index);
    const currentTab = (await chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }))[0];
    console.info('currentTab', currentTab);
    if (group) {
      if (currentTab && currentTab.groupId !== group.id && currentTab.id) {
        if (currentTab.groupId && this.groups[currentTab.groupId]) {
          this.groups[currentTab.groupId].lastActive = undefined;
        }
        chrome.tabs.group({
          groupId: group.id,
          tabIds: [currentTab.id]
        });
      }
    } else if (currentTab && currentTab.id){
      chrome.tabs.group({
	tabIds: [currentTab.id]
      });
    }
  }

  async toggleIndex(index: number) {
    console.info('this.groups', this.groups);

    let group = await this.getGroupByIndex(index);
    if (group) {
      // Toggle the current group open/closed.
      this.toggle(group.id, { collapsed: !group.collapsed });

      // Clase all other open groups except the current one.
      this.closeAllOpenGroups({ except: group.id });
      this.fixGlitch();

      // If all groups are collapsed, switch to the default group.
      const tabId = this.groups?.[group.id]?.lastActive ?? (await chrome.tabs.query({ groupId: group.id }))?.[0]?.id;
      if (tabId) chrome.tabs.update(tabId, { active: true });
    } else {
      const tabId = (
        await chrome.tabs.query({
          active: true,
          index,
          windowId: chrome.windows.WINDOW_ID_CURRENT
        })
      )?.[0]?.id;
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

  async fetchTabsAndGroups() {
    const allGroups = await chrome.tabGroups.query({});

    // Update the groups in our internal mapping.
    allGroups.map(group => {
      this.groups[group.id] = { ...(this.groups[group.id] || {}), ...group };
    });

    // Update last active tab in its group.
    const activeTab = (await chrome.tabs.query({ active: true, windowId: chrome.windows.WINDOW_ID_CURRENT }))[0];
    if (activeTab) {
      this.groups[activeTab.groupId] = this.groups?.[activeTab.groupId] ?? {};
      this.groups[activeTab.groupId].lastActive = activeTab.id;
    }
    console.info('fetchTabsAndGroups', this.groups);
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
  watchTabsAndGroups() {
    chrome.tabs.onActivated.addListener(() => this.fetchTabsAndGroups());
  }
}

new GroupManagerApp().init();
