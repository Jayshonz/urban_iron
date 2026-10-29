const $ = (id) => document.getElementById(id);
let races = [];
let activeRaceId = '';

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
  $('adminPassword').focus();
}

function showEditor() {
  $('adminLogin').hidden = true;
  $('adminEditor').hidden = false;
}

function setMessage(element, message, type = '') {
  element.textContent = message;
  element.className = `admin-message${type ? ` ${type}` : ''}`;
}

function fillContent(content = {}) {
  $('routeDescription').value = content.routeDescription || '';
  $('routeUrl').value = content.routeUrl || '';
  $('workoutDescription').value = content.workoutDescription || '';
  $('workoutUrl').value = content.workoutUrl || '';
  $('raceDayNotes').value = content.raceDayNotes || '';
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
        },
      }),
    });
    fillContent(data.content);
    setMessage($('editorMessage'), 'Race-day information saved.', 'success-text');
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
