/* eslint-disable quotes */
const nameDialog = document.getElementById('name_dialog');
const nameBox = document.getElementById('name_box');

function openBrowseDialog(browseDialog, pickType, mediaType, index, slctFunc) {
  //let data = await eel.read_music_files('/')();
  drawDialogContent('show-drives', browseDialog, pickType, mediaType, index, slctFunc);
  browseDialog = document.getElementById(browseDialog);
  browseDialog.style.display = 'flex';
}

eel.expose(closeBrowseDialog);
function closeBrowseDialog(browseDialog) {
  browseDialog = document.getElementById(browseDialog);
  console.log(browseDialog);
  browseDialog.style.display = 'none';
}

function openNameDialog() {
  nameDialog.style.display = 'flex';
}

function closeNameDialog() {
  nameDialog.style.display = 'none';
}

function submitName() {
  closeNameDialog();
  let name = nameBox.value;
  nameBox.value = '';
  openBrowseDialog('browse_dialog', 'folder', name, 0, 'eel.save_playlist');
}

async function drawDialogContent(startPath, drawAt, pickType, pathType, pathIndex, slctFunc) {
  // get the contents of the dir to render in a json format
  const fileList = await getDialogContent(startPath);
  // get the html element to render in
  const browseDialog = document.getElementById(drawAt);
  let curPath = '';
  if (fileList[0] == 'empty') {
    curPath = fileList[1];
    fileList = [];
  } else {
    curPath = fileList[0].path.replace('\\', '/');
  }
  //console.log('curpath: ' + curPath);
  let lastIndex = curPath.lastIndexOf('/');
  let exploreBar = `<div id='explore_bar' class='explore-bar'>
  <button 
    onclick="goBackDialog('` + drawAt + `','` + pickType + `','` + pathType + `',` + pathIndex + `,'` + slctFunc + `')"
    class='files-interactable' 
    fwd-intrct='goBackDialog()'
    bck-intrct="changeInteractLayer('.main-interactable')"
    rowbreak='true'>Go Back</button>
  <p>` + curPath.slice(0, lastIndex) + `</p>
  </div>
  <div class='fileslist'>`;
  for (var i = 0; i < fileList.length; i++) {
    var path = fileList[i].path.replace('\\', '/').split('/');
    path = path.join('\\\/');
    if (fileList[i].type == 'folder') {
      let folderObj = '';
      //console.log(curPath);
      folderObj = `<div
        class='folder files-interactable'
        fwd-intrct="drawDialogContent('` + path + `','` + drawAt + `','` + pickType + `','` + pathType +
        `',` + pathIndex + `,'` + slctFunc + `'); resetSelected()" 
        bck-intrct="goBackDialog()"
        dynamic="true"
        path="\`` + path + `\`">
      <p>` + fileList[i].name + `</p>
      <button
        onclick="drawDialogContent('` + path + `','` + drawAt + `','` + pickType + `','` + pathType +
        `',` + pathIndex + `,'` + slctFunc + `')">Open</button>`;
      if (pickType == 'folder' || pickType == 'both') {
        folderObj = folderObj.concat(`<button
        onclick="` + slctFunc + `('setpath','` + pathType +
        `',` + pathIndex + `,'` + path + `/')">Choose folder</button>`);
      }
      exploreBar = exploreBar.concat(folderObj + '</div>');
    } else if (fileList[i].type == 'file' && pickType == 'file' || pickType == 'both') {
      let fileObj = '';
      fileObj = `<div class='file files-interactable'
        fwd-intrct="eel.enqueue_file(\`` + path + `\`)" bck-intrct="goBack()" dynamic="true" path="\`` + path + `\`">
        <p>` + fileList[i].name + `</p>
        <button
        onclick="` + slctFunc + `('setpath','` + pathType +
        `',` + pathIndex + `,'` + path + `')">Choose file</button>
        </div>`;
      exploreBar = exploreBar.concat(fileObj);
    }
  }
  exploreBar = exploreBar.concat(`</div>
  <div class="confirm-bar">`);
  if (pickType == 'folder' || pickType == 'both') {
    exploreBar = exploreBar.concat(`<button onclick="` + slctFunc + `('setpath','` + pathType +
    `',` + pathIndex + `,'` + curPath.slice(0, lastIndex) + `/')">
    Choose current path</button>`);
  }
  exploreBar = exploreBar.concat(`<button onclick="closeBrowseDialog('` + drawAt + `')" class='files-interactable' 
fwd-intrct='goBackDialog()' bck-intrct="changeInteractLayer('.main-interactable')" rowbreak='true'>Cancel</button>
  </div>`);
  browseDialog.innerHTML = exploreBar;
}

let currentDialogDir = 'show-drives';

function goBackDialog(drawAt, pickType, mediaType, index, slctFunc) {
  let parentDir = currentDialogDir.split('/');
  parentDir.pop();
  parentDir = parentDir.join('/');
  console.log(parentDir);
  if (/^([A-Z]|[a-z]):$/.test(parentDir)) {
    parentDir = parentDir + '/';
  }
  if (/^([A-Z]|[a-z]):$/.test(currentDialogDir) || /^([A-Z]|[a-z]):\/$/.test(currentDialogDir) ||
    currentDialogDir == 'DRIVES/' || currentDialogDir == '/') {
    drawDialogContent('show-drives', drawAt, pickType, mediaType, index, slctFunc);
  } else if (parentDir == '') {
    drawDialogContent('/', drawAt, pickType, mediaType, index, slctFunc);
  } else {
    drawDialogContent(parentDir, drawAt, pickType, mediaType, index, slctFunc);
  }
}

async function getDialogContent(path) {
  let json = '';
  if (path == 'show-drives') {
    currentDialogDir = 'DRIVES/';
    json = await eel.get_drives()();
  } else {
    currentDialogDir = path;
    json = await eel.read_music_files(path)();
  }
  console.log(currentDialogDir);
  return json;
}
