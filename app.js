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

// Category display order and labels
const CATEGORY_ORDER = [
  'Eye Decoration',
  'Face Decoration',
  'Hair',
  'Overall',
  'Top',
  'Bottom',
  'Cape',
  'Gloves',
  'Shoes',
  'Hat',
  'Earrings',
  'Ring',
  'Pendant',
  'Weapon',
  'Secondary Weapon',
  'Chair',
  'Pet',
  'Pet Equip',
  'Coupon',
  'Service',
  'Convenience',
  'Other',
];

const API_BASE = '/api/maplestory/GMS/265';
let storage = [];
let pendingItem = null;
let selectedClass = null;
let searchTimer = null;
let currentQuery = '';

// ─── STORAGE PERSISTENCE ────────────────────────────────────────────────────
function loadStorage() {
  try {
    const raw = localStorage.getItem('maplestorage_v2');
    storage = raw ? JSON.parse(raw) : [];
  } catch { storage = []; }
}

function saveStorage() {
  try { localStorage.setItem('maplestorage_v2', JSON.stringify(storage)); } catch {}
}

function updateStats() {
  const total = storage.reduce((sum, i) => sum + (i.qty || 1), 0);
  document.getElementById('total-count').textContent = total;
}

// ─── ICON HELPERS ────────────────────────────────────────────────────────────
function iconUrl(id) { return `${API_BASE}/item/${id}/icon`; }

function iconHTML(item, size = 40, imgSize = 32) {
  const src = item.iconUrl || iconUrl(item.id || item.itemId);
  return `<div class="item-icon-wrap" style="width:${size}px;height:${size}px">
    <img src="${src}" width="${imgSize}" height="${imgSize}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" alt="">
    <span class="fallback" style="display:none">🍁</span>
  </div>`;
}

// ─── CLASS BADGE ─────────────────────────────────────────────────────────────
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

// ─── CLASS BUTTON (modal) ────────────────────────────────────────────────────
function classBtnHTML(cls, isSelected) {
  const chars = cls.chars.map(ch => `<span class="btn-popover-char">${ch}</span>`).join('');
  const sel = isSelected
    ? `border-color:${cls.color};background:${cls.bg};color:${cls.color};font-weight:600`
    : '';
  return `<button class="class-btn" id="cbtn-${cls.id}" onclick="selectClass('${cls.id}')" style="${sel}">
    ${cls.name}
    <div class="btn-popover">
      <div class="btn-popover-title">Characters</div>
      <div class="btn-popover-chars">${chars}</div>
    </div>
  </button>`;
}

// ─── CATEGORY NORMALISER ─────────────────────────────────────────────────────
function normaliseCategory(item) {
  const sub = item.typeInfo?.subCategory || '';
  const cat = item.typeInfo?.category || '';
  const overall = item.overallCategory || item.itemCategory || '';

  const s = sub.toLowerCase();
  const c = cat.toLowerCase();

  if (s.includes('eye')) return 'Eye Decoration';
  if (s.includes('face')) return 'Face Decoration';
  if (s.includes('hair')) return 'Hair';
  if (s.includes('overall')) return 'Overall';
  if (s.includes('top') || c.includes('top')) return 'Top';
  if (s.includes('bottom')) return 'Bottom';
  if (s.includes('cape')) return 'Cape';
  if (s.includes('glove')) return 'Gloves';
  if (s.includes('shoe') || s.includes('boot')) return 'Shoes';
  if (s.includes('hat') || s.includes('helm') || s.includes('cap')) return 'Hat';
  if (s.includes('earring')) return 'Earrings';
  if (s.includes('ring')) return 'Ring';
  if (s.includes('pendant')) return 'Pendant';
  if (s.includes('weapon') && s.includes('secondary')) return 'Secondary Weapon';
  if (s.includes('weapon') || c.includes('weapon')) return 'Weapon';
  if (s.includes('chair')) return 'Chair';
  if (s.includes('pet equip')) return 'Pet Equip';
  if (s.includes('pet')) return 'Pet';
  if (s.includes('coupon')) return 'Coupon';
  if (s.includes('service')) return 'Service';
  if (s.includes('convenience') || s.includes('teleport')) return 'Convenience';

  // fallback to stored category string
  if (item.itemCategory) return item.itemCategory;
  return 'Other';
}

// ─── SEARCH ──────────────────────────────────────────────────────────────────
// ─── ITEM CACHE ───────────────────────────────────────────────────────────────
let itemCache = null;
let itemCacheLoading = false;

async function fetchCategory(overallCategory, subCategory = '') {
  const results = [];
  const PAGE_SIZE = 1000;
  for (let offset = 0; offset < 50000; offset += PAGE_SIZE) {
    let url = `${API_BASE}/item?overallCategory=${encodeURIComponent(overallCategory)}&count=${PAGE_SIZE}&offset=${offset}`;
    if (subCategory) url += `&category=${encodeURIComponent(subCategory)}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const items = Array.isArray(data) ? data : (data.items || []);
    if (items.length === 0) break;
    results.push(...items);
    if (items.length < PAGE_SIZE) break; // last page
  }
  return results;
}

async function ensureItemCache() {
  if (itemCache) return itemCache;
  if (itemCacheLoading) {
    await new Promise(resolve => {
      const interval = setInterval(() => {
        if (!itemCacheLoading) { clearInterval(interval); resolve(); }
      }, 100);
    });
    return itemCache;
  }
  itemCacheLoading = true;
  document.getElementById('spinner').classList.add('show');
  document.getElementById('db-result-count').textContent = 'Loading item database…';

  try {
    // Fetch all equip subcategories in parallel to bypass the 5000 item cap
    const equipSubs = [
      'Hat', 'Face', 'Eye Decoration', 'Earring', 'Top', 'Overall',
      'Bottom', 'Shoes', 'Glove', 'Cape', 'Ring', 'Pendant',
      'Weapon', 'Secondary Weapon', 'Emblem', 'Badge', 'Medal',
      'Shoulder', 'Pocket', 'Belt', 'Android', 'Mechanic Heart',
    ];

    const [cashItems, ...equipBatches] = await Promise.all([
      fetchCategory('Cash'),
      ...equipSubs.map(sub => fetchCategory('Equip', sub)),
    ]);

    const equipItems = equipBatches.flat();

    // Merge and deduplicate
    const seen = new Set();
    const merged = [...cashItems, ...equipItems].filter(item => {
      const id = item.id || item.itemId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return !!item.name;
    });

    itemCache = merged;
    console.log(`Item cache loaded: ${itemCache.length} items (cash: ${cashItems.length}, equip: ${equipItems.length})`);
  } catch (err) {
    itemCacheLoading = false;
    throw err;
  }

  itemCacheLoading = false;
  document.getElementById('spinner').classList.remove('show');
  document.getElementById('db-result-count').textContent = '';
  return itemCache;
}

function onSearchInput() {
  clearTimeout(searchTimer);
  const q = document.getElementById('db-search').value.trim();
  if (!q) { resetSearch(); return; }
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

    const results = allItems.filter(item => {
      const id = String(item.id || item.itemId || '');
      const name = (item.name || item.description?.name || '').toLowerCase();
      if (isId) return id.startsWith(q);
      return name.includes(ql);
    }).slice(0, 30);

    renderResults(results, q);
  } catch (err) {
    if (currentQuery !== q) return;
    document.getElementById('spinner').classList.remove('show');
    document.getElementById('api-error').style.display = 'block';
    document.getElementById('api-error').textContent =
      `⚠ Could not reach maplestory.io — check your connection. (${err.message})`;
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
    container.style.display = 'none';
    empty.style.display = 'block';
    empty.innerHTML = `<div class="db-empty-icon">🔍</div>No cash items found for "<strong>${q}</strong>".`;
    countEl.textContent = '';
    return;
  }

  countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''} found`;
  container.style.display = 'block';
  empty.style.display = 'none';

  container.innerHTML = `<div class="db-header">
    <span>Live Results — maplestory.io</span>
    <span class="api-badge">Live API</span>
  </div>` + items.map(item => {
    const id = item.id || item.itemId;
    const name = item.name || item.description?.name || 'Unknown Item';
    const category = normaliseCategory(item);
    const owned = storage.find(s => s.itemId === id);

    return `<div class="db-item">
      ${iconHTML({ id, iconUrl: iconUrl(id) })}
      <div class="item-info">
        <div class="item-name">${name}</div>
        <div class="item-id">#${id} &nbsp;·&nbsp; <span style="color:var(--text-dim)">${category}</span></div>
        ${owned ? `<div style="margin-top:3px">${classBadgeHTML(owned.classId)}</div>` : ''}
      </div>
      ${owned
        ? `<div class="add-btn owned">✓ Stored ×${owned.qty || 1}</div>`
        : `<button class="add-btn" onclick='openModal(${JSON.stringify({ id, name, category, iconUrl: iconUrl(id) })})'>+ Add</button>`
      }
    </div>`;
  }).join('');
}

// ─── MODAL ───────────────────────────────────────────────────────────────────
function openModal(item) {
  pendingItem = item;
  selectedClass = null;

  document.getElementById('modal-item-preview').innerHTML =
    `${iconHTML(item, 40, 32)}
    <div class="item-info">
      <div class="item-name">${item.name}</div>
      <div class="item-id">#${item.id} · ${item.category}</div>
    </div>`;

  document.getElementById('qty-input').value = 1;
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
  pendingItem = null;
  selectedClass = null;
}

function changeQty(delta) {
  const input = document.getElementById('qty-input');
  const val = Math.max(1, Math.min(999, (parseInt(input.value) || 1) + delta));
  input.value = val;
}

function clampQty() {
  const input = document.getElementById('qty-input');
  const val = parseInt(input.value);
  if (isNaN(val) || val < 1) input.value = 1;
  if (val > 999) input.value = 999;
}

function confirmAdd() {
  if (!pendingItem || !selectedClass) return;
  const cls = CLASSES.find(c => c.id === selectedClass);
  const qty = Math.max(1, parseInt(document.getElementById('qty-input').value) || 1);

  // If already exists, update qty and class
  const existing = storage.find(s => s.itemId === pendingItem.id);
  if (existing) {
    existing.qty = (existing.qty || 1) + qty;
    existing.classId = selectedClass;
    showToast(`Updated — now ×${existing.qty} in ${cls.name}`, 'success');
  } else {
    storage.push({
      itemId: pendingItem.id,
      itemName: pendingItem.name,
      itemCategory: pendingItem.category,
      iconUrl: pendingItem.iconUrl,
      classId: selectedClass,
      qty,
      addedAt: Date.now(),
    });
    showToast(`Added ×${qty} to ${cls.name} storage`, 'success');
  }

  saveStorage();
  updateStats();
  closeModal();

  const q = document.getElementById('db-search').value.trim();
  if (q) doSearch(q);
  populateClassFilter();
}

// ─── STORAGE VIEW ────────────────────────────────────────────────────────────
function renderStorage() {
  const q = document.getElementById('storage-search').value.trim().toLowerCase();
  const cf = document.getElementById('storage-class-filter').value;
  const list = document.getElementById('storage-list');

  let items = [...storage];
  if (q) items = items.filter(i => i.itemName.toLowerCase().includes(q) || String(i.itemId).includes(q));
  if (cf) items = items.filter(i => i.classId === cf);

  if (!items.length) {
    list.innerHTML = `<div class="empty">
      <div class="empty-icon">📭</div>
      <p>${storage.length === 0
        ? 'Your storage is empty. Add items from the Add Items tab.'
        : 'No items match your search.'}</p>
    </div>`;
    return;
  }

  // Group by category
  const grouped = {};
  for (const item of items) {
    const cat = item.itemCategory || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  // Sort categories by our defined order, unknowns go to end
  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  list.innerHTML = sortedCats.map(cat => {
    const catItems = grouped[cat];
    const rows = catItems.map(item => {
      const qtyBadge = `<span class="item-qty-badge ${(item.qty || 1) > 1 ? 'multi' : ''}">×${item.qty || 1}</span>`;
      return `<div class="storage-item">
        ${iconHTML(item)}
        <div class="item-info">
          <div class="item-name">${item.itemName}</div>
          <div class="item-id">#${item.itemId}</div>
        </div>
        ${qtyBadge}
        ${classBadgeHTML(item.classId)}
        <button class="remove-btn" onclick="removeItem(${item.itemId})" title="Remove">✕</button>
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

function removeItem(itemId) {
  storage = storage.filter(i => i.itemId !== itemId);
  saveStorage();
  updateStats();
  renderStorage();
  populateClassFilter();
  showToast('Item removed');
}

function populateClassFilter() {
  const sel = document.getElementById('storage-class-filter');
  const cur = sel.value;
  const used = new Set(storage.map(i => i.classId));
  sel.innerHTML = '<option value="">All storages</option>' +
    CLASSES.filter(c => used.has(c.id))
      .map(c => `<option value="${c.id}" ${cur === c.id ? 'selected' : ''}>${c.name}</option>`)
      .join('');
}

// ─── TABS ────────────────────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('tab-add').style.display = tab === 'add' ? 'block' : 'none';
  document.getElementById('tab-storage').style.display = tab === 'storage' ? 'block' : 'none';
  document.getElementById('tab-sim').style.display = tab === 'sim' ? 'block' : 'none';
  const tabs = ['add', 'storage', 'sim'];
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', tabs[i] === tab));
  if (tab === 'storage') { populateClassFilter(); renderStorage(); }
  if (tab === 'sim') { renderSimSlots(); }
}

// ─── TOAST ───────────────────────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── MODAL CLOSE ON BACKDROP ─────────────────────────────────────────────────
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

// ─── INIT ────────────────────────────────────────────────────────────────────
loadStorage();
updateStats();
renderSimSlots();
// Pre-warm the item cache in the background so first search is instant
ensureItemCache().catch(() => {});

// ─── SIM ─────────────────────────────────────────────────────────────────────

// Slot definitions: label, category matcher, default item ID (base body parts)
const SIM_SLOTS = [
  { id: 'Face',      label: 'Face',       cats: ['face decoration','face acc'],       default: 20000 },
  { id: 'Eye',       label: 'Eye Dec.',   cats: ['eye decoration','eye acc'],          default: 30000 },
  { id: 'Hat',       label: 'Hat',        cats: ['hat','helm','cap'],                  default: null  },
  { id: 'Top',       label: 'Top',        cats: ['top','shirt','coat'],                default: null  },
  { id: 'Bottom',    label: 'Bottom',     cats: ['bottom','pants'],                    default: null  },
  { id: 'Overall',   label: 'Overall',    cats: ['overall'],                           default: null  },
  { id: 'Shoes',     label: 'Shoes',      cats: ['shoe','boot'],                       default: null  },
  { id: 'Gloves',    label: 'Gloves',     cats: ['glove'],                             default: null  },
  { id: 'Cape',      label: 'Cape',       cats: ['cape'],                              default: null  },
  { id: 'Weapon',    label: 'Weapon',     cats: ['weapon'],                            default: null  },
  { id: 'Earring',   label: 'Earrings',   cats: ['earring'],                           default: null  },
];

// Default hair and body IDs by skin tone
const SKIN_HAIR_DEFAULTS = {
  '2000': { body: 2000, head: 12000, hair: 30030, face: 20000 },
  '2004': { body: 2004, head: 12004, hair: 30030, face: 20000 },
  '2010': { body: 2010, head: 12010, hair: 30030, face: 20000 },
  '2001': { body: 2001, head: 12001, hair: 30030, face: 20000 },
};

let simEquipped = {}; // slotId → { id, name, iconUrl }
let simSearchTimer = null;

function slotForItem(item) {
  const sub = (item.typeInfo?.subCategory || item.itemCategory || '').toLowerCase();
  const cat = (item.typeInfo?.category || '').toLowerCase();
  const combined = sub + ' ' + cat;
  for (const slot of SIM_SLOTS) {
    if (slot.cats.some(c => combined.includes(c))) return slot.id;
  }
  return null;
}

function updateCharacter() {
  const skin = document.getElementById('sim-skin').value;
  const stance = document.getElementById('sim-stance').value;
  const animated = document.getElementById('sim-animated').checked;
  const defaults = SKIN_HAIR_DEFAULTS[skin] || SKIN_HAIR_DEFAULTS['2000'];

  // Build item ID list: always include body, head, hair, face defaults + equipped items
  const ids = [defaults.body, defaults.head, defaults.hair, defaults.face];
  for (const slot of SIM_SLOTS) {
    const eq = simEquipped[slot.id];
    if (eq) ids.push(eq.id);
    else if (slot.default) ids.push(slot.default);
  }

  const idStr = ids.join(',');
  const ext = animated ? 'animated' : '0';
  const url = `${API_BASE}/character/${idStr}/${stance}/${ext}`;

  const img = document.getElementById('sim-character-img');
  const placeholder = document.getElementById('sim-character-placeholder');

  // Show loading spinner overlay
  const wrap = document.querySelector('.sim-character-wrap');
  let overlay = wrap.querySelector('.sim-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'sim-loading-overlay';
    overlay.innerHTML = '<div class="spinner show" style="position:static;transform:none;"></div>';
    wrap.appendChild(overlay);
  }
  overlay.style.display = 'flex';

  img.onload = () => {
    overlay.style.display = 'none';
    img.style.display = 'block';
    placeholder.style.display = 'none';
  };
  img.onerror = () => {
    overlay.style.display = 'none';
  };
  img.src = url;
}

function renderSimSlots() {
  const grid = document.getElementById('sim-slots-grid');
  grid.innerHTML = SIM_SLOTS.map(slot => {
    const eq = simEquipped[slot.id];
    return `<div class="sim-slot ${eq ? 'has-item' : ''}" id="simslot-${slot.id}">
      <span class="sim-slot-label">${slot.label}</span>
      ${eq
        ? `<div class="sim-slot-item">
            ${iconHTML({ id: eq.id, iconUrl: eq.iconUrl }, 28, 22)}
            <span class="sim-slot-name">${eq.name}</span>
          </div>
          <button class="sim-unequip-btn" onclick="unequipSlot('${slot.id}')" title="Remove">✕</button>`
        : `<span class="sim-slot-empty">— empty —</span>`
      }
    </div>`;
  }).join('');
}

function equipItem(item) {
  const slotId = item.slotId || slotForItem(item);
  if (!slotId) {
    showToast('Item type not supported for sim', 'error');
    return;
  }
  simEquipped[slotId] = { id: item.id, name: item.name, iconUrl: item.iconUrl || iconUrl(item.id) };
  renderSimSlots();
  updateCharacter();
  // Clear search
  document.getElementById('sim-search').value = '';
  document.getElementById('sim-search-results').style.display = 'none';
}

function unequipSlot(slotId) {
  delete simEquipped[slotId];
  renderSimSlots();
  if (Object.keys(simEquipped).length > 0) {
    updateCharacter();
  } else {
    // No items equipped — reset preview
    const img = document.getElementById('sim-character-img');
    img.style.display = 'none';
    document.getElementById('sim-character-placeholder').style.display = 'block';
  }
}

function clearSim() {
  simEquipped = {};
  renderSimSlots();
  const img = document.getElementById('sim-character-img');
  img.style.display = 'none';
  document.getElementById('sim-character-placeholder').style.display = 'block';
}

// Sim search
function onSimSearchInput() {
  clearTimeout(simSearchTimer);
  const q = document.getElementById('sim-search').value.trim();
  if (!q) { document.getElementById('sim-search-results').style.display = 'none'; return; }
  simSearchTimer = setTimeout(() => doSimSearch(q), 400);
}

async function doSimSearch(q) {
  document.getElementById('sim-spinner').classList.add('show');
  try {
    const allItems = await ensureItemCache();
    document.getElementById('sim-spinner').classList.remove('show');
    const ql = q.toLowerCase();
    const isId = /^\d+$/.test(q);
    const items = allItems.filter(item => {
      const id = String(item.id || item.itemId || '');
      const name = (item.name || item.description?.name || '').toLowerCase();
      if (isId) return id.startsWith(q);
      return name.includes(ql);
    }).slice(0, 15);
    renderSimResults(items);
  } catch {
    document.getElementById('sim-spinner').classList.remove('show');
  }
}

function renderSimResults(items) {
  const container = document.getElementById('sim-search-results');
  if (!items.length) { container.style.display = 'none'; return; }

  container.style.display = 'block';
  container.innerHTML = items.map(item => {
    const id = item.id || item.itemId;
    const name = item.name || 'Unknown';
    const slotId = slotForItem(item);
    const category = normaliseCategory(item);
    const iUrl = iconUrl(id);
    const itemData = JSON.stringify({ id, name, iconUrl: iUrl, slotId, typeInfo: item.typeInfo, itemCategory: category });
    return `<div class="sim-result-item">
      ${iconHTML({ id, iconUrl: iUrl }, 32, 26)}
      <div>
        <div class="sim-result-name">${name}</div>
        <div class="sim-result-meta">#${id} · ${category}</div>
      </div>
      ${slotId
        ? `<button class="sim-equip-btn" onclick='equipItem(${itemData})'>Equip</button>`
        : `<span style="font-size:0.7rem;color:var(--text-dim);margin-left:auto">Not wearable</span>`
      }
    </div>`;
  }).join('');
}

// Also expose equipFromStorage — equip any item directly from the storage tab
function equipFromStorage(item) {
  switchTab('sim');
  equipItem({
    id: item.itemId,
    name: item.itemName,
    iconUrl: item.iconUrl || iconUrl(item.itemId),
    itemCategory: item.itemCategory,
    slotId: null,
  });
}
