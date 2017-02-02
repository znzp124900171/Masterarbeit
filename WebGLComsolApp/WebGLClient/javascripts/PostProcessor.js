var MAX_DATA = 0x10000;
function getGeoType(type) {
    switch (type) {
        case TYPE_PLOTGROUP1D:
        case TYPE_ARROW_VOLUME:
        case TYPE_ARROW_SURFACE:
        case TYPE_ARROW_LINE:
            return 1;
        case TYPE_PLOTGROUP2D:
        case TYPE_PLOTGROUP3D:
        case TYPE_STREAMLINES:
        case TYPE_LINES:
        case TYPE_SURFACE:
            return 2;
        case TYPE_VOLUME:
        case TYPE_SLICE:
        case TYPE_MULTISLICE:
        case TYPE_SURFACE:
            return 3;
    }
}
function getShaderType(type, lightOn, attributes) {
    switch (type) {
        case TYPE_PLOTGROUP2D:
            return 99;
        case TYPE_PLOTGROUP1D:
        case TYPE_PLOTGROUP3D:
            return 1;
        case TYPE_VOLUME:
        case TYPE_SLICE:
        case TYPE_MULTISLICE:
        case TYPE_SURFACE:
            if (attributes[ATTR_DEFX] || attributes[ATTR_DEFY] || attributes[ATTR_DEFZ]) {
                if (lightOn) {
                    return 105;
                }
                else {
                    return 5;
                }
            }
            else {
                if (lightOn) {
                    return 103;
                }
                else {
                    return 3;
                }
            }
        case TYPE_ARROW_VOLUME:
        case TYPE_ARROW_SURFACE:
        case TYPE_ARROW_LINE:
            if (lightOn) {
                return 104;
            }
            else {
                return 4;
            }
        case TYPE_STREAMLINES:
        case TYPE_LINES:
            if (attributes[ATTR_COLOR] || attributes[ATTR_ISO]) {
                if (attributes[ATTR_DEFX] || attributes[ATTR_DEFY] || attributes[ATTR_DEFZ]) {
                    return 5;
                }
                else {
                    return 3;
                }
            }
            else if (attributes[ATTR_RAD]) {
                if (lightOn) {
                    return 104;
                }
                else {
                    return 4;
                }
            }
            else {
                if (lightOn) {
                    return 101;
                }
                else {
                    return 1;
                }
            }
    }
}
function PostProcessor(glContext) {
    var self = this;
    function createWebGLGeom(geom) {
        var vertices = glContext.setupArrayBuffer(geom.vertices);
        var indices = glContext.setupElementBuffer(geom.indices);
        var webGLGeom = { nVertices: geom.nVertices, nElements: geom.nElements, vertices: vertices, indices: indices };
        if (geom.normals) {
            webGLGeom.normals = glContext.setupArrayBuffer(geom.normals);
        }
        if (geom.attributes) {
            webGLGeom.attributes = [];
            for (var i = 0; i < geom.attributes.length; i++) {
                webGLGeom.attributes[i] = glContext.setupArrayBuffer(geom.attributes[i]);
            }
        }
        if (geom.position) {
            webGLGeom.position = glContext.setupArrayBuffer(geom.position);
        }
        return webGLGeom;
    }
    var prepareDefaultPlot = function (nVertices, nElements, geomType, attributes, vertexData, elementData, attribData) {
        console.log('prepareDefaultPlot is excuted');
        var geomData = [];
        var webGLData = [];
        if (nVertices > MAX_DATA) {
            console.log('spiltGeom is executed');
            geomData = splitGeometry(nVertices, nElements, vertexData, elementData, attribData, geomType);
        }
        else {
            var elementData16 = ConvertIntToShort(elementData);
            var geometry = { nVertices: nVertices, nElements: nElements, vertices: vertexData, indices: elementData16, attributes: attribData };
            geomData.push(geometry);
        }
        if (geomType === 3) {
            for (var i = 0; i < geomData.length; i++) {
                calcNormals(geomData[i]);
            }
        }
        var isColorTable = attributes[ATTR_COLOR] || attributes[ATTR_ISO];
        if (isColorTable) {
            var colorData = attribData[isColorTable.index];
            for (var i = 0; i < geomData.length; i++) {
                var geom = geomData[i];
                geom.attributes[isColorTable.index] = normalizeScalars(geom.attributes[isColorTable.index], isColorTable.min, isColorTable.max);
            }
        }
        for (var i = 0; i < geomData.length; i++) {
            webGLData[i] = createWebGLGeom(geomData[i]);
        }
        return webGLData;
    };
    var prepareTypeOnePlot = function (model, plotGroup, result, renderGroup, renderData) {
        console.log('prepareTypeOnePlot is excuted');
        var byteOffset = 4;
        var binData = renderData.rawData;
        var geomType = 1;
        var webGLData = [];
        var diameter = calcModelDiameter(plotGroup);
        var attributes = renderGroup.attributes;
        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * 3);
        byteOffset += renderData.numVert * 3 * 4;
        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset + (attributes[name].index * renderData.numVert * 4), renderData.numVert);
        }
        if (attributes[ATTR_VECTORX]) {
            var attrVX = attributes[ATTR_VECTORX];
            var attrVY = attributes[ATTR_VECTORY];
            var attrVZ = attributes[ATTR_VECTORZ];
            var x = attrVX.max - attrVX.min;
            var y = attrVY.max - attrVY.min;
            var z = attrVZ.max - attrVZ.min;
            var maxL2 = Math.sqrt(x * x + y * y + z * z);
            var scalation = diameter / maxL2 / 10;
            var geomData = calcArrowLong(vertexData, attribData[attrVX.index], attribData[attrVY.index], attribData[attrVZ.index], renderData.numVert, scalation);
            for (var i = 0; i < geomData.length; i++) {
                webGLData[i] = createWebGLGeom(geomData[i]);
            }
        }
        renderData.geomData = webGLData;
    };
    var prepareTypeTwoPlot = function (model, plotGroup, result, renderGroup, renderData) {
        console.log('prepareTypeTwoPlot is excuted');
        var byteOffset = 4;
        var binData = renderData.rawData;
        var geomType = 2;
        var plotType = 0;
        if (plotGroup.type == TYPE_PLOTGROUP3D) {
            plotType = 3;
        }
        else if (plotGroup.type == TYPE_PLOTGROUP2D) {
            plotType = 2;
        }
        var webGLData;
        var diameter = calcModelDiameter(plotGroup);
        var attributes = renderGroup.attributes;
        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * plotType);
        byteOffset += renderData.numVert * plotType * 4;
        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset, renderData.numVert);
            byteOffset += renderData.numVert * 4;
        }
        var elementData = new Uint32Array(binData, byteOffset, renderData.numEle * 2);
        byteOffset += renderData.numEle * geomType * 4;
        if (binData.byteLength !== byteOffset) {
            console.log("Byte sizes differ");
        }
        if (attributes[ATTR_RAD]) {
        }
        else {
            webGLData = prepareDefaultPlot(renderData.numVert, renderData.numEle, geomType, attributes, vertexData, elementData, attribData);
        }
        renderData.geomData = webGLData;
    };
    var prepareTypeThreePlot = function (model, plotGroup, result, renderGroup, renderData) {
        console.log('prepareTypeThreePlot is excuted');
        var byteOffset = 4;
        var binData = renderData.rawData;
        var webGLData;
        var geomType = 3;
        var diameter = calcModelDiameter(plotGroup);
        var attributes = renderGroup.attributes;
        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * 3);
        byteOffset += renderData.numVert * 3 * 4;
        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset, renderData.numVert);
            byteOffset += renderData.numVert * 4;
        }
        var elementData = new Uint32Array(binData, byteOffset, renderData.numEle * geomType);
        byteOffset += renderData.numEle * geomType * 4;
        webGLData = prepareDefaultPlot(renderData.numVert, renderData.numEle, geomType, attributes, vertexData, elementData, attribData);
        renderData.geomData = webGLData;
    };
    this.preparePlotByNumber = function (model, plotGroup, result, groupId, dataId) {
        var renderGroup = result.renderGroup[groupId];
        var renderData = renderGroup.renderData[dataId];
        this.preparePlot(model, plotGroup, result, renderGroup, renderData);
    };
    this.preparePlot = function (model, plotGroup, result, renderGroup, renderData) {
        console.log("Preparation of Plot: " + model.name + " / " + plotGroup.name + " / " + result.name + " (" + result.type + ")");
        if (!result.noData && renderData.rawData) {
            renderGroup.geoType = getGeoType(result.type);
            switch (renderGroup.geoType) {
                case 1:
                    prepareTypeOnePlot(model, plotGroup, result, renderGroup, renderData);
                    break;
                case 2:
                    prepareTypeTwoPlot(model, plotGroup, result, renderGroup, renderData);
                    break;
                case 3:
                    prepareTypeThreePlot(model, plotGroup, result, renderGroup, renderData);
                    break;
            }
            result.usrColor = glContext.getColorNames()[0];
            result.usrText = glContext.getTextureName()[0];
            result.usrScale = 1.0;
        }
        else {
            throw "no binary data exist";
        }
    };
    this.preparePlotGroup = function (model, plotGroup, groupId, dataId) {
        console.log("Preparation of Plotgroup: " + model.name + " / " + plotGroup.name + " (" + plotGroup.type + ")");
        if (plotGroup.type === TYPE_PLOTGROUP3D) {
            if (plotGroup.renderGroup[groupId] && plotGroup.renderGroup[groupId].renderData[dataId]) {
                this.preparePlotByNumber(model, plotGroup, plotGroup, groupId, dataId);
            }
            else {
                plotGroup.noData = true;
            }
        }
        else if (plotGroup.type === TYPE_PLOTGROUP2D) {
            if (plotGroup.renderGroup[groupId] && plotGroup.renderGroup[groupId].renderData[dataId]) {
                this.preparePlotByNumber(model, plotGroup, plotGroup, groupId, dataId);
            }
            else {
                plotGroup.noData = true;
            }
        }
        else {
            throw plotGroup.name + "is not of type Plotgroup";
        }
    };
    this.initResultSize = function (result) {
        var rangeScale;
        var recipScale;
        var boundingBox = result.boundBox;
        result.scale = new Float32Array(3);
        result.offset = new Float32Array(3);
        if (boundingBox[4] !== 0 && boundingBox[5] !== 0) {
            console.log('step 1');
            var xMin = boundingBox[0];
            var xMax = boundingBox[1];
            var yMin = boundingBox[2];
            var yMax = boundingBox[3];
            var zMin = boundingBox[4];
            var zMax = boundingBox[5];
            var xRange = xMax - xMin;
            var yRange = yMax - yMin;
            var zRange = zMax - zMin;
            rangeScale = (xRange > yRange) ? ((xRange > zRange) ? xRange : zRange) : ((yRange > zRange) ? yRange : zRange);
            recipScale = 1 / rangeScale;
            result.scale[0] = recipScale;
            result.scale[1] = recipScale;
            result.scale[2] = recipScale;
            result.offset[0] = -(xMax + xMin) / 2;
            result.offset[1] = -(yMax + yMin) / 2;
            result.offset[2] = -(zMax + zMin) / 2;
        }
        else if (boundingBox[4] === 0 && boundingBox[5] === 0) {
            console.log('step 2');
            var xMin = boundingBox[0];
            var xMax = boundingBox[1];
            var yMin = boundingBox[2];
            var yMax = boundingBox[3];
            var xRange = xMax - xMin;
            var yRange = yMax - yMin;
            rangeScale = (xRange > yRange) ? 2 * xRange : 2 * yRange;
            recipScale = 1 / rangeScale;
            result.scale[0] = recipScale;
            result.scale[1] = recipScale;
            result.scale[2] = recipScale;
            result.offset[0] = 0;
            result.offset[1] = 0;
            result.offset[2] = 0;
        }
        else {
            throw "unsupported Bounding Box";
        }
    };
}
function calcModelDiameter(result) {
    var x = result.boundBox[1] - result.boundBox[0];
    var y = result.boundBox[3] - result.boundBox[2];
    var z = result.boundBox[5] - result.boundBox[4];
    return Math.sqrt(x * x + y * y + z * z);
}
function splitGeometry(nVertex, nElements, vertexData, elementData, attribData, geomType) {
    var nBuffer;
    var nAttrib = attribData.length;
    if (nVertex % MAX_DATA == 0) {
        nBuffer = nVertex / MAX_DATA;
    }
    else {
        nBuffer = (nVertex / MAX_DATA) + 1;
    }
    var nVertPerBuffer;
    var nElePerBuffer;
    var outVertex;
    var outAttrib;
    var outIndex;
    var splittedElements = new Array(nBuffer);
    var lastElements = new Uint16Array(nElements * geomType);
    var lastCoordinates = new Uint32Array(nVertex);
    var sizeLastElement = 0;
    var sizeLastCoordinates = 0;
    var sizeCounter;
    var upperLimit;
    var lowerLimit;
    for (var i = 0; i < nBuffer; i++) {
        sizeCounter[i] = 0;
        lowerLimit[i] = i * MAX_DATA;
        upperLimit[i] = (i + 1) * MAX_DATA;
        splittedElements[i] = new Uint16Array(nElements * geomType);
    }
    var p1, p2, p3;
    var newP1, newP2, newP3;
    var idx1, idx2, idx3;
    if (geomType === 2) {
        LineLoop: for (var i = 0; i < nElements; i++) {
            p1 = elementData.get(geomType * i + 0);
            p2 = elementData.get(geomType * i + 1);
            for (var j = 0; j < nBuffer; j++) {
                if (p1 >= lowerLimit[j] && p1 < upperLimit[j] && p2 >= lowerLimit[j] && p2 < upperLimit[j]) {
                    newP1 = p1 % MAX_DATA, newP2 = p2 % MAX_DATA;
                    idx1 = sizeCounter[j] * geomType + 0, idx2 = sizeCounter[j] * geomType + 1;
                    splittedElements[j].set(idx1, p1), splittedElements[j].set(idx2, p2);
                    sizeCounter[j]++;
                    continue LineLoop;
                }
            }
            for (var k = 0; k < sizeLastCoordinates; k++) {
                if (p1 === lastCoordinates[k]) {
                    lastElements.set(geomType * sizeLastElement + 0, k);
                }
                else {
                    lastCoordinates.set(sizeLastCoordinates, p1);
                    lastElements.set(geomType * sizeLastElement + 0, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
                if (p2 === lastCoordinates[k]) {
                    lastElements.set(geomType * sizeLastElement + 1, k);
                }
                else {
                    lastCoordinates.set(sizeLastCoordinates, p2);
                    lastElements.set(geomType * sizeLastElement + 1, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
            }
            sizeLastElement++;
        }
    }
    else if (geomType === 3) {
        TriangleLoop: for (var i = 0; i < nElements; i++) {
            p1 = elementData.get(geomType * i + 0);
            p2 = elementData.get(geomType * i + 1);
            p3 = elementData.get(geomType * i + 2);
            for (var j = 0; j < nBuffer; j++) {
                if (p1 >= lowerLimit[j] && p1 < upperLimit[j] && p2 >= lowerLimit[j] && p2 < upperLimit[j] && p3 >= lowerLimit[j] && p3 < upperLimit[j]) {
                    newP1 = p1 % MAX_DATA, newP2 = p2 % MAX_DATA, newP3 = p3 % MAX_DATA;
                    idx1 = sizeCounter[j] * geomType + 0, idx2 = sizeCounter[j] * geomType + 1, idx3 = sizeCounter[j] * geomType + 2;
                    splittedElements[j].set(idx1, p1), splittedElements[j].set(idx2, p2), splittedElements[j].set(idx3, p3);
                    sizeCounter[j]++;
                    continue TriangleLoop;
                }
            }
            for (var k = 0; k < sizeLastCoordinates; k++) {
                if (p1 === lastCoordinates[k]) {
                    lastElements.set(geomType * sizeLastElement + 0, k);
                }
                else {
                    lastCoordinates.set(sizeLastCoordinates, p1);
                    lastElements.set(geomType * sizeLastElement + 0, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
                if (p2 === lastCoordinates[k]) {
                    lastElements.set(geomType * sizeLastElement + 1, k);
                }
                else {
                    lastCoordinates.set(sizeLastCoordinates, p2);
                    lastElements.set(geomType * sizeLastElement + 1, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
                if (p3 === lastCoordinates[k]) {
                    lastElements.set(geomType * sizeLastElement + 2, k);
                }
                else {
                    lastCoordinates.set(sizeLastCoordinates, p3);
                    lastElements.set(geomType * sizeLastElement + 2, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
            }
            sizeLastElement++;
        }
    }
    if (sizeLastCoordinates > MAX_DATA) {
        console.log("The size of the plot Data is to high to be handled correctly.");
    }
    nBuffer++;
    nVertPerBuffer = new Array(nBuffer);
    nElePerBuffer = new Array(nBuffer);
    outVertex = [];
    outAttrib = [];
    outIndex = [];
    for (var i = 0; i < nBuffer - 2; i++) {
        nVertPerBuffer[i] = MAX_DATA;
        nElePerBuffer[i] = sizeCounter[i];
        outIndex[i] = splittedElements[i].slice(0, geomType * sizeCounter[i]);
        outVertex[i] = vertexData.slice(MAX_DATA * 3 * i, MAX_DATA * 3 * (i + 1));
        outAttrib[i] = [];
        for (var j = 0; j < nAttrib; j++) {
            outAttrib[i][j] = attribData[j].slice(MAX_DATA * i, MAX_DATA);
        }
    }
    nVertPerBuffer[nBuffer - 2] = nVertex % MAX_DATA;
    nElePerBuffer[nBuffer - 2] = sizeCounter[nBuffer - 2];
    outVertex[nBuffer - 2] = vertexData.slice(MAX_DATA * 3 * (nBuffer - 2), 3 * nVertex);
    outAttrib[nBuffer - 2] = [];
    for (var j = 0; j < nAttrib; j++) {
        outAttrib[i][j] = attribData[j].slice(MAX_DATA * (nBuffer - 2), nVertex);
    }
    outIndex[nBuffer - 2] = splittedElements[nBuffer - 2].slice(0, geomType * nElePerBuffer[nBuffer - 2]);
    this.nVertPerBuffer[nBuffer - 1] = sizeLastCoordinates;
    this.nElePerBuffer[nBuffer - 1] = sizeLastElement;
    outVertex[nBuffer - 1] = new Float32Array(3 * sizeLastCoordinates);
    outAttrib[nBuffer - 1] = [];
    var coordIdx;
    for (var i = 0; i < sizeLastCoordinates; i++) {
        coordIdx = lastCoordinates.get(i);
        outVertex[nBuffer - 1].set(i * 3 + 0, vertexData.get(coordIdx * 3 + 0));
        outVertex[nBuffer - 1].set(i * 3 + 1, vertexData.get(coordIdx * 3 + 1));
        outVertex[nBuffer - 1].set(i * 3 + 2, vertexData.get(coordIdx * 3 + 2));
        for (var j = 0; j < nAttrib; j++) {
            outAttrib[nBuffer - 1][j] = new Float32Array(sizeLastCoordinates);
            outAttrib[nBuffer - 1][j].set(i, attribData[j].get(coordIdx));
        }
    }
    outIndex[nBuffer - 1] = lastElements.slice(0, geomType * sizeLastElement);
    var geoms = [];
    for (var i = 0; i < nBuffer; i++) {
        geoms[i] = {
            nVertices: nVertPerBuffer[i], vertices: outVertex[i],
            nElements: nElePerBuffer[i], indices: outIndex[i],
            attributes: outAttrib[i]
        };
    }
    return geoms;
}
function ConvertIntToShort(int32Array) {
    var length = int32Array.length;
    var outShort = new Uint16Array(length);
    for (var i = 0; i < length; i++) {
        outShort[i] = int32Array[i];
    }
    return outShort;
}
