(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.CockpitTabbedExplorerUI = factory;
}(typeof window !== 'undefined' ? window : globalThis, function createTabbedExplorerUI(options) {
  'use strict';
  const c = options || {};
  if (!c.document || !c.root || !Array.isArray(c.tabs) || !c.tabs.length) {
    throw new TypeError('TabbedExplorerUI requires document, root and tabs');
  }
  const doc = c.document, root = c.root;
  const tabs = new Map();
  for (const tab of c.tabs) {
    if (!tab?.id || !tab.label || tabs.has(tab.id)) throw new TypeError('Explorer tabs need unique ids and labels');
    tabs.set(tab.id, tab);
  }
  const storage = c.storage || null, storageKey = c.storageKey || 'cockpit-tabbed-explorer-v1';
  let saved = {};
  try { saved = JSON.parse(storage?.getItem(storageKey) || '{}') || {}; } catch {}
  const order = [...new Set([...(Array.isArray(saved.order) ? saved.order : []), ...tabs.keys()])].filter(id => tabs.has(id));
  const hidden = new Set(Array.isArray(saved.hidden) ? saved.hidden.filter(id => tabs.has(id)) : []);
  if (hidden.size === tabs.size) hidden.delete(order[0]);
  const views = new Map([...tabs].map(([id]) => {
    const old = saved.views?.[id] || {};
    return [id, {filter:typeof old.filter === 'string' ? old.filter.slice(0,120) : '', sort:old.sort || 'name', expanded:new Set(Array.isArray(old.expanded) ? old.expanded.slice(0,500) : []), selected:old.selected || null, scroll:0}];
  }));
  let active = tabs.has(saved.active) && !hidden.has(saved.active) ? saved.active : order.find(id => !hidden.has(id));
  let generation = 0;
  const prefix = root.id || 'cockpit-explorer';
  root.classList.add('cockpit-tabbed-explorer');
  const header = doc.createElement('div'); header.className = 'cockpit-tabbed-explorer__header';
  const tablist = doc.createElement('div'); tablist.className = 'cockpit-tabbed-explorer__tabs';
  tablist.setAttribute('role','tablist'); tablist.setAttribute('aria-label','Explorer views');
  const menu = doc.createElement('details'); menu.className = 'cockpit-tabbed-explorer__menu';
  const summary = doc.createElement('summary'); summary.textContent = '⋯'; summary.title = 'Customize Explorer tabs'; summary.setAttribute('aria-label','Customize Explorer tabs');
  const menuContent = doc.createElement('div'); menuContent.className = 'cockpit-tabbed-explorer__menu-content';
  menu.append(summary, menuContent); header.append(tablist,menu);
  const controls = doc.createElement('div'); controls.className = 'cockpit-tabbed-explorer__controls';
  const filter = doc.createElement('input'); filter.type = 'search'; filter.maxLength = 120;
  const sort = doc.createElement('select');
  controls.append(filter,sort);
  const panel = doc.createElement('section'); panel.className = 'cockpit-tabbed-explorer__panel'; panel.id = prefix + '-panel';
  panel.setAttribute('role','tabpanel');
  const status = doc.createElement('p'); status.className = 'cockpit-tabbed-explorer__status'; status.setAttribute('role','status');
  const tree = doc.createElement('div'); tree.className = 'cockpit-tabbed-explorer__tree'; tree.setAttribute('role','tree');
  panel.append(status,tree); root.append(header,controls,panel);
  function persist() {
    try { storage?.setItem(storageKey, JSON.stringify({active,order,hidden:[...hidden],views:Object.fromEntries([...views].map(([id,v]) => [id,{filter:v.filter,sort:v.sort,expanded:[...v.expanded].slice(0,500),selected:v.selected}]))})); } catch {}
  }
  function optionsFor(tab) {
    return [{id:'name',label:'Name A–Z',compare:(a,b) => a.label.localeCompare(b.label)}, {id:'name-desc',label:'Name Z–A',compare:(a,b) => b.label.localeCompare(a.label)}, ...(tab.sortOptions || [])];
  }
  function renderChrome() {
    tablist.replaceChildren(); menuContent.replaceChildren();
    for (const id of order) {
      const tab = tabs.get(id);
      if (!hidden.has(id)) {
        const button = doc.createElement('button'); button.type = 'button'; button.id = prefix + '-tab-' + id;
        button.className = 'cockpit-tabbed-explorer__tab'; button.title = tab.label;
        button.setAttribute('role','tab'); button.setAttribute('aria-label',tab.label);
        button.setAttribute('aria-controls',panel.id); button.setAttribute('aria-selected',String(id === active));
        button.tabIndex = id === active ? 0 : -1; button.dataset.explorerTab = id;
        const icon = doc.createElement('span'); icon.setAttribute('aria-hidden','true'); icon.textContent = tab.icon || '▤'; button.append(icon);
        tablist.append(button);
      }
      const item = doc.createElement('div'); item.className = 'cockpit-tabbed-explorer__menu-item';
      const checkbox = doc.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = !hidden.has(id);
      checkbox.disabled = !hidden.has(id) && tabs.size - hidden.size === 1;
      checkbox.setAttribute('aria-label','Show ' + tab.label + ' tab');
      checkbox.addEventListener('change',() => setTabVisible(id,checkbox.checked));
      const label = doc.createElement('span'); label.textContent = tab.label;
      const up = doc.createElement('button'); up.type = 'button'; up.textContent = '↑'; up.title = 'Move ' + tab.label + ' left'; up.setAttribute('aria-label',up.title);
      up.disabled = order.indexOf(id) === 0; up.addEventListener('click',() => moveTab(id,-1));
      const down = doc.createElement('button'); down.type = 'button'; down.textContent = '↓'; down.title = 'Move ' + tab.label + ' right'; down.setAttribute('aria-label',down.title);
      down.disabled = order.indexOf(id) === order.length - 1; down.addEventListener('click',() => moveTab(id,1));
      item.append(checkbox,label,up,down); menuContent.append(item);
    }
    panel.setAttribute('aria-labelledby',prefix + '-tab-' + active);
    const current = tabs.get(active), view = views.get(active);
    filter.setAttribute('aria-label','Filter ' + current.label); filter.placeholder = 'Filter ' + current.label.toLowerCase(); filter.value = view.filter;
    sort.setAttribute('aria-label','Sort ' + current.label); sort.replaceChildren();
    const choices = optionsFor(current);
    if (!choices.some(choice => choice.id === view.sort)) view.sort = 'name';
    for (const choice of choices) { const option = doc.createElement('option'); option.value = choice.id; option.textContent = choice.label; sort.append(option); }
    sort.value = view.sort;
  }
  function normalizedNodes(value) {
    if (Array.isArray(value)) return {nodes:value,message:''};
    return {nodes:Array.isArray(value?.nodes) ? value.nodes : [],message:typeof value?.message === 'string' ? value.message : ''};
  }
  function renderTree(nodes, message) {
    const tab = tabs.get(active), view = views.get(active), query = view.filter.trim().toLocaleLowerCase();
    const choice = optionsFor(tab).find(item => item.id === view.sort) || optionsFor(tab)[0];
    const visible = [];
    function walk(items, level, parentId) {
      const sorted = [...items].filter(item => item && typeof item.id === 'string' && typeof item.label === 'string').sort(choice.compare);
      for (let index = 0; index < sorted.length; index++) {
        const node = sorted[index], children = Array.isArray(node.children) ? node.children : [];
        const match = !query || node.label.toLocaleLowerCase().includes(query);
        const childMatch = query && containsMatch(children,query);
        if (!match && !childMatch) continue;
        visible.push({node,level,parentId,index:index+1,setsize:sorted.length,branch:children.length>0});
        if (children.length && (query || view.expanded.has(node.id))) walk(children,level+1,node.id);
      }
    }
    function containsMatch(items,needle) { return items.some(node => typeof node?.label === 'string' && (node.label.toLocaleLowerCase().includes(needle) || containsMatch(Array.isArray(node.children) ? node.children : [],needle))); }
    walk(nodes,1,null);
    tree.replaceChildren(); status.textContent = message || (visible.length ? '' : query ? 'No matching items.' : tab.emptyMessage || 'Nothing here yet.');
    for (let visibleIndex = 0; visibleIndex < visible.length; visibleIndex++) {
      const item = visible[visibleIndex];
      const row = doc.createElement('div'); row.className = 'cockpit-tabbed-explorer__item'; row.tabIndex = item.node.id === view.selected ? 0 : -1;
      row.setAttribute('role','treeitem'); row.setAttribute('aria-level',String(item.level)); row.setAttribute('aria-posinset',String(item.index)); row.setAttribute('aria-setsize',String(item.setsize));
      row.setAttribute('aria-selected',String(item.node.id === view.selected));
      const expanded = item.branch && visible.some(entry => entry.parentId === item.node.id);
      row.dataset.nodeId = item.node.id; row.style.paddingInlineStart = (8 + (item.level-1)*14) + 'px';
      const icon = item.branch ? doc.createElement('button') : doc.createElement('span');
      if (item.branch) {
        icon.type = 'button'; icon.className = 'cockpit-tabbed-explorer__disclosure'; icon.dataset.disclosure = item.node.id;
        icon.setAttribute('aria-label',(expanded ? 'Collapse ' : 'Expand ') + item.node.label + ' in Explorer'); icon.setAttribute('aria-expanded',String(expanded));
      } else icon.setAttribute('aria-hidden','true');
      icon.textContent = item.branch ? (expanded ? '▾' : '▸') : item.node.icon || '·';
      const label = doc.createElement('span'); label.textContent = item.node.label;
      label.id = prefix + '-node-label-' + visibleIndex;
      row.setAttribute('aria-labelledby',label.id);
      row.append(icon,label);
      if (item.node.meta) { const meta = doc.createElement('small'); meta.textContent = item.node.meta; meta.id = prefix + '-node-meta-' + visibleIndex; row.setAttribute('aria-labelledby',label.id + ' ' + meta.id); row.append(meta); }
      tree.append(row);
    }
    if (visible.length && !visible.some(item => item.node.id === view.selected)) {
      view.selected = visible[0].node.id;
      tree.firstChild.tabIndex = 0; tree.firstChild.setAttribute('aria-selected','true');
    }
    tree._visibleNodes = visible;
    tree.setAttribute('aria-label',tab.label + ' tree');
    tree.scrollTop = view.scroll;
  }
  async function refresh() {
    const current = active, token = ++generation, tab = tabs.get(current);
    renderChrome(); status.textContent = 'Loading ' + tab.label.toLowerCase() + '…'; tree.replaceChildren();
    if (typeof tab.provider?.getNodes !== 'function') { if (token === generation) renderTree([],tab.unavailableMessage || tab.label + ' is not connected in this workspace.'); return; }
    try {
      const result = normalizedNodes(await tab.provider.getNodes());
      if (token === generation && current === active) renderTree(result.nodes,result.message);
    } catch { if (token === generation) renderTree([],'Could not load ' + tab.label.toLowerCase() + '.'); }
  }
  function activate(id, focus) {
    if (!tabs.has(id) || hidden.has(id)) throw new TypeError('Unknown or hidden Explorer tab');
    views.get(active).scroll = tree.scrollTop;
    active = id; persist(); refresh();
    if (focus) tablist.querySelector('[data-explorer-tab="' + id + '"]')?.focus();
  }
  function setTabVisible(id,visible) {
    if (!tabs.has(id)) throw new TypeError('Unknown Explorer tab');
    if (!visible && !hidden.has(id) && tabs.size - hidden.size === 1) return false;
    if (visible) hidden.delete(id); else hidden.add(id);
    if (hidden.has(active)) active = order.find(key => !hidden.has(key));
    persist(); refresh(); return !hidden.has(id);
  }
  function moveTab(id,direction) {
    const index = order.indexOf(id), next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return false;
    [order[index],order[next]] = [order[next],order[index]];
    persist(); renderChrome(); return true;
  }
  tablist.addEventListener('click',event => { const button = event.target.closest('[data-explorer-tab]'); if (button) activate(button.dataset.explorerTab,false); });
  tablist.addEventListener('keydown',event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault(); const shown = order.filter(id => !hidden.has(id)); const index = shown.indexOf(active);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? shown.length-1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + shown.length) % shown.length;
    activate(shown[next],true);
  });
  filter.addEventListener('input',() => { views.get(active).filter = filter.value; persist(); refresh(); filter.focus(); });
  sort.addEventListener('change',() => { views.get(active).sort = sort.value; persist(); refresh(); sort.focus(); });
  tree.addEventListener('scroll',() => { views.get(active).scroll = tree.scrollTop; });
  function focusNode(id) {
    const rows = [...tree.querySelectorAll('[role="treeitem"]')];
    const target = rows.find(row => row.dataset.nodeId === id); if (!target) return;
    const view = views.get(active); view.selected = id;
    for (const row of rows) { const selected = row === target; row.tabIndex = selected ? 0 : -1; row.setAttribute('aria-selected',String(selected)); }
    target.focus(); persist();
  }
  function toggleNode(item) {
    if (!item.branch) return;
    const expanded = views.get(active).expanded; if (expanded.has(item.node.id)) expanded.delete(item.node.id); else expanded.add(item.node.id); persist(); refresh();
  }
  function openNode(item) {
    toggleNode(item);
    tabs.get(active).provider?.open?.(item.node);
  }
  tree.addEventListener('click',event => { const row = event.target.closest('[role="treeitem"]'); if (!row) return; const item = tree._visibleNodes?.find(entry => entry.node.id === row.dataset.nodeId); if (!item) return; if (event.target.closest('[data-disclosure]')) { toggleNode(item); return; } focusNode(item.node.id); openNode(item); });
  tree.addEventListener('keydown',event => {
    const rows = [...tree.querySelectorAll('[role="treeitem"]')], index = rows.indexOf(doc.activeElement), item = tree._visibleNodes?.[index];
    if (index < 0 || !item) return;
    let next = null;
    if (event.key === 'ArrowDown') next = rows[Math.min(rows.length-1,index+1)];
    if (event.key === 'ArrowUp') next = rows[Math.max(0,index-1)];
    if (event.key === 'Home') next = rows[0];
    if (event.key === 'End') next = rows.at(-1);
    if (event.key === 'ArrowRight' && item.branch) { views.get(active).expanded.add(item.node.id); persist(); refresh(); next = tree.querySelectorAll('[role="treeitem"]')[index+1]; }
    if (event.key === 'ArrowLeft') {
      if (item.branch && views.get(active).expanded.has(item.node.id)) { views.get(active).expanded.delete(item.node.id); persist(); refresh(); next = tree.querySelectorAll('[role="treeitem"]')[index]; }
      else next = rows.find(row => row.dataset.nodeId === item.parentId);
    }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openNode(item); return; }
    if (next) { event.preventDefault(); focusNode(next.dataset.nodeId); }
  });
  refresh();
  return Object.freeze({activate,activeTab:() => active,refresh,setTabVisible,moveTab,tabOrder:() => [...order],tabVisible:id => !hidden.has(id)});
}));
