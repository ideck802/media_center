/* eslint-disable quotes */
const stationsList = document.getElementById('stations');
const indicator = document.getElementById('station_indicator');

let stationsLen = 0;

async function renderStations() {
  const list = await eel.get_stations()();
  let html = '';
  for (let i = 0; i < list.length; i++) {
    let fileName = '';
    if (list[i].path.endsWith('/')) {
      fileName = list[i].path.split('/').at(-2);
    } else {
      fileName = list[i].path.split('/').pop().slice(0, -4);
    }
    console.log(fileName);
    const station = `<div class="station">
    <button class="play" onclick="changeStation('set',` + i + `)">Play</button>
    <p>` + fileName + `</p>
    <button
      class="settings-interactable"
      onclick="openBrowseDialog('browse_dialog', 'both', 'movie',` + i + `,'chngRadioPath')">Browse</button>
      <button class="settings-interactable" onclick="chngRadioPath('remove', 'movie', ` + i + `)">X</button>
    </div>`;
    html = html.concat(station);
  }
  html = html.concat(`<button class="add settings-interactable" onclick="chngRadioPath('add', 'movie', 0)">
    +</button>`);
  stationsList.innerHTML = html;
  stationsLen = list.length - 1;
}

const indicatorOffset = 24;
const indStationHeight = 24;
const indHeight = 6;

let currentStation = 0;

indicator.style.marginTop = (indicatorOffset + ((currentStation + 1) * indStationHeight) - (indStationHeight / 2) -
    (indHeight / 2)) + 'px';

function changeStation(action, i = null) {
  if (action == 'set') {
    currentStation = i;
  } else if (action == 'prev' && currentStation > 0) {
    currentStation -= 1;
  } else if (action == 'next' && currentStation < stationsLen) {
    currentStation += 1;
  }
  console.log(currentStation);
  indicator.style.marginTop = (indicatorOffset + ((currentStation + 1) * indStationHeight) - (indStationHeight / 2) -
    (indHeight / 2)) + 'px';

  eel.play_radio(currentStation);
}

async function chngRadioPath(action, type, index, path = '/') {
  let stations = await eel.get_stations()();
  console.log(stations);
  if (action == 'add') {
    stations.push({"path": "/", "time": 0, "length": 0, "filesCnt": 0, "fileAt": 0});
    openBrowseDialog('browse_dialog', 'both', 'movie', stationsLen + 1 ,'chngRadioPath');
  } else if (action == 'remove') {
    stations.splice(index, 1);
  } else if (action == 'setpath') {
    stations[index].path = path;
    closeBrowseDialog('browse_dialog');
  }
  eel.write_stations(stations);
  renderStations();
}
