// This will be replaced by the plugin with actual file data
const fileData = {{FILE_DATA}};

function populateFileList(elementId, files) {
  const list = document.getElementById(elementId);
  list.innerHTML = "";

  if (files.length === 0) {
    const li = document.createElement("li");
    li.className = "section-item";
    li.innerHTML = '<p class="section-item-name">No files found</p>';
    list.appendChild(li);
    return;
  }

  files.forEach(function (file) {
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
    if (elementId === "js-files") {
      formattedContent = '<script defer src="' + file.url + '"></' + 'script>';
      
      // Create elements for display
      const openTag = document.createElement("span");
      openTag.style.color = "#80cbc4";
      openTag.textContent = "<script";
      
      const space1 = document.createTextNode(" ");
      
      const deferAttr = document.createElement("span");
      deferAttr.style.color = "#ffcb6b";
      deferAttr.textContent = "defer";
      
      const space2 = document.createTextNode(" ");
      
      const srcAttr = document.createElement("span");
      srcAttr.style.color = "#ffcb6b";
      srcAttr.textContent = "src";
      
      const equals1 = document.createTextNode("=");
      
      const quote1 = document.createElement("span");
      quote1.style.color = "#c3e88d";
      quote1.textContent = '"';
      
      const urlValue = document.createElement("span");
      urlValue.style.color = "#c3e88d";
      urlValue.textContent = file.url;
      
      const quote2 = document.createElement("span");
      quote2.style.color = "#c3e88d";
      quote2.textContent = '"';
      
      const closeStart = document.createElement("span");
      closeStart.style.color = "#80cbc4";
      closeStart.textContent = "></";
      
      const closeTag = document.createElement("span");
      closeTag.style.color = "#80cbc4";
      closeTag.textContent = "script>";
      
      text.appendChild(openTag);
      text.appendChild(space1);
      text.appendChild(deferAttr);
      text.appendChild(space2);
      text.appendChild(srcAttr);
      text.appendChild(equals1);
      text.appendChild(quote1);
      text.appendChild(urlValue);
      text.appendChild(quote2);
      text.appendChild(closeStart);
      text.appendChild(closeTag);
      
    } else if (elementId === "css-files") {
      formattedContent = '<link rel="stylesheet" href="' + file.url + '">';
      
      // Create elements for display
      const openTag = document.createElement("span");
      openTag.style.color = "#80cbc4";
      openTag.textContent = "<link";
      
      const space1 = document.createTextNode(" ");
      
      const relAttr = document.createElement("span");
      relAttr.style.color = "#ffcb6b";
      relAttr.textContent = "rel";
      
      const equals1 = document.createTextNode("=");
      
      const quote1 = document.createElement("span");
      quote1.style.color = "#c3e88d";
      quote1.textContent = '"stylesheet"';
      
      const space2 = document.createTextNode(" ");
      
      const hrefAttr = document.createElement("span");
      hrefAttr.style.color = "#ffcb6b";
      hrefAttr.textContent = "href";
      
      const equals2 = document.createTextNode("=");
      
      const quote2 = document.createElement("span");
      quote2.style.color = "#c3e88d";
      quote2.textContent = '"';
      
      const urlValue = document.createElement("span");
      urlValue.style.color = "#c3e88d";
      urlValue.textContent = file.url;
      
      const quote3 = document.createElement("span");
      quote3.style.color = "#c3e88d";
      quote3.textContent = '"';
      
      const closeTag = document.createElement("span");
      closeTag.style.color = "#80cbc4";
      closeTag.textContent = ">";
      
      text.appendChild(openTag);
      text.appendChild(space1);
      text.appendChild(relAttr);
      text.appendChild(equals1);
      text.appendChild(quote1);
      text.appendChild(space2);
      text.appendChild(hrefAttr);
      text.appendChild(equals2);
      text.appendChild(quote2);
      text.appendChild(urlValue);
      text.appendChild(quote3);
      text.appendChild(closeTag);
      
    } else {
      formattedContent = file.url;
      text.textContent = file.url;
    }

    const button = document.createElement("button");
    button.className = "section-item-content-button";
    button.textContent = "Copy";
    button.onclick = function () {
      navigator.clipboard.writeText(formattedContent).then(function () {
        button.textContent = "Copied!";
        setTimeout(function () {
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
document.addEventListener("DOMContentLoaded", function() {
  populateFileList("js-files", fileData.js || []);
  populateFileList("css-files", fileData.css || []);
});