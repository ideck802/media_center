/* eslint-disable quotes */

const settingsMenu = document.getElementById('settings');
const moviePathsEl = document.getElementById('movie_paths');
const showPathsEl = document.getElementById('show_paths');
const musicPathsEl = document.getElementById('music_paths');
const tabSettings = document.getElementById('tab_settings');
const startupSettings = document.getElementById('startup_settings');

function openSettings() {
  renderMovieSettings();
  renderShowSettings();
  renderMusicSettings();
  renderTabSettings();
  renderStartupSettings();
  settingsMenu.style.display = 'flex';
}

function closeSettings() {
  settingsMenu.style.display = 'none';
}

let configVals = {};
configVals.mediaEnabled = true;

function saveSettings() {
  let settingsCnfg = {
    "moviePaths": configVals.moviePaths,
    "showPaths": configVals.showPaths,
    "musicPaths": configVals.musicPaths,
    "radioEnabled": configVals.radioEnabled,
    "gamesEnabled": configVals.gamesEnabled,
    "playOnOpen": configVals.playOnOpen,
    "syncPath": configVals.syncPath
  };
  eel.save_settings(JSON.stringify(settingsCnfg));
  closeSettings();
}

async function readSettings() {
  let json = await eel.read_settings()();
  console.log(json);
  json = JSON.parse(json);
  configVals.moviePaths = json.moviePaths;
  configVals.showPaths = json.showPaths;
  configVals.musicPaths = json.musicPaths;
  configVals.radioEnabled = json.radioEnabled;
  configVals.gamesEnabled = json.gamesEnabled;
  configVals.playOnOpen = json.playOnOpen;
  configVals.syncPath = json.syncPath;
  renderTabBtns('media');
  if (configVals.radioEnabled) {
    eel.load_stations();
    renderStations();
  }
}

function renderMovieSettings() {
  let html = `<h4>Movie Paths</h4>
  <button class="settings-interactable" onclick="chngPath('add', 'movie')">+</button>
  <div class="paths-list">`;
  if (configVals.moviePaths.length > 0) {
    for (let i = 0; i < configVals.moviePaths.length; i++) {
      const pathBlock = `<div class="path-block">
      <input type="text" value="` + configVals.moviePaths[i] + `"/>
      <button class="settings-interactable" onclick="openBrowseDialog('browse_dialog', 'folder',
        'movie',` + i + `, 'chngPath')">Browse</button>
      <button class="settings-interactable" onclick="chngPath('remove', 'movie', ` + i + `)">X</button>
      </div>`;
      html = html.concat(pathBlock);
    }
  } else {
    html = html.concat(`<p>There are no paths, add one with the + button</p>`);
  }
  html = html.concat(`</div>`);
  moviePathsEl.innerHTML = html;
}

function renderShowSettings() {
  let html = `<h4>Show Paths</h4>
  <button class="settings-interactable" onclick="chngPath('add', 'show')">+</button>
  <div class="paths-list">`;
  if (configVals.showPaths.length > 0) {
    for (let i = 0; i < configVals.showPaths.length; i++) {
      const pathBlock = `<div class="path-block">
      <input type="text" value="` + configVals.showPaths[i] + `"/>
      <button class="settings-interactable" onclick="openBrowseDialog('browse_dialog', 'folder',
        'show',` + i + `, 'chngPath')">Browse</button>
      <button class="settings-interactable" onclick="chngPath('remove', 'show', ` + i + `)">X</button>
      </div>`;
      html = html.concat(pathBlock);
    }
  } else {
    html = html.concat(`<p>There are no paths, add one with the + button</p>`);
  }
  html = html.concat(`</div>`);
  showPathsEl.innerHTML = html;
}

function renderMusicSettings() {
  let html = `<h4>Music Paths</h4>
  <button class="settings-interactable" onclick="chngPath('add', 'music')">+</button>
  <div class="paths-list">`;
  if (configVals.musicPaths.length > 0) {
    for (let i = 0; i < configVals.musicPaths.length; i++) {
      const pathBlock = `<div class="path-block">
      <input type="text" value="` + configVals.musicPaths[i] + `"/>
      <button class="settings-interactable" onclick="openBrowseDialog('browse_dialog', 'folder',
        'music',` + i + `, 'chngPath')">Browse</button>
      <button class="settings-interactable" onclick="chngPath('remove', 'music', ` + i + `)">X</button>
      </div>`;
      html = html.concat(pathBlock);
    }
  } else {
    html = html.concat(`<p>There are no paths, add one with the + button</p>`);
  }
  html = html.concat(`</div>`);
  musicPathsEl.innerHTML = html;
}

function renderTabSettings() {
  let html = `<input id="radio2" type="checkbox" onchange="chngTabSettings(this, 'radioEnabled')"
  ` + (configVals.radioEnabled ? 'checked' : '') + `/>
  <label for="radio2">Use radio</label>
  <input id="games2" type="checkbox" onchange="chngTabSettings(this, 'gamesEnabled')"
    ` + (configVals.gamesEnabled ? 'checked' : '') + `/>
  <label for="games2">Use game launcher</label>`;
  tabSettings.innerHTML = html;
}

function renderStartupSettings() {
  let html = `<input id="radio3" type="checkbox" onchange="changeStartupSetting(0, 'playOnOpen', 0, this)"
  ` + (configVals.playOnOpen ? 'checked' : '') + `/>
  <label for="radio3">Auto play last open media</label>
  <input type="text" value="` + configVals.syncPath + `"/>
  <button class="settings-interactable" onclick="openBrowseDialog('browse_dialog', 'folder',
  'syncPath', 0, 'chngStartupSetting')">Browse</button>`;
  startupSettings.innerHTML = html;
}

function chngStartupSetting(action, type, index, path = '/') {
  if (type == 'playOnOpen') {
    configVals.playOnOpen = path.checked;
  } else if (type == 'syncPath') {
    configVals.syncPath = path;
  }
  renderStartupSettings();
  closeBrowseDialog('browse_dialog');
}

function chngTabSettings(e, varName) {
  console.log(e.checked);
  configVals[varName] = e.checked;
  e.checked = e.checked;
  renderTabBtns('media');
  if (varName == 'radioEnabled' && configVals[varName] == true) {
    eel.load_stations();
    renderStations();
  }
}

function chngPath(action, type, index, path = '/') {
  if (action == 'add') {
    if (type == 'movie') {
      configVals.moviePaths.push('/');
      console.log(configVals.moviePaths);
      renderMovieSettings();
    } else if (type == 'show') {
      configVals.showPaths.push('/');
      console.log(configVals.showPaths);
      renderShowSettings();
    } else if (type == 'music') {
      configVals.musicPaths.push('/');
      console.log(configVals.musicPaths);
      renderMusicSettings();
    }
  } else if (action == 'remove') {
    if (type == 'movie') {
      configVals.moviePaths.splice(index, 1);
      console.log(configVals.moviePaths);
      renderMovieSettings();
    } else if (type == 'show') {
      configVals.showPaths.splice(index, 1);
      console.log(configVals.showPaths);
      renderShowSettings();
    } else if (type == 'music') {
      configVals.musicPaths.splice(index, 1);
      console.log(configVals.musicPaths);
      renderMusicSettings();
    }
  } else if (action == 'setpath') {
    path = path.slice(0, -1);
    if (type == 'movie') {
      console.log(configVals.moviePaths);
      configVals.moviePaths[index] = path;
      renderMovieSettings();
      closeBrowseDialog('browse_dialog');
    } else if (type == 'show') {
      configVals.showPaths[index] = path;
      renderShowSettings();
      closeBrowseDialog('browse_dialog');
    } else if (type == 'music') {
      configVals.musicPaths[index] = path;
      renderMusicSettings();
      closeBrowseDialog('browse_dialog');
    }
  }
}
