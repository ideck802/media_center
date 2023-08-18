/* eslint-disable quotes */
const stationsList = document.getElementById('stations');

async function renderStations() {
  const list = await eel.get_stations()();
  let html = '';
  for (let i = 0; i < list.length; i++) {
    const station = `<div class="station">
    <button onclick="eel.play_radio(` + i + `)">Play</button>
    <input type="text" value="` + list[i].path + `"/>
    <button
      class="settings-interactable"
      onclick="openBrowseDialog('browse_dialog', 'file', 'movie',` + i + `,'chngRadioPath')">Browse</button>
      <button class="settings-interactable" onclick="chngRadioPath('remove', 'movie', ` + i + `)">X</button>
    </div>`;
    html = html.concat(station);
  }
  stationsList.innerHTML = html;
}

async function chngRadioPath(action, type, index, path = '/') {
  let stations = await eel.get_stations()();
  console.log(stations);
  if (action == 'add') {
    stations.push({"path": "/", "time": 0, "length": 0});
  } else if (action == 'remove') {
    stations.splice(index, 1);
  } else if (action == 'setpath') {
    stations[index].path = path;
    closeBrowseDialog('browse_dialog');
  }
  eel.write_stations(stations);
  renderStations();
}
