// ─── CLASS DEFINITIONS ──────────────────────────────────────────────────────
const CLASSES = [
  { id: 'explorer',    name: 'Explorers',      color: '#5b9bd5', bg: 'rgba(91,155,213,0.15)',   chars: ['Paladin','Dark Knight','Hero','Ice/Lightning Mage','Fire/Poison Mage','Bishop','Marksman','Bowmaster','Pathfinder','Night Lord','Shadower','Dual Blade','Cannoneer','Buccaneer','Corsair'] },
  { id: 'cygnus',      name: 'Cygnus Knights',  color: '#e8834a', bg: 'rgba(232,131,74,0.15)',   chars: ['Dawn Warrior','Blaze Wizard','Wind Archer','Night Walker','Thunder Breaker','Mihile'] },
  { id: 'heroes',      name: 'Heroes',          color: '#00c8c8', bg: 'rgba(0,200,200,0.15)',    chars: ['Aran','Evan','Luminous','Mercedes','Phantom','Shade'] },
  { id: 'resistance',  name: 'Resistance',      color: '#4ae87a', bg: 'rgba(74,232,122,0.15)',   chars: ['Blaster','Demon Slayer','Demon Avenger','Battle Mage','Wild Hunter','Xenon','Mechanic'] },
  { id: 'nova',        name: 'Nova',            color: '#c8c8c8', bg: 'rgba(200,200,200,0.12)',  chars: ['Kaiser','Kain','Cadena','Angelic Buster'] },
  { id: 'sengoku',     name: 'Sengoku',         color: '#e84ac7', bg: 'rgba(232,74,199,0.15)',   chars: ['Hayato','Kanna'] },
  { id: 'flora',       name: 'Flora',           color: '#e05252', bg: 'rgba(224,82,82,0.15)',    chars: ['Adele','Illium','Khali','Ark'] },
  { id: 'anima',       name: 'Anima',           color: '#00c8a0', bg: 'rgba(0,200,160,0.15)',    chars: ['Ren','Lara','Hoyoung'] },
  { id: 'jianghu',     name: 'Jianghu',         color: '#c8a87a', bg: 'rgba(200,168,122,0.15)',  chars: ['Lynn','Mo Xuan'] },
  { id: 'shine',       name: 'Shine',           color: '#9b7fe8', bg: 'rgba(155,127,232,0.15)',  chars: ['Sia Astelle'] },
  { id: 'friendstory', name: 'FriendStory',     color: '#f090b0', bg: 'rgba(240,144,176,0.15)', chars: ['Kinesis'] },
  { id: 'childofgod',  name: 'Child of God',    color: '#e8c84a', bg: 'rgba(232,200,74,0.15)',   chars: ['Zero'] },
];

const CATEGORY_ORDER = [
  'Eye Decoration','Face Decoration','Hair','Overall','Top','Bottom',
  'Cape','Gloves','Shoes','Hat','Earrings','Ring','Pendant',
  'Weapon','Secondary Weapon','Chair','Pet','Pet Equip',
  'Coupon','Service','Convenience','Other',
];

const API_BASE = '/api/maplestory/GMS/265';
let storage = [];
let pendingItem = null;
let selectedClass = null;
let searchTimer = null;
let currentQuery = '';

// ─── STORAGE PERSISTENCE ─────────────────────────────────────────────────────
function loadStorage() {
  try { const r = localStorage.getItem('maplestorage_v2'); storage = r ? JSON.parse(r) : []; }
  catch { storage = []; }
}
function saveStorage() {
  try { localStorage.setItem('maplestorage_v2', JSON.stringify(storage)); } catch {}
}
function updateStats() {
  document.getElementById('total-count').textContent = storage.length;
}

// ─── ICON HELPERS ─────────────────────────────────────────────────────────────
function iconUrl(id) { return `${API_BASE}/item/${id}/icon`; }
function iconHTML(item, size = 40, imgSize = 32) {
  const src = item.iconUrl || iconUrl(item.id || item.itemId);
  return `<div class="item-icon-wrap" style="width:${size}px;height:${size}px">
    <img src="${src}" width="${imgSize}" height="${imgSize}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
    <span class="fallback" style="display:none">🍁</span>
  </div>`;
}

// ─── CLASS BADGE ──────────────────────────────────────────────────────────────
function classBadgeHTML(classId) {
  const cls = CLASSES.find(c => c.id === classId);
  if (!cls) return '';
  const chars = cls.chars.map(ch => `<span class="popover-char">${ch}</span>`).join('');
  return `<div class="class-badge-wrap">
    <div class="class-badge" style="color:${cls.color};background:${cls.bg};border-color:${cls.color}33">
      <span class="badge-dot" style="background:${cls.color}"></span>${cls.name}
    </div>
    <div class="class-popover">
      <div class="popover-title">Characters in this storage</div>
      <div class="popover-chars">${chars}</div>
    </div>
  </div>`;
}

// ─── CLASS BUTTON (modal) ─────────────────────────────────────────────────────
function classBtnHTML(cls, isSelected) {
  const chars = cls.chars.map(ch => `<span class="btn-popover-char">${ch}</span>`).join('');
  const sel = isSelected ? `border-color:${cls.color};background:${cls.bg};color:${cls.color};font-weight:600` : '';
  return `<button class="class-btn" id="cbtn-${cls.id}" onclick="selectClass('${cls.id}')" style="${sel}">
    ${cls.name}
    <div class="btn-popover">
      <div class="btn-popover-title">Characters</div>
      <div class="btn-popover-chars">${chars}</div>
    </div>
  </button>`;
}

// ─── CATEGORY NORMALISER ──────────────────────────────────────────────────────
function normaliseCategory(item) {
  const sub = (item.typeInfo?.subCategory || '').toLowerCase();
  const cat = (item.typeInfo?.category || '').toLowerCase();
  if (sub.includes('eye')) return 'Eye Decoration';
  if (sub.includes('face')) return 'Face Decoration';
  if (sub.includes('hair')) return 'Hair';
  if (sub.includes('overall')) return 'Overall';
  if (sub.includes('top') || cat.includes('top')) return 'Top';
  if (sub.includes('bottom')) return 'Bottom';
  if (sub.includes('cape')) return 'Cape';
  if (sub.includes('glove')) return 'Gloves';
  if (sub.includes('shoe') || sub.includes('boot')) return 'Shoes';
  if (sub.includes('hat') || sub.includes('helm') || sub.includes('cap')) return 'Hat';
  if (sub.includes('earring')) return 'Earrings';
  if (sub.includes('ring')) return 'Ring';
  if (sub.includes('pendant')) return 'Pendant';
  if (sub.includes('weapon') && sub.includes('secondary')) return 'Secondary Weapon';
  if (sub.includes('weapon') || cat.includes('weapon')) return 'Weapon';
  if (sub.includes('chair')) return 'Chair';
  if (sub.includes('pet equip')) return 'Pet Equip';
  if (sub.includes('pet')) return 'Pet';
  if (sub.includes('coupon')) return 'Coupon';
  if (sub.includes('service')) return 'Service';
  if (sub.includes('convenience') || sub.includes('teleport')) return 'Convenience';
  if (item.itemCategory) return item.itemCategory;
  return 'Other';
}

// ─── ITEM CACHE ───────────────────────────────────────────────────────────────
let itemCache = null;
let itemCacheLoading = false;

async function ensureItemCache() {
  if (itemCache) return itemCache;
  if (itemCacheLoading) {
    await new Promise(resolve => {
      const interval = setInterval(() => { if (!itemCacheLoading) { clearInterval(interval); resolve(); } }, 100);
    });
    return itemCache;
  }
  itemCacheLoading = true;
  document.getElementById('spinner').classList.add('show');
  document.getElementById('db-result-count').textContent = 'Loading item database…';
  try {
    const [cashRes, equipRes] = await Promise.all([
      fetch(`${API_BASE}/item?overallCategory=Cash&count=99999`),
      fetch(`${API_BASE}/item?overallCategory=Equip&count=99999`),
    ]);
    if (!cashRes.ok) throw new Error(`API returned ${cashRes.status}`);
    if (!equipRes.ok) throw new Error(`API returned ${equipRes.status}`);
    const cashItems = await cashRes.json();
    const equipItems = await equipRes.json();
    const seen = new Set();
    itemCache = [...(Array.isArray(cashItems) ? cashItems : []), ...(Array.isArray(equipItems) ? equipItems : [])].filter(item => {
      const id = item.id || item.itemId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return !!item.name;
    });
    console.log(`Item cache loaded: ${itemCache.length} (cash: ${Array.isArray(cashItems) ? cashItems.length : 0}, equip: ${Array.isArray(equipItems) ? equipItems.length : 0})`);
  } catch (err) {
    itemCacheLoading = false;
    throw err;
  }
  itemCacheLoading = false;
  document.getElementById('spinner').classList.remove('show');
  document.getElementById('db-result-count').textContent = '';
  return itemCache;
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────
function onSearchInput() {
  clearTimeout(searchTimer);
  const q = document.getElementById('db-search').value.trim();
  const cat = document.getElementById('db-category-filter').value;
  if (!q && !cat) { resetSearch(); return; }
  searchTimer = setTimeout(() => doSearch(q), 300);
}

function resetSearch() {
  document.getElementById('db-results').style.display = 'none';
  document.getElementById('db-empty').style.display = 'block';
  document.getElementById('db-result-count').textContent = '';
  document.getElementById('api-error').style.display = 'none';
  document.getElementById('spinner').classList.remove('show');
}

async function doSearch(q) {
  currentQuery = q;
  document.getElementById('api-error').style.display = 'none';
  try {
    const allItems = await ensureItemCache();
    if (currentQuery !== q) return;
    const ql = q.toLowerCase();
    const isId = /^\d+$/.test(q);
    const categoryFilter = document.getElementById('db-category-filter').value;
    const results = allItems.filter(item => {
      const id = String(item.id || item.itemId || '');
      const name = (item.name || '').toLowerCase();
      const matchesQuery = !q || (isId ? id.startsWith(q) : name.includes(ql));
      if (!matchesQuery) return false;
      if (categoryFilter) return normaliseCategory(item) === categoryFilter;
      return true;
    }).slice(0, 50);
    renderResults(results, q);
  } catch (err) {
    if (currentQuery !== q) return;
    document.getElementById('spinner').classList.remove('show');
    document.getElementById('api-error').style.display = 'block';
    document.getElementById('api-error').textContent = `⚠ Could not reach maplestory.io — check your connection. (${err.message})`;
    document.getElementById('db-result-count').textContent = '';
    document.getElementById('db-results').style.display = 'none';
    document.getElementById('db-empty').style.display = 'none';
  }
}

function renderResults(items, q) {
  const container = document.getElementById('db-results');
  const empty = document.getElementById('db-empty');
  const countEl = document.getElementById('db-result-count');
  if (!items.length) {
    container.style.display = 'none'; empty.style.display = 'block';
    empty.innerHTML = `<div class="db-empty-icon">🔍</div>No items found for "<strong>${q}</strong>".`;
    countEl.textContent = ''; return;
  }
  countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} found`;
  container.style.display = 'block'; empty.style.display = 'none';
  window._searchResults = items;
  container.innerHTML = `<div class="db-header"><span>Results — maplestory.io</span></div>` +
    items.map((item, idx) => {
      const id = item.id || item.itemId;
      const name = item.name || 'Unknown Item';
      const category = normaliseCategory(item);
      return `<div class="db-item">
        ${iconHTML({ id, iconUrl: iconUrl(id) })}
        <div class="item-info">
          <div class="item-name">${name}</div>
          <div class="item-id">#${id} &nbsp;·&nbsp; <span style="color:var(--text-dim)">${category}</span></div>
        </div>
        <button class="add-btn" onclick="openModalByIndex(${idx})">+ Add</button>
      </div>`;
    }).join('');
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
function openModalByIndex(idx) {
  const item = window._searchResults[idx];
  if (!item) return;
  const id = item.id || item.itemId;
  const name = item.name || 'Unknown Item';
  const category = normaliseCategory(item);
  openModal({ id, name, category, iconUrl: iconUrl(id) });
}

function openModal(item) {
  pendingItem = item; selectedClass = null;
  document.getElementById('modal-item-preview').innerHTML =
    `${iconHTML(item, 40, 32)}
    <div class="item-info">
      <div class="item-name">${item.name}</div>
      <div class="item-id">#${item.id} · ${item.category}</div>
    </div>`;
  document.getElementById('btn-confirm').disabled = true;
  document.getElementById('class-grid').innerHTML = CLASSES.map(cls => classBtnHTML(cls, false)).join('');
  document.getElementById('modal').classList.add('open');
}

function selectClass(classId) {
  selectedClass = classId;
  document.getElementById('class-grid').innerHTML = CLASSES.map(cls => classBtnHTML(cls, cls.id === classId)).join('');
  document.getElementById('btn-confirm').disabled = false;
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  pendingItem = null; selectedClass = null;
}


function confirmAdd() {
  if (!pendingItem || !selectedClass) return;
  const cls = CLASSES.find(c => c.id === selectedClass);
  storage.push({ itemId: pendingItem.id, itemName: pendingItem.name, itemCategory: pendingItem.category, iconUrl: pendingItem.iconUrl, classId: selectedClass, addedAt: Date.now() });
  showToast(`Added to ${cls.name} storage`, 'success');
  saveStorage(); updateStats(); closeModal();
  const q = document.getElementById('db-search').value.trim();
  if (q) doSearch(q);
  populateClassFilter();
}

// ─── STORAGE VIEW ─────────────────────────────────────────────────────────────
function renderStorage() {
  const q = document.getElementById('storage-search').value.trim().toLowerCase();
  const cf = document.getElementById('storage-class-filter').value;
  let items = storage.map((item, idx) => ({ ...item, _idx: idx }));
  if (q) items = items.filter(i => i.itemName.toLowerCase().includes(q) || String(i.itemId).includes(q));
  if (cf) items = items.filter(i => i.classId === cf);
  const list = document.getElementById('storage-list');
  if (!items.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📭</div><p>${storage.length === 0 ? 'Your storage is empty. Add items from the Add Items tab.' : 'No items match your search.'}</p></div>`;
    return;
  }
  const grouped = {};
  for (const item of items) {
    const cat = item.itemCategory || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a), bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1; if (bi === -1) return -1;
    return ai - bi;
  });
  list.innerHTML = sortedCats.map(cat => {
    const catItems = grouped[cat];
    const rows = catItems.map(item => {
      return `<div class="storage-item">
        ${iconHTML(item)}
        <div class="item-info">
          <div class="item-name">${item.itemName}</div>
          <div class="item-id">#${item.itemId}</div>
        </div>
        ${classBadgeHTML(item.classId)}
        <button class="remove-btn" onclick="removeItem(${item._idx})" title="Remove">✕</button>
      </div>`;
    }).join('');
    return `<div class="storage-category-group">
      <div class="storage-category-header">
        <span class="storage-category-name">${cat}</span>
        <span class="storage-category-count">${catItems.length}</span>
      </div>
      <div class="storage-items-list">${rows}</div>
    </div>`;
  }).join('');
}

function removeItem(idx) {
  storage.splice(idx, 1);
  saveStorage(); updateStats(); renderStorage(); populateClassFilter();
  showToast('Item removed');
}

function populateClassFilter() {
  const sel = document.getElementById('storage-class-filter');
  const cur = sel.value;
  const used = new Set(storage.map(i => i.classId));
  sel.innerHTML = '<option value="">All storages</option>' +
    CLASSES.filter(c => used.has(c.id)).map(c => `<option value="${c.id}" ${cur === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('tab-add').style.display = tab === 'add' ? 'block' : 'none';
  document.getElementById('tab-storage').style.display = tab === 'storage' ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab')[tab === 'add' ? 0 : 1].classList.add('active');
  if (tab === 'storage') { populateClassFilter(); renderStorage(); }
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── MODAL CLOSE ON BACKDROP ──────────────────────────────────────────────────
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadStorage();
updateStats();
ensureItemCache().catch(() => {});
