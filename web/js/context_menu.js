/* eslint-disable quotes */
let contextMenu = document.getElementById('context_menu');

document.addEventListener('contextmenu', openContextMenu);
document.addEventListener('click', closeContextMenu);

function openContextMenu(e) {
  e.preventDefault();
  if (e.target.closest('.folder') !== null) {
    openMenu(e.target.closest('.folder'), true, [e.pageX, e.pageY]);
  } else if (e.target.closest('.file') !== null) {
    openMenu(e.target.closest('.file'), true, [e.pageX, e.pageY]);
  }
}

function openMenu(refElement, mousePos = true, pos = [0,0]) {
  renderContextOptions(mousePos, refElement);
  if (mousePos) {
    contextMenu.classList.remove('open-btn');
    contextMenu.classList.add('open-click');
    contextMenu.style.left = pos[0] + 'px';
    contextMenu.style.top = pos[1] + 'px';
  } else {
    contextMenu.classList.remove('open-click');
    contextMenu.classList.add('open-btn');
    contextMenu.style.left = pos[0] + 'px';
    contextMenu.style.top = pos[1] + 'px';
  }
  changeInteractLayer('.context-interactable');
}

function closeMenu() {
  contextMenu.classList.remove('open-click');
  contextMenu.classList.remove('open-btn');
  changeInteractLayer('.main-interactable');
}

function closeContextMenu(e) {
  if (e.target.classList.contains('context-menu') || e.target.closest('.context-menu')) {
    e.preventDefault();
  } else {
    closeMenu();
  }
}

function renderContextOptions(fromClick, refElement) {
  contextMenu.innerHTML = '';
  let option = `<button onclick="eel.dwnld_metadata(` + refElement.getAttribute('path') + `)" 
  class="context-interactable" 
  fwd-intrct="eel.dwnld_metadata(` + refElement.getAttribute('path') + `)" rowbreak="true">
  Scan here for metadata
  </button>
  <button onclick="eel.handle_watched_data('` + refElement.getAttribute('path') + `', true)">Set as watched</button>
  <button onclick="overrideMetadata('` + refElement.getAttribute('path') +
  `','` + refElement.getAttribute('path').match(/^.*?([^\\/.]*)[^\\/]*$/)[1] + `')">Override Metadata</button>`;
  contextMenu.innerHTML += option;
  if (!fromClick) {
    contextMenu.innerHTML += `<button onclick="closeMenu()" class="context-interactable" 
    fwd-intrct="closeMenu()" rowbreak="true">
    close
    </button>`;
  }
}
