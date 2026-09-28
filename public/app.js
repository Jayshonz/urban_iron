let selected = null;
let accessToken = null;
let currentPerson = null;
let checkInEnabled = false;
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
    $('status').textContent = data.races.length ? 'Select your city.' : 'No races are currently published.';
    $('races').innerHTML = '';
    data.races.forEach((race) => {
      const button = document.createElement('button');
      button.className = 'race';
      button.innerHTML = `<strong>${esc(race.city)}</strong><span>${esc(race.date)}</span>`;
      button.onclick = () => choose(race);
      $('races').appendChild(button);
    });
  } catch {
    $('status').textContent = 'Race list unavailable.';
  }
}

function choose(race) {
  selected = race;
  accessToken = null;
  currentPerson = null;
  checkInEnabled = Boolean(race.checkInEnabled);
  $('races').hidden = true;
  $('status').hidden = true;
  $('raceFlow').hidden = false;
  $('raceTitle').textContent = `${race.city} · ${race.date}`;
  $('gate').hidden = false;
  $('searchPanel').hidden = true;
  $('password').value = '';
  $('query').value = '';
  $('gateMessage').innerHTML = '';
  $('result').innerHTML = '';
  $('password').focus();
}

$('back').onclick = () => {
  selected = null;
  accessToken = null;
  currentPerson = null;
  $('raceFlow').hidden = true;
  $('races').hidden = false;
  $('status').hidden = false;
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
    $('searchPanel').hidden = false;
    $('query').focus();
  } catch (error) {
    message.innerHTML = `<div class="error">${esc(error.message)}</div>`;
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
      <div class="checkin-name">${esc(fullName(person))}</div>
      <div class="checkin-bib-label">BIB</div>
      <div class="checkin-bib">${esc(person.bib || '—')}</div>
      <div class="checkin-meta">Heat ${esc(heat || 'TBD')} · ${esc(division)}</div>
      ${person.checkedIn ? `
        <div class="checkin-success">✓ CHECKED IN</div>
        <button class="checkin-return" id="checkInReturn">Back to My Race Info</button>
      ` : `
        <div class="checkin-instruction">Present this screen to the check-in team. A team member will confirm your check-in.</div>
        <button class="confirm-checkin" id="confirmCheckIn">TEAM MEMBER: CONFIRM CHECK-IN</button>
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
    button.textContent = 'TEAM MEMBER: CONFIRM CHECK-IN';
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
        <p class="roster-title">${esc(person.heatName)} · ${data.participants.length} participants</p>
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
  $('searchPanel').hidden = true;
  $('gate').hidden = false;
  $('gateMessage').innerHTML = `<div class="error">${esc(message)}</div>`;
  $('password').focus();
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
