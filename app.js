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
  const keys = Object.keys(localStorage).filter(k => k.startsWith('nt_'));
  keys.forEach(k => localStorage.removeItem(k));
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
  const grid = document.getElementById('food-grid');
  grid.innerHTML = FOODS.map(food => {
    const media = food.photo
      ? `<img src="${food.photo}" class="food-card-img" alt="${food.name}" loading="lazy">`
      : food.emoji;
    return `
      <button class="food-card" data-food-id="${food.id}">
        <div class="food-card-media" style="background:${food.cardColor || '#F5EFE4'}">
          ${media}
        </div>
        <div class="food-card-body">
          <div class="food-card-name">${food.name}</div>
          <div class="food-card-kcal">${food.per100g.kcal} kcal / 100g</div>
        </div>
      </button>`;
  }).join('');

  grid.querySelectorAll('.food-card').forEach(c =>
    c.addEventListener('click', () => openModal(c.dataset.foodId))
  );

  const search = document.getElementById('food-search');
  search.value = '';
  search.oninput = e => filterGrid(e.target.value.trim().toLowerCase());
}

function filterGrid(q) {
  let n = 0;
  document.querySelectorAll('.food-card').forEach(c => {
    const show = !q || c.querySelector('.food-card-name').textContent.toLowerCase().includes(q);
    c.style.display = show ? '' : 'none';
    if (show) n++;
  });
  document.getElementById('no-results').classList.toggle('hidden', n > 0);
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
function getFoodById(id) { return FOODS.find(f => f.id === id) || null; }

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
