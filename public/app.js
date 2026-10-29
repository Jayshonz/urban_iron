let selected = null;
let accessToken = null;
let currentPerson = null;
let checkInEnabled = false;
let availableRaces = [];
let raceDayContentRaceId = '';
const $ = (id) => document.getElementById(id);

async function api(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

async function load() {
  try {
    const response = await fetch('/api/races');
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Race list unavailable');
    availableRaces = data.races;
    const select = $('raceSelect');
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = data.races.length ? 'Select race' : 'No races are currently published';
    select.appendChild(placeholder);
    data.races.forEach((race) => {
      const option = document.createElement('option');
      option.value = race.id;
      option.textContent = `${race.city} · ${race.date}`;
      select.appendChild(option);
    });
    select.disabled = !data.races.length;
    $('openRace').disabled = true;
    $('status').textContent = data.races.length ? 'Select a race to continue.' : 'No races are currently published.';
  } catch {
    availableRaces = [];
    $('raceSelect').innerHTML = '<option value="">Race list unavailable</option>';
    $('raceSelect').disabled = true;
    $('openRace').disabled = true;
    $('status').textContent = 'Race list unavailable.';
  }
}

$('raceSelect').addEventListener('change', () => {
  $('openRace').disabled = !$('raceSelect').value;
});

$('raceForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const race = availableRaces.find((item) => item.id === $('raceSelect').value);
  if (race) choose(race);
});

const workspaceTabs = Array.from(document.querySelectorAll('[data-tab]'));

function activateTab(tabName, { focus = false } = {}) {
  workspaceTabs.forEach((tab) => {
    const active = tab.dataset.tab === tabName;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    if (active && focus) tab.focus();
  });
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });
  if (tabName === 'route' && selected && accessToken) loadRaceDayContent();
}

workspaceTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % workspaceTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + workspaceTabs.length) % workspaceTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = workspaceTabs.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    activateTab(workspaceTabs[nextIndex].dataset.tab, { focus: true });
  });
});

async function choose(race) {
  selected = race;
  accessToken = null;
  currentPerson = null;
  raceDayContentRaceId = '';
  checkInEnabled = Boolean(race.checkInEnabled);
  $('home').hidden = true;
  $('raceFlow').hidden = false;
  $('raceTitle').textContent = `${race.city} · ${race.date}`;
  $('password').value = '';
  $('query').value = '';
  $('gateMessage').innerHTML = '';
  $('result').innerHTML = '';
  renderRaceDayPlaceholder();
  $('workspace').hidden = true;
  activateTab('heat');
  window.scrollTo({ top: 0, behavior: 'auto' });

  if (race.requiresPassword === false || race.id === 'la-2026-10-04') {
    $('gate').hidden = true;
    await unlockPasswordlessRace();
    return;
  }

  $('gate').hidden = false;
  $('password').focus();
}

$('back').onclick = () => {
  selected = null;
  accessToken = null;
  currentPerson = null;
  raceDayContentRaceId = '';
  $('raceFlow').hidden = true;
  $('workspace').hidden = true;
  activateTab('heat');
  $('home').hidden = false;
  $('raceSelect').value = '';
  $('openRace').disabled = true;
  window.scrollTo({ top: 0, behavior: 'auto' });
};

$('unlock').onclick = unlock;
$('password').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') unlock();
});

async function unlock() {
  const message = $('gateMessage');
  message.textContent = 'Checking password…';
  try {
    const data = await api('/api/unlock', { raceId: selected.id, password: $('password').value });
    accessToken = data.accessToken;
    $('password').value = '';
    $('gate').hidden = true;
    $('workspace').hidden = false;
    activateTab('heat');
    loadRaceDayContent();
    $('query').focus();
  } catch (error) {
    message.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

async function unlockPasswordlessRace() {
  const result = $('result');
  result.textContent = 'Opening race…';
  try {
    const data = await api('/api/unlock', { raceId: selected.id });
    accessToken = data.accessToken;
    result.innerHTML = '';
    $('workspace').hidden = false;
    activateTab('heat');
    loadRaceDayContent();
    $('query').focus();
  } catch (error) {
    $('workspace').hidden = false;
    activateTab('heat');
    result.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

$('find').onclick = search;
$('query').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') search();
});

async function search() {
  const result = $('result');
  result.textContent = 'Searching…';
  try {
    const data = await api('/api/lookup', {
      raceId: selected.id,
      accessToken,
      query: $('query').value,
    });
    checkInEnabled = Boolean(data.checkInEnabled);
    if (!data.results.length) {
      result.innerHTML = '<div class="error">No matches found. Try a first name, last name, or registration email.</div>';
      return;
    }
    if (data.results.length === 1) {
      renderParticipant(data.results[0]);
      return;
    }
    result.innerHTML = `
      <p class="match-count">${data.results.length} matches — select your name.</p>
      <div class="match-list">
        ${data.results.map((person, index) => `
          <button class="match" data-index="${index}">
            <span>${esc(fullName(person))}</span>
            <span class="match-heat">${esc(person.heatName)}</span>
          </button>
        `).join('')}
      </div>`;
    result.querySelectorAll('.match').forEach((button) => {
      button.onclick = () => renderParticipant(data.results[Number(button.dataset.index)]);
    });
  } catch (error) {
    if (error.message.toLowerCase().includes('session expired')) resetGate(error.message);
    else result.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

function renderParticipant(person) {
  currentPerson = person;
  const heatLabel = person.heatName || 'TBD';
  const heatNumber = heatDisplayNumber(heatLabel);
  const checkInButton = checkInEnabled
    ? `<button class="checkin-entry ${person.checkedIn ? 'checked' : ''}" id="openCheckIn">${person.checkedIn ? '✓ CHECKED IN' : 'CHECK IN'}</button>`
    : '';

  $('result').innerHTML = `
    <button class="selected-person" id="selectedPerson">${esc(fullName(person))}</button>
    ${checkInButton}
    <div class="share-card" aria-label="${esc(heatLabel)}">
      <div class="share-card-inner">
        <img class="share-logo" src="/urban-iron-logo.png" alt="Urban Iron">
        <div class="share-heat-label">HEAT</div>
        <div class="share-heat-number">${esc(heatNumber)}</div>
        <div class="share-presented">PRESENTED BY</div>
        <img class="share-create-logo" src="/create-logo.png" alt="Create">
        <div class="checkerboard" aria-hidden="true"></div>
      </div>
    </div>
    <div class="card">
      <div class="detail-row"><span>Heat</span><strong>${esc(heatLabel)}</strong></div>
      <div class="detail-row"><span>Bib Number</span><strong>${esc(person.bib || '—')}</strong></div>
      <div class="detail-row"><span>Estimated Start Time</span><strong>${esc(person.start || 'TBD')}</strong></div>
      <button class="heat-button" id="viewHeat">View everyone in ${esc(heatLabel)} →</button>
      <div id="heatRoster"></div>
    </div>`;

  $('selectedPerson').onclick = () => showHeat(person);
  $('viewHeat').onclick = () => showHeat(person);
  if ($('openCheckIn')) $('openCheckIn').onclick = () => renderCheckIn(person);
}

function renderCheckIn(person) {
  currentPerson = person;
  const division = person.heatType || heatDivision(person.heatName) || 'Race';
  const heat = person.heatNumber || heatDisplayNumber(person.heatName);
  $('result').innerHTML = `
    <div class="checkin-screen">
      <button class="text-button checkin-back" id="checkInBack">← Back to my race info</button>
      <img class="checkin-logo" src="/urban-iron-checkin-logo.png" alt="Urban Iron">
      <div class="checkin-title">RACE DAY CHECK-IN</div>
      <div class="checkin-divider"></div>
      <div class="checkin-name">${esc(fullName(person))}</div>
      <div class="checkin-bib-label">Bib:</div>
      <div class="checkin-bib">${esc(person.bib || '—')}</div>
      <div class="checkin-shirt-size">Shirt Size: ${esc(person.shirtSize || '—')}</div>
      <div class="checkin-meta">Heat ${esc(heat || 'TBD')} · ${esc(division)}</div>
      <div class="checkin-divider"></div>
      ${person.checkedIn ? `
        <div class="checkin-success">✓ CHECKED IN</div>
        <button class="checkin-return" id="checkInReturn">Back to My Race Info</button>
      ` : `
        <div class="checkin-team-icon" aria-hidden="true">
          <svg viewBox="0 0 64 48" role="img">
            <circle cx="32" cy="10" r="7"></circle>
            <circle cx="14" cy="16" r="6"></circle>
            <circle cx="50" cy="16" r="6"></circle>
            <path d="M20 42v-7c0-8 5-12 12-12s12 4 12 12v7H20z"></path>
            <path d="M4 42v-5c0-6 4-10 10-10 3 0 5 1 7 2"></path>
            <path d="M60 42v-5c0-6-4-10-10-10-3 0-5 1-7 2"></path>
          </svg>
        </div>
        <div class="checkin-instruction">Present this screen to the check-in team.</div>
        <button class="confirm-checkin" id="confirmCheckIn">
          <span class="team-only">*TEAM MEMBER USE ONLY*</span>
          <span>CONFIRM CHECK-IN</span>
        </button>
        <div class="checkin-presented">
          <span>Presented by</span>
          <img src="/create-logo-orange.png" alt="Create">
        </div>
        <div id="checkInMessage"></div>
      `}
    </div>`;

  $('checkInBack').onclick = () => renderParticipant(person);
  if ($('checkInReturn')) $('checkInReturn').onclick = () => renderParticipant(person);
  if ($('confirmCheckIn')) $('confirmCheckIn').onclick = confirmCheckIn;
}

async function confirmCheckIn() {
  const button = $('confirmCheckIn');
  const message = $('checkInMessage');
  button.disabled = true;
  button.textContent = 'CONFIRMING…';
  try {
    await api('/api/check-in', {
      raceId: selected.id,
      accessToken,
      first: currentPerson.first,
      last: currentPerson.last,
      bib: currentPerson.bib,
    });
    currentPerson = { ...currentPerson, checkedIn: true };
    renderCheckIn(currentPerson);
  } catch (error) {
    button.disabled = false;
    button.innerHTML = '<span class="team-only">*TEAM MEMBER USE ONLY*</span><span>CONFIRM CHECK-IN</span>';
    message.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

function heatDisplayNumber(heatName) {
  const match = String(heatName || '').match(/(\d+(?:\.\d+)?)/);
  return match ? match[1] : heatName || '—';
}

function heatDivision(heatName) {
  if (/competitive/i.test(String(heatName || ''))) return 'Competitive';
  if (/vibes/i.test(String(heatName || ''))) return 'Vibes';
  return '';
}

async function showHeat(person) {
  const roster = $('heatRoster');
  if (!roster) return;
  roster.innerHTML = '<p class="roster-loading">Loading heat…</p>';
  try {
    const data = await api('/api/heat', {
      raceId: selected.id,
      accessToken,
      heatName: person.heatName,
    });
    roster.innerHTML = `
      <div class="roster">
        <p class="roster-title">${esc(person.heatName)} · ${data.participants.length} athletes</p>
        ${data.participants.map((p) => `
          <div class="roster-person ${samePerson(p, person) ? 'you' : ''}">
            <span>${esc(fullName(p))}${samePerson(p, person) ? ' · YOU' : ''}</span>
            <span>Bib ${esc(p.bib || '—')}</span>
          </div>
        `).join('')}
      </div>`;
  } catch (error) {
    if (error.message.toLowerCase().includes('session expired')) resetGate(error.message);
    else roster.innerHTML = `<div class="error">${esc(error.message)}</div>`;
  }
}

function resetGate(message) {
  accessToken = null;
  raceDayContentRaceId = '';
  $('workspace').hidden = true;

  if (selected && selected.requiresPassword === false) {
    $('gate').hidden = true;
    $('workspace').hidden = false;
    activateTab('heat');
    $('result').innerHTML = `<div class="error">${esc(message)}</div>`;
    unlockPasswordlessRace();
    return;
  }

  $('gate').hidden = false;
  $('gateMessage').innerHTML = `<div class="error">${esc(message)}</div>`;
  $('password').focus();
}

function renderRaceDayPlaceholder(message = 'Race details are coming soon.') {
  $('raceDayContent').className = 'workspace-placeholder';
  $('raceDayContent').innerHTML = `
    <strong>${esc(message)}</strong>
    <p>This section will hold the running route, workout order, movement standards, and race-day notes for this event.</p>`;
}

function raceDaySection(label, body, url, linkLabel) {
  if (!body && !url) return '';
  return `
    <section class="race-day-section">
      <p class="race-day-label">${esc(label)}</p>
      ${body ? `<div class="race-day-copy">${esc(body).replace(/\n/g, '<br>')}</div>` : ''}
      ${url ? `<a class="race-day-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(linkLabel)} <span aria-hidden="true">↗</span></a>` : ''}
    </section>`;
}

function renderRaceDayContent(content) {
  const sections = [
    raceDaySection('Running route', content.routeDescription, content.routeUrl, 'Open route map'),
    raceDaySection('Workouts', content.workoutDescription, content.workoutUrl, 'Open workout details'),
    raceDaySection('Important notes', content.raceDayNotes, '', ''),
  ].filter(Boolean);
  if (!sections.length) {
    renderRaceDayPlaceholder();
    return;
  }
  $('raceDayContent').className = 'race-day-content';
  $('raceDayContent').innerHTML = sections.join('');
}

async function loadRaceDayContent() {
  if (!selected || !accessToken || raceDayContentRaceId === selected.id) return;
  const requestedRaceId = selected.id;
  raceDayContentRaceId = requestedRaceId;
  $('raceDayContent').className = 'workspace-placeholder';
  $('raceDayContent').innerHTML = '<strong>Loading race-day information…</strong>';
  try {
    const data = await api('/api/race-content', {
      raceId: requestedRaceId,
      accessToken,
    });
    if (!selected || selected.id !== requestedRaceId) return;
    renderRaceDayContent(data.content || {});
  } catch (error) {
    raceDayContentRaceId = '';
    if (error.message.toLowerCase().includes('session expired')) resetGate(error.message);
    else renderRaceDayPlaceholder('Race-day information is temporarily unavailable.');
  }
}

function fullName(person) {
  return `${person.first || ''} ${person.last || ''}`.trim();
}

function samePerson(a, b) {
  return String(a.bib || '') === String(b.bib || '') && fullName(a) === fullName(b);
}

function esc(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

load();
