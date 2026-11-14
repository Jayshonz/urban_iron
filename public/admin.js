const $ = (id) => document.getElementById(id);
let races = [];
let activeRaceId = '';
let contentLoadedRaceId = '';
const adminTabs = Array.from(document.querySelectorAll('[data-admin-tab]'));

async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body ? { 'content-type': 'application/json' } : undefined,
    ...options,
  });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong');
    error.status = response.status;
    throw error;
  }
  return data;
}

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = `admin-message${type ? ` ${type}` : ''}`;
}

function activeRace() {
  return races.find((race) => race.id === activeRaceId) || null;
}

function showLogin(message = '') {
  $('adminEditor').hidden = true;
  $('adminLogin').hidden = false;
  $('loginMessage').textContent = message;
  $('adminPassword').value = '';
}

function showEditor() {
  $('adminLogin').hidden = true;
  $('adminEditor').hidden = false;
}

function activateAdminTab(tabName, { focus = false } = {}) {
  adminTabs.forEach((tab) => {
    const selected = tab.dataset.adminTab === tabName;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  document.querySelectorAll('[data-admin-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.adminPanel !== tabName;
  });
  if (tabName === 'content' && activeRaceId && contentLoadedRaceId !== activeRaceId) loadRaceContent(activeRaceId);
}

adminTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateAdminTab(tab.dataset.adminTab));
  tab.addEventListener('keydown', (event) => {
    let next = null;
    if (event.key === 'ArrowRight') next = (index + 1) % adminTabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + adminTabs.length) % adminTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = adminTabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    activateAdminTab(adminTabs[next].dataset.adminTab, { focus: true });
  });
});

function chip(label, value, tone = '') {
  const element = document.createElement('span');
  element.className = tone;
  element.textContent = `${label}: ${value}`;
  return element;
}

function statusTone(value) {
  if (['Active', 'Live', 'Published', 'Open', 'Released'].includes(value)) return 'live';
  if (['Hidden', 'Draft', 'Editable'].includes(value)) return 'hidden';
  return 'offline';
}

function renderRaceList() {
  const query = $('raceSearch').value.trim().toLowerCase();
  const visible = races.filter((race) => `${race.name} ${race.city} ${race.date}`.toLowerCase().includes(query));
  const list = $('raceList');
  list.innerHTML = '';
  if (!visible.length) {
    list.innerHTML = '<p class="admin-empty-state">No races match this search.</p>';
    return;
  }
  visible.forEach((race) => {
    const row = document.createElement('button');
    row.className = 'admin-race-row';
    row.type = 'button';
    const identity = document.createElement('div');
    const name = document.createElement('strong');
    const date = document.createElement('small');
    name.textContent = race.name;
    date.textContent = `${race.city} · ${race.date}`;
    identity.append(name, date);
    const cells = [
      ['Operations', race.status],
      ['Athletes', race.athletePortalStatus],
      ['Heats', race.heatsReleased ? 'Released' : 'Hidden'],
      ['Photos', race.photoStatus || 'Not configured'],
    ].map(([label, value]) => {
      const cell = document.createElement('span');
      cell.className = 'admin-race-cell';
      const heading = document.createElement('span');
      const badge = document.createElement('span');
      heading.textContent = label;
      badge.className = `admin-chip ${statusTone(value)}`;
      badge.textContent = value;
      cell.append(heading, badge);
      return cell;
    });
    const action = document.createElement('span');
    action.className = 'admin-row-action';
    action.textContent = 'Manage →';
    row.append(identity, ...cells, action);
    row.addEventListener('click', () => openRace(race.id));
    list.appendChild(row);
  });
}

function setLink(id, href, available = true) {
  const link = $(id);
  link.hidden = !available;
  if (available) link.href = href;
}

function renderRaceWorkspace() {
  const race = activeRace();
  if (!race) return;
  $('raceName').textContent = race.name;
  $('raceCityDate').textContent = `${race.city} · ${race.date}`;
  const chips = $('raceStatusChips');
  chips.innerHTML = '';
  const statusValues = [
    ['Operations', race.status],
    ['Portal', race.athletePortalStatus],
    ['Heats', race.heatsReleased ? 'Released' : 'Hidden'],
    ['Photos', race.photoStatus || 'Not configured'],
  ];
  statusValues.forEach(([label, value]) => chips.appendChild(chip(label, value, statusTone(value))));

  $('operationsStatus').value = race.status;
  $('athletePortalStatus').value = race.athletePortalStatus;
  $('heatsReleased').value = race.heatsReleased ? 'Yes' : 'No';
  $('assignmentsLocked').value = race.assignmentsLocked ? 'Yes' : 'No';
  $('checkInEnabled').value = race.checkInEnabled ? 'Yes' : 'No';
  $('lastAgentRun').textContent = race.lastHeatAgentRun || 'Not run yet';
  $('lastNewParticipants').textContent = race.lastNewParticipants === '' ? '' : `${race.lastNewParticipants} new participant${race.lastNewParticipants === '1' ? '' : 's'} on the last run`;
  $('overviewPhotoStatus').textContent = race.photoStatus || 'Not configured';
  $('overviewUploadStatus').textContent = `Photographer uploads: ${race.photographerUploads || 'Not configured'}`;
  $('lastUpdated').textContent = race.lastUpdated || 'No registry timestamp';
  $('lastUpdatedBy').textContent = race.lastUpdatedBy || '';

  $('rawTabName').textContent = race.rawTab || 'Not configured';
  $('heatTabName').textContent = race.heatAssignmentTab || 'Not configured';
  $('slackChannel').textContent = race.slackChannel || 'Not configured';
  $('assignmentState').textContent = race.assignmentsLocked ? 'Locked' : 'Editable';
  setLink('openRaceWorkbook', `https://docs.google.com/spreadsheets/d/${encodeURIComponent(race.raceSheetId)}/edit`, Boolean(race.raceSheetId));

  $('photoStatus').textContent = race.photoStatus || 'Not configured';
  $('photographerUploadStatus').textContent = race.photographerUploads || 'Not configured';
  $('photoRaceSlug').textContent = race.photoRaceSlug || 'Not configured';
  const photoBase = race.photoRaceSlug ? `https://photos.urbaniron.co/events/${encodeURIComponent(race.photoRaceSlug)}` : '';
  const uploadBase = race.photoRaceSlug ? `https://admin.urbaniron.co/photographer/events/${encodeURIComponent(race.photoRaceSlug)}` : '';
  setLink('viewPhotoGallery', photoBase, Boolean(photoBase));
  setLink('openPhotographerUploads', uploadBase, Boolean(uploadBase));
}

function openRace(raceId) {
  activeRaceId = raceId;
  contentLoadedRaceId = '';
  fillContent();
  setEditorEnabled(false);
  setMessage($('editorMessage'), 'Open Portal content to load this race.');
  setMessage($('controlsMessage'), '');
  $('registryView').hidden = true;
  $('raceWorkspace').hidden = false;
  renderRaceWorkspace();
  activateAdminTab('overview');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function showRegistry() {
  activeRaceId = '';
  contentLoadedRaceId = '';
  $('raceWorkspace').hidden = true;
  $('registryView').hidden = false;
  renderRaceList();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function initializeEditor() {
  showEditor();
  setMessage($('registryMessage'), 'Loading the main race registry…');
  try {
    const data = await request('/api/admin-race-registry');
    races = data.races || [];
    setMessage($('registryMessage'), races.length ? `${races.length} races in the registry.` : 'No races are configured.');
    showRegistry();
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('registryMessage'), error.message, 'error-text');
  }
}

function itemValue(item, field) {
  const control = item.querySelector(`[data-field="${field}"]`);
  if (!control) return '';
  return control.type === 'checkbox' ? control.checked : control.value;
}

function readPrepGuides() {
  return Array.from($('prepGuideList').querySelectorAll('[data-prep-guide]')).map((item) => ({
    title: itemValue(item, 'title'), description: itemValue(item, 'description'), url: itemValue(item, 'url'),
  }));
}

function readOffers() {
  return Array.from($('offerList').querySelectorAll('[data-offer]')).map((item) => ({
    partner: itemValue(item, 'partner'), title: itemValue(item, 'title'), description: itemValue(item, 'description'),
    code: itemValue(item, 'code'), url: itemValue(item, 'url'), logoUrl: itemValue(item, 'logoUrl'), active: itemValue(item, 'active'),
  }));
}

function renderPrepGuides(guides = []) {
  const list = $('prepGuideList');
  list.innerHTML = '';
  if (!guides.length) {
    list.innerHTML = '<p class="admin-empty-state">No prep guides yet.</p>';
    return;
  }
  guides.forEach((guide, index) => {
    const item = document.createElement('article');
    item.className = 'admin-list-item';
    item.dataset.prepGuide = '';
    item.innerHTML = `<div class="admin-item-heading"><strong>Guide ${index + 1}</strong><button class="admin-remove-button" type="button">Remove</button></div>
      <div class="admin-field-grid"><div><label for="prepTitle${index}">Title</label><input id="prepTitle${index}" data-field="title" maxlength="160"></div><div><label for="prepUrl${index}">HTTPS link</label><input id="prepUrl${index}" data-field="url" type="url" inputmode="url" placeholder="https://…"></div></div>
      <label for="prepDescription${index}">Description</label><textarea id="prepDescription${index}" data-field="description" rows="3" maxlength="1200"></textarea>`;
    ['title', 'description', 'url'].forEach((field) => { item.querySelector(`[data-field="${field}"]`).value = guide[field] || ''; });
    item.querySelector('.admin-remove-button').addEventListener('click', () => { const next = readPrepGuides(); next.splice(index, 1); renderPrepGuides(next); });
    list.appendChild(item);
  });
}

function renderOffers(offers = []) {
  const list = $('offerList');
  list.innerHTML = '';
  if (!offers.length) {
    list.innerHTML = '<p class="admin-empty-state">No offers yet.</p>';
    return;
  }
  offers.forEach((offer, index) => {
    const item = document.createElement('article');
    item.className = 'admin-list-item';
    item.dataset.offer = '';
    item.innerHTML = `<div class="admin-item-heading"><strong>Offer ${index + 1}</strong><button class="admin-remove-button" type="button">Remove</button></div>
      <div class="admin-field-grid"><div><label for="offerPartner${index}">Partner</label><input id="offerPartner${index}" data-field="partner" maxlength="160"></div><div><label for="offerTitle${index}">Offer title</label><input id="offerTitle${index}" data-field="title" maxlength="160"></div></div>
      <label for="offerDescription${index}">Description</label><textarea id="offerDescription${index}" data-field="description" rows="3" maxlength="1200"></textarea>
      <div class="admin-field-grid"><div><label for="offerCode${index}">Coupon code</label><input id="offerCode${index}" data-field="code" maxlength="80"></div><div><label for="offerUrl${index}">Destination link</label><input id="offerUrl${index}" data-field="url" type="url" inputmode="url" placeholder="https://…"></div></div>
      <label for="offerLogo${index}">Logo image link</label><input id="offerLogo${index}" data-field="logoUrl" type="url" inputmode="url" placeholder="https://…">
      <label class="admin-checkbox" for="offerActive${index}"><input id="offerActive${index}" data-field="active" type="checkbox"><span>Show this offer to athletes</span></label>`;
    ['partner', 'title', 'description', 'code', 'url', 'logoUrl'].forEach((field) => { item.querySelector(`[data-field="${field}"]`).value = offer[field] || ''; });
    item.querySelector('[data-field="active"]').checked = offer.active !== false;
    item.querySelector('.admin-remove-button').addEventListener('click', () => { const next = readOffers(); next.splice(index, 1); renderOffers(next); });
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

async function loadRaceContent(raceId) {
  contentLoadedRaceId = '';
  fillContent();
  setEditorEnabled(false);
  setMessage($('editorMessage'), 'Loading portal content…');
  try {
    const data = await request(`/api/admin-race-content?raceId=${encodeURIComponent(raceId)}`);
    if (activeRaceId !== raceId) return;
    fillContent(data.content);
    contentLoadedRaceId = raceId;
    setEditorEnabled(true);
    setMessage($('editorMessage'), data.content?.updatedAt ? `Last saved ${new Date(data.content.updatedAt).toLocaleString()}.` : 'No portal content has been saved yet.');
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('editorMessage'), error.message, 'error-text');
  }
}

$('raceSearch').addEventListener('input', renderRaceList);
$('backToRaces').addEventListener('click', showRegistry);

$('raceControlsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeRaceId) return;
  $('saveControls').disabled = true;
  setMessage($('controlsMessage'), 'Saving controls…');
  try {
    const data = await request('/api/admin-race-registry', {
      method: 'PATCH',
      body: JSON.stringify({ raceId: activeRaceId, controls: {
        status: $('operationsStatus').value,
        athletePortalStatus: $('athletePortalStatus').value,
        heatsReleased: $('heatsReleased').value,
        assignmentsLocked: $('assignmentsLocked').value,
        checkInEnabled: $('checkInEnabled').value,
      } }),
    });
    races = races.map((race) => race.id === data.race.id ? data.race : race);
    renderRaceWorkspace();
    setMessage($('controlsMessage'), 'Race controls saved.', 'success-text');
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('controlsMessage'), error.message, 'error-text');
  } finally { $('saveControls').disabled = false; }
});

$('addPrepGuide').addEventListener('click', () => {
  const guides = readPrepGuides();
  if (guides.length >= 12) return setMessage($('editorMessage'), 'A race can have up to 12 prep guides.', 'error-text');
  guides.push({ title: '', description: '', url: '' }); renderPrepGuides(guides);
  $('prepGuideList').lastElementChild?.querySelector('[data-field="title"]')?.focus();
});

$('addOffer').addEventListener('click', () => {
  const offers = readOffers();
  if (offers.length >= 20) return setMessage($('editorMessage'), 'A race can have up to 20 offers.', 'error-text');
  offers.push({ partner: '', title: '', description: '', code: '', url: '', logoUrl: '', active: true }); renderOffers(offers);
  $('offerList').lastElementChild?.querySelector('[data-field="partner"]')?.focus();
});

$('contentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeRaceId) return;
  $('saveContent').disabled = true;
  setMessage($('editorMessage'), 'Saving portal content…');
  try {
    const data = await request('/api/admin-race-content', { method: 'PUT', body: JSON.stringify({
      raceId: activeRaceId,
      content: {
        routeDescription: $('routeDescription').value, routeUrl: $('routeUrl').value,
        workoutDescription: $('workoutDescription').value, workoutUrl: $('workoutUrl').value,
        raceDayNotes: $('raceDayNotes').value, prepGuides: readPrepGuides(), offers: readOffers(),
      },
    }) });
    fillContent(data.content);
    setMessage($('editorMessage'), 'Portal content saved.', 'success-text');
  } catch (error) {
    if (error.status === 401) return showLogin('Your admin session expired. Sign in again.');
    setMessage($('editorMessage'), error.message, 'error-text');
  } finally { if (!$('adminEditor').hidden) $('saveContent').disabled = false; }
});

$('adminLoginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  $('adminLoginButton').disabled = true;
  setMessage($('loginMessage'), 'Signing in…');
  try {
    await request('/api/admin-session', { method: 'POST', body: JSON.stringify({ action: 'login', password: $('adminPassword').value }) });
    $('adminPassword').value = '';
    await initializeEditor();
  } catch (error) { setMessage($('loginMessage'), error.message, 'error-text'); }
  finally { $('adminLoginButton').disabled = false; }
});

$('adminLogout').addEventListener('click', async () => {
  try { await request('/api/admin-session', { method: 'POST', body: JSON.stringify({ action: 'logout' }) }); }
  finally { showLogin('You are logged out.'); }
});

async function start() {
  try {
    const session = await request('/api/admin-session');
    if (!session.configured) {
      showLogin('Admin access needs to be configured in Vercel before this portal can be used.');
      $('adminLoginButton').disabled = true;
      return;
    }
    if (session.authenticated) await initializeEditor(); else showLogin();
  } catch (error) { showLogin(error.message); }
}

start();
