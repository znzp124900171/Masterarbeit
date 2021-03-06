﻿/// <refernce path="lib/gl-matrix.d.ts"/>
/// <refernce path="lib/jquery.d.ts"/>

interface Tick {
    label: Array<string>;
    normalization: Array<number>;
}

//The render engine 
// calculates the M V P Matrices
// start draw Call
function Renderer(modelData: ModelCmds, glc: Web3DContext) {
    //General Data
    var self: Renderer = this;
    var drawCallRequest = true;

    //Fallbacks for the animation looop
    (<any>window).requestAnimFrame = (function () {
        return (<any>window).requestAnimationFrame ||
            (<any>window).webkitRequestAnimationFrame ||
            (<any>window).mozRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    var glContext = glc;
    var modelCmd = modelData;
    var gl = glContext.getContext();
    // Shader Programs
    var programs = glContext.getPrograms();

    //light on/off
    var light: boolean = false 

    //stereoscopic vision on/off
    var vr: boolean = false;

    // type of plot group, 3 for 3D plot, 2 for 2D plot, 1 for 1D plot
    var plotType: number;
    // width of the 3D View
    var glWidth: number;
    // height of the 3D View
    var glHeight: number;
    // CONSTANT to calculate Radians from Degree
    var degToRad = Math.PI / 180;
    // Viewing Angle
    var viewAngle = 45 * degToRad;
    // Pupillary distance
    var eyeSeperation: number = 0.1;
    // Render Items:
    // active Model, only one Model is selected at one time
    var activeModel: Model = null;
    // active Plotgroup, only one Plotgroup is selected at one time
    var activePlotgroup: Result = null;
    // active Plots, multiple can be selected
    var activePlots: Result[] = [];

    //Vectors
    //Bounding Box Data set by Model
    var scale:         Float32Array;    // to scale the model to (-1,1)x(-1,1)x(-1,1)
    var offset:        Float32Array;   // Offset to positionate the model in the middle
    //Light Position
    var lightPosition: Float32Array;    //Position of the Ligth source
    //Center of the Modell: mostly 0,0,0
    var center:         Float32Array;       
    //Vector to the up of the canvas
    var up:             Float32Array;
    //Position of the Viewer
    var eye:            Float32Array;
    var transVec:       Float32Array;
    var transVecOrth:   Float32Array;

    //3D Matrices and Quaternions
    var mvpBackground:  Float32Array;       // Model View Projection Matrix of Background
    var quatTmp:        Float32Array;       // Temporal used Quaternion
    var quatRot:        Float32Array;       // Quaternion for Rotation
    var rotScene:       Float32Array;       // Rotation of the Scene 4x4
    var rotNorm:        Float32Array;       // Rotation of the Normals 3x3 (Extract from rot Scene)
    var mScene:         Float32Array;       // Model Matrix
    var vScene:         Float32Array;       // View Matrix
    var mvScene:        Float32Array;       // Model View Matrix
    var pScene:         Float32Array;       // Projection Matrx
    var mvpScene:       Float32Array;       // Model View Projection Matrix
    var mFront:         Float32Array;       // Model Matrix of Foreground
    var vpFront:        Float32Array;       // View Projection Matrix of Foreground
    var mvpFront:       Float32Array;       // Model View Projection Matrix of Foreground
    var mvpColorLegend: Float32Array;       // Model View Projection Matrix of color legend
    
    //Background
    var background: Background;

    //ColorLegend
    var colorLegend: ColorLegend;

    //x,y,z Axis
    var coordSys: CoordSys;
    var axisSize: number = 32;

    //property of legend calibration
    var calibrationTextWidth: number;
    var calibrationTextHeight: number;
    var calibrationTextFontSize: number;

    //init constant Render Data
    initMatrices();
    initStaticData();

    /*  This function creates the initial Matrices, Quaternions and Vectors
    **  it is called by initializiation of the RenderQueue
    */
    function initMatrices() {
        //Default Scalation
        scale = vec3.create();
        vec3.set(scale, 1, 1, 1);
        //Default Offset
        offset = vec3.create();
        vec3.set(offset, 0, 0, 0);

        lightPosition = vec3.create();
        vec3.set(lightPosition, 1, 1, 1);

        eye = vec3.create();
        vec3.set(eye, 0, 0, 1);

        center = vec3.create();
        vec3.set(center, 0, 0, 0);

        up = vec3.create();
        vec3.set(up, 0, 1, 0);

        transVec = vec3.create();
        vec3.set(transVec, 0, 0, 0);

        transVecOrth = vec3.create();
        vec3.set(transVecOrth, 0, 0, 0);

        //Background
        mvpBackground = mat4.create();
        mat4.ortho(mvpBackground, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

        //ColorLegend
        mvpColorLegend = mat4.create();
        mat4.ortho(mvpColorLegend, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

        //Rotation Matrix
        quatTmp = quat.create();
        quatRot = quat.create();
        rotScene = mat4.create();
        rotNorm = mat3.create();

        //Scene Matrix
        mScene = mat4.create();
        vScene = mat4.create();
        mat4.lookAt(vScene, eye, center, up);  //(Viewer, Model, Axis upwards)
        mvScene = mat4.create();
        pScene = mat4.create();
        mvpScene = mat4.create();

        //Front Matrix
        mFront = mat4.create();
        vpFront = mat4.create();
        mat4.lookAt(vpFront, new Float32Array([0, 0, 1]), center, up);
        mat4.multiply(vpFront, pScene, vpFront);
        mvpFront = mat4.create();
    }

    /*  This function initize static data, like Backgroup and the Axis
    **  it is called by initializiation of the RenderQueue
    */
    function initStaticData() {
        background = {
            vertexBuf: glc.setupArrayBuffer(new Float32Array([-1.0, -1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, 1.0, 0.0])),

            // Color Values can be individually manipulated                                
            colorBuf: glc.setupArrayBuffer(new Float32Array([0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0]))
        };

        colorLegend = {
            vertexBuf: glc.setupArrayBuffer(new Float32Array([-0.85, 0.8,
            -0.82, 0.8,
            -0.85, 0.0,
            -0.82, 0.0,])),

            colorBuf: glc.setupArrayBuffer(new Float32Array([1.0, 1.0, 0.0, 0.0])),

            indexBuf: glc.setupElementBuffer(new Uint16Array([0, 1, 2, 3])),
        };

        coordSys = {
            vertexBuf: glc.setupArrayBuffer(new Float32Array([0, 0, 0, 0.1, 0, 0, 0.09, 0.0, 0.005, 0.09, 0.001545085, 0.004755283, 0.09, 0.0029389262, 0.004045085,
                0.09, 0.004045085, 0.0029389262, 0.09, 0.004755283, 0.001545085, 0.09, 0.005, 3.061617E-19, 0.09, 0.004755283, -0.001545085, 0.09, 0.004045085, -0.0029389262,
                0.09, 0.0029389262, -0.004045085, 0.09, 0.001545085, -0.004755283, 0.09, 6.123234E-19, -0.005, 0.09, -0.001545085, -0.004755283, 0.09, -0.0029389262, -0.004045085,
                0.09, -0.004045085, -0.0029389262, 0.09, -0.004755283, -0.001545085, 0.09, -0.005, -9.184851E-19, 0.09, -0.004755283, 0.001545085, 0.09, -0.004045085, 0.0029389262,
                0.09, -0.0029389262, 0.004045085, 0.09, -0.001545085, 0.004755283, 0, 0.1, 0, 0.005, 0.09, 0.0, 0.004755283, 0.09, 0.001545085, 0.004045085, 0.09, 0.0029389262,
                0.0029389262, 0.09, 0.004045085, 0.001545085, 0.09, 0.004755283, 3.061617E-19, 0.09, 0.005, -0.001545085, 0.09, 0.004755283, -0.0029389262, 0.09, 0.004045085,
                -0.004045085, 0.09, 0.0029389262, -0.004755283, 0.09, 0.001545085, -0.005, 0.09, 6.123234E-19, -0.004755283, 0.09, -0.001545085, -0.004045085, 0.09, -0.0029389262,
                -0.0029389262, 0.09, -0.004045085, -0.001545085, 0.09, -0.004755283, -9.184851E-19, 0.09, -0.005, 0.001545085, 0.09, -0.004755283, 0.0029389262, 0.09, -0.004045085,
                0.004045085, 0.09, -0.0029389262, 0.004755283, 0.09, -0.001545085, 0, 0, 0.1, 0.0, 0.005, 0.09, 0.001545085, 0.004755283, 0.09, 0.0029389262, 0.004045085, 0.09,
                0.004045085, 0.0029389262, 0.09, 0.004755283, 0.001545085, 0.09, 0.005, 3.061617E-19, 0.09, 0.004755283, -0.001545085, 0.09, 0.004045085, -0.0029389262, 0.09,
                0.0029389262, -0.004045085, 0.09, 0.001545085, -0.004755283, 0.09, 6.123234E-19, -0.005, 0.09, -0.001545085, -0.004755283, 0.09, -0.0029389262, -0.004045085, 0.09,
                -0.004045085, -0.0029389262, 0.09, -0.004755283, -0.001545085, 0.09, -0.005, -9.184851E-19, 0.09, -0.004755283, 0.001545085, 0.09, -0.004045085, 0.0029389262, 0.09,
                -0.0029389262, 0.004045085, 0.09, -0.001545085, 0.004755283, 0.09
            ])),
            idxBuf: glc.setupElementBuffer(new Uint16Array([0, 1, 0, 22, 0, 43, 2, 3, 4, 2, 4, 5, 2, 5, 6, 2, 6, 7, 2, 7, 8, 2, 8, 9, 2, 9, 10, 2, 10, 11, 2, 11, 12, 2, 12, 13, 2, 13,
                14, 2, 14, 15, 2, 15, 16, 2, 16, 17, 2, 17, 18, 2, 18, 19, 2, 19, 20, 2, 20, 21, 2, 1, 3, 3, 1, 4, 4, 1, 5, 5, 1, 6, 6, 1, 7, 7, 1, 8, 8, 1, 9, 9, 1, 10, 10, 1, 11, 11,
                1, 12, 12, 1, 13, 13, 1, 14, 14, 1, 15, 15, 1, 16, 16, 1, 17, 17, 1, 18, 18, 1, 19, 19, 1, 20, 20, 1, 21, 21, 1, 2, 23, 24, 25, 23, 25, 26, 23, 26, 27, 23, 27, 28, 23,
                28, 29, 23, 29, 30, 23, 30, 31, 23, 31, 32, 23, 32, 33, 23, 33, 34, 23, 34, 35, 23, 35, 36, 23, 36, 37, 23, 37, 38, 23, 38, 39, 23, 39, 40, 23, 40, 41, 23, 41, 42, 23,
                22, 24, 24, 22, 25, 25, 22, 26, 26, 22, 27, 27, 22, 28, 28, 22, 29, 29, 22, 30, 30, 22, 31, 31, 22, 32, 32, 22, 33, 33, 22, 34, 34, 22, 35, 35, 22, 36, 36, 22, 37, 37,
                22, 38, 38, 22, 39, 39, 22, 40, 40, 22, 41, 41, 22, 42, 42, 22, 23, 44, 45, 46, 44, 46, 47, 44, 47, 48, 44, 48, 49, 44, 49, 50, 44, 50, 51, 44, 51, 52, 44, 52, 53, 44,
                53, 54, 44, 54, 55, 44, 55, 56, 44, 56, 57, 44, 57, 58, 44, 58, 59, 44, 59, 60, 44, 60, 61, 44, 61, 62, 44, 62, 63, 44, 43, 45, 45, 43, 46, 46, 43, 47, 47, 43, 48, 48,
                43, 49, 49, 43, 50, 50, 43, 51, 51, 43, 52, 52, 43, 53, 53, 43, 54, 54, 43, 55, 55, 43, 56, 56, 43, 57, 57, 43, 58, 58, 43, 59, 59, 43, 60, 60, 43, 61, 61, 43, 62, 62,
                43, 63, 63, 43, 44])),
            axisBuf: glc.setupArrayBuffer(new Float32Array([0.11, 0,0,
                0, 0.115,0,
                0.0, 0.0,0.11])),
            axisPointSize: glc.setupArrayBuffer(new Float32Array([axisSize, axisSize, axisSize]))
        };
    }

    this.renderScene = function () {
        drawCallRequest = true;
    }

    // sets the active Model to be rendered
    this.setActiveModel = function (model: Model) {
        activeModel = model;
        activePlotgroup = null;
        activePlots = [];
        drawCallRequest = true;
    }

    // sets the active Model by ID (if not exist, request it from server and callback when finished )
    // set all current rendering data to null
    this.setActiveModelById = function (modelId: string, callback:() => void) {
        modelCmd.getModel(modelId, function (model) {
            activeModel = model;            //set model
            activePlotgroup = null;         //no PlotGroup selected yet
            activePlots = [];               //no Plots
            callback();
        });
        drawCallRequest = true;
    }

    // sets the active Plot Group by ID (if not exist, request it from server and callback when finished)
    this.setActivePlotGroupById = function (plotGroupTag: string, callback: () => void) {
        if (activeModel) {
            activeModel.results.forEach(function (value: Result) {
                if (value.tag === plotGroupTag) {
                    modelCmd.getPlotGroup(activeModel.modelId, plotGroupTag, function (plotGroup) {
                        activePlotgroup = plotGroup;

                        // set the plotType
                        if (activePlotgroup.type == TYPE_PLOTGROUP3D) {
                            plotType = 3;
                        } else if (activePlotgroup.type == TYPE_PLOTGROUP2D) {
                            plotType = 2;
                        } else if (activePlotgroup.type == TYPE_PLOTGROUP1D) {
                            plotType = 1;
                        }

                        activePlots = [];
                        scale = plotGroup.scale;
                        offset = plotGroup.offset;
                        drawCallRequest = true;
                        callback();
                    });
                }
            });
        } else {
            throw "no model selected";
        }
    }

    // gets the active Model
    this.getActiveModel = function (): Model {
        return activeModel;
    }
    
    // gets the active Model by ID
    this.getActiveModelId = function (): string {
        if (activeModel) {
            return activeModel.modelId;
        }
        else {
            return null;
        }
    }

    this.setActivePlotGroup = function (plotGroup: Result) {
        if (activeModel) {
            if (activeModel.results.indexOf(plotGroup) !== -1) {
                activePlotgroup = plotGroup;
                activePlots = [];
                drawCallRequest = true;
                scale = plotGroup.scale;            //take scale and offset for the scene from Plotgroup
                offset = plotGroup.offset;
            } else {
                throw "plot group not part of this model";
            }
        } else {
            throw "no model selected";
        }
    }

    // gets the active Plotgroup
    this.getActivePlotGroup = function (): Result {
        return activePlotgroup;
    }

    // gets the active Plotgroup by ID
    this.getActivePlotGroupId = function (): string {
        if (activePlotgroup) {
            return activePlotgroup.tag;
        }
        else {
            return null;
        }
    }

    // get all Active Plots
    this.getActivePlots = function (): Result[]{
        return activePlots;
    }

    // get active plot type
    this.getActivePlotGroupType = function (): number {
        return plotType;
    }

    // add the plot to the active Plot List
    this.addPlot = function (plot: Result) {
        if (activePlots.indexOf(plot) === -1) {
            activePlots.push(plot);
            drawCallRequest = true;
        }
    }

    // remove the plot from the active Plot List
    this.removePlot = function (plot: Result) {
        var index = activePlots.indexOf(plot);
        if (index !== - 1) {
            activePlots.splice(index, 1);
        }
        drawCallRequest = true;
    }

    // gets the Position of the Viewer
    this.getPosition = function (): Float32Array {
        return transVec;
    }

    this.getPositionOrth = function (): Float32Array {
        return transVecOrth;
    }

    // get the eyeSeperation
    this.getSeperation = function (): number {
        return eyeSeperation;
    }

    // get axis size
    this.getAxisSize = function () {
        return axisSize;
    }

    // sets the Position of the Viewer
    this.setPosition = function (eyeX: number, eyeY: number, eyeZ: number) {
        transVec[0] = eyeX;
        transVec[1] = eyeY;
        transVec[2] = eyeZ;
        drawCallRequest = true;
    }

    this.setPositionOrth = function (X: number, Y: number, Z: number) {
        transVecOrth[0] = X;
        transVecOrth[1] = Y;
        transVecOrth[2] = Z;
    }

    //sets the Position of the Viewer as (Float32Array)
    this.setPositionV = function (eyeVec: Float32Array) {
        transVec = eyeVec;
        drawCallRequest = true;
    }

    //sets the X-Position of the Viewer
    this.setXPosition = function (eyeX: number) {
        transVec[0] = eyeX;
        drawCallRequest = true;
    }

    //sets the Y-Position of the Viewer
    this.setYPosition = function (eyeY: number) {
        transVec[1] = eyeY;
        drawCallRequest = true;
    }

    //sets the Z-Position of the Viewer
    this.setZPosition = function (eyeZ: number) {
        transVec[2] = eyeZ;
        drawCallRequest = true;
    }

    this.setPositionVOrth = function (Vec: Float32Array) {
        transVecOrth = Vec;
        drawCallRequest = true;
    }

    this.setPositionXOrth = function (X: number) {
        transVecOrth[0] = X;
        drawCallRequest = true;
    }

    //sets the seperation distance (pupillary distance) of plots in two viewports
    this.setSeperation = function (seperation: number) {
        eyeSeperation = seperation;
        drawCallRequest = true;
    }

    //sets the font-size of axis
    this.setAxisSize = function (fontsize: number) {
        axisSize = fontsize;
        drawCallRequest = true;
    }

    this.setCalibrationText = function (textWidth: number, textHeight: number, textFontSize:number) {
        calibrationTextWidth = textWidth;
        calibrationTextHeight = textHeight;
        calibrationTextFontSize = textFontSize;
        drawCallRequest = true;
    }

    this.setTicksPosition = function () {

    }
    //rotate Object x and y in degrees
    //Changes the rotMatrix, and normalMatrix
    this.rotateObject = function (x: number, y: number) {

        quat.identity(quatTmp);
        quat.rotateX(quatTmp, quatTmp, y * degToRad);
        quat.rotateY(quatTmp, quatTmp, x * degToRad);
        quat.multiply(quatRot, quatTmp, quatRot);

        mat4.fromQuat(rotScene, quatRot); 
        mat3.fromMat4(rotNorm, rotScene);

        drawCallRequest = true;
    }

    // sets the View back to start View
    this.resetView = function () {
        vec3.set(transVec, 0, 0, 0);
        quat.identity(quatRot);
        mat4.identity(rotScene);
        mat3.identity(rotNorm);
        drawCallRequest = true;
    }

    // make the Light on or off
    this.toggleLight = function (): boolean {
        light = !light;
        drawCallRequest = true;
        return light;
    }

    // make the stereoscopic vision on or off
    this.toggleVR = function (): boolean {
        vr = !vr;
        drawCallRequest = true;
        return vr;
    }

    // when the Canvas is resized, the Render engine must be updated
    this.resizeCanvas = function () {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        mat4.perspective(pScene, viewAngle, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.05, 100.0);

        mat4.identity(mFront);
        mat4.translate(mFront, mFront, new Float32Array([-0.3 * gl.drawingBufferWidth / gl.drawingBufferHeight, -0.3, 0]));

        mat4.identity(vpFront);
        mat4.lookAt(vpFront, new Float32Array([0, 0, 1]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]));
        mat4.multiply(vpFront, pScene, vpFront);

        drawCallRequest = true;
    }

    // when VR feature is actived, full screen the canvas and update the Render engine
    this.resizeVRCanvas = function () {
        if (gl.drawingBufferWidth > 800) {
            mat4.perspective(pScene, viewAngle, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.05, 100.0);
        } else {
            mat4.perspective(pScene, viewAngle, gl.drawingBufferWidth / 2 / gl.drawingBufferHeight, 0.05, 100.0);
        }

        drawCallRequest = true;
    }

    //draw the Plotgroup (the wire frame of the model if it exist)
    var drawPlotGroup = function () {
        if (!activePlotgroup.noData) {
            for (var i = 0; i < activePlotgroup.renderGroup.length; i++) {
                drawRenderGroupShader1Lines(activePlotgroup.renderGroup[i], activePlotgroup.usrColor);              
            }
        }
    }

    //draw all active Plots
    var drawPlots = function () {
        for (var i = 0; i < activePlots.length; i++) {
            var result = activePlots[i];      

            if (!result.noData) {
                for (var j = 0; j < result.renderGroup.length; j++) {
                    var renderGroup = result.renderGroup[j];
                    var shaderId = getShaderType(result.type, light, renderGroup.attributes);
                    var geomType = getGeoType(result.type);

                    switch (shaderId) {
                        case 1:
                            if (geomType === 2) {
                                drawRenderGroupShader1Lines(renderGroup, result.usrColor);
                            } else if (geomType === 3) {
                                drawRenderGroupShader1Trias(renderGroup, result.usrColor);
                            }
                            break;

                        case 101:
                            if (geomType === 3) {
                                drawRenderGroupShader101Trias(renderGroup, result.usrColor);
                            }
                            break;

                        case 3:
                            if (geomType === 2) {
                                drawRenderGroupShader3Lines(renderGroup, result.usrText);
                            } else if (geomType === 3) {
                                drawRenderGroupShader3Trias(renderGroup, result.usrText);
                            }
                            break;

                        case 103:
                            if (geomType === 3) {
                                drawRenderGroupShader103Trias(renderGroup, result.usrText);
                            }
                            break;

                        case 4:
                            drawRenderGroupShader4(renderGroup, result.usrScale, result.usrColor);
                            break;

                        case 104:
                            drawRenderGroupShader104(renderGroup, result.usrScale, result.usrColor);
                            break;

                        case 5:
                            if (geomType === 2) {
                                drawRenderGroupShader5Lines(renderGroup, result.usrText, result.usrScale);
                            } else if (geomType === 3) {
                                drawRenderGroupShader5Trias(renderGroup, result.usrText, result.usrScale);
                            }
                            break;
                        case 105:
                            drawRenderGroupShader105Trias(renderGroup, result.usrText, result.usrScale);
                            break;
                    }
                                                                           
                }
            }
        }
    }


    // draw the wire frame of plotGroup
    var drawRenderGroupShader1Lines = function (renderGroup: RenderGroup, usrColor: string) {
        var color = glContext.getColorByName(usrColor);
        var prog = programs[1];

        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], color);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                // for 2D plots, the size is 2, for 3D plots, the size is 3
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], plotType, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.LINES, geom.nElements * 2 , gl.UNSIGNED_SHORT, 0);
            }
        }
    }

    var drawRenderGroupShader1Trias = function (renderGroup: RenderGroup, usrColor: string) {
        var color = glContext.getColorByName(usrColor);
        var prog = programs[1];

        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], color);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    }
    
    var drawRenderGroupShader101Trias = function (renderGroup: RenderGroup, usrColor: string) {
        var color = glContext.getColorByName(usrColor);
        var prog = programs[101];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_P], false, pScene);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MV], false, mvScene);
        gl.uniformMatrix3fv(prog.uniforms[GL_UNI_NORM], false, rotNorm);
        gl.uniform3fv(prog.uniforms[GL_UNI_LIG], lightPosition);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], color);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_NRM]);
        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.normals);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_NRM], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    }

    var drawRenderGroupShader3Lines = function (renderGroup: RenderGroup, usrText: string) { 
             
        var colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];

        var prog = programs[3];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.LINES, geom.nElements * 2, gl.UNSIGNED_SHORT, 0);
            }
        }
        drawLegend(renderGroup, usrText);  
    }

    var drawRenderGroupShader3Trias = function (renderGroup: RenderGroup, usrText: string) {
        console.time('legend');
        drawLegend(renderGroup, usrText);
        console.timeEnd('legend');
        var colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];

        var prog = programs[3];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], plotType, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
           
    }

    var drawRenderGroupShader103Trias = function (renderGroup: RenderGroup, usrText: string) {
        
        var colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];

        var prog = programs[103];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_P], false, pScene);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MV], false, mvScene);
        gl.uniformMatrix3fv(prog.uniforms[GL_UNI_NORM], false, rotNorm);
        gl.uniform3fv(prog.uniforms[GL_UNI_LIG], lightPosition);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_NRM]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.normals);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_NRM], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }

        drawLegend(renderGroup, usrText);
    }

    var drawRenderGroupShader4 = function (renderGroup: RenderGroup, usrScale: number, usrColor: string) {
        var prog = programs[4];
        gl.useProgram(prog.gl); //set Shader Progam

        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);    //set MVP Matrix
        gl.uniform1f(prog.uniforms[GL_UNI_SCL], usrScale);      // set Scalation
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], glContext.getColorByName(usrColor));    //set Unified Color

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_POS]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.position);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_POS], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    }

    var drawRenderGroupShader104 = function (renderGroup: RenderGroup, usrScale: number, usrColor: string) {
        var prog = programs[104];
        gl.useProgram(prog.gl); //set Shader Progam

        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MV], false, mvScene);    //set MV Matrix
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_P], false, pScene);    //set MV Matrix
        gl.uniformMatrix3fv(prog.uniforms[GL_UNI_NORM], false, rotNorm);    //set Normal Matrix

        gl.uniform1f(prog.uniforms[GL_UNI_SCL], usrScale);      // set Scalation
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], glContext.getColorByName(usrColor));    //set Unified Color

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_POS]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_NRM]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.position);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_POS], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.normals);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_NRM], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    }

    var drawRenderGroupShader5Lines = function (renderGroup: RenderGroup, usrText: string, usrScale: number) {
        
        var colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        var defXAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFX];
        var defYAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFY];
        var defZAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFZ];

        var prog = programs[5];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_X]);
        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Y]);
        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Z]);

        if (defXAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_X]);
        }
        if (defYAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Y]);
        }
        if (defZAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Z]);
        }

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                if (defXAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defXAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_X], 1, gl.FLOAT, false, 0, 0);
                }
                if (defYAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defYAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_Y], 1, gl.FLOAT, false, 0, 0);
                }
                if (defZAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defZAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_Z], 1, gl.FLOAT, false, 0, 0);
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.LINES, geom.nElements * 2, gl.UNSIGNED_SHORT, 0);
            }
        }

        drawLegend(renderGroup, usrText);
    }

    var drawRenderGroupShader5Trias = function (renderGroup: RenderGroup, usrText: string, usrScale: number) {
        
        var colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        var defXAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFX];
        var defYAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFY];
        var defZAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFZ];

        var prog = programs[5];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_X]);
        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Y]);
        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Z]);

        if (defXAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_X]);
        }
        if (defYAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Y]);
        }
        if (defZAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Z]);
        }

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                if (defXAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defXAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_X], 1, gl.FLOAT, false, 0, 0);
                }
                if (defYAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defYAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_Y], 1, gl.FLOAT, false, 0, 0);
                }
                if (defZAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defZAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_Z], 1, gl.FLOAT, false, 0, 0);
                }
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
        drawLegend(renderGroup, usrText);
    }

    var drawRenderGroupShader105Trias = function (renderGroup: RenderGroup, usrText: string, usrScale: number) {
        
        var colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        var defXAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFX];
        var defYAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFY];
        var defZAttr: RenderAttribute = renderGroup.attributes[ATTR_DEFZ];

        var prog = programs[103];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MV], false, mvScene);
        gl.uniformMatrix3fv(prog.uniforms[GL_UNI_NORM], false, rotNorm);
        gl.uniform3fv(prog.uniforms[GL_UNI_LIG], lightPosition);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_NRM]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_X]);
        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Y]);
        gl.disableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Z]);

        if (defXAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_X]);
        }
        if (defYAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Y]);
        }
        if (defZAttr) {
            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_DEF_Z]);
        } 

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom: WebGLGeom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.normals);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_NRM], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                if (defXAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defXAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_X], 1, gl.FLOAT, false, 0, 0);
                }
                if (defYAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defYAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_Y], 1, gl.FLOAT, false, 0, 0);
                }
                if (defZAttr) {
                    gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[defZAttr.index]);
                    gl.vertexAttribPointer(prog.attributes[GL_ATTR_DEF_Z], 1, gl.FLOAT, false, 0, 0);
                } 
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }

        drawLegend(renderGroup, usrText);
    }

    //paint the background
    var drawBackground = function () {
        //reset View
        gl.useProgram(programs[2].gl);
        gl.uniformMatrix4fv(programs[2].uniforms[GL_UNI_MVP], false, mvpBackground);

        gl.enableVertexAttribArray(programs[2].attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(programs[2].attributes[GL_ATTR_COL]);

        gl.bindBuffer(gl.ARRAY_BUFFER, background.vertexBuf);
        gl.vertexAttribPointer(programs[2].attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, background.colorBuf);
        gl.vertexAttribPointer(programs[2].attributes[GL_ATTR_COL], 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    }

    var drawLegend = function (renderGroup: RenderGroup, usrText: string) {

        let colAttr: RenderAttribute = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        let minValue: number = colAttr.min;
        let maxValue: number = colAttr.max;
        let ticks = <Tick>{};

        ticks = legendScala(minValue, maxValue);
        console.time('test');
        console.log('tick label: ' + ticks.label);
        glContext.setLegendCalibrationTextures(ticks.label, calibrationTextWidth, calibrationTextHeight, calibrationTextFontSize);
        console.timeEnd('test');
        
        //reset View
        let prog = programs[3];
        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpBackground);
        gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
        gl.activeTexture(gl.TEXTURE0);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.bindTexture(gl.TEXTURE_2D, glContext.getTextureByName(usrText));

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_COL]);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorLegend.vertexBuf);
        gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, colorLegend.colorBuf);
        gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, colorLegend.indexBuf);
        gl.drawElements(gl.TRIANGLE_STRIP, 4, gl.UNSIGNED_SHORT, 0);

        drawScala(ticks.normalization);
    }

    var drawScala = function (tickNormalization?: number[]) {
        console.log('normalization' + tickNormalization);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        var textures = glContext.getLegendCalibrationTextures();

        if (tickNormalization) {
            var ticksPosition = [-0.78, 0.85, 0];
            var yPosition: number;
            var points = [axisSize];

            for (var i = 0; i < tickNormalization.length; i++) {
                yPosition = 0.78 - tickNormalization[i] * (0.78 - 0.02);
                yPosition = Math.round(yPosition * 100) / 100;
                ticksPosition.push(-0.78, yPosition, 0);
                points.push(axisSize);
            }
            console.log('ticksPosition: ' + ticksPosition);
            console.log('points: ' + points);
        }

        for (var i = 0; i < tickNormalization.length+1; i++) {
            var prog = programs[6];
            gl.useProgram(prog.gl);
            gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpBackground);
            gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);

            colorLegend.scalaBuf = glc.setupArrayBuffer(new Float32Array(ticksPosition));
            colorLegend.scalaPointSize = glc.setupArrayBuffer(new Float32Array(points));

            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorLegend.scalaBuf);
            gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_SIZE]);
            gl.bindBuffer(gl.ARRAY_BUFFER, colorLegend.scalaPointSize);
            gl.vertexAttribPointer(prog.attributes[GL_ATTR_SIZE], 1, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, i, 1);
        }
        gl.depthMask(true);
    }

    //paint the foreground i.e coordination system
    var drawFront = function () {
        gl.useProgram(programs[1].gl);
        gl.uniformMatrix4fv(programs[1].uniforms[GL_UNI_MVP], false, mvpFront);
        gl.enableVertexAttribArray(programs[1].attributes[GL_ATTR_VTX]);
        gl.bindBuffer(gl.ARRAY_BUFFER, coordSys.vertexBuf);
        gl.vertexAttribPointer(programs[1].attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(programs[1].uniforms[GL_UNI_COL], [0.0, 0.0, 0.0]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordSys.idxBuf);
        gl.drawElements(gl.LINES, 6, gl.UNSIGNED_SHORT, 0);

        gl.uniform3fv(programs[1].uniforms[GL_UNI_COL], [0.0, 1.0, 0.0]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordSys.idxBuf);
        gl.drawElements(gl.TRIANGLES, 114, gl.UNSIGNED_SHORT, 12);

        gl.uniform3fv(programs[1].uniforms[GL_UNI_COL], [0.0, 0.0, 1.0]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordSys.idxBuf);
        gl.drawElements(gl.TRIANGLES, 114, gl.UNSIGNED_SHORT, 240);

        gl.uniform3fv(programs[1].uniforms[GL_UNI_COL], [1.0, 0.0, 0.0]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, coordSys.idxBuf);
        gl.drawElements(gl.TRIANGLES, 114, gl.UNSIGNED_SHORT, 468);

        drawAxis();
    }

    var drawAxis = function () {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        let textures = glContext.getTextTexture();
        for (let i = 0; i < textures.length; i++) {
            let prog = programs[6];
            gl.useProgram(prog.gl);
            gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpFront);
            gl.uniform1i(prog.uniforms[GL_UNI_TEX], 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);

            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
            gl.bindBuffer(gl.ARRAY_BUFFER, coordSys.axisBuf);
            gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

            gl.enableVertexAttribArray(prog.attributes[GL_ATTR_SIZE]);
            gl.bindBuffer(gl.ARRAY_BUFFER, coordSys.axisPointSize);
            gl.vertexAttribPointer(prog.attributes[GL_ATTR_SIZE], 1, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, i, 1);
        }
        gl.depthMask(true);
    }

    //paint the complete Scene
    function drawScene(seperation?:number) {
        gl.disable(gl.DEPTH_TEST);
        mat4.identity(mScene);          //Setup Model Matrix

        //Setup the seperation distance in two viewports,
        if (seperation) {
            let xOld = transVec[0];
            let xNew = xOld + seperation;
            transVec[0] = xNew;
        }

        mat4.translate(mScene, mScene, transVec);   //Translate according to the user (first rotate then translate)
        mat4.scale(mScene, mScene, scale);          //Scale to unit Box -1,1,   (scalation is cummutativ)
        mat4.multiply(mScene, mScene, rotScene);    //Rotate Model
        mat4.translate(mScene, mScene, offset);     //Translate to the middlepoint

        mat4.multiply(mvScene, vScene, mScene);
        mat4.multiply(mvpScene, pScene, mvScene);

        mat4.multiply(mvpFront, mFront, rotScene);
        mat4.multiply(mvpFront, vpFront, mvpFront);


        drawBackground();
        if (activeModel && activePlotgroup) {
            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LESS);
            drawPlots();
            drawPlotGroup();
        }
        gl.disable(gl.DEPTH_TEST);

        if (plotType === 3) {
            if (seperation) {
                mat4.identity(mFront);

                if (gl.drawingBufferWidth > 800) {
                    mat4.translate(mFront, mFront, new Float32Array([(-0.3 - seperation / 3) * gl.drawingBufferWidth / gl.drawingBufferHeight, -0.2, 0]));
                    mat4.identity(vpFront);
                    mat4.lookAt(vpFront, new Float32Array([0, 0, 1]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]));
                } else {
                    mat4.translate(mFront, mFront, new Float32Array([(-0.3 - seperation / 3) * gl.drawingBufferWidth / gl.drawingBufferHeight, -0.2, 0]));
                    mat4.identity(vpFront);
                    mat4.lookAt(vpFront, new Float32Array([0, 0, 2]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]));
                }
                
                mat4.multiply(vpFront, pScene, vpFront);
            }
            drawFront();
        }
        gl.clear(gl.DEPTH_BUFFER_BIT);

    }

    //paint the stereoscopic 3D with two viewplot
    function drawSceneVR() {
        gl.viewport(0, 0, gl.drawingBufferWidth / 2, gl.drawingBufferHeight);
        drawScene(eyeSeperation);

        gl.viewport(gl.drawingBufferWidth / 2, 0, gl.drawingBufferWidth / 2, gl.drawingBufferHeight);
        drawScene(-eyeSeperation);
    }

    //set legend scala array
    function legendScala(min: number, max: number): Tick{
        console.log('Max: ' + max);
        console.log('Min: ' + min);
        let range: number = max - min;
        let label = [];
        let normalization = [];

        let step: number = 0;
        let tempStep = range / 12;
        let mag = Math.floor(Math.log10(tempStep));
        let magPow = Math.pow(10, mag);

        let magMsd = tempStep / magPow;

        if (magMsd > 5.0) {
            magMsd = 10.0;
        } else if (magMsd > 2.0) {
            magMsd = 5.0;
        } else if (magMsd > 1.0) {
            magMsd = 2.0;
        }

        let start: number = Math.ceil(max / 10/ magPow)*10;
        while (start * magPow > max) {
            console.log('start*magPow : ' + start * magPow);
            start = start - magMsd;
        }
        label.push('10E' + mag.toString());
        for (let i = 0; i < 20; i++) {

            if (start * magPow > min) {
                console.log('start*magPow : ' + start * magPow);
                label.push(start.toString());
                normalization.push((max - start*magPow) / range);
            } else {
                break;
            }

            start = start - magMsd;
        }
        return {
            label: label,
            normalization: normalization
        };
    }

    function checkGLerror() : boolean{

        var error = gl.getError();
        if (error) {
            console.log("GL Error: " + error);
            return true;
        }
        return false;
    }

    //The continous Loop for Rendering
    (function renderLoop() {
        if (drawCallRequest) {
            drawCallRequest = false;
            if (vr) {
                drawSceneVR();
            } else {
                drawScene();
            }
        }
        if (!checkGLerror()) {
            requestAnimationFrame(renderLoop);
        }
    })();
}