let selected = null;
let accessToken = null;
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
  $('result').innerHTML = `
    <button class="selected-person" id="selectedPerson">${esc(fullName(person))}</button>
    <div class="card">
      <div class="detail-row"><span>Heat</span><strong>${esc(person.heatName || 'TBD')}</strong></div>
      <div class="detail-row"><span>Bib Number</span><strong>${esc(person.bib || '—')}</strong></div>
      <div class="detail-row"><span>Estimated Start Time</span><strong>${esc(person.start || 'TBD')}</strong></div>
      <button class="heat-button" id="viewHeat">View everyone in ${esc(person.heatName || 'this heat')} →</button>
      <div id="heatRoster"></div>
    </div>`;
  $('selectedPerson').onclick = () => showHeat(person);
  $('viewHeat').onclick = () => showHeat(person);
}

async function showHeat(person) {
  const roster = $('heatRoster');
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
