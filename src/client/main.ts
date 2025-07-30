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
  css: []
};

function populateFileList(elementId: string, files: FileInfo[]): void {
  const list = document.getElementById(elementId);
  if (!list) return;
  
  list.innerHTML = "";

  if (files.length === 0) {
    const li = document.createElement("li");
    li.className = "section-item";
    li.innerHTML = '<p class="section-item-name">No files found</p>';
    list.appendChild(li);
    return;
  }

  files.forEach(function (file: FileInfo) {
    const li = document.createElement("li");
    li.className = "section-item";

    const name = document.createElement("p");
    name.className = "section-item-name";
    name.textContent = file.name;

    const content = document.createElement("div");
    content.className = "section-item-content";

    const text = document.createElement("span");
    text.className = "section-item-content-text";

    // Format the content based on file type
    let formattedContent;
    let displayHTML;
    
    if (elementId === "js-files") {
      formattedContent = '<script defer src="' + file.url + '"></' + 'script>';
      displayHTML = '<span class="syntax-tag">&lt;script</span> ' +
                    '<span class="syntax-attr">defer</span> ' +
                    '<span class="syntax-attr">src</span>=' +
                    '<span class="syntax-value">"' + file.url + '"</span>' +
                    '<span class="syntax-tag">&gt;&lt;/script&gt;</span>';
      
    } else if (elementId === "css-files") {
      formattedContent = '<link rel="stylesheet" href="' + file.url + '">';
      displayHTML = '<span class="syntax-tag">&lt;link</span> ' +
                    '<span class="syntax-attr">rel</span>=' +
                    '<span class="syntax-value">"stylesheet"</span> ' +
                    '<span class="syntax-attr">href</span>=' +
                    '<span class="syntax-value">"' + file.url + '"</span>' +
                    '<span class="syntax-tag">&gt;</span>';
      
    } else {
      formattedContent = file.url;
      displayHTML = file.url;
    }

    text.innerHTML = displayHTML;

    const button = document.createElement("button");
    button.className = "section-item-content-button";
    button.textContent = "Copy";
    button.onclick = function (): void {
      navigator.clipboard.writeText(formattedContent).then(function (): void {
        button.textContent = "Copied!";
        setTimeout(function (): void {
          button.textContent = "Copy";
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