function checkBrowser() {
    var browserOk = true;
    var problems = [];
    if (typeof (Worker) === "undefined") {
        browserOk = false;
        problems.push("No Web Worker");
    }
    if (!browserOk) {
        handleProblem(problems);
        return false;
    }
    else {
        return true;
    }
}
function handleProblem(text) {
    $.mobile.navigate("#problemInfo");
    var parent = $("#browserSupport");
    for (var i in text) {
        parent.append($("<p></p>").text(text[i]));
    }
}
function handleError(err) {
    $.mobile.navigate("#errorWindow");
    var parent = $("#errorMain");
    parent.append($("<p></p>").text('Error name: ' + err.name));
    parent.append($("<p></p>").text('Error description: ' + err.message));
}
function main() {
    if (!checkBrowser()) {
        return -1;
    }
    var modelCmds;
    var postProcessor;
    var renderer;
    var glContext;
    var gui;
    glMatrix.setMatrixArrayType(Float32Array);
    modelCmds = new ModelCmds();
    try {
        glContext = new Web3DContext(document.getElementById("webgl"));
    }
    catch (e) {
        handleError(e);
        return -1;
    }
    console.log("WebGL init OK");
    postProcessor = new PostProcessor(glContext);
    modelCmds.setPostProcessor(postProcessor);
    console.log("Postprocessor init OK");
    renderer = new Renderer(modelCmds, glContext);
    console.log("Renderer init OK");
    gui = new Gui(modelCmds, renderer, glContext);
    console.log("Gui init OK");
}
