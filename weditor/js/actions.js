
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
function actionCreateNewDirectory(event) {
    function createdDir(response) {
        loadDirPath(window.activeFileDir);
    }
    var dname = prompt("New directory name (in: " + window.activeFileDir + ")");
    if (dname) {
        dpath = window.activeFileDir + dname;
        showNotification("Creating directory: " + dpath);
        fetch("/newdir?path=" + dpath).then(response => response.json()).then(json => createdDir(json));
    }
}

function actionCreateNewFile(event) {
    function createdFile(response) {
        loadDirPath(window.activeFileDir);
    }
    var fname = prompt("New file name (in: " + window.activeFileDir + ")");
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
function actionSaveFile(callback) {
    showNotification("Saving file: " + window.activeFilePath);
    fetch('/savefileb', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'File-Path': window.activeFilePath
        },
        body: globalEditor.getValue(),
    })
    .then((response) => response.json())
    .then((data) => {
        console.log('Success saving:', data);
        showNotification("Saved", 1);
        if (callback) {
            callback();
        }
    })
    .catch((error) => {
        console.error('Error saving:', error);
        showNotification("Error saving file: " + error, 4);
    });
}
function actionSaveRunFile() {
    let fname = window.activeFilePath.split("/").filter(v=>v.length>0).join(".");
    if (!fname.endsWith(".py")) {
        showNotification("Can only run python files", 1);
        return;
    }
    fname = fname.substring(0, fname.length-3);
    actionSaveFile(function() {
        fetch("/run?name=" + fname).then(response => response.json()).then(json => {
            showNotification("Running file " + fname, 1);
        });
    });
}
function actionStop() {
    showNotification("Stopping active 'process'", 1);
    fetch("/run?stop=1").then(response => response.json()).then(json => {
        showNotification("Stopped", 1);
    });
}
