function initEditor() {
    var editor = ace.edit("editor");
    window.globalEditor = editor;
    editor.setTheme("ace/theme/dracula");
    editor.session.setMode("ace/mode/plain_text");
    editor.setValue("\n<- Select a file to edit\n");
    window.editor = editor;
    loadDirPath("/");
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

function actionRefreshDirectory() {
    loadDirPath(window.activeFileDir);
}
function actionActivateDirectory(event) {
    var dpath = event.target.innerHTML;
    window.activeFileDir += dpath + "/";
    loadDirPath(window.activeFileDir);
}
function actionActivateParentDirectory(event) {
    var components = window.activeFileDir.split("/");
    if (components.length <= 2) return;
    components.splice(components.length - 2, 1);
    window.activeFileDir = components.join("/");
    loadDirPath(window.activeFileDir);
}

function actionCreateNewFile(event) {
    function createdFile(response) {
        loadDirPath(window.activeFileDir);
    }
    var fname = prompt("New file name");
    if (fname) {
        fpath = window.activeFileDir + fname;
        showNotification("Creating file: " + fpath);
        fetch("/newfile?path=" + fpath).then(response => response.json()).then(json => createdFile(json));
    }
}
function actionActivateFile(event) {
    var fpath = window.activeFileDir + event.target.innerHTML;
    console.log("Loading file ", "==" + fpath + "==");
    showNotification("Loading file: " + fpath);
    fetch("/file?path=" + fpath).then(response => response.json()).then(json => loadedFile(fpath, json['lines']));
}
function loadedFile(fname, lines) {
    editor.setValue(lines);
    var components = fname.split(".");
    var mode = "plain_text";
    if (components.length > 1) {
        var ext = components[components.length - 1];
        if (ext == "py") mode = "python";
        if (ext == "html") mode = "html";
        if (ext == "css") mode = "css";
        if (ext == "js") mode = "javascript";
    }
    editor.session.setMode("ace/mode/" + mode);
    window.activeFilePath = fname;
    window.activeFileName = fname;
    editor.selection.clearSelection();
    showNotification("Loaded: " + fname, 1);
}
function actionSaveFile() {
    showNotification("Saving file: " + window.activeFilePath);
    fetch('/savefile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({"lines": globalEditor.getValue(), "path": window.activeFilePath}),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log('Success saving:', data);
        showNotification("Saved", 1);
    })
    .catch((error) => {
        console.error('Error saving:', error);
        showNotification("Error saving file: " + error, 4);
    });
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
