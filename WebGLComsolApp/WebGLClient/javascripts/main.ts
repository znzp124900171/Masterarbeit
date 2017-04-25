/// <reference path="libs/gl-matrix.d.ts"/>
/// <reference path="libs/jquery.d.ts"/>

interface JQueryStatic {
    mobile: JQueryMobileStatic;
}

interface JQueryMobileStatic {
    (): JQuery;
    navigate(name: string): string;
    navigate(name: string, value: string, append?: boolean): JQuery;
}

// All required Function should be checked here
function checkBrowser(): boolean {
    let browserOk = true;
    let problems: string[] = [];

    if (typeof (Worker) === "undefined") {
        browserOk = false;
        problems.push("No Web Worker");
    }

    if (!browserOk) {
        handleProblem(problems);
        return false;
    } else {
        return true;
    }
}

//Problem Handler
function handleProblem(text: string[]) {
    $.mobile.navigate("#problemInfo");
    let parent = $("#browserSupport");
    for (let i in text) {
        parent.append($("<p></p>").text(text[i]));
    }
}

//Error Handler
function handleError(err: Error) {

    $.mobile.navigate("#errorWindow");
    let parent = $("#errorMain");

    parent.append($("<p></p>").text('Error name: ' + err.name));
    parent.append($("<p></p>").text('Error description: ' + err.message));
    //TODO: Sended Error to Server for Logging

}




function main() {
    //check Browser and print Information
    if (!checkBrowser()) {
        return -1;
    }

    let modelCmds: ModelCmds;
    let postProcessor: PostProcessor;
    let renderer: Renderer;
    let glContext: Web3DContext;
    let gui;

    // initialize the glMatrix Library
    glMatrix.setMatrixArrayType(Float32Array);

    //create all Commands
    modelCmds = new ModelCmds();

    //try to initialize the WebGL
    try {
        glContext = new Web3DContext(document.getElementById("webgl")); //init WebGL
    } catch (e) {
        handleError(e);
        return -1
    }
    console.log("WebGL init OK");

    //Initialize the postprocess (Calculates the normals, Arrows, ...)
    postProcessor = new PostProcessor(glContext);
    modelCmds.setPostProcessor(postProcessor);
    console.log("Postprocessor init OK");

    //Initalize the Render Engine
    renderer = new Renderer(modelCmds, glContext);
    console.log("Renderer init OK");

    //Initalize the Gui
    gui = new Gui(modelCmds, renderer, glContext);
    console.log("Gui init OK");
}