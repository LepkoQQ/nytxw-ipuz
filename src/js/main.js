const dropZoneEl = document.querySelector(".drop-zone");
const puzzleContainerEl = document.querySelector(".puzzle-container");

dropZoneEl.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZoneEl.classList.add("highlight");
});

dropZoneEl.addEventListener("dragleave", () => {
  dropZoneEl.classList.remove("highlight");
});

dropZoneEl.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZoneEl.classList.remove("highlight");

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const reader = new FileReader();
    reader.onload = (event) => {
      loadNYTXW(JSON.parse(event.target.result));
    };
    reader.readAsText(files[0]);
    // dropZoneEl.classList.add("hidden");
  }
});

function getLineWrappedCellIndex(cellIndex, direction) {
  const gridEl = document.querySelector(".puzzle-grid");
  const width = Number(gridEl.dataset.width);
  const height = Number(gridEl.dataset.height);
  let col = cellIndex % width;
  let row = Math.floor(cellIndex / width);

  if (direction === "right") {
    col = (col + 1) % width;
  } else if (direction === "left") {
    col = (col - 1 + width) % width;
  } else if (direction === "up") {
    row = (row - 1 + height) % height;
  } else if (direction === "down") {
    row = (row + 1) % height;
  }

  return row * width + col;
}

function getGridWrappedCellIndex(cellIndex, direction) {
  const gridEl = document.querySelector(".puzzle-grid");
  const width = Number(gridEl.dataset.width);
  const count = gridEl.querySelectorAll(".grid-cell").length;
  let index = cellIndex;

  if (direction === "right") {
    index = (index + 1) % count;
  } else if (direction === "left") {
    index = (index - 1 + count) % count;
  } else if (direction === "up") {
    index = (index - width + count) % count;
  } else if (direction === "down") {
    index = (index + width) % count;
  }

  return index;
}

function getWrappedCellIndex(cellIndex, direction, wrapType) {
  if (wrapType === "grid") {
    return getGridWrappedCellIndex(cellIndex, direction);
  } else if (wrapType === "line") {
    return getLineWrappedCellIndex(cellIndex, direction);
  }
}

function getAdjacentInput(input, direction, wrapType = "grid") {
  const cell = input.parentElement;
  const cellIndex = Number(cell.dataset.cell);
  let adjacentCell = cell;
  let adjacentIndex = cellIndex;

  do {
    adjacentIndex = getWrappedCellIndex(adjacentIndex, direction, wrapType);
    adjacentCell = cell.parentElement.querySelector(
      `.grid-cell[data-cell="${adjacentIndex}"]`,
    );
    if (!adjacentCell) {
      return input;
    }
  } while (!adjacentCell.querySelector(".answer"));

  return adjacentCell.querySelector(".answer");
}

puzzleContainerEl.addEventListener("keydown", (event) => {
  if (
    event.target.tagName !== "INPUT" ||
    !event.target.classList.contains("answer")
  ) {
    return;
  }

  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }

  // single character key sets input value and focuses the next input
  if (event.key.length === 1) {
    event.preventDefault();
    event.target.value = event.key.toUpperCase();
    const nextInput = getAdjacentInput(event.target, "right");
    nextInput?.focus();
    return;
  }

  // backspace deletes and focuses the previous input if current is empty
  if (event.key === "Backspace") {
    event.preventDefault();
    if (event.target.value === "") {
      const prevInput = getAdjacentInput(event.target, "left");
      prevInput.value = "";
      prevInput?.focus();
    } else {
      event.target.value = "";
    }
    return;
  }

  // delete clears the input
  if (event.key === "Delete") {
    event.preventDefault();
    event.target.value = "";
    return;
  }

  // left/right/up/down arrows move to previous/next inputs in the same line (wrapping around)
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    const prevInput = getAdjacentInput(event.target, "left", "line");
    prevInput?.focus();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    const nextInput = getAdjacentInput(event.target, "right", "line");
    nextInput?.focus();
    return;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    const prevInput = getAdjacentInput(event.target, "up", "line");
    prevInput?.focus();
    return;
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    const nextInput = getAdjacentInput(event.target, "down", "line");
    nextInput?.focus();
    return;
  }
});

function formatDate(isoDate) {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(isoDate).toLocaleDateString("en-US", options);
}

function joinList(list) {
  const options = { style: "long", type: "conjunction" };
  return new Intl.ListFormat("en-US", options).format(list);
}

function loadMetadata(json) {
  const metaEl = document.querySelector(".puzzle-meta");
  const titleEl = metaEl.querySelector(".title");
  const dateEl = metaEl.querySelector(".date");
  const constructorsEl = metaEl.querySelector(".constructors");
  const editorEl = metaEl.querySelector(".editor");

  titleEl.textContent = json.title || "Untitled";
  dateEl.textContent = formatDate(json.publicationDate);
  constructorsEl.textContent = `Constructed by: ${joinList(json.constructors)}`;
  editorEl.textContent = `Edited by: ${json.editor}`;
}

function buildClueLists(clueLists, clues) {
  const clueListsEl = document.querySelector(".puzzle-clue-lists");
  clueListsEl.innerHTML = "";

  clueLists.forEach((clueList) => {
    const listWrapperEl = document.createElement("div");
    listWrapperEl.classList.add("clue-list");

    const listNameEl = document.createElement("h3");
    listNameEl.classList.add("name");
    listNameEl.textContent = clueList.name;
    listWrapperEl.appendChild(listNameEl);

    const ulEl = document.createElement("ul");
    clueList.clues.forEach((clueIdx) => {
      const clue = clues[clueIdx];
      const liEl = document.createElement("li");
      liEl.dataset.clue = clueIdx;
      if (clue.cells?.length) {
        liEl.dataset.cells = JSON.stringify(clue.cells);
      }
      if (clue.relatives?.length) {
        liEl.dataset.relatives = JSON.stringify(clue.relatives);
      }
      const labelEl = document.createElement("span");
      labelEl.classList.add("label");
      labelEl.textContent = `${clue.label}`;
      liEl.appendChild(labelEl);
      const textEl = document.createElement("span");
      textEl.classList.add("text");
      textEl.textContent = clue.text[0].plain;
      liEl.appendChild(textEl);
      ulEl.appendChild(liEl);
    });
    listWrapperEl.appendChild(ulEl);

    clueListsEl.appendChild(listWrapperEl);
  });
}

function buildGrid(dimensions, cells) {
  const gridEl = document.querySelector(".puzzle-grid");
  const { width, height } = dimensions;

  gridEl.innerHTML = "";
  gridEl.dataset.width = width;
  gridEl.dataset.height = height;
  gridEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  gridEl.style.fontSize = `${15 / width}rem`;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row * width + col];
      const cellEl = document.createElement("div");
      cellEl.classList.add("grid-cell");
      cellEl.dataset.cell = row * width + col;
      if (cell.clues?.length) {
        cellEl.dataset.clues = JSON.stringify(cell.clues);
      }
      if (cell.label) {
        const labelEl = document.createElement("span");
        labelEl.classList.add("label");
        labelEl.textContent = cell.label;
        cellEl.appendChild(labelEl);
      }
      if (!cell.answer) {
        cellEl.classList.add("black");
      }
      if (cell.answer) {
        const answerEl = document.createElement("input");
        answerEl.classList.add("answer");
        // answerElement.value = cell.answer;
        cellEl.appendChild(answerEl);
      }
      gridEl.appendChild(cellEl);
    }
  }
}

function loadNYTXW(json) {
  loadMetadata(json);
  buildClueLists(json.body[0].clueLists, json.body[0].clues);
  buildGrid(json.body[0].dimensions, json.body[0].cells);
  puzzleContainerEl.classList.remove("hidden");
  puzzleContainerEl.querySelector(".grid-cell .answer").focus();
}
