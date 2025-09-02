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
}
