document.addEventListener('keydown', handleKeyPress);

let selectedIndex = 0;

let gridItems = [];
let rowbreaks = [];
let layerClass = '.main-interactable';


function handleKeyPress(event) {
  const layerItems = Array.from(document.querySelectorAll(layerClass));
  gridItems = [];
  rowbreaks = [];
  let numOfDyns = 0;
  let firstDyns = [];
  for (var i = 0; i < layerItems.length; i++) {
    let rowbreak = false;
    if (layerItems[i].getAttribute('rowbreak') == 'true') {
      rowbreak = true;
      rowbreaks.push(i);
    } else if (layerItems[i].getAttribute('dynamic') == 'true') {
      if (numOfDyns == 0) {
        firstDyns.push(i);
      }
      numOfDyns++;
      if (Number.isInteger(numOfDyns / getColumnsNum(layerItems[i]))) {
        rowbreak = true;
        rowbreaks.push(i);
      } else if (i == layerItems.length - 1) {
        rowbreak = true;
        rowbreaks.push(i + (getColumnsNum(layerItems[i]) - (i - rowbreaks[rowbreaks.length - 1])));
      }
    } else {
      numOfDyns = 0;
    }
    const temp = [layerItems[i], rowbreak];
    gridItems.push(temp);
  }

  console.log(gridItems);

  const key = event.key;

  if (key === 'ArrowUp' && selectedIndex >= calculateNumColumns(0)) {
    //if (selectedIndex >= firstDyns[0] &&
    //  selectedIndex <= (firstDyns[0] + getColumnsNum(layerItems[firstDyns[0]]) - 1)) {
    //  selectedIndex -= Math.ceil(calculateNumColumns(Math.max(0, selectedIndex -
    //    getColumnsNum(layerItems[selectedIndex]))) / 2) + (selectedIndex - firstDyns[0]);
    //} else {
    selectedIndex = Math.max(0, selectedIndex - calculateNumColumns(selectedIndex));
    //}
    highlight();
  } else if (key === 'ArrowDown' && selectedIndex < gridItems.length - calculateNumColumns(selectedIndex)) {
    selectedIndex += calculateNumColumns(selectedIndex);
    highlight();
  } else if (key === 'ArrowLeft' && selectedIndex > 0) {
    selectedIndex--;
    highlight();
  } else if (key === 'ArrowRight' && selectedIndex < gridItems.length - 1) {
    selectedIndex++;
    highlight();
  } else if (key === 'Enter') {
    eval(gridItems[selectedIndex][0].getAttribute('fwd-intrct'));
  } else if (key === 'Backspace') {
    eval(gridItems[selectedIndex][0].getAttribute('bck-intrct'));
  } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
    highlight();
  } else if (key === 'z') {
    if (gridItems[selectedIndex][0].classList.contains('folder') ||
    gridItems[selectedIndex][0].classList.contains('file')) {
      openMenu(gridItems[selectedIndex][0], false);
    }
  }

  // Scroll to the selected item if it's not currently visible
  const scrollE = gridItems[selectedIndex][0];
  const gridContainer = scrollE.parentElement;
  const scrollOffset = 5;
  gridContainer.scrollTo({
    top: scrollE.offsetTop - scrollOffset,
    behavior: 'smooth'
  });

}

function getColumnsNum(element) {
  const containerWidth = element.parentElement.offsetWidth;
  return Math.floor(containerWidth / outerWidthMargin(element));
}

// render/clear the highlighted class and apply it to the one element
function highlight() {
  gridItems.forEach(item => item[0].classList.remove('nav-highlighted'));
  gridItems[selectedIndex][0].classList.add('nav-highlighted');
}

// reset the position of the highlighted element to none/the first one
function resetSelected() {
  selectedIndex = 0;
}

// change the class name searched for to find the interactable
// elements for the defined layer
function changeInteractLayer(className) {
  resetSelected();
  gridItems[selectedIndex][0].classList.remove('nav-highlighted');
  layerClass = className;
}

function outerWidthMargin(element) {
  var width = element.offsetWidth;
  var style = getComputedStyle(element);

  width += parseInt(style.marginLeft) + parseInt(style.marginRight);
  return width;
}

function calculateNumColumns(i) {
  console.log(rowbreaks + ' | ' + i);
  console.log(findClosestNumbers(rowbreaks, i));
  const surroundingNums = findClosestNumbers(rowbreaks, i);
  if (i <= rowbreaks[0]) {
    console.log((surroundingNums.higher - surroundingNums.lower) + 1);
    return (surroundingNums.higher - surroundingNums.lower) + 1;
  } else {
    console.log((surroundingNums.higher - surroundingNums.lower));
    return (surroundingNums.higher - surroundingNums.lower);
  }
  // const containerWidth = gridItems[selectedIndex][0].parentElement.offsetWidth;
  // return Math.floor(containerWidth / outerWidthMargin(gridItems[selectedIndex][0]));
}

function findClosestNumbers(arr, num) {
  let lowerNum = 0;
  let higherNum = null;

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === num) {
      lowerNum = arr[i - 1] !== undefined ? arr[i - 1] : 0;
      higherNum = arr[i];
      break;
    } else if (arr[i] > num) {
      lowerNum = arr[i - 1] !== undefined ? arr[i - 1] : 0;
      higherNum = arr[i];
      break;
    }
  }

  return {
    lower: lowerNum,
    higher: higherNum
  };
}
