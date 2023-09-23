/* eslint-disable quotes */

const bigView = document.getElementById('big_view');
const mediaTab = document.getElementById('media');
const radioTab = document.getElementById('radio');
const gamesTab = document.getElementById('games');
const tabBtns =  document.getElementById('tab_btns');
const musicFileView = document.getElementById('files_explorer');
const playlistView = document.getElementById('media_playlist');
const subsList = document.getElementById('subs');
const audioList = document.getElementById('audio_list');
const progressBar = document.getElementById('progressbar');
const browseDialog = document.getElementById('browse_dialog');
const metadataList = document.getElementById('metadata_list');
const playBtn = document.getElementById('play_btn');
const resizeBtn = document.getElementById('resize_btn');

window.addEventListener('beforeunload', () => { eel.on_quit(); });

async function toggleGuiSize() {
  if (await eel.get_shrunk_status()() == true) {
    eel.expand_gui();
  } else {
    eel.shrink_gui();
  }
}

function savePlaylist() {
  openNameDialog();
}

eel.expose(drawResizeArrow);
function drawResizeArrow(state) {
  if (state == 'expand') {
    resizeBtn.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
  } else if (state == 'shrink') {
    resizeBtn.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
  }
}

eel.expose(drawPlayBtn);
function drawPlayBtn(state) {
  if (state == 'play') {
    playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  } else if (state == 'pause') {
    playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
  }
}

function switchTab(e, name) {
  if (name == 'media') {
    mediaTab.style.display = 'flex';
    radioTab.style.display = 'none';
    gamesTab.style.display = 'none';
  } else if (name == 'radio') {
    mediaTab.style.display = 'none';
    radioTab.style.display = 'flex';
    gamesTab.style.display = 'none';
    renderStations();
  } else if (name == 'games') {
    mediaTab.style.display = 'none';
    radioTab.style.display = 'none';
    gamesTab.style.display = 'flex';
  }
  renderTabBtns(name);
}

function renderTabBtns(active = 'media') {
  tabBtns.innerHTML = '';
  let allHTML = '';
  const tabs = ['media', 'radio', 'games'];
  const names = ['Media Player', 'Radio', 'Game Launcher'];
  for (let i = 0; i < tabs.length; i++) {
    if (configVals[tabs[i] + 'Enabled']) {
      if (i == tabs.indexOf(active)) {
        let tabHTML = `<button class="main-interactable main-tab-btn active" onclick="switchTab(this, '` +
        tabs[i] + `')">` + names[i] + `</button>`;
        allHTML = allHTML.concat(tabHTML);
      } else {
        let tabHTML = `<button class="main-interactable main-tab-btn" onclick="switchTab(this, '` +
        tabs[i] + `')">` + names[i] + `</button>`;
        allHTML = allHTML.concat(tabHTML);
      }
    }
  }
  tabBtns.innerHTML = allHTML;
}

function drawMediaOptions(mediaType = null) {
  musicFileView.innerHTML = '';
  let curPath = '';
  let exploreBar = `<div id='explore_bar' class='explore-bar'>
  <button onclick='goBack()' class='files-interactable' 
fwd-intrct='goBack()' bck-intrct="changeInteractLayer('.main-interactable')" rowbreak='true'>Go Back</button>
  <p></p>
  </div>
  <div class='fileslist'>`;
  //showPaths.some(item => path.includes(item))
  if (mediaType == null) {
    let folderObj = '';
    folderObj = `<div class='folder files-interactable'
    fwd-intrct="drawMediaOptions('movie'); resetSelected()" 
    bck-intrct="goBack()" dynamic="true">
    <p>Movies</p>
    <button onclick="drawMediaOptions('movie')">Open</button>
    </div>
    <div class='folder files-interactable'
    fwd-intrct="drawMediaOptions('show'); resetSelected()" 
    bck-intrct="goBack()" dynamic="true">
    <p>Shows</p>
    <button onclick="drawMediaOptions('show')">Open</button>
    </div>
    <div class='folder files-interactable'
    fwd-intrct="drawMediaOptions('music'); resetSelected()" 
    bck-intrct="goBack()" dynamic="true">
    <p>Music</p>
    <button onclick="drawMediaOptions('music')">Open</button>
    </div>`;
    exploreBar = exploreBar.concat(folderObj);
  } else if (mediaType == 'movie') {
    for (var i = 0; i < configVals.moviePaths.length; i++) {
      let folderObj = '';
      folderObj = `<div class='folder files-interactable'
      fwd-intrct="getMusicFiles('` + configVals.moviePaths[i] + `'); resetSelected()" 
      bck-intrct="goBack()" dynamic="true">
      <p>` + configVals.moviePaths[i].split('/').pop() + `</p>
      <button onclick="getMusicFiles('` + configVals.moviePaths[i] + `')">Open</button>
      </div>`;
      exploreBar = exploreBar.concat(folderObj);
    }
  } else if (mediaType == 'show') {
    for (var i = 0; i < configVals.showPaths.length; i++) {
      let folderObj = '';
      folderObj = `<div class='folder files-interactable'
      fwd-intrct="getMusicFiles('` + configVals.showPaths[i] + `'); resetSelected()" 
      bck-intrct="goBack()" dynamic="true">
      <p>` + configVals.showPaths[i].split('/').pop() + `</p>
      <button onclick="getMusicFiles('` + configVals.showPaths[i] + `')">Open</button>
      </div>`;
      exploreBar = exploreBar.concat(folderObj);
    }
  } else if (mediaType == 'music') {
    for (var i = 0; i < configVals.musicPaths.length; i++) {
      let folderObj = '';
      folderObj = `<div class='folder files-interactable'
      fwd-intrct="getMusicFiles('` + configVals.musicPaths[i] + `'); resetSelected()" 
      bck-intrct="goBack()" dynamic="true">
      <p>` + configVals.musicPaths[i].split('/').pop() + `</p>
      <button onclick="getMusicFiles('` + configVals.musicPaths[i] + `')">Open</button>
      </div>`;
      exploreBar = exploreBar.concat(folderObj);
    }
  }
  exploreBar = exploreBar.concat('</div>');
  musicFileView.innerHTML += exploreBar;
}

async function drawFiles(fileList) {
  musicFileView.innerHTML = '';
  let curPath = '';
  if (fileList[0] == 'empty') {
    curPath = fileList[1];
    fileList = [];
  } else {
    curPath = fileList[0].path.replace('\\', '/');
  }
  let lastIndex = curPath.lastIndexOf('/');
  let exploreBar = `<div id='explore_bar' class='explore-bar'>
  <button onclick='goBack()' class='files-interactable' 
fwd-intrct='goBack()' bck-intrct="changeInteractLayer('.main-interactable')" rowbreak='true'>Go Back</button>
  <p>` + curPath.slice(0, lastIndex) + `</p>
  </div>
  <div class='fileslist'>`;
  for (var i = 0; i < fileList.length; i++) {
    var path = fileList[i].path.replace('\\', '/').split('/');
    path = path.join('\\\/');
    if (fileList[i].type == 'folder') {
      let folderObj = '';
      console.log(curPath);
      if (configVals.showPaths.some(item => curPath.includes(item))) {
        folderObj = `<div class='folder files-interactable'
        fwd-intrct="getMusicFiles('` + path + `'); resetSelected()" 
        bck-intrct="goBack()" dynamic="true" path="\`` + path + `\`">
        <p>` + fileList[i].name + `</p>
        <img src="./cached_metadata/` + fileList[i].name + `_img.jpg"/>
        <button onclick="getMusicFiles('` + path + `')">Open</button>
        <button onclick="eel.play_folder('` + path + `')">Play Folder</button>
        <button onclick="eel.enqueue_folder('` + path + `')">Enqueue</button>
        <button onclick="eel.play_folder('` + path + `', true)">Shuffle</button>
        </div>`;
      } else {
        folderObj = `<div class='folder files-interactable'
        fwd-intrct="getMusicFiles('` + path + `'); resetSelected()" 
        bck-intrct="goBack()" dynamic="true" path="\`` + path + `\`">
        <p>` + fileList[i].name + `</p>
        <button onclick="getMusicFiles('` + path + `')">Open</button>
        <button onclick="eel.play_folder('` + path + `')">Play Folder</button>
        <button onclick="eel.enqueue_folder('` + path + `')">Enqueue</button>
        <button onclick="eel.play_folder('` + path + `', true)">Shuffle</button>
        </div>`;
      }
      exploreBar = exploreBar.concat(folderObj);
    } else {
      let fileObj = '';
      if (fileList[i].name.includes('mp4') || fileList[i].name.includes('mkv') || fileList[i].name.includes('m4v')) {
        if (curPath.includes('show')) {
          let metadata = await eel.get_metadata('tv', fileList[i].name)();
          fileObj = `<div class='file files-interactable'
          fwd-intrct="eel.enqueue_file(\`` + path + `\`)" bck-intrct="goBack()" dynamic="true" path="\`` + path + `\`">
          <p>` + fileList[i].name + `</p>
          <img src="./cached_metadata/` + fileList[i].name + `_img.jpg"/>
          <button onclick="eel.play_file(\`` + path + `\`)">Play</button>
          <button onclick="eel.enqueue_file(\`` + path + `\`)">Enqueue</button>
          </div>`;
        } else if (curPath.includes('movie')) {
          fileObj = `<div class='file files-interactable'
          fwd-intrct="eel.enqueue_file(\`` + path + `\`)" bck-intrct="goBack()" dynamic="true" path="\`` + path + `\`">
          <p>` + fileList[i].name + `</p>
          <img src="./cached_metadata/` + fileList[i].name + `_img.jpg"/>
          <button onclick="eel.play_file(\`` + path + `\`)">Play</button>
          <button onclick="eel.enqueue_file(\`` + path + `\`)">Enqueue</button>
          </div>`;
        }
      } else {
        fileObj = `<div class='file files-interactable'
        fwd-intrct="eel.enqueue_file(\`` + path + `\`)" bck-intrct="goBack()" dynamic="true" path="\`` + path + `\`">
        <p>` + fileList[i].name + `</p>
        <button onclick="eel.play_file(\`` + path + `\`)">Play</button>
        <button onclick="eel.enqueue_file(\`` + path + `\`)">Enqueue</button>
        </div>`;
      }
      exploreBar = exploreBar.concat(fileObj);
    }
  }
  exploreBar = exploreBar.concat('</div>');
  musicFileView.innerHTML += exploreBar;
}

eel.expose(drawPlaylist);
function drawPlaylist(playlist) {
  playlistView.innerHTML = '';
  for (var i = 0; i < playlist.length; i++) {
    let listObj = '';
    if (playlist[i].isPlaying) {
      listObj = `<div class='media playing'>
      <p>` + playlist[i].name + `</p>
      <button onclick='eel.remove_file(` + i + `)'>Remove</button>
      </div>`;
    } else {
      listObj = `<div class='media'>
      <p>` + playlist[i].name + `</p>
      <button onclick='eel.remove_file(` + i + `)'>Remove</button>
      </div>`;
    }
    playlistView.innerHTML += listObj;
  }
}

eel.expose(renderProgress);
function renderProgress(len, pos, time) {
  progressBar.innerHTML = '';
  let marker = `<p class='media-time'>
  ` + time + `</p><div class='marker-cont'>
  <div class='marker' style='width: ` + pos + `%;'>.</div>
  </div><p class='media-len'>` + len + '</p>';
  progressBar.innerHTML = marker;
}

eel.expose(getSubs);
function getSubs(subs, activeSub) {
  subsList.innerHTML = '';
  for (var i = 0; i < subs.length; i++) {
    if (subs[i] == activeSub) {
      let option = '<option value="' + subs[i] + '" selected>' + subs[i] + '</option>';
      subsList.innerHTML += option;
    } else {
      let option = '<option value="' + subs[i] + '">' + subs[i] + '</option>';
      subsList.innerHTML += option;
    }
  }
}

eel.expose(getAudios);
function getAudios(audios, activeAudio) {
  for (let i = 0; i < audios.length; i++) {
    if (audios[i] == activeAudio) {
      let option = '<option value="' + audios[i] + '" selected>' + audios[i] + '</option>';
      audioList.innerHTML += option;
    } else {
      let option = '<option value="' + audios[i] + '">' + audios[i] + '</option>';
      audioList.innerHTML += option;
    }
  }
}

async function overrideMetadata(path, searchTerm) {
  console.log(searchTerm);
  let data = '';
  let html = `<input type='text' value='` + searchTerm + `' id='overrideSearchBox'/>
  <button onclick="overrideMetadata('` + path + `', document.getElementById('overrideSearchBox').value)">Search</button>
  <button onclick="closeMetadataList()">Cancel</button>`;
  if (configVals.showPaths.some(item => path.includes(item))) {
    data = await eel.get_metadata('tv', searchTerm, 4)();
    for (let i = 0; i < data.length; i++) {
      html = html.concat(`<div class='media'>
      <h3>` + data[i].name + `</h3>
      <button onclick="eel.set_override('` + path + `','` + data[i].id + `')">Pick</button>
      <p>` + data[i].first_air_date + `</p>
      <p>` + data[i].overview + `</p></div>`);
    }
  } else if (configVals.moviePaths.some(item => path.includes(item))) {
    data = await eel.get_metadata('movie', searchTerm, 3)();
    for (let i = 0; i < data.length; i++) {
      html = html.concat(`<div class='media'>
      <h3>` + data[i].title + `</h3>
      <button onclick="eel.set_override('` + path + `','` + data[i].id + `')">Pick</button>
      <p>` + data[i].release_date + `</p>
      <p>` + data[i].overview + `</p></div>`);
    }
  }
  console.log(data);
  metadataList.innerHTML = '';
  metadataList.innerHTML = html;
  metadataList.style.display = 'flex';
}

function closeMetadataList() {
  metadataList.style.display = 'none';
}

let currentDir = 'DRIVES';

function goBack() {
  if (configVals.moviePaths.includes(currentDir)) {
    currentDir = 'mediaOps';
    drawMediaOptions('movie');
  } else if (configVals.showPaths.includes(currentDir)) {
    currentDir = 'mediaOps';
    drawMediaOptions('show');
  } else if (configVals.musicPaths.includes(currentDir)) {
    currentDir = 'mediaOps';
    drawMediaOptions('music');
  } else if (currentDir == 'mediaOps') {
    drawMediaOptions();
  } else {
    let parentDir = currentDir.split('/');
    parentDir.pop();
    parentDir = parentDir.join('/');
    if (parentDir == '') {
      parentDir = '/';
    } else if (/^([A-Z]|[a-z]):$/.test(parentDir)) {
      parentDir = parentDir + '/';
    }
    getMusicFiles(parentDir);
  }
}

async function getMusicFiles(path) {
  currentDir = path;
  let json = await eel.read_music_files(path)();
  drawFiles(json);
}
readSettings();
eel.init();
//getMusicFiles('/');
drawMediaOptions();

