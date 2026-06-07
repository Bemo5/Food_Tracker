// ============================================================
//  FOOD TRACKER — App Logic
// ============================================================

// ─── App state ───────────────────────────────────────────────
const state = {
  profileId:    null,   // "mom" | "dad"
  screen:       'profile',
  selectedFood: null,   // food object from FOODS while modal open
  gramsInput:   100,
};


// ─── Storage helpers ─────────────────────────────────────────

/** Returns today's date string "YYYY-MM-DD" */
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function storageKey(profileId, date) {
  return `ft_log_${profileId}_${date}`;
}

function getLog(profileId, date) {
  try {
    const raw = localStorage.getItem(storageKey(profileId, date));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLog(profileId, date, entries) {
  localStorage.setItem(storageKey(profileId, date), JSON.stringify(entries));
}

function addEntry(profileId, date, entry) {
  const log = getLog(profileId, date);
  log.push(entry);
  saveLog(profileId, date, log);
}

function deleteEntry(profileId, date, index) {
  const log = getLog(profileId, date);
  log.splice(index, 1);
  saveLog(profileId, date, log);
}

function calcTotals(entries) {
  return entries.reduce(
    (t, e) => ({
      kcal:    t.kcal    + e.kcal,
      protein: t.protein + e.protein,
      carbs:   t.carbs   + e.carbs,
      fat:     t.fat     + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}


// ─── Profile helpers ──────────────────────────────────────────

function getProfile() {
  return PROFILES.find(p => p.id === state.profileId) || null;
}

function loadSavedProfile() {
  return localStorage.getItem('ft_current_profile') || null;
}

function saveCurrentProfile(id) {
  localStorage.setItem('ft_current_profile', id);
}


// ─── Routing ─────────────────────────────────────────────────

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.remove('hidden');
  state.screen = name;

  // Sync nav active state (nav exists on today / history / settings screens)
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === name);
  });

  if (name === 'today')    renderToday();
  if (name === 'add')      renderAddFood();
  if (name === 'history')  renderHistory();
  if (name === 'settings') renderSettings();
}


// ─── TODAY screen ─────────────────────────────────────────────

function renderToday() {
  const profile = getProfile();
  if (!profile) return;

  const entries = getLog(profile.id, todayStr());
  const totals  = calcTotals(entries);

  // Header
  document.getElementById('today-profile-name').textContent = profile.name;
  document.getElementById('header-date').textContent = formatDate(new Date());

  // Calorie ring
  updateRing(totals.kcal, profile.goalKcal);

  // Macro bars
  updateMacroBar('protein', totals.protein, profile.goalProtein);
  updateMacroBar('carbs',   totals.carbs,   profile.goalCarbs);
  updateMacroBar('fat',     totals.fat,     profile.goalFat);

  // Food log
  renderFoodLog(entries, profile.id);
}

function updateRing(eaten, goal) {
  const C        = 2 * Math.PI * 90; // ≈ 565.49
  const fraction = Math.min(eaten / goal, 1);
  const offset   = C * (1 - fraction);

  const ring = document.getElementById('ring-progress');
  ring.style.strokeDasharray  = C;
  ring.style.strokeDashoffset = offset;

  const ratio = eaten / goal;
  ring.style.stroke = ratio >= 1 ? '#C62828' : ratio >= 0.85 ? '#E65100' : '#43A047';

  document.getElementById('ring-kcal').textContent  = Math.round(eaten);
  document.getElementById('ring-goal').textContent  = `/ ${goal} kcal`;

  const remaining = goal - eaten;
  const remEl = document.getElementById('ring-remaining');
  if (remaining >= 0) {
    remEl.textContent = `${Math.round(remaining)} kcal left`;
    remEl.style.color = ratio >= 0.85 ? '#E65100' : '#2E7D32';
  } else {
    remEl.textContent = `${Math.round(-remaining)} kcal over`;
    remEl.style.color = '#C62828';
  }
}

function updateMacroBar(id, eaten, goal) {
  const pct  = goal > 0 ? Math.min(eaten / goal, 1) * 100 : 0;
  const fill = document.getElementById(`${id}-bar-fill`);
  const val  = document.getElementById(`${id}-value`);

  fill.style.width           = `${pct}%`;
  fill.style.backgroundColor = pct >= 100 ? '#C62828' : pct >= 85 ? '#E65100' : '#43A047';
  val.textContent             = `${Math.round(eaten)}/${goal}g`;
}

function renderFoodLog(entries, profileId) {
  const container = document.getElementById('food-log');
  if (entries.length === 0) {
    container.innerHTML = '<p class="empty-log">No food logged yet today.<br>Tap <strong>Add Food</strong> to start.</p>';
    return;
  }

  container.innerHTML = entries.map((e, i) => {
    const food = getFoodById(e.foodId);
    return `
      <div class="log-item">
        <div class="log-item-emoji">${food ? food.emoji : '🍽️'}</div>
        <div class="log-item-info">
          <div class="log-item-name">${food ? food.name : e.foodId} (${e.grams}g)</div>
          <div class="log-item-time">${e.time} &nbsp;·&nbsp; P:${fmt1(e.protein)}g &nbsp;C:${fmt1(e.carbs)}g &nbsp;F:${fmt1(e.fat)}g</div>
        </div>
        <div class="log-item-kcal">${Math.round(e.kcal)}<span>kcal</span></div>
        <button class="log-delete-btn" data-index="${i}" aria-label="Delete">✕</button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.log-delete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteEntry(profileId, todayStr(), parseInt(btn.dataset.index));
      renderToday();
    });
  });
}


// ─── ADD FOOD screen ──────────────────────────────────────────

function renderAddFood() {
  const grid = document.getElementById('food-grid');
  grid.innerHTML = FOODS.map(food => {
    const mediaHtml = food.photo
      ? `<img src="${food.photo}" class="food-card-photo" alt="${food.name}" loading="lazy">`
      : `<div class="food-card-emoji">${food.emoji}</div>`;

    return `
      <button class="food-card" data-food-id="${food.id}"
              style="background-color: ${food.cardColor || '#FFFFFF'}">
        ${mediaHtml}
        <div class="food-card-name">${food.name}</div>
        <div class="food-card-kcal">${food.per100g.kcal} kcal/100g</div>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.food-card').forEach(card => {
    card.addEventListener('click', () => openGramsModal(card.dataset.foodId));
  });
}


// ─── GRAMS MODAL ─────────────────────────────────────────────

function openGramsModal(foodId) {
  const food = getFoodById(foodId);
  if (!food) return;

  state.selectedFood = food;
  state.gramsInput   = 100;

  // Populate food display
  document.getElementById('modal-food-display').innerHTML = food.photo
    ? `<img src="${food.photo}" class="modal-food-photo" alt="${food.name}">`
    : food.emoji;

  document.getElementById('modal-food-name').textContent = food.name;
  document.getElementById('grams-input').value = 100;
  refreshModalPreview();

  document.getElementById('modal-grams').classList.remove('hidden');
  // Focus the number field — raises keyboard on iPhone
  setTimeout(() => document.getElementById('grams-input').focus(), 50);
}

function refreshModalPreview() {
  const food   = state.selectedFood;
  const g      = Math.max(0, state.gramsInput);
  const factor = g / 100;

  const kcal    = Math.round(food.per100g.kcal    * factor);
  const protein = fmt1(food.per100g.protein * factor);
  const carbs   = fmt1(food.per100g.carbs   * factor);
  const fat     = fmt1(food.per100g.fat     * factor);

  document.getElementById('modal-kcal-preview').textContent    = `${kcal} kcal`;
  document.getElementById('modal-macros-preview').textContent  =
    `Protein: ${protein}g · Carbs: ${carbs}g · Fat: ${fat}g`;
}

function adjustGrams(delta) {
  state.gramsInput = Math.max(0, (state.gramsInput || 0) + delta);
  document.getElementById('grams-input').value = state.gramsInput;
  refreshModalPreview();
}

function confirmGramsModal() {
  const food   = state.selectedFood;
  const g      = Math.max(1, state.gramsInput);
  const factor = g / 100;
  const profile = getProfile();

  const now  = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  addEntry(profile.id, todayStr(), {
    foodId:  food.id,
    grams:   g,
    kcal:    food.per100g.kcal    * factor,
    protein: food.per100g.protein * factor,
    carbs:   food.per100g.carbs   * factor,
    fat:     food.per100g.fat     * factor,
    time,
  });

  closeGramsModal();
  showScreen('today');
}

function closeGramsModal() {
  document.getElementById('modal-grams').classList.add('hidden');
  state.selectedFood = null;
}


// ─── HISTORY screen ───────────────────────────────────────────

function renderHistory() {
  const profile   = getProfile();
  const container = document.getElementById('history-list');
  const rows      = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entries = getLog(profile.id, dateStr);
    const totals  = calcTotals(entries);
    const label   = i === 0 ? 'Today'
                  : i === 1 ? 'Yesterday'
                  : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    rows.push({ label, totals, goalKcal: profile.goalKcal, hasData: entries.length > 0 });
  }

  container.innerHTML = rows.map(row => {
    const pct   = row.goalKcal > 0 ? Math.min(row.totals.kcal / row.goalKcal * 100, 100) : 0;
    const color = !row.hasData ? '#CCCCCC'
                : row.totals.kcal >= row.goalKcal ? '#C62828'
                : '#43A047';
    return `
      <div class="history-item">
        <div class="history-date">${row.label}</div>
        <div class="history-bar-track">
          <div class="history-bar-fill"
               style="width: ${row.hasData ? Math.max(pct, 2) : 0}%; background: ${color}"></div>
        </div>
        <div class="history-kcal">${row.hasData ? Math.round(row.totals.kcal) + ' kcal' : 'No data'}</div>
      </div>
    `;
  }).join('');
}


// ─── SETTINGS screen ──────────────────────────────────────────

function renderSettings() {
  const profile = getProfile();
  document.getElementById('setting-profile-name').textContent = profile.name;
  document.getElementById('setting-kcal').value    = profile.goalKcal;
  document.getElementById('setting-protein').value = profile.goalProtein;
  document.getElementById('setting-carbs').value   = profile.goalCarbs;
  document.getElementById('setting-fat').value     = profile.goalFat;
}

function saveSettings() {
  const profile = getProfile();
  const readInt = (id, fallback) => Math.max(1, parseInt(document.getElementById(id).value) || fallback);

  profile.goalKcal    = readInt('setting-kcal',    profile.goalKcal);
  profile.goalProtein = readInt('setting-protein', profile.goalProtein);
  profile.goalCarbs   = readInt('setting-carbs',   profile.goalCarbs);
  profile.goalFat     = readInt('setting-fat',     profile.goalFat);

  showScreen('today');
}


// ─── Profile selection ────────────────────────────────────────

function selectProfile(id) {
  state.profileId = id;
  saveCurrentProfile(id);
  showScreen('today');
}

function switchProfile() {
  localStorage.removeItem('ft_current_profile');
  state.profileId = null;
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById('screen-profile').classList.remove('hidden');
}


// ─── Utilities ────────────────────────────────────────────────

function getFoodById(id) {
  return FOODS.find(f => f.id === id) || null;
}

/** Format to 1 decimal, drop .0 */
function fmt1(n) {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

function formatDate(d) {
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}


// ─── Init ─────────────────────────────────────────────────────

function init() {
  // Build profile buttons from config
  const profileBtns = document.getElementById('profile-buttons');
  profileBtns.innerHTML = PROFILES.map(p => `
    <button class="profile-btn" data-profile-id="${p.id}"
            style="--profile-color: ${p.color}">
      <span class="profile-btn-name">${p.name}</span>
      <span class="profile-btn-sub">Tap to continue</span>
    </button>
  `).join('');

  profileBtns.querySelectorAll('.profile-btn').forEach(btn => {
    btn.addEventListener('click', () => selectProfile(btn.dataset.profileId));
  });

  // Nav buttons (exist in today / history / settings screens)
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showScreen(btn.dataset.screen));
  });

  // Today screen
  document.getElementById('btn-add-food').addEventListener('click', () => showScreen('add'));
  document.getElementById('switch-profile-link').addEventListener('click', switchProfile);

  // Add food screen
  document.getElementById('btn-add-back').addEventListener('click', () => showScreen('today'));

  // Grams modal — input
  document.getElementById('grams-input').addEventListener('input', e => {
    state.gramsInput = parseInt(e.target.value) || 0;
    refreshModalPreview();
  });

  // Grams modal — adjustment buttons
  document.getElementById('btn-grams-minus-25').addEventListener('click', () => adjustGrams(-25));
  document.getElementById('btn-grams-plus-25').addEventListener('click',  () => adjustGrams(+25));
  document.getElementById('btn-grams-plus-50').addEventListener('click',  () => adjustGrams(+50));

  // Grams modal — actions
  document.getElementById('modal-cancel').addEventListener('click',  closeGramsModal);
  document.getElementById('modal-confirm').addEventListener('click', confirmGramsModal);
  // Tap backdrop to close
  document.getElementById('modal-grams').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-grams')) closeGramsModal();
  });

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-switch-from-settings').addEventListener('click', switchProfile);

  // Restore saved profile
  const savedId = loadSavedProfile();
  if (savedId && PROFILES.find(p => p.id === savedId)) {
    state.profileId = savedId;
    showScreen('today');
  } else {
    document.getElementById('screen-profile').classList.remove('hidden');
  }

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .catch(err => console.warn('SW registration failed:', err));
  }
}

document.addEventListener('DOMContentLoaded', init);
