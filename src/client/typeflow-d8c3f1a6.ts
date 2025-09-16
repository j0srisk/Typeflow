interface FileInfo {
  name: string;
  url: string;
}

interface FileData {
  js: FileInfo[];
  ts: FileInfo[];
  css: FileInfo[];
}

// This will be replaced by the plugin with actual file data
const fileData: FileData = {
  js: [],
  ts: [],
  css: [],
};

function populateFileList(elementId: string, files: FileInfo[]): void {
  const list = document.getElementById(elementId);
  if (!list) return;

  list.innerHTML = "";

  // Find the corresponding note element
  const noteElement = list.parentElement?.querySelector(
    ".note",
  ) as HTMLDivElement;

  if (files.length === 0) {
    // Show the note element if no files
    if (noteElement) {
      noteElement.style.display = "flex";
    }
    return;
  } else {
    // Hide the note element if there are files
    if (noteElement) {
      noteElement.style.display = "none";
    }
  }

  files.forEach(function (file: FileInfo) {
    const li = document.createElement("li");
    li.className = "section-item";

    const name = document.createElement("a");
    name.className = "section-item-name";
    name.href = file.url;
    name.target = "_blank";

    // Split the file path to style directory and filename differently
    const lastSlashIndex = file.name.lastIndexOf("/");
    if (lastSlashIndex !== -1) {
      const directory = file.name.substring(0, lastSlashIndex + 1);
      const filename = file.name.substring(lastSlashIndex + 1);

      const directorySpan = document.createElement("span");
      directorySpan.style.color = "rgba(255, 255, 255, 0.67)";
      directorySpan.textContent = directory;

      const filenameSpan = document.createElement("span");
      filenameSpan.textContent = filename;

      name.appendChild(directorySpan);
      name.appendChild(filenameSpan);
    } else {
      // No directory, just the filename
      name.textContent = file.name;
    }

    const content = document.createElement("div");
    content.className = "section-item-content";

    const text = document.createElement("span");
    text.className = "section-item-content-text";

    // Format the content based on file type
    let formattedContent;
    let displayHTML;

    if (elementId === "js-files") {
      formattedContent = '<script defer src="' + file.url + '"></' + "script>";
      displayHTML =
        '<span class="syntax-tag">&lt;script</span> ' +
        '<span class="syntax-attr">defer</span> ' +
        '<span class="syntax-attr">src</span>=' +
        '<span class="syntax-value">"' +
        file.url +
        '"</span>' +
        '<span class="syntax-tag">&gt;&lt;/script&gt;</span>';
    } else if (elementId === "css-files") {
      formattedContent = '<link rel="stylesheet" href="' + file.url + '">';
      displayHTML =
        '<span class="syntax-tag">&lt;link</span> ' +
        '<span class="syntax-attr">rel</span>=' +
        '<span class="syntax-value">"stylesheet"</span> ' +
        '<span class="syntax-attr">href</span>=' +
        '<span class="syntax-value">"' +
        file.url +
        '"</span>' +
        '<span class="syntax-tag">&gt;</span>';
    } else {
      formattedContent = file.url;
      displayHTML = file.url;
    }

    text.innerHTML = displayHTML;

    const button = document.createElement("button");
    button.className = "section-item-content-button";

    const copyIcon =
      '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 3C6 2.44772 6.44772 2 7 2H13C13.5523 2 14 2.44772 14 3V9C14 9.55228 13.5523 10 13 10H7C6.44772 10 6 9.55228 6 9V3ZM7 3H13V9H7V3Z" fill="currentColor"></path><path d="M3 5V12C3 12.5523 3.44772 13 4 13H11V12H4V5H3Z" fill="currentColor"></path></svg>';

    button.innerHTML = copyIcon;
    button.onclick = function (): void {
      navigator.clipboard.writeText(formattedContent).then(function (): void {
        button.textContent = "Copied!";
        setTimeout(function (): void {
          button.innerHTML = copyIcon;
        }, 2000);
      });
    };

    content.appendChild(text);
    content.appendChild(button);
    li.appendChild(name);
    li.appendChild(content);
    list.appendChild(li);
  });
}

// Populate the lists when the page loads
document.addEventListener("DOMContentLoaded", function (): void {
  populateFileList("js-files", fileData.js || []);
  populateFileList("css-files", fileData.css || []);
});
