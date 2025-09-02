const dropZone = document.querySelector(".drop-zone");
const dropOutput = document.querySelector(".drop-output");

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZone.classList.add("highlight");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("highlight");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZone.classList.remove("highlight");

  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const reader = new FileReader();
    reader.onload = (event) => {
      dropOutput.value = event.target.result;
    };
    reader.readAsText(files[0]);
    dropZone.classList.add("hidden");
  }
});
