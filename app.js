// ============================================================
//  NutriTrack — App logic
//  Single-user, device-local storage. No accounts, no sync.
// ============================================================

// ─── State ───────────────────────────────────────────────────
const state = {
  screen:       'onboarding',
  selectedFood: null,
  gramsInput:   100,
};


// ─── User storage ────────────────────────────────────────────
function getUser() {
  try { return JSON.parse(localStorage.getItem('nt_user')); } catch { return null; }
}

function saveUser(user) {
  localStorage.setItem('nt_user', JSON.stringify(user));
}

function clearAllData() {
  Object.keys(localStorage).filter(k => k.startsWith('nt_')).forEach(k => localStorage.removeItem(k));
}


// ─── Custom foods storage ────────────────────────────────────
function getCustomFoods() {
  try { return JSON.parse(localStorage.getItem('nt_custom_foods')) || []; } catch { return []; }
}

function saveCustomFoods(foods) {
  localStorage.setItem('nt_custom_foods', JSON.stringify(foods));
}

function addCustomFood(food) {
  const foods = getCustomFoods();
  foods.unshift(food);
  saveCustomFoods(foods);
}

function deleteCustomFood(id) {
  saveCustomFoods(getCustomFoods().filter(f => f.id !== id));
}

function getAllFoods() {
  return [...getCustomFoods(), ...FOODS];
}


// ─── Log storage ─────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getLog(date) {
  try { return JSON.parse(localStorage.getItem(`nt_log_${date}`)) || []; } catch { return []; }
}

function saveLog(date, entries) {
  localStorage.setItem(`nt_log_${date}`, JSON.stringify(entries));
}

function addEntry(date, entry) {
  const log = getLog(date);
  log.push(entry);
  saveLog(date, log);
}

function deleteEntry(date, index) {
  const log = getLog(date);
  log.splice(index, 1);
  saveLog(date, log);
}

function calcTotals(entries) {
  return entries.reduce(
    (t, e) => ({ kcal: t.kcal + e.kcal, protein: t.protein + e.protein,
                 carbs: t.carbs + e.carbs, fat: t.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}


// ─── Routing ─────────────────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(`screen-${name}`).classList.remove('hidden');
  state.screen = name;

  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.screen === name)
  );

  if (name === 'today')    renderToday();
  if (name === 'add')      renderAddFood();
  if (name === 'history')  renderHistory();
  if (name === 'settings') renderSettings();
}


// ─── TODAY ───────────────────────────────────────────────────
function renderToday() {
  const user    = getUser();
  const entries = getLog(todayStr());
  const totals  = calcTotals(entries);

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('header-greeting').textContent = `${greet}, ${user.name}`;
  document.getElementById('header-date').textContent     = formatDate(new Date());

  // Ring  (circumference = 2π × 82 ≈ 515.22)
  const C        = 2 * Math.PI * 82;
  const fraction = Math.min(totals.kcal / user.goalKcal, 1);
  const ring     = document.getElementById('ring-progress');
  ring.style.strokeDasharray  = C;
  ring.style.strokeDashoffset = C * (1 - fraction);
  const ratio = totals.kcal / user.goalKcal;
  ring.style.stroke = ratio >= 1 ? '#B54A3A' : ratio >= 0.85 ? '#C4864A' : '#5B7A4E';

  document.getElementById('ring-kcal').textContent     = Math.round(totals.kcal);
  document.getElementById('ring-goal-lbl').textContent = `of ${user.goalKcal}`;

  const rem    = user.goalKcal - totals.kcal;
  const remEl  = document.getElementById('ring-remaining');
  remEl.textContent = rem >= 0
    ? `${Math.round(rem)} kcal left`
    : `${Math.round(-rem)} kcal over`;
  remEl.style.color = rem >= 0
    ? (ratio >= 0.85 ? '#C4864A' : '#5B7A4E')
    : '#B54A3A';

  // Macros
  updateMacro('protein', totals.protein, user.goalProtein);
  updateMacro('carbs',   totals.carbs,   user.goalCarbs);
  updateMacro('fat',     totals.fat,     user.goalFat);

  // Log
  renderLog(entries);
}

function updateMacro(id, eaten, goal) {
  const pct  = goal > 0 ? Math.min(eaten / goal, 1) * 100 : 0;
  const fill = document.getElementById(`${id}-fill`);
  const val  = document.getElementById(`${id}-val`);
  fill.style.width           = `${pct}%`;
  fill.style.backgroundColor = pct >= 100 ? '#B54A3A' : pct >= 85 ? '#C4864A' : '#5B7A4E';
  val.textContent            = `${Math.round(eaten)}g`;
}

function renderLog(entries) {
  const container = document.getElementById('food-log');
  if (!entries.length) {
    container.innerHTML = '<p class="log-empty">Nothing logged yet.<br>Tap <strong>Add Food</strong> to start.</p>';
    return;
  }
  container.innerHTML = entries.map((e, i) => {
    const food = getFoodById(e.foodId);
    const media = food?.photo
      ? `<img src="${food.photo}" class="log-photo" alt="${food?.name ?? e.foodId}">`
      : `<div class="log-emoji">${food?.emoji ?? '🍽️'}</div>`;
    return `
      <div class="log-item">
        ${media}
        <div class="log-info">
          <div class="log-name">${food?.name ?? e.foodId} · ${e.grams}g</div>
          <div class="log-meta">${e.time} &nbsp;·&nbsp; P:${f1(e.protein)}g C:${f1(e.carbs)}g F:${f1(e.fat)}g</div>
        </div>
        <div class="log-kcal">${Math.round(e.kcal)}<span>kcal</span></div>
        <button class="log-del" data-i="${i}" aria-label="Delete">✕</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.log-del').forEach(btn =>
    btn.addEventListener('click', () => {
      deleteEntry(todayStr(), +btn.dataset.i);
      renderToday();
    })
  );
}


// ─── ADD FOOD ─────────────────────────────────────────────────
function renderAddFood() {
  const grid        = document.getElementById('food-grid');
  const customFoods = getCustomFoods();

  // "Add your own" card first
  const newCard = `
    <button class="food-card food-card--new" id="btn-create-food">
      <div class="food-card-media food-card-media--new">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
          <path d="M16 9v14M9 16h14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="food-card-body">
        <div class="food-card-name">Add your own</div>
        <div class="food-card-kcal">Custom food</div>
      </div>
    </button>`;

  const customCards = customFoods.map(food => {
    const media = food.photo
      ? `<img src="${food.photo}" class="food-card-img" alt="${food.name}" loading="lazy">`
      : (food.emoji || '🍽️');
    return `
      <div class="food-card-wrap">
        <button class="food-card" data-food-id="${food.id}">
          <div class="food-card-media" style="background:${food.cardColor || '#EAF0E8'}">${media}</div>
          <div class="food-card-body">
            <div class="food-card-name">${food.name}</div>
            <div class="food-card-kcal">${food.per100g.kcal} kcal / 100g</div>
          </div>
        </button>
        <button class="food-card-del" data-del-id="${food.id}" aria-label="Delete">✕</button>
      </div>`;
  }).join('');

  const presetCards = FOODS.map(food => {
    const media = food.photo
      ? `<img src="${food.photo}" class="food-card-img" alt="${food.name}" loading="lazy">`
      : food.emoji;
    return `
      <button class="food-card" data-food-id="${food.id}">
        <div class="food-card-media" style="background:${food.cardColor || '#F0F0EE'}">${media}</div>
        <div class="food-card-body">
          <div class="food-card-name">${food.name}</div>
          <div class="food-card-kcal">${food.per100g.kcal} kcal / 100g</div>
        </div>
      </button>`;
  }).join('');

  grid.innerHTML = newCard + customCards + presetCards;

  document.getElementById('btn-create-food').addEventListener('click', openCustomFoodModal);

  grid.querySelectorAll('.food-card[data-food-id]').forEach(c =>
    c.addEventListener('click', () => openModal(c.dataset.foodId))
  );

  grid.querySelectorAll('.food-card-del').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteCustomFood(btn.dataset.delId);
      renderAddFood();
    })
  );

  const search = document.getElementById('food-search');
  search.value = '';
  search.oninput = e => filterGrid(e.target.value.trim().toLowerCase());
}

function filterGrid(q) {
  let n = 0;
  // Each item is either a .food-card or a .food-card-wrap (custom); skip the new-card
  document.querySelectorAll('#food-grid > .food-card, #food-grid > .food-card-wrap').forEach(el => {
    const nameEl = el.querySelector('.food-card-name');
    if (!nameEl) return;
    const show = !q || nameEl.textContent.toLowerCase().includes(q);
    el.style.display = show ? '' : 'none';
    if (show) n++;
  });
  document.getElementById('no-results').classList.toggle('hidden', n > 0);
}


// ─── CUSTOM FOOD MODAL ────────────────────────────────────────
function openCustomFoodModal() {
  document.getElementById('cf-form').reset();
  document.getElementById('cf-error').classList.add('hidden');
  document.getElementById('modal-custom-food').classList.remove('hidden');
  setTimeout(() => document.getElementById('cf-name').focus(), 60);
}

function closeCustomFoodModal() {
  document.getElementById('modal-custom-food').classList.add('hidden');
}

function handleCustomFoodSubmit(e) {
  e.preventDefault();
  const errEl = document.getElementById('cf-error');

  const name  = document.getElementById('cf-name').value.trim();
  const kcal  = parseFloat(document.getElementById('cf-kcal').value);

  if (!name)          { errEl.textContent = 'Please enter a food name.';          errEl.classList.remove('hidden'); return; }
  if (!kcal || kcal < 0) { errEl.textContent = 'Please enter calories per 100g.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  const emoji   = document.getElementById('cf-emoji').value.trim() || '🍽️';
  const protein = parseFloat(document.getElementById('cf-protein').value) || 0;
  const carbs   = parseFloat(document.getElementById('cf-carbs').value)   || 0;
  const fat     = parseFloat(document.getElementById('cf-fat').value)     || 0;

  addCustomFood({
    id:        `custom_${Date.now()}`,
    name,
    emoji,
    photo:     null,
    cardColor: '#EAF0E8',
    custom:    true,
    per100g:   { kcal, protein, carbs, fat },
  });

  closeCustomFoodModal();
  renderAddFood();
}


// ─── GRAMS MODAL ─────────────────────────────────────────────
function openModal(foodId) {
  const food = getFoodById(foodId);
  if (!food) return;
  state.selectedFood = food;
  state.gramsInput   = 100;

  document.getElementById('modal-media').innerHTML = food.photo
    ? `<img src="${food.photo}" class="modal-photo" alt="${food.name}">`
    : food.emoji;
  document.getElementById('modal-name').textContent = food.name;
  document.getElementById('grams-input').value      = 100;
  refreshModal();
  document.getElementById('modal-grams').classList.remove('hidden');
  setTimeout(() => document.getElementById('grams-input').focus(), 60);
}

function refreshModal() {
  const food = state.selectedFood;
  const g    = Math.max(0, state.gramsInput);
  const f    = g / 100;
  document.getElementById('modal-kcal-pre').textContent   = `${Math.round(food.per100g.kcal * f)} kcal`;
  document.getElementById('modal-macros-pre').textContent =
    `Protein: ${f1(food.per100g.protein * f)}g · Carbs: ${f1(food.per100g.carbs * f)}g · Fat: ${f1(food.per100g.fat * f)}g`;
}

function adjustGrams(delta) {
  state.gramsInput = Math.max(0, (state.gramsInput || 0) + delta);
  document.getElementById('grams-input').value = state.gramsInput;
  refreshModal();
}

function confirmModal() {
  const food = state.selectedFood;
  const g    = Math.max(1, state.gramsInput);
  const f    = g / 100;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  addEntry(todayStr(), {
    foodId:  food.id,
    grams:   g,
    kcal:    food.per100g.kcal    * f,
    protein: food.per100g.protein * f,
    carbs:   food.per100g.carbs   * f,
    fat:     food.per100g.fat     * f,
    time,
  });
  closeModal();
  showScreen('today');
}

function closeModal() {
  document.getElementById('modal-grams').classList.add('hidden');
  state.selectedFood = null;
}


// ─── HISTORY ─────────────────────────────────────────────────
function renderHistory() {
  const user = getUser();
  const list = document.getElementById('history-list');
  list.innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d       = new Date();
    d.setDate(d.getDate() - i);
    const dStr    = d.toISOString().slice(0, 10);
    const entries = getLog(dStr);
    const totals  = calcTotals(entries);
    const hasData = entries.length > 0;
    const label   = i === 0 ? 'Today' : i === 1 ? 'Yesterday'
                  : d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    const pct     = hasData ? Math.min(totals.kcal / user.goalKcal * 100, 100) : 0;
    const color   = !hasData ? '#D6CCBF'
                  : totals.kcal >= user.goalKcal ? '#B54A3A'
                  : '#5B7A4E';
    return `
      <div class="history-item">
        <div class="history-date">${label}</div>
        <div class="history-bar-track">
          <div class="history-bar-fill" style="width:${hasData ? Math.max(pct,1) : 0}%;background:${color}"></div>
        </div>
        <div class="history-kcal">${hasData ? Math.round(totals.kcal) + ' kcal' : '—'}</div>
      </div>`;
  }).join('');
}


// ─── SETTINGS ────────────────────────────────────────────────
function renderSettings() {
  const u = getUser();
  document.getElementById('s-name').value    = u.name;
  document.getElementById('s-kcal').value    = u.goalKcal;
  document.getElementById('s-protein').value = u.goalProtein;
  document.getElementById('s-carbs').value   = u.goalCarbs;
  document.getElementById('s-fat').value     = u.goalFat;
}

function saveSettings() {
  const u = getUser();
  u.name        = document.getElementById('s-name').value.trim() || u.name;
  u.goalKcal    = posInt('s-kcal',    u.goalKcal);
  u.goalProtein = posInt('s-protein', u.goalProtein);
  u.goalCarbs   = posInt('s-carbs',   u.goalCarbs);
  u.goalFat     = posInt('s-fat',     u.goalFat);
  saveUser(u);
  showScreen('today');
}


// ─── ONBOARDING ──────────────────────────────────────────────
function handleOnboardSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('onboard-name').value.trim();
  const kcal = parseInt(document.getElementById('onboard-kcal').value);
  const errEl = document.getElementById('onboard-error');

  if (!name) { errEl.textContent = 'Please enter your name.'; errEl.classList.remove('hidden'); return; }
  if (!kcal || kcal < 500) { errEl.textContent = 'Please enter a valid calorie goal (at least 500).'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  const protein = posIntOrDefault('onboard-protein', DEFAULTS.goalProtein);
  const carbs   = posIntOrDefault('onboard-carbs',   DEFAULTS.goalCarbs);
  const fat     = posIntOrDefault('onboard-fat',     DEFAULTS.goalFat);

  saveUser({ name, goalKcal: kcal, goalProtein: protein, goalCarbs: carbs, goalFat: fat });
  showScreen('today');
}


// ─── Utilities ───────────────────────────────────────────────
function getFoodById(id) { return getAllFoods().find(f => f.id === id) || null; }

function f1(n) {
  const s = (+n).toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

function formatDate(d) {
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function posInt(id, fallback) {
  const v = parseInt(document.getElementById(id).value);
  return v > 0 ? v : fallback;
}

function posIntOrDefault(id, def) {
  const v = parseInt(document.getElementById(id).value);
  return v > 0 ? v : def;
}


// ─── Init ────────────────────────────────────────────────────
function init() {
  // Onboarding
  document.getElementById('onboard-form').addEventListener('submit', handleOnboardSubmit);
  document.getElementById('onboard-kcal').value    = DEFAULTS.goalKcal;
  document.getElementById('onboard-protein').value = DEFAULTS.goalProtein;
  document.getElementById('onboard-carbs').value   = DEFAULTS.goalCarbs;
  document.getElementById('onboard-fat').value     = DEFAULTS.goalFat;

  // Nav
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.addEventListener('click', () => showScreen(b.dataset.screen))
  );

  // Today
  document.getElementById('btn-add-food').addEventListener('click', () => showScreen('add'));

  // Add food
  document.getElementById('btn-add-back').addEventListener('click', () => showScreen('today'));

  // Grams modal
  document.getElementById('grams-input').addEventListener('input', e => {
    state.gramsInput = parseInt(e.target.value) || 0;
    refreshModal();
  });
  document.getElementById('btn-minus-25').addEventListener('click', () => adjustGrams(-25));
  document.getElementById('btn-plus-25').addEventListener('click',  () => adjustGrams(+25));
  document.getElementById('btn-plus-50').addEventListener('click',  () => adjustGrams(+50));
  document.getElementById('modal-cancel').addEventListener('click',  closeModal);
  document.getElementById('modal-confirm').addEventListener('click', confirmModal);
  document.getElementById('modal-grams').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-grams')) closeModal();
  });

  // Custom food modal
  document.getElementById('cf-form').addEventListener('submit', handleCustomFoodSubmit);
  document.getElementById('cf-cancel').addEventListener('click', closeCustomFoodModal);
  document.getElementById('modal-custom-food').addEventListener('click', e => {
    if (e.target === document.getElementById('modal-custom-food')) closeCustomFoodModal();
  });

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-reset').addEventListener('click', () =>
    document.getElementById('modal-reset').classList.remove('hidden')
  );
  document.getElementById('reset-cancel').addEventListener('click', () =>
    document.getElementById('modal-reset').classList.add('hidden')
  );
  document.getElementById('reset-confirm').addEventListener('click', () => {
    clearAllData();
    document.getElementById('modal-reset').classList.add('hidden');
    showScreen('onboarding');
  });

  // Boot: existing user → today, otherwise → onboarding
  const user = getUser();
  if (user?.name) {
    showScreen('today');
  } else {
    showScreen('onboarding');
  }

  // PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js', { scope: './' })
      .catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
