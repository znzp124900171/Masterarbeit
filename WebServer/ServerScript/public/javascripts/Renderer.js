function Renderer(modelData, glc) {
    var self = this;
    var drawCallRequest = true;

    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
    })();

    var glContext = glc;
    var modelCmd = modelData;
    var gl = glContext.getContext();

    var programs = glContext.getPrograms();

    var light = false;

    var glWidth;

    var glHeight;

    var degToRad = Math.PI / 180;

    var viewAngle = 45 * degToRad;

    var activeModel = null;

    var activePlotgroup = null;

    var activePlots = [];

    var scale;
    var offset;

    var lightPosition;

    var center;

    var up;

    var eye;
    var transVec;

    var mvpBackground;
    var quatTmp;
    var quatRot;
    var rotScene;
    var rotNorm;
    var mScene;
    var vScene;
    var mvScene;
    var pScene;
    var mvpScene;
    var mFront;
    var vpFront;
    var mvpFront;

    var background;

    var coordSys;

    initMatrices();
    initStaticData();

    function initMatrices() {
        scale = vec3.create();
        vec3.set(scale, 1, 1, 1);

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

        mvpBackground = mat4.create();
        mat4.ortho(mvpBackground, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0);

        quatTmp = quat.create();
        quatRot = quat.create();
        rotScene = mat4.create();
        rotNorm = mat3.create();

        mScene = mat4.create();
        vScene = mat4.create();
        mat4.lookAt(vScene, eye, center, up);
        mvScene = mat4.create();
        pScene = mat4.create();
        mvpScene = mat4.create();

        mFront = mat4.create();
        vpFront = mat4.create();
        mat4.lookAt(vpFront, new Float32Array([0, 0, 1]), center, up);
        mat4.multiply(vpFront, pScene, vpFront);
        mvpFront = mat4.create();
    }

    function initStaticData() {
        background = {
            vertexBuf: glc.setupArrayBuffer(new Float32Array([
                -1.0, -1.0, 0.0,
                1.0, -1.0, 0.0,
                -1.0, 1.0, 0.0,
                1.0, 1.0, 0.0])),
            colorBuf: glc.setupArrayBuffer(new Float32Array([
                0.5, 0.5, 0.5,
                0.5, 0.5, 0.5,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0]))
        };

        coordSys = {
            vertexBuf: glc.setupArrayBuffer(new Float32Array([
                0, 0, 0, 0.1, 0, 0, 0.09, 0.0, 0.005, 0.09, 0.001545085, 0.004755283, 0.09, 0.0029389262, 0.004045085,
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
            idxBuf: glc.setupElementBuffer(new Uint16Array([
                0, 1, 0, 22, 0, 43, 2, 3, 4, 2, 4, 5, 2, 5, 6, 2, 6, 7, 2, 7, 8, 2, 8, 9, 2, 9, 10, 2, 10, 11, 2, 11, 12, 2, 12, 13, 2, 13,
                14, 2, 14, 15, 2, 15, 16, 2, 16, 17, 2, 17, 18, 2, 18, 19, 2, 19, 20, 2, 20, 21, 2, 1, 3, 3, 1, 4, 4, 1, 5, 5, 1, 6, 6, 1, 7, 7, 1, 8, 8, 1, 9, 9, 1, 10, 10, 1, 11, 11,
                1, 12, 12, 1, 13, 13, 1, 14, 14, 1, 15, 15, 1, 16, 16, 1, 17, 17, 1, 18, 18, 1, 19, 19, 1, 20, 20, 1, 21, 21, 1, 2, 23, 24, 25, 23, 25, 26, 23, 26, 27, 23, 27, 28, 23,
                28, 29, 23, 29, 30, 23, 30, 31, 23, 31, 32, 23, 32, 33, 23, 33, 34, 23, 34, 35, 23, 35, 36, 23, 36, 37, 23, 37, 38, 23, 38, 39, 23, 39, 40, 23, 40, 41, 23, 41, 42, 23,
                22, 24, 24, 22, 25, 25, 22, 26, 26, 22, 27, 27, 22, 28, 28, 22, 29, 29, 22, 30, 30, 22, 31, 31, 22, 32, 32, 22, 33, 33, 22, 34, 34, 22, 35, 35, 22, 36, 36, 22, 37, 37,
                22, 38, 38, 22, 39, 39, 22, 40, 40, 22, 41, 41, 22, 42, 42, 22, 23, 44, 45, 46, 44, 46, 47, 44, 47, 48, 44, 48, 49, 44, 49, 50, 44, 50, 51, 44, 51, 52, 44, 52, 53, 44,
                53, 54, 44, 54, 55, 44, 55, 56, 44, 56, 57, 44, 57, 58, 44, 58, 59, 44, 59, 60, 44, 60, 61, 44, 61, 62, 44, 62, 63, 44, 43, 45, 45, 43, 46, 46, 43, 47, 47, 43, 48, 48,
                43, 49, 49, 43, 50, 50, 43, 51, 51, 43, 52, 52, 43, 53, 53, 43, 54, 54, 43, 55, 55, 43, 56, 56, 43, 57, 57, 43, 58, 58, 43, 59, 59, 43, 60, 60, 43, 61, 61, 43, 62, 62,
                43, 63, 63, 43, 44]))
        };
    }

    this.renderScene = function () {
        drawCallRequest = true;
    };

    this.setActiveModel = function (model) {
        activeModel = model;
        activePlotgroup = null;
        activePlots = [];
        drawCallRequest = true;
    };

    this.setActiveModelById = function (modelId, callback) {
        modelCmd.getModel(modelId, function (model) {
            activeModel = model;
            activePlotgroup = null;
            activePlots = [];
            callback();
        });
        drawCallRequest = true;
    };

    this.setActivePlotGroupById = function (plotGroupTag, callback) {
        if (activeModel) {
            activeModel.results.forEach(function (value) {
                if (value.tag === plotGroupTag) {
                    modelCmd.getPlotGroup(activeModel.modelId, plotGroupTag, function (plotGroup) {
                        activePlotgroup = plotGroup;
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
    };

    this.getActiveModel = function () {
        return activeModel;
    };

    this.getActiveModelId = function () {
        if (activeModel) {
            return activeModel.modelId;
        } else {
            return null;
        }
    };

    this.setActivePlotGroup = function (plotGroup) {
        if (activeModel) {
            if (activeModel.results.indexOf(plotGroup) !== -1) {
                activePlotgroup = plotGroup;
                activePlots = [];
                drawCallRequest = true;
                scale = plotGroup.scale;
                offset = plotGroup.offset;
            } else {
                throw "plot group not part of this model";
            }
        } else {
            throw "no model selected";
        }
    };

    this.getActivePlotGroup = function () {
        return activePlotgroup;
    };

    this.getActivePlotGroupId = function () {
        if (activePlotgroup) {
            return activePlotgroup.tag;
        } else {
            return null;
        }
    };

    this.getActivePlots = function () {
        return activePlots;
    };

    this.addPlot = function (plot) {
        if (activePlots.indexOf(plot) === -1) {
            activePlots.push(plot);
            drawCallRequest = true;
        }
    };

    this.removePlot = function (plot) {
        var index = activePlots.indexOf(plot);
        if (index !== -1) {
            activePlots.splice(index, 1);
        }
        drawCallRequest = true;
    };

    this.getPosition = function () {
        return transVec;
    };

    this.setPosition = function (eyeX, eyeY, eyeZ) {
        transVec[0] = eyeX;
        transVec[1] = eyeY;
        transVec[2] = eyeZ;
        drawCallRequest = true;
    };

    this.setPositionV = function (eyeVec) {
        transVec = eyeVec;
        drawCallRequest = true;
    };

    this.setXPosition = function (eyeX) {
        transVec[0] = eyeX;
        drawCallRequest = true;
    };

    this.setYPosition = function (eyeY) {
        transVec[1] = eyeY;
        drawCallRequest = true;
    };

    this.setZPosition = function (eyeZ) {
        transVec[2] = eyeZ;
        drawCallRequest = true;
    };

    this.rotateObject = function (x, y) {
        quat.identity(quatTmp);
        quat.rotateX(quatTmp, quatTmp, y * degToRad);
        quat.rotateY(quatTmp, quatTmp, x * degToRad);
        quat.multiply(quatRot, quatTmp, quatRot);

        mat4.fromQuat(rotScene, quatRot);
        mat3.fromMat4(rotNorm, rotScene);

        drawCallRequest = true;
    };

    this.resetView = function () {
        vec3.set(transVec, 0, 0, 0);
        quat.identity(quatRot);
        mat4.identity(rotScene);
        mat3.identity(rotNorm);
        drawCallRequest = true;
    };

    this.toggleLight = function () {
        light = !light;
        drawCallRequest = true;
        return light;
    };

    this.resizeCanvas = function (width, height) {
        glWidth = width;
        glHeight = height;
        gl.viewport(0, 0, width, height);
        mat4.perspective(pScene, viewAngle, width / height, 0.05, 100.0);

        mat4.identity(mFront);
        mat4.translate(mFront, mFront, new Float32Array([-0.3 * width / height, -0.3, 0]));

        mat4.identity(vpFront);
        mat4.lookAt(vpFront, new Float32Array([0, 0, 1]), new Float32Array([0, 0, 0]), new Float32Array([0, 1, 0]));
        mat4.multiply(vpFront, pScene, vpFront);

        drawCallRequest = true;
    };

    var drawPlotGroup = function () {
        if (!activePlotgroup.noData) {
            for (var i = 0; i < activePlotgroup.renderGroup.length; i++) {
                drawRenderGroupShader1Lines(activePlotgroup.renderGroup[i], "black");
            }
        }
    };

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
    };

    var drawRenderGroupShader1Lines = function (renderGroup, usrColor) {
        var color = glContext.getColorByName(usrColor);
        var prog = programs[1];

        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], color);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom = geomData[j];
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.LINES, geom.nElements * 2, gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    var drawRenderGroupShader1Trias = function (renderGroup, usrColor) {
        var color = glContext.getColorByName(usrColor);
        var prog = programs[1];

        gl.useProgram(prog.gl);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], color);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    var drawRenderGroupShader101Trias = function (renderGroup, usrColor) {
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
                var geom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.normals);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_NRM], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    var drawRenderGroupShader3Lines = function (renderGroup, usrText) {
        var colAttr = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];

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
                var geom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.LINES, geom.nElements * 2, gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    var drawRenderGroupShader3Trias = function (renderGroup, usrText) {
        var colAttr = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];

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
                var geom = geomData[j];

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.attributes[colAttr.index]);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_COL], 1, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    var drawRenderGroupShader103Trias = function (renderGroup, usrText) {
        var colAttr = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];

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
                var geom = geomData[j];

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
    };

    var drawRenderGroupShader4 = function (renderGroup, usrScale, usrColor) {
        var prog = programs[4];
        gl.useProgram(prog.gl);

        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MVP], false, mvpScene);
        gl.uniform1f(prog.uniforms[GL_UNI_SCL], usrScale);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], glContext.getColorByName(usrColor));

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_POS]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom = geomData[j];
                gl.bindBuffer(gl.ARRAY_BUFFER, geom.vertices);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ARRAY_BUFFER, geom.position);
                gl.vertexAttribPointer(prog.attributes[GL_ATTR_POS], 3, gl.FLOAT, false, 0, 0);

                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geom.indices);
                gl.drawElements(gl.TRIANGLES, geom.nElements * 3, gl.UNSIGNED_SHORT, 0);
            }
        }
    };

    var drawRenderGroupShader104 = function (renderGroup, usrScale, usrColor) {
        var prog = programs[104];
        gl.useProgram(prog.gl);

        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_MV], false, mvScene);
        gl.uniformMatrix4fv(prog.uniforms[GL_UNI_P], false, pScene);
        gl.uniformMatrix3fv(prog.uniforms[GL_UNI_NORM], false, rotNorm);

        gl.uniform1f(prog.uniforms[GL_UNI_SCL], usrScale);
        gl.uniform3fv(prog.uniforms[GL_UNI_COL], glContext.getColorByName(usrColor));

        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_POS]);
        gl.enableVertexAttribArray(prog.attributes[GL_ATTR_NRM]);

        for (var i = 0; i < renderGroup.renderData.length; i++) {
            var geomData = renderGroup.renderData[i].geomData;
            for (var j = 0; j < geomData.length; j++) {
                var geom = geomData[j];
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
    };

    var drawRenderGroupShader5Lines = function (renderGroup, usrText, usrScale) {
        var colAttr = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        var defXAttr = renderGroup.attributes[ATTR_DEFX];
        var defYAttr = renderGroup.attributes[ATTR_DEFY];
        var defZAttr = renderGroup.attributes[ATTR_DEFZ];

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
                var geom = geomData[j];

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
    };

    var drawRenderGroupShader5Trias = function (renderGroup, usrText, usrScale) {
        var colAttr = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        var defXAttr = renderGroup.attributes[ATTR_DEFX];
        var defYAttr = renderGroup.attributes[ATTR_DEFY];
        var defZAttr = renderGroup.attributes[ATTR_DEFZ];

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
                var geom = geomData[j];
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
    };

    var drawRenderGroupShader105Trias = function (renderGroup, usrText, usrScale) {
        var colAttr = renderGroup.attributes[ATTR_COLOR] || renderGroup.attributes[ATTR_ISO];
        var defXAttr = renderGroup.attributes[ATTR_DEFX];
        var defYAttr = renderGroup.attributes[ATTR_DEFY];
        var defZAttr = renderGroup.attributes[ATTR_DEFZ];

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
                var geom = geomData[j];

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
    };

    var drawBackground = function () {
        gl.useProgram(programs[2].gl);
        gl.uniformMatrix4fv(programs[2].uniforms[GL_UNI_MVP], false, mvpBackground);

        gl.enableVertexAttribArray(programs[2].attributes[GL_ATTR_VTX]);
        gl.enableVertexAttribArray(programs[2].attributes[GL_ATTR_COL]);

        gl.bindBuffer(gl.ARRAY_BUFFER, background.vertexBuf);
        gl.vertexAttribPointer(programs[2].attributes[GL_ATTR_VTX], 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, background.colorBuf);
        gl.vertexAttribPointer(programs[2].attributes[GL_ATTR_COL], 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

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
    };

    function drawScene() {
        gl.disable(gl.DEPTH_TEST);
        mat4.identity(mScene);
        mat4.translate(mScene, mScene, transVec);
        mat4.scale(mScene, mScene, scale);
        mat4.multiply(mScene, mScene, rotScene);
        mat4.translate(mScene, mScene, offset);

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
        drawFront();
        gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    function checkGLerror() {
        var error = gl.getError();
        if (error) {
            console.log("GL Error: " + error);
            return true;
        }
        return false;
    }

    (function renderLoop() {
        if (drawCallRequest) {
            drawCallRequest = false;
            drawScene();
        }
        if (!checkGLerror()) {
            requestAnimationFrame(renderLoop);
        }
    })();
}
//# sourceMappingURL=Renderer.js.map
