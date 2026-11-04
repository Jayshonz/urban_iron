const $ = (id) => document.getElementById(id);
let races = [];
let activeRaceId = '';
const adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]'));

function activateAdminTab(tabName, { focus = false } = {}) {
  adminTabs.forEach((tab) => {
    const active = tab.dataset.adminTab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  document.querySelectorAll('[data-admin-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== tabName;
  });
}

adminTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateAdminTab(tab.dataset.adminTab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % adminTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + adminTabs.length) % adminTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = adminTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    activateAdminTab(adminTabs[nextIndex].dataset.adminTab, { focus: true });
  });
});

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    ...options,
  });
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong');
    error.status = response.status;
    throw error;
  }
  return data;
}

function showLogin(message = '') {
  $('adminEditor').hidden = true;
  $('adminLogin').hidden = false;
  $('loginMessage').textContent = message;
  $('adminPassword').value = '';
  if (document.activeElement === document.body && $('adminPassword').offsetParent) $('adminPassword').focus();
}

function showEditor() {
  $('adminLogin').hidden = true;
  $('adminEditor').hidden = false;
}

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = `admin-message${type ? ` ${type}` : ''}`;
}

function itemValue(item, field) {
  const control = item.querySelector(`[data-field="${field}"]`);
  if (!control) return '';
  if (control.type === 'checkbox') return control.checked;
  return control.value;
}

function readPrepGuides() {
  return Array.from($('prepGuideList').querySelectorAll('[data-prep-guide]')).map((item) => ({
    title: itemValue(item, 'title'),
    description: itemValue(item, 'description'),
    url: itemValue(item, 'url'),
  }));
}

function readOffers() {
  return Array.from($('offerList').querySelectorAll('[data-offer]')).map((item) => ({
    partner: itemValue(item, 'partner'),
    title: itemValue(item, 'title'),
    description: itemValue(item, 'description'),
    code: itemValue(item, 'code'),
    url: itemValue(item, 'url'),
    logoUrl: itemValue(item, 'logoUrl'),
    active: itemValue(item, 'active'),
  }));
}

function renderPrepGuides(guides = []) {
  const list = $('prepGuideList');
  list.innerHTML = '';
  if (!guides.length) {
    list.innerHTML = '<p class="admin-empty-state">No prep guides yet. Add the first resource when it is ready.</p>';
    return;
  }
  guides.forEach((guide, index) => {
    const item = document.createElement('article');
    item.className = 'admin-list-item';
    item.dataset.prepGuide = '';
    item.innerHTML = `
      <div class="admin-item-heading"><strong>Guide ${index + 1}</strong><button class="admin-remove-button" type="button">Remove</button></div>
      <div class="admin-field-grid">
        <div><label for="prepTitle${index}">Title</label><input id="prepTitle${index}" data-field="title" maxlength="160"></div>
        <div><label for="prepUrl${index}">HTTPS link</label><input id="prepUrl${index}" data-field="url" type="url" inputmode="url" placeholder="https://…"></div>
      </div>
      <label for="prepDescription${index}">Description <span>Optional</span></label>
      <textarea id="prepDescription${index}" data-field="description" rows="3" maxlength="1200"></textarea>`;
    item.querySelector('[data-field="title"]').value = guide.title || '';
    item.querySelector('[data-field="description"]').value = guide.description || '';
    item.querySelector('[data-field="url"]').value = guide.url || '';
    item.querySelector('.admin-remove-button').addEventListener('click', () => {
      const next = readPrepGuides();
      next.splice(index, 1);
      renderPrepGuides(next);
    });
    list.appendChild(item);
  });
}

function renderOffers(offers = []) {
  const list = $('offerList');
  list.innerHTML = '';
  if (!offers.length) {
    list.innerHTML = '<p class="admin-empty-state">No offers yet. Add a partner offer when its details are approved.</p>';
    return;
  }
  offers.forEach((offer, index) => {
    const item = document.createElement('article');
    item.className = 'admin-list-item';
    item.dataset.offer = '';
    item.innerHTML = `
      <div class="admin-item-heading"><strong>Offer ${index + 1}</strong><button class="admin-remove-button" type="button">Remove</button></div>
      <div class="admin-field-grid">
        <div><label for="offerPartner${index}">Partner</label><input id="offerPartner${index}" data-field="partner" maxlength="160"></div>
        <div><label for="offerTitle${index}">Offer title</label><input id="offerTitle${index}" data-field="title" maxlength="160"></div>
      </div>
      <label for="offerDescription${index}">Description <span>Optional</span></label>
      <textarea id="offerDescription${index}" data-field="description" rows="3" maxlength="1200"></textarea>
      <div class="admin-field-grid">
        <div><label for="offerCode${index}">Coupon code <span>Optional</span></label><input id="offerCode${index}" data-field="code" maxlength="80" autocomplete="off"></div>
        <div><label for="offerUrl${index}">Destination link</label><input id="offerUrl${index}" data-field="url" type="url" inputmode="url" placeholder="https://…"></div>
      </div>
      <label for="offerLogo${index}">Logo image link <span>Optional · HTTPS</span></label>
      <input id="offerLogo${index}" data-field="logoUrl" type="url" inputmode="url" placeholder="https://…">
      <label class="admin-checkbox" for="offerActive${index}"><input id="offerActive${index}" data-field="active" type="checkbox"><span>Show this offer to athletes</span></label>`;
    ['partner', 'title', 'description', 'code', 'url', 'logoUrl'].forEach((field) => {
      item.querySelector(`[data-field="${field}"]`).value = offer[field] || '';
    });
    item.querySelector('[data-field="active"]').checked = offer.active !== false;
    item.querySelector('.admin-remove-button').addEventListener('click', () => {
      const next = readOffers();
      next.splice(index, 1);
      renderOffers(next);
    });
    list.appendChild(item);
  });
}

function fillContent(content = {}) {
  $('routeDescription').value = content.routeDescription || '';
  $('routeUrl').value = content.routeUrl || '';
  $('workoutDescription').value = content.workoutDescription || '';
  $('workoutUrl').value = content.workoutUrl || '';
  $('raceDayNotes').value = content.raceDayNotes || '';
  renderPrepGuides(content.prepGuides || []);
  renderOffers(content.offers || []);
}

function setEditorEnabled(enabled) {
  $('contentFields').disabled = !enabled;
  $('saveContent').disabled = !enabled;
}

async function initializeEditor() {
  showEditor();
  setMessage($('editorMessage'), 'Loading races…');
  try {
    const data = await request('/api/admin-race-content');
    races = data.races || [];
    $('adminRace').innerHTML = '<option value="">Select a race</option>';
    races.forEach((race) => {
      const option = document.createElement('option');
      option.value = race.id;
      option.textContent = `${race.city} · ${race.date}`;
      $('adminRace').appendChild(option);
    });
    setEditorEnabled(false);
    setMessage(
      $('editorMessage'),
      races.length ? 'Select a race to edit.' : 'No published races are available.',
    );
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('editorMessage'), error.message, 'error-text');
  }
}

$('addPrepGuide').addEventListener('click', () => {
  const guides = readPrepGuides();
  if (guides.length >= 12) return setMessage($('editorMessage'), 'A race can have up to 12 prep guides.', 'error-text');
  guides.push({ title: '', description: '', url: '' });
  renderPrepGuides(guides);
  const last = $('prepGuideList').lastElementChild;
  last?.querySelector('[data-field="title"]')?.focus();
});

$('addOffer').addEventListener('click', () => {
  const offers = readOffers();
  if (offers.length >= 20) return setMessage($('editorMessage'), 'A race can have up to 20 offers.', 'error-text');
  offers.push({ partner: '', title: '', description: '', code: '', url: '', logoUrl: '', active: true });
  renderOffers(offers);
  const last = $('offerList').lastElementChild;
  last?.querySelector('[data-field="partner"]')?.focus();
});

async function loadRaceContent(raceId) {
  activeRaceId = raceId;
  fillContent();
  setEditorEnabled(false);
  if (!raceId) {
    setMessage($('editorMessage'), 'Select a race to edit.');
    return;
  }
  setMessage($('editorMessage'), 'Loading race-day information…');
  try {
    const data = await request(`/api/admin-race-content?raceId=${encodeURIComponent(raceId)}`);
    if (activeRaceId !== raceId) return;
    fillContent(data.content);
    setEditorEnabled(true);
    setMessage(
      $('editorMessage'),
      data.content?.updatedAt
        ? `Last saved ${new Date(data.content.updatedAt).toLocaleString()}.`
        : 'No race-day information has been saved yet.',
    );
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('editorMessage'), error.message, 'error-text');
  }
}

$('adminLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('adminLoginButton').disabled = true;
  setMessage($('loginMessage'), 'Signing in…');
  try {
    await request('/api/admin-session', {
      method: 'POST',
      body: JSON.stringify({ action: 'login', password: $('adminPassword').value }),
    });
    $('adminPassword').value = '';
    await initializeEditor();
  } catch (error) {
    setMessage($('loginMessage'), error.message, 'error-text');
  } finally {
    $('adminLoginButton').disabled = false;
  }
});

$('adminRace').addEventListener('change', () => loadRaceContent($('adminRace').value));

$('contentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeRaceId) return;
  $('saveContent').disabled = true;
  setMessage($('editorMessage'), 'Saving…');
  try {
    const data = await request('/api/admin-race-content', {
      method: 'PUT',
      body: JSON.stringify({
        raceId: activeRaceId,
        content: {
          routeDescription: $('routeDescription').value,
          routeUrl: $('routeUrl').value,
          workoutDescription: $('workoutDescription').value,
          workoutUrl: $('workoutUrl').value,
          raceDayNotes: $('raceDayNotes').value,
          prepGuides: readPrepGuides(),
          offers: readOffers(),
        },
      }),
    });
    fillContent(data.content);
    setMessage($('editorMessage'), 'Race content saved.', 'success-text');
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('editorMessage'), error.message, 'error-text');
  } finally {
    if (!$('adminEditor').hidden) $('saveContent').disabled = false;
  }
});

$('adminLogout').addEventListener('click', async () => {
  try {
    await request('/api/admin-session', {
      method: 'POST',
      body: JSON.stringify({ action: 'logout' }),
    });
  } finally {
    showLogin('You are logged out.');
  }
});

async function start() {
  try {
    const session = await request('/api/admin-session');
    if (!session.configured) {
      showLogin('Admin access needs to be configured in Vercel before this editor can be used.');
      $('adminLoginButton').disabled = true;
      return;
    }
    if (session.authenticated) await initializeEditor();
    else showLogin();
  } catch (error) {
    showLogin(error.message);
  }
}

start();
