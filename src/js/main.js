import Joi from "joi";

const dropZoneEl = document.querySelector(".drop-zone");
const loadErrorEl = document.querySelector(".load-error");
const puzzleContainerEl = document.querySelector(".puzzle-container");
const metaEl = document.querySelector(".puzzle-meta");
const gridEl = document.querySelector(".puzzle-grid");
const clueListsEl = document.querySelector(".puzzle-clue-lists");

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
      loadNYTXW(event.target.result);
    };
    reader.readAsText(files[0]);
    // dropZoneEl.classList.add("hidden");
  }
});

function getLineWrappedCellIndex(cellIndex, direction) {
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
  const width = Number(gridEl.dataset.width);
  const count = gridEl.querySelectorAll(".grid-cell").length;
  const col = cellIndex % width;
  let index = cellIndex;

  if (direction === "right") {
    index = (index + 1) % count;
  } else if (direction === "left") {
    index = (index - 1 + count) % count;
  } else if (direction === "up") {
    index = (index - width + count) % count;
    if (index > cellIndex) {
      index = (width - 1) * width + ((col - 1 + width) % width);
    }
  } else if (direction === "down") {
    index = (index + width) % count;
    if (index < cellIndex) {
      index = (col + 1) % width;
    }
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

  // space swaps directions (needs to be before event.key.length because event.key is " ")
  if (event.code === "Space") {
    event.preventDefault();
    gridEl.dataset.direction =
      gridEl.dataset.direction === "across" ? "down" : "across";
    highlightCells(event.target);
    return;
  }

  // single character key sets input value and focuses the next input
  if (event.key.length === 1) {
    event.preventDefault();
    event.target.value = event.key.toUpperCase();
    const dir = gridEl.dataset.direction === "across" ? "right" : "down";
    const nextInput = getAdjacentInput(event.target, dir);
    nextInput?.focus();
    return;
  }

  // backspace deletes and focuses the previous input if current is empty
  if (event.key === "Backspace") {
    event.preventDefault();
    if (event.target.value === "") {
      const dir = gridEl.dataset.direction === "across" ? "left" : "up";
      const prevInput = getAdjacentInput(event.target, dir);
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

const _STATE = {
  lastActiveAnswerInputMouseDown: null,
};

puzzleContainerEl.addEventListener("mousedown", (event) => {
  if (
    event.target.tagName === "INPUT" &&
    event.target.classList.contains("answer") &&
    event.target === document.activeElement
  ) {
    _STATE.lastActiveAnswerInputMouseDown = event.target;
  }
});

puzzleContainerEl.addEventListener("mouseup", (event) => {
  if (
    event.target.tagName === "INPUT" &&
    event.target.classList.contains("answer") &&
    event.target === document.activeElement &&
    event.target === _STATE.lastActiveAnswerInputMouseDown
  ) {
    gridEl.dataset.direction =
      gridEl.dataset.direction === "across" ? "down" : "across";
    highlightCells(event.target);
  }

  _STATE.lastActiveAnswerInputMouseDown = null;
});

function highlightCells(input) {
  puzzleContainerEl.querySelectorAll(".grid-cell.highlight").forEach((cell) => {
    cell.classList.remove("highlight");
  });
  clueListsEl.querySelectorAll("li.highlight").forEach((clue) => {
    clue.classList.remove("highlight", "other");
  });

  // TODO: related cells

  const cellEl = input.parentElement;
  const clues = JSON.parse(cellEl.dataset.clues || "[]");
  if (clues.length) {
    let listIndex = gridEl.dataset.direction === "across" ? 0 : 1;
    let clue = clues.find((c) =>
      clueListsEl.querySelector(
        `[data-list="${listIndex}"] li[data-clue="${c}"]`,
      ),
    );
    if (clue == null) {
      gridEl.dataset.direction = listIndex === 0 ? "down" : "across";
      listIndex = listIndex === 0 ? 1 : 0;
      clue = clues.find((c) =>
        clueListsEl.querySelector(
          `[data-list="${listIndex}"] li[data-clue="${c}"]`,
        ),
      );
    }
    if (clue == null) {
      return;
    }
    const clueEl = clueListsEl.querySelector(`li[data-clue="${clue}"]`);
    if (clueEl) {
      clueEl.classList.add("highlight");
      const cells = JSON.parse(clueEl.dataset.cells || "[]");
      if (cells.length) {
        cells.forEach((cellIdx) => {
          const cell = puzzleContainerEl.querySelector(
            `.grid-cell[data-cell="${cellIdx}"]`,
          );
          if (cell) {
            cell.classList.add("highlight");
          }
        });
      }
    }
    const otherClues = clues.filter((c) => c !== clue);
    otherClues.forEach((otherClue) => {
      const otherClueEl = clueListsEl.querySelector(
        `li[data-clue="${otherClue}"]`,
      );
      if (otherClueEl) {
        otherClueEl.classList.add("highlight", "other");
      }
    });
  }
}

puzzleContainerEl.addEventListener("focusin", (event) => {
  if (
    event.target.tagName === "INPUT" &&
    event.target.classList.contains("answer")
  ) {
    highlightCells(event.target);
  }
});

clueListsEl.addEventListener("click", (event) => {
  const clueEl = event.target.closest("li[data-clue]");
  if (clueEl) {
    const listEl = clueEl.closest(".clue-list");
    const listIdx = Number(listEl.dataset.list);
    gridEl.dataset.direction = listIdx === 0 ? "across" : "down";

    const cells = JSON.parse(clueEl.dataset.cells || "[]");
    if (cells.length) {
      const cellIdx = cells[0];
      const cell = puzzleContainerEl.querySelector(
        `.grid-cell[data-cell="${cellIdx}"]`,
      );
      if (cell?.querySelector(".answer")) {
        cell.querySelector(".answer").focus();
      }
    }
  }
});

function formatDate(isoDate) {
  if (!isoDate) {
    return "Unknown Date";
  }
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  return Intl.DateTimeFormat("en-US", options).format(new Date(isoDate));
}

function joinList(list) {
  const options = {
    style: "long",
    type: "conjunction",
  };
  return new Intl.ListFormat("en-US", options).format(list);
}

function loadMetadata(json) {
  const titleEl = metaEl.querySelector(".title");
  const dateEl = metaEl.querySelector(".date");
  const constructorsEl = metaEl.querySelector(".constructors");
  const editorEl = metaEl.querySelector(".editor");

  const { width, height } = json.body[0]?.dimensions || {};
  const fallbackTitle =
    width < 12 || height < 12 ? "The Mini" : "The Crossword";

  titleEl.textContent = json.title || fallbackTitle;
  dateEl.textContent = formatDate(json.publicationDate);
  constructorsEl.textContent = `Constructed by: ${joinList(json.constructors) || "N/A"}`;
  editorEl.textContent = `Edited by: ${json.editor || "N/A"}`;
}

function buildClueLists(clueLists, clues) {
  clueListsEl.innerHTML = "";

  clueLists.forEach((clueList, i) => {
    const listWrapperEl = document.createElement("div");
    listWrapperEl.classList.add("clue-list");
    listWrapperEl.dataset.list = i;

    const listNameEl = document.createElement("h3");
    listNameEl.classList.add("name");
    listNameEl.textContent = clueList.name;
    listWrapperEl.appendChild(listNameEl);

    const ulEl = document.createElement("ul");
    clueList.clues.forEach((clueIdx) => {
      const clue = clues[clueIdx];
      if (!clue) {
        throw new Error(`Invalid NYTXW JSON: Invalid clue index: ${clueIdx}`);
      }
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
      if (clue.text[0].formatted) {
        textEl.innerHTML = clue.text[0].formatted;
      } else {
        textEl.textContent = clue.text[0].plain;
      }
      liEl.appendChild(textEl);
      ulEl.appendChild(liEl);
    });
    listWrapperEl.appendChild(ulEl);

    clueListsEl.appendChild(listWrapperEl);
  });
}

function buildGrid(dimensions, cells) {
  const { width, height } = dimensions;

  gridEl.innerHTML = "";
  gridEl.dataset.direction = "across";
  gridEl.dataset.width = width;
  gridEl.dataset.height = height;
  gridEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
  gridEl.style.fontSize = `${15 / width}rem`;

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const cell = cells[row * width + col];
      if (!cell) {
        throw new Error(
          `Invalid NYTXW JSON: Invalid cell index: ${row * width + col}`,
        );
      }
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
      if (cell.type === 2) {
        cellEl.classList.add("circled");
      }
      gridEl.appendChild(cellEl);
    }
  }
}

function validateNYTXW(jsonString) {
  let json;
  try {
    json = JSON.parse(jsonString);
  } catch (error) {
    throw new Error("Invalid NYTXW JSON: " + error.message);
  }

  const schema = Joi.object({
    assets: Joi.array()
      .items(
        Joi.object({
          uri: Joi.string().uri().required(),
        }),
      )
      .optional(),
    body: Joi.array()
      .length(1)
      .items(
        Joi.object({
          dimensions: Joi.object({
            width: Joi.number().min(1).required(),
            height: Joi.number().min(1).required(),
          }).required(),
          clueLists: Joi.array()
            .length(2)
            .items(
              Joi.object({
                name: Joi.string().required(),
                clues: Joi.array().items(Joi.number()).min(1).required(),
              }),
            )
            .required(),
          clues: Joi.array()
            .items(
              Joi.object({
                label: Joi.string().required(),
                text: Joi.array()
                  .items(
                    Joi.object({
                      plain: Joi.string().required(),
                      formatted: Joi.string().optional(),
                    }),
                  )
                  .length(1)
                  .required(),
                cells: Joi.array().items(Joi.number()).min(1).required(),
                relatives: Joi.array().items(Joi.number()).optional(),
                direction: Joi.string().optional(),
                list: Joi.number().optional(),
              }),
            )
            .required(),
          cells: Joi.array()
            .items(
              Joi.object({
                label: Joi.string().optional(),
                answer: Joi.string().optional(),
                clues: Joi.array().items(Joi.number()).min(1).optional(),
                type: Joi.number().valid(1, 2).optional(),
              })
                .and("answer", "clues")
                .with("label", ["answer", "clues"]),
            )
            .required(),
          overlays: Joi.object({
            beforeStart: Joi.number().valid(1).required(),
          }).optional(),
          board: Joi.any().optional(),
          SVG: Joi.any().optional(),
        }),
      )
      .required(),
    title: Joi.string().optional(),
    constructors: Joi.array().items(Joi.string()).min(1).optional(),
    editor: Joi.string().optional(),
    copyright: Joi.string().optional(),
    id: Joi.number().optional(),
    subcategory: Joi.number().optional(),
    lastUpdated: Joi.date().optional(),
    publicationDate: Joi.date().optional(),
    relatedContent: Joi.any().optional(),
    freePuzzle: Joi.boolean().optional(),
  });

  const { error } = schema.validate(json);
  if (error) {
    throw new Error("Invalid NYTXW JSON: " + error.message);
  }

  return json;
}

function loadNYTXW(jsonString) {
  try {
    const json = validateNYTXW(jsonString);
    loadMetadata(json);
    buildClueLists(json.body[0].clueLists, json.body[0].clues);
    buildGrid(json.body[0].dimensions, json.body[0].cells);
    puzzleContainerEl.classList.remove("hidden");
    puzzleContainerEl.querySelector(".grid-cell .answer").focus();
    loadErrorEl.classList.add("hidden");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    loadErrorEl.textContent = error.message;
    loadErrorEl.classList.remove("hidden");
    puzzleContainerEl.classList.add("hidden");
  }
}
