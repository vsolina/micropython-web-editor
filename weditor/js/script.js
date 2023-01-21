function initEditor() {
    document.getElementById("action-save").style.display = 'none';
    document.getElementById("action-save-run").style.display = 'none';
    document.getElementById("action-stop").style.display = 'none';
    var editor = ace.edit("editor");
    window.globalEditor = editor;
    editor.setTheme("ace/theme/dracula");
    editor.session.setMode("ace/mode/plain_text");
    editor.setValue("\n<- Select a file to edit\n");
    window.editor = editor;
    loadDirPath("/");
    updateTitle();
}

function showNotification(text, seconds) {
    var notification = document.getElementById("notification");
    notification.innerHTML = text;
    notification.style.display = "block";
    if (seconds) {
        setTimeout(hideNotification, seconds * 1000);
    }
}
function hideNotification() {
    var notification = document.getElementById("notification");
    notification.style.display = "none";
}

function loadedFile(fname, lines) {
    editor.setValue(lines);
    var components = fname.split(".");
    var mode = "plain_text";
    if (components.length > 1) {
        let display = "none";
        var ext = components[components.length - 1];
        if (ext == "py") { mode = "python"; display = "inline-block"; }
        if (ext == "html") mode = "html";
        if (ext == "css") mode = "css";
        if (ext == "js") mode = "javascript";

        document.getElementById("action-save-run").style.display = display;
        document.getElementById("action-stop").style.display = display;
    }
    editor.session.setMode("ace/mode/" + mode);
    window.activeFilePath = fname;
    window.activeFileName = fname;
    document.getElementById("active-path").innerHTML = fname;
    document.getElementById("action-save").style.display = 'inline-block';
    editor.selection.clearSelection();
    showNotification("Loaded: " + fname, 1);
}

function loadDirPath(path) {
    window.activeFileDir = path;
    showNotification("Loading directory: " + path);
    fetch("/dir?path=" + path).then(response => response.json()).then(json => updateFileList(json));
}
function updateFileList(json) {
    var files = json.files;
    var dirs = json.dirs;
    var left = document.getElementById("left");
    left.innerHTML = "";
    
    function addSpan(title, className, action) {
        var span = document.createElement("span");
        span.innerHTML = title;
        span.className = className;
        if (action) { span.onclick = action; }
        left.appendChild(span);
    }

    addSpan("&#8635; refresh", "left_element left_action", actionRefreshDirectory);
    addSpan("DIRS", "left_title");

    if (window.activeFileDir != "/") {
        addSpan("..", "left_element left_dir", actionActivateParentDirectory);
    }
    for (var dirName of dirs) {
        addSpan(dirName, "left_element left_dir", actionActivateDirectory);
    }
    addSpan("new directory...", "left_element left_action", actionCreateNewDirectory);
    
    addSpan("FILES", "left_title");
    addSpan("new file...", "left_element left_action", actionCreateNewFile);

    for (var fileName of files) {
        addSpan(fileName, "left_element left_file", actionActivateFile);
    }
    showNotification("Loaded directory: " + window.activeFileDir, 1);
}

function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.code == 'KeyS') {
        actionSaveFile();
        event.preventDefault();
    }
}

function updateTitle() {
    fetch("/info").then(response => response.json()).then(json => document.title = json.name);
}
