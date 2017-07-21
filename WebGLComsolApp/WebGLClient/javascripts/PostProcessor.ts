/// <refernce path="libs/gl-matrix.d.ts"/>
/// <refernce path="libs/jquery.d.ts"/>

interface Uint32Array {
    get?(any?: any): any;
}

interface Float32Array {
    get?(any?: any): any;
}

// var EPSILON = 1E-7;

// The maximal Indices size is 65536 binary ( unsigned short integer
var MAX_DATA = 0x10000;

//These are the 3D Types from COMSOL
//the first are isolated Points
//the second are pairs of Points connected to a line
//the third are triple of Points connected to a triangle
function getGeoType(type: string): number {
    switch (type) {
        case TYPE_ARROW_VOLUME:
        case TYPE_ARROW_SURFACE:
        case TYPE_ARROW_LINE:
            return 1;
        case TYPE_PLOTGROUP2D:
        case TYPE_PLOTGROUP3D:
        case TYPE_STREAMLINES:
        case TYPE_LINES:
            return 2;
        case TYPE_VOLUME:
        case TYPE_SLICE:
        case TYPE_MULTISLICE:
        case TYPE_SURFACE:
            return 3;
    }
}

//get the number of the Shader
function getShaderType(type: String, lightOn: boolean, attributes: RenderAttribute[]) {
    switch (type) {
        case TYPE_PLOTGROUP2D:
            return 12;
        case TYPE_PLOTGROUP3D:
            return 1;

        case TYPE_VOLUME:
        case TYPE_SLICE:
        case TYPE_MULTISLICE:
        case TYPE_SURFACE:
            if (attributes[ATTR_DEFX] || attributes[ATTR_DEFY] || attributes[ATTR_DEFZ]) {
                if (lightOn) {
                    return 105;
                } else {
                    return 5;
                }
            } else {
                if (lightOn) {
                    return 103;
                } else {
                    return 3;
                }
            }
            
        case TYPE_ARROW_VOLUME:
        case TYPE_ARROW_SURFACE:
        case TYPE_ARROW_LINE:
            if (lightOn) {
                return 104;
            } else {
                return 4;
            }

        case TYPE_STREAMLINES:
        case TYPE_LINES:
            if (attributes[ATTR_COLOR] || attributes[ATTR_ISO]) {
                if (attributes[ATTR_DEFX] || attributes[ATTR_DEFY] || attributes[ATTR_DEFZ]) {
                    return 5;
                } else {
                    return 3;
                }
            } else if (attributes[ATTR_RAD]) {
                if (lightOn) {
                    return 104;
                } else {
                    return 4;
                }
            } else {
                if (lightOn) {
                    return 101;
                } else {
                    return 1;
                }
            }
    }

}


//The Postprocessing functionality, 
// binary Calculation (Arrows and Normals)
// creating of WebGL Render Items
function PostProcessor(glContext: Web3DContext) {
    var self = this;

    //converts Geometry into WebGL Geometry
    function createWebGLGeom(geom: Geometry): WebGLGeom {
      
        var vertices = glContext.setupArrayBuffer(geom.vertices);
        var indices = glContext.setupElementBuffer(geom.indices);

        var webGLGeom: WebGLGeom = { nVertices: geom.nVertices, nElements: geom.nElements, vertices: vertices, indices: indices};

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

    // This function is for the preparation of Default Plots
    // The can be rendered directly as the are exported by COMSOL
    var prepareDefaultPlot = function (nVertices: number, nElements: number, geomType: number, attributes: RenderAttribute[], vertexData: Float32Array, elementData: Uint32Array, attribData: Float32Array[]): WebGLGeom[] {
        console.log('prepareDefaultPlot is excuted');
        var geomData: Geometry[] = [];
        var webGLData: WebGLGeom[] = [];
        //TODO: As soon as WebGL supports 32 Bit Indexing, this here can be neglected
        // additional annotation by Nan: WebGL 2.0 has supported the 32 Bit Indexing 
        if (nVertices > MAX_DATA) {
            console.log('spiltGeom is executed');
            geomData = splitGeometry(nVertices, nElements, vertexData, elementData, attribData, geomType);
        } else {
            var elementData16 = ConvertIntToShort(elementData);
            var geometry: Geometry = { nVertices: nVertices, nElements: nElements, vertices: vertexData, indices: elementData16, attributes: attribData };
            geomData.push(geometry);
        }
        if (geomType === 3) {   //only triangles have normals
            for (var i = 0; i < geomData.length; i++) {
                calcNormals(geomData[i]);
            }
        }

        // check for Color Attribute
        var isColorTable: RenderAttribute = attributes[ATTR_COLOR] || attributes[ATTR_ISO];
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
    }

    // Prepare Plots based on Point data
    var prepareTypeOnePlot = function (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData): void {
        console.log('prepareTypeOnePlot is excuted');
        var byteOffset = 4;  //4 Bytes Offset for Magic Number
        var binData = renderData.rawData;   //Binary Data containing Vertices indices and Attributes
        var webGLData: WebGLGeom[] = [];
        var geomType = renderGroup.geoType;       //singelPoints
        var plotType = (plotGroup.type == TYPE_PLOTGROUP3D) ? 3 : ((plotGroup.type == TYPE_PLOTGROUP2D) ? 2 : 1);

        var diameter = calcModelDiameter(plotGroup);   //Diameter of the Model

        var attributes = renderGroup.attributes;    //Description of the Attributes

        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * 3); //Offset always in Byte and Length in Float32 (4 Byte)

        byteOffset += renderData.numVert * 3 * 4; // Offset in Bytes
               
        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset + (attributes[name].index * renderData.numVert * 4), renderData.numVert);
        }

        if (attributes[ATTR_VECTORX]) { //ARROW Data
            var attrVX: RenderAttribute = attributes[ATTR_VECTORX];
            var attrVY: RenderAttribute = attributes[ATTR_VECTORY];
            var attrVZ: RenderAttribute = attributes[ATTR_VECTORZ];

            var x = attrVX.max - attrVX.min;
            var y = attrVY.max - attrVY.min;
            var z = attrVZ.max - attrVZ.min;

            var maxL2 = Math.sqrt(x * x + y * y + z * z);

            var scalation = diameter / maxL2 / 10 //Maximal Arrow Length is 10% Percent of Model size (Default, Size)

            var geomData = calcArrowLong(vertexData, attribData[attrVX.index], attribData[attrVY.index], attribData[attrVZ.index], renderData.numVert, scalation);
            
            for (var i = 0; i < geomData.length; i++) {
                webGLData[i] = createWebGLGeom(geomData[i]);
            }
        }
        renderData.geomData = webGLData;
    }

    // Prepare Plots based on Line data
    var prepareTypeTwoPlot = function (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData): void {
        console.log('prepareTypeTwoPlot is excuted');
        var byteOffset = 4;  //4 Bytes Offset for Magic Number
        var binData = renderData.rawData;   //Binary Data containing Vertices indices and Attributes
        var geomType = renderGroup.geoType;
        var plotType = (plotGroup.type == TYPE_PLOTGROUP3D) ? 3 : ((plotGroup.type == TYPE_PLOTGROUP2D) ? 2 : 1);

        var webGLData: WebGLGeom[];

        var diameter = calcModelDiameter(plotGroup);   //Diameter of the Model

        var attributes = renderGroup.attributes;    //Description of the Attributes

        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * plotType); //Offset always in Byte and Length in Float32 (4 Byte)
        byteOffset += renderData.numVert * plotType * Float32Array.BYTES_PER_ELEMENT; // Offset in Bytes
        

        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset, renderData.numVert);
            byteOffset += renderData.numVert * Float32Array.BYTES_PER_ELEMENT; // Offset in Bytes
        }

        var elementData = new Uint32Array(binData, byteOffset, renderData.numEle * 2);
        byteOffset += renderData.numEle * geomType * Uint32Array.BYTES_PER_ELEMENT;  //Offset in Bytes


        if (binData.byteLength !== byteOffset) {
            console.log("Byte sizes differ");
        }

        //check special Attributes
        if (attributes[ATTR_RAD]) { // Render Tubes
            //var attrRadius: RenderAttribute = attributes[ATTR_RAD];

            //var scalation = diameter / attrRadius.max / 100 // Thickest tube is 1 %Percent of Model size, Default Thickness (can manually changed by User)

            //var geomData = calcTube(renderData.numVert, renderData.numEle, vertexData, attribData[attrRadius.index], elementData, scalation);


            //for (var i = 0; i < geomData.length; i++) {
            //    webGLData[i] = createWebGLGeom(geomData[i]);
            //}

        } else {    // If no Tube then this here is a default Plot
            webGLData = prepareDefaultPlot(renderData.numVert, renderData.numEle, geomType, attributes, vertexData, elementData, attribData);
        }

        renderData.geomData = webGLData;
    }

    // Prepare Plots based on Triangle data
    var prepareTypeThreePlot = function (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData): void {
        console.log('prepareTypeThreePlot is excuted');
        var byteOffset = 4;  //4 Bytes Offset for Magic Number
        var binData = renderData.rawData;   //Binary Data containing Vertices indices and Attributes
        var webGLData: WebGLGeom[];
        var geomType = renderGroup.geoType;
        var plotType = (plotGroup.type == TYPE_PLOTGROUP3D) ? 3 : ((plotGroup.type == TYPE_PLOTGROUP2D) ? 2 : 1);

        var diameter = calcModelDiameter(plotGroup);   //Diameter of the Model

        var attributes = renderGroup.attributes;    //Description of the Attributes

        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * plotType); //Offset always in Byte and Length in Float32 (4 Byte)
        byteOffset += renderData.numVert * plotType * Float32Array.BYTES_PER_ELEMENT; // Offset in Bytes

        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset, renderData.numVert);
            byteOffset += renderData.numVert * Float32Array.BYTES_PER_ELEMENT; // Offset in Bytes
        }

        var elementData = new Uint32Array(binData, byteOffset, renderData.numEle * geomType);
        byteOffset += renderData.numEle * geomType * Uint32Array.BYTES_PER_ELEMENT;  //Offset in Bytes

        webGLData = prepareDefaultPlot(renderData.numVert, renderData.numEle, geomType, attributes, vertexData, elementData, attribData);

        renderData.geomData = webGLData;
    }

    // Prepare Plots based on Line data
    var prepareTypeTwo2DPlot = function (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData): void {
        console.log('prepareTypeTwo2DPlot is excuted');
        var byteOffset = 4;  //4 Bytes Offset for Magic Number
        var binData = renderData.rawData;   //Binary Data containing Vertices indices and Attributes
        var webGLData: WebGLGeom[];
        var geomType = renderGroup.geoType;
        var plotType = (plotGroup.type == TYPE_PLOTGROUP3D) ? 3 : ((plotGroup.type == TYPE_PLOTGROUP2D) ? 2 : 1);
        
        var diameter = calcModelDiameter(plotGroup);   //Diameter of the Model

        var attributes = renderGroup.attributes;    //Description of the Attributes

        var vertexData = new Float32Array(binData, byteOffset, renderData.numVert * 3); //Offset always in Byte and Length in Float32 (4 Byte)
        byteOffset += renderData.numVert * 3 * Float32Array.BYTES_PER_ELEMENT; // Offset in Bytes
        console.log('ByteOffset(vertexData): ' + renderData.numVert * plotType * 4);

        var attribData = [];
        for (var name in attributes) {
            attribData[attributes[name].index] = new Float32Array(binData, byteOffset, renderData.numVert);
            byteOffset += renderData.numVert * Float32Array.BYTES_PER_ELEMENT; // Offset in Bytes
        }
        console.log('ByteOffset(attribData): ' + renderData.numVert * 4);
        var elementData = new Uint32Array(binData, byteOffset, renderData.numEle * geomType);
        byteOffset += renderData.numEle * geomType * Uint32Array.BYTES_PER_ELEMENT;  //Offset in Bytes
        console.log('ByteOffset(elementData): ' + byteOffset);
        console.log('binData.byteLength : ' + binData.byteLength + '/nbtyeOffset' + byteOffset);
        if (binData.byteLength !== byteOffset) {
            console.log("Byte sizes differ");
        }

        webGLData = prepareDefaultPlot(renderData.numVert, renderData.numEle, geomType, attributes, vertexData, elementData, attribData);

        renderData.geomData = webGLData;
    }

    /* 
    *  Prepares the raw Data of a plot
    * Calculate normals, arrows, bindBuffer
    */
    this.preparePlotByNumber = function (model: Model, plotGroup: Result, result: Result, groupId: number, dataId: number) {
        var renderGroup = result.renderGroup[groupId];
        var renderData = renderGroup.renderData[dataId];
        this.preparePlot(model, plotGroup, result, renderGroup, renderData);
    };

    /* 
    *  Prepares the raw Data of a plot
    * Calculate normals, arrows, bindBuffer
    */
    this.preparePlot = function (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData) {
        console.log("Preparation of Plot: " + model.name + " / " + plotGroup.name + " / " + result.name + " (" + result.type + ")");
        if (!result.noData && renderData.rawData) { //rawData exists
            renderGroup.geoType = getGeoType(result.type);  //1 = Points, 2 = Lines, 3 = Triangles
            if (plotGroup.type == TYPE_PLOTGROUP3D) {
                switch (renderGroup.geoType) {
                    case 1: prepareTypeOnePlot(model, plotGroup, result, renderGroup, renderData);
                        break;
                    case 2: prepareTypeTwoPlot(model, plotGroup, result, renderGroup, renderData);
                        break;
                    case 3: prepareTypeThreePlot(model, plotGroup, result, renderGroup, renderData);
                        break;
                }
            } else if (plotGroup.type == TYPE_PLOTGROUP2D) {
                switch (renderGroup.geoType) {
                    case 1: prepareTypeOnePlot(model, plotGroup, result, renderGroup, renderData);
                        break;
                    case 2: prepareTypeTwoPlot(model, plotGroup, result, renderGroup, renderData);
                        break;
                    case 3: prepareTypeThreePlot(model, plotGroup, result, renderGroup, renderData);
                        break;
                }
            } else {
                throw "unsupport plotGroup type";
            }
            
            result.usrColor = glContext.getColorNames()[0];
            result.usrText = glContext.getTextureName()[0];
            result.usrScale = 1.0;
        } else {
            throw "no binary data exist";
        }
    }

    //Must be called before a plot from this plotGroup can be rendered
    this.preparePlotGroup = function (model: Model, plotGroup: Result, groupId: number, dataId: number) {
        console.log("Preparation of Plotgroup: " + model.name + " / " + plotGroup.name + " (" + plotGroup.type + ")");
        if (plotGroup.type === TYPE_PLOTGROUP3D) {  //check if Type is of PlotGroup3D
            if (plotGroup.renderGroup[groupId] && plotGroup.renderGroup[groupId].renderData[dataId]) {
                this.preparePlotByNumber(model, plotGroup, plotGroup, groupId, dataId);
            } else {
                plotGroup.noData = true;
            }
        } else if (plotGroup.type === TYPE_PLOTGROUP2D) {
            if (plotGroup.renderGroup[groupId] && plotGroup.renderGroup[groupId].renderData[dataId]) {
                this.preparePlotByNumber(model, plotGroup, plotGroup, groupId, dataId);
            } else {
                plotGroup.noData = true;
            }
        }else {
            throw plotGroup.name + "is not of type Plotgroup";
        }
    }

    /*  This function calculates out of the bounding Box of the Model
    **  the Offsets to place the model into the Middle of the Screen
    **  and the Scalation to place the Model in -1:1 cube
    */
    this.initResultSize = function(result: Result) {
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

        } else if (boundingBox[4] === 0 && boundingBox[5] === 0) {
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
            result.scale[2] = 0;

            result.offset[0] = -(xMax+xMin) / 2;
            result.offset[1] = -(yMax+yMin) / 2;
            result.offset[2] = 0;
        } else {
            throw "unsupported Bounding Box";
        }
    }

}

// Calc the Diameter of the Model
function calcModelDiameter(result: Result): number {
    var x = result.boundBox[1] - result.boundBox[0];     //boundary Box [minX, maxX, minY, maxY, minZ, maxZ]
    var y = result.boundBox[3] - result.boundBox[2];
    var z = result.boundBox[5] - result.boundBox[4];

    return Math.sqrt(x * x + y * y + z * z);
}


// raw Data functions

//This function splits the Buffer into smaller ones, since WebGL is only specified for 16bit indexing
function splitGeometry(nVertex: number, nElements: number, vertexData: Float32Array, elementData: Uint32Array, attribData: Float32Array[], geomType: number): Geometry[] {

    // Size of Data
    var nBuffer: number;
    var nAttrib = attribData.length;

    //calculate number of Buffers
    if (nVertex % MAX_DATA == 0) {   //All Vertex fit exactly into nBuffer Arrays
        nBuffer = nVertex / MAX_DATA;
    } else {
        nBuffer = (nVertex / MAX_DATA) + 1;  //Add one last Buffer for Rest Data
    }

    // number , size of the splitted Buffers
    var nVertPerBuffer: number[];   //number of Vertices per Buffer
    var nElePerBuffer: number[];    //number of Elements per Buffer

    // Here the splitted Data useable for WebGL is saved
    var outVertex: Float32Array[];
    var outAttrib: Float32Array[][];
    var outIndex: Uint16Array[];

    //temporay Array with static maximal size
    var splittedElements: Array<Uint16Array> = new Array(nBuffer);     // here the splitted index data is saved,                                                                    new short[nBuffer][nElement][3];  
    var lastElements = new Uint16Array(nElements * geomType);           // extra buffer for the index data of Triangles / Lines, which don't fit into one Buffer                  new short[nElement][3 or 2];
    var lastCoordinates = new Uint32Array(nVertex)                      // here the index data of Coordinates, which belong to the lastElements Triangles are saved                         new int[nVertex];

    var sizeLastElement = 0;         //pointer to the current size of the lastElements
    var sizeLastCoordinates = 0;     //pointer to the current size of the lastCoordinates
    var sizeCounter: number[];       //pointer to the current size for each Buffer of splitted Elements

    var upperLimit: number[];
    var lowerLimit: number[];

    for (var i = 0; i < nBuffer; i++) {             // sets the limits when to use next buffer  0x10000, 0x20000, ..., nBuffer * 0x10000
        sizeCounter[i] = 0;
        lowerLimit[i] = i * MAX_DATA;
        upperLimit[i] = (i + 1) * MAX_DATA;
        splittedElements[i] = new Uint16Array(nElements * geomType);   //initialize the ArrayBuffer for splitted Elements
    }

    var p1, p2, p3;             // Point 1, 2 and 3 for a triangle, Index for the Vertex Buffer
    var newP1, newP2, newP3     // new Points 1,2 and 3, Index for the splitted Vertex Buffer
    var idx1, idx2, idx3        // Point Index for new Element Buffer


    if (geomType === 2) { // Lines

        LineLoop: for (var i = 0; i < nElements; i++) {   // For each Line

            p1 = elementData.get(geomType * i + 0);  // get All Points for this Line     
            p2 = elementData.get(geomType * i + 1);

            for (var j = 0; j < nBuffer; j++) {  // For each splitted Buffer

                // Check if Lines is completly contained in one Buffer
                if (p1 >= lowerLimit[j] && p1 < upperLimit[j] && p2 >= lowerLimit[j] && p2 < upperLimit[j]) {

                    newP1 = p1 % MAX_DATA, newP2 = p2 % MAX_DATA;               //modulo to convert to Uint16

                    idx1 = sizeCounter[j] * geomType + 0, idx2 = sizeCounter[j] * geomType + 1;      // calc Indices

                    splittedElements[j].set(idx1, p1), splittedElements[j].set(idx2, p2);    //Add to the new Index Buffer

                    sizeCounter[j]++;   // increase the point for the j-Buffer

                    continue LineLoop;   //Next Triangle
                }
            }
            //  Line cannot be put into one Buffer, since some Points are distributed over multiple Buffers.
            //  Thus put them into an extra Buffer
            for (var k = 0; k < sizeLastCoordinates; k++) {  // Search if Point already marked,

                if (p1 === lastCoordinates[k]) {    // Point 1 is found
                    lastElements.set(geomType * sizeLastElement + 0, k);

                } else {    // Point 1 is not found, save point and increase the index pointer
                    lastCoordinates.set(sizeLastCoordinates, p1);
                    lastElements.set(geomType * sizeLastElement + 0, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }

                if (p2 === lastCoordinates[k]) {    // Point 2 is found
                    lastElements.set(geomType * sizeLastElement + 1, k);

                } else {    // Point 2 is not found, save point and increase the index pointer
                    lastCoordinates.set(sizeLastCoordinates, p2);
                    lastElements.set(geomType * sizeLastElement + 1, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
            }
            sizeLastElement++;  //increase the index pointer for last Element, since the Last element Buffer contains now this triangle

        } // END: LineLoop

    } else if (geomType === 3) { // Triangles

        TriangleLoop: for (var i = 0; i < nElements; i++) {   // For each Triangle

            p1 = elementData.get(geomType * i + 0);  // get All Points for this triangle     
            p2 = elementData.get(geomType * i + 1);
            p3 = elementData.get(geomType * i + 2);

            for (var j = 0; j < nBuffer; j++) {  // For each splitted Buffer

                // Check if Triangle is completly contained in one Buffer
                if (p1 >= lowerLimit[j] && p1 < upperLimit[j] && p2 >= lowerLimit[j] && p2 < upperLimit[j] && p3 >= lowerLimit[j] && p3 < upperLimit[j]) {

                    newP1 = p1 % MAX_DATA, newP2 = p2 % MAX_DATA, newP3 = p3 % MAX_DATA;               //modulo to convert to Uint16

                    idx1 = sizeCounter[j] * geomType + 0, idx2 = sizeCounter[j] * geomType + 1, idx3 = sizeCounter[j] * geomType + 2;      // calc Indices

                    splittedElements[j].set(idx1, p1), splittedElements[j].set(idx2, p2), splittedElements[j].set(idx3, p3);    //Add to the new Index Buffer

                    sizeCounter[j]++;   // increase the point for the j-Buffer

                    continue TriangleLoop;   //Next Triangle
                }
            }
            //  Triangle cannot be put into one Buffer, since some Points are distributed over multiple Buffers.
            //  Thus put them into an extra Buffer
            for (var k = 0; k < sizeLastCoordinates; k++) {  // Search if Point already marked,

                if (p1 === lastCoordinates[k]) {    // Point 1 is found
                    lastElements.set(geomType * sizeLastElement + 0, k);

                } else {    // Point 1 is not found, save point and increase the index pointer
                    lastCoordinates.set(sizeLastCoordinates, p1);
                    lastElements.set(geomType * sizeLastElement + 0, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }

                if (p2 === lastCoordinates[k]) {    // Point 2 is found
                    lastElements.set(geomType * sizeLastElement + 1, k);

                } else {    // Point 2 is not found, save point and increase the index pointer
                    lastCoordinates.set(sizeLastCoordinates, p2);
                    lastElements.set(geomType * sizeLastElement + 1, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }

                if (p3 === lastCoordinates[k]) {    // Point 3 is found
                    lastElements.set(geomType * sizeLastElement + 2, k)

            } else {    // Point 3 is not found, save point and increase the index pointer
                    lastCoordinates.set(sizeLastCoordinates, p3);
                    lastElements.set(geomType * sizeLastElement + 2, sizeLastCoordinates);
                    sizeLastCoordinates++;
                }
            }
            sizeLastElement++;  //increase the index pointer for last Element, since the Last element Buffer contains now this triangle

        } // END: TriangleLoop
    }

    if (sizeLastCoordinates > MAX_DATA) {    //So much Data is not normal
        console.log("The size of the plot Data is to high to be handled correctly.");
    }

    //if ((sizeLastCoordinates + (nVertex % maxData)) > maxData) { //one additional index Buffer needed
    nBuffer++;  //increase the number of Buffers
    nVertPerBuffer = new Array(nBuffer);
    nElePerBuffer = new Array(nBuffer);

    // init all Buffers
    outVertex = [];
    outAttrib = [];
    outIndex = [];

    for (var i = 0; i < nBuffer - 2; i++) {
        nVertPerBuffer[i] = MAX_DATA;
        nElePerBuffer[i] = sizeCounter[i];

        //initialize Index buffer[i], unnecessary Data is removed
        outIndex[i] = splittedElements[i].slice(0, geomType * sizeCounter[i]); //slice(begin index, end index), new Feature 

        //initialize Vertex buffer[i]
        outVertex[i] = vertexData.slice(MAX_DATA * 3 * i, MAX_DATA * 3 * (i + 1));

        //initialize Attribute buffer[i]
        outAttrib[i] = [];


        for (var j = 0; j < nAttrib; j++) {
            outAttrib[i][j] = attribData[j].slice(MAX_DATA * i, MAX_DATA);
        }

    }

    //second last Buffer
    nVertPerBuffer[nBuffer - 2] = nVertex % MAX_DATA;
    nElePerBuffer[nBuffer - 2] = sizeCounter[nBuffer - 2];

    //copy (by Ref) Vertex Buffer;
    outVertex[nBuffer - 2] = vertexData.slice(MAX_DATA * 3 * (nBuffer - 2), 3 * nVertex);

    //copy Attribute buffer[i]
    outAttrib[nBuffer - 2] = []             //new Float32Array(nVertPerBuffer[nBuffer - 2] * nAttrib); //Lenght is number of Vertex (maxData)
        for (var j = 0; j < nAttrib; j++) {
        outAttrib[i][j] = attribData[j].slice(MAX_DATA * (nBuffer - 2), nVertex);
    }

    //copy Index Buffer
    outIndex[nBuffer - 2] = splittedElements[nBuffer - 2].slice(0, geomType * nElePerBuffer[nBuffer - 2]);

    //last Buffer
    this.nVertPerBuffer[nBuffer - 1] = sizeLastCoordinates;
    this.nElePerBuffer[nBuffer - 1] = sizeLastElement;

    //copy Vertex and Attribute Buffer
    outVertex[nBuffer - 1] = new Float32Array(3 * sizeLastCoordinates);

    //copy Attribute buffer[i]
    outAttrib[nBuffer - 1] = [];

    var coordIdx: number;
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

    //copy (by Ref) Index Buffer
    outIndex[nBuffer - 1] = lastElements.slice(0, geomType * sizeLastElement);

    /*
    ** the last two Buffers can be merged
    */
    //} else  {
    //    var offset = nVertex % maxData;
    //    nVertPerBuffer = new Array(nBuffer);
    //    nElePerBuffer = new Array(nBuffer);

    //    // init all Buffers
    //    bufVertex = new Array(nBuffer);
    //    bufAttrib = null;
    //    bufIndex = new Array(nBuffer);

    //    for(var i = 0; i < nBuffer - 1; i++){
    //        nVertPerBuffer[i] = maxData;
    //        nElePerBuffer[i] = sizeCounter[i];

    //        //initialize Index buffer[i], unnecessary Data is removed
    //        bufIndex[i] = splittedElements[i].slice(0, geomType * sizeCounter[i]); //slice(begin index, end index), new Feature not all Browser support this feature

    //        //initialize Vertex buffer[i]
    //        bufVertex[i] = vertexData.slice(maxData * 3 * i, maxData * geomType * (i + 1));
    //    }

    //    nVertPerBuffer[nBuffer - 1] = offset + sizeLastCoordinates;
    //    nElePerBuffer[nBuffer - 1] = sizeCounter[nBuffer - 1] + sizeLastElement;

    //    bufVertex[nBuffer - 1] = new Float32Array(3 * nVertPerBuffer[nBuffer - 1]); // 3 (x, y, z ) * number of Vertices

    //    //copy First part of the vertex Data
    //    bufVertex[nBuffer - 1].set(vertexData.slice(maxData * 3 * (nBuffer - 1), maxData * 3 *(nBuffer - 1) + offset * 3, 0));

    //    //copy Second part of the vertex and Attribute Data
    //    for (var i = 0; i < sizeLastCoordinates; i++) {
    //        bufVertex[nBuffer - 1].set(offset + i * 3 + 0, vertexData.get(lastCoordinates.get(i) * 3 + 0));
    //        bufVertex[nBuffer - 1].set(offset + i * 3 + 1, vertexData.get(lastCoordinates.get(i) * 3 + 1));
    //        bufVertex[nBuffer - 1].set(offset + i * 3 + 2, vertexData.get(lastCoordinates.get(i) * 3 + 2));
    //    }

    //    //copy First part of the index data
    //    bufIndex[nBuffer - 1] = new Uint16Array(3 * nElePerBuffer[nBuffer - 1]);
    //    bufIndex[nBuffer - 1].set(splittedElements[nBuffer - 1].slice(0, geomType * sizeCounter[nBuffer - 1]), 0);

    //    //copy Second part of the index data
    //    if (geomType === 2) { // lines
    //        for (i = 0; i < sizeLastElement; i++) {
    //            bufIndex[nBuffer - 1].set(sizeCounter[nBuffer - 1] + geomType * i + 0, lastElements.get(geomType * i + 0) + offset);
    //            bufIndex[nBuffer - 1].set(sizeCounter[nBuffer - 1] + geomType * i + 1, lastElements.get(geomType * i + 1) + offset);
    //        }

    //    } else if (geomType === 3) { //triangles
    //        for (i = 0; i < sizeLastElement; i++) {
    //            bufIndex[nBuffer - 1].set(sizeCounter[nBuffer - 1] + geomType * i + 0, lastElements.get(geomType * i + 0) + offset);
    //            bufIndex[nBuffer - 1].set(sizeCounter[nBuffer - 1] + geomType * i + 1, lastElements.get(geomType * i + 1) + offset);
    //            bufIndex[nBuffer - 1].set(sizeCounter[nBuffer - 1] + geomType * i + 2, lastElements.get(geomType * i + 2) + offset);
    //        }
    //    }
    //} 

        var geoms: Geometry[] = [];

        for (var i = 0; i < nBuffer; i++) {
            geoms[i] = {
                nVertices: nVertPerBuffer[i], vertices: outVertex[i],
                nElements: nElePerBuffer[i], indices: outIndex[i],
                attributes: outAttrib[i]
            };
        }

        return geoms;
    }

//Converting Int to Short
function ConvertIntToShort(int32Array: Uint32Array): Uint16Array {
    var length = int32Array.length;
    var outShort = new Uint16Array(length);

    for (var i = 0; i < length; i++) {
        outShort[i] = int32Array[i];
        //console.log(i + ":  " + int32Array[i] + "   :   " + outShort[i]);
    }
    return outShort;
}


    ////This Function creates an 3D Arrow for each vertex
    //function ArrowCreator() {
    //    var nVertArrow20 = 120;     //number of Vertices per Arrow
    //    var nIdxArrow20 = 96;       //number of Triangles per Arrow
    //    var sizeVertArrow20 = nVertArrow20 * 12;   // byte Size: number of Vertices * 3 (x,y,z) * 4 (4Bytes in Float)
    //    var sizeIdxArrow20 = nIdxArrow20 * 6;      // byte Size  number of Triangles * 3 (3 Points per Triangle) * 2 (2Bytes in Short)

    //    var vertArrow20 = new Float32Array([0.0, 0.03125, 0.0, 0.009656781, 0.029720517, 0.0, 0.018368289,
    //        0.025281781, 0.0, 0.025281781, 0.018368289, 0.0, 0.029720517, 0.009656781, 0.0, 0.03125, 1.9135107E-18,
    //        0.0, 0.029720517, -0.009656781, 0.0, 0.025281781, -0.018368289, 0.0, 0.018368289, -0.025281781, 0.0, 0.009656781,
    //        -0.029720517, 0.0, 3.8270214E-18, -0.03125, 0.0, -0.009656781, -0.029720517, 0.0, -0.018368289, -0.025281781, 0.0,
    //        -0.025281781, -0.018368289, 0.0, -0.029720517, -0.009656781, 0.0, -0.03125, -5.7405317E-18, 0.0, -0.029720517, 0.009656781,
    //        0.0, -0.025281781, 0.018368289, 0.0, -0.018368289, 0.025281781, 0.0, -0.009656781, 0.029720517, 0.0, 0.0, 0.03125, 0.75, 0.009656781,
    //        0.029720517, 0.75, 0.018368289, 0.025281781, 0.75, 0.025281781, 0.018368289, 0.75, 0.029720517, 0.009656781, 0.75, 0.03125, 1.9135107E-18,
    //        0.75, 0.029720517, -0.009656781, 0.75, 0.025281781, -0.018368289, 0.75, 0.018368289, -0.025281781, 0.75, 0.009656781, -0.029720517, 0.75,
    //        3.8270214E-18, -0.03125, 0.75, -0.009656781, -0.029720517, 0.75, -0.018368289, -0.025281781, 0.75, -0.025281781, -0.018368289, 0.75,
    //        -0.029720517, -0.009656781, 0.75, -0.03125, -5.7405317E-18, 0.75, -0.029720517, 0.009656781, 0.75, -0.025281781, 0.018368289, 0.75,
    //        -0.018368289, 0.025281781, 0.75, -0.009656781, 0.029720517, 0.75, 0.0, 0.03125, 0.0, 0.009656781, 0.029720517, 0.0, 0.018368289, 0.025281781,
    //        0.0, 0.025281781, 0.018368289, 0.0, 0.029720517, 0.009656781, 0.0, 0.03125, 1.9135107E-18, 0.0, 0.029720517, -0.009656781, 0.0, 0.025281781,
    //        -0.018368289, 0.0, 0.018368289, -0.025281781, 0.0, 0.009656781, -0.029720517, 0.0, 3.8270214E-18, -0.03125, 0.0, -0.009656781, -0.029720517,
    //        0.0, -0.018368289, -0.025281781, 0.0, -0.025281781, -0.018368289, 0.0, -0.029720517, -0.009656781, 0.0, -0.03125, -5.7405317E-18, 0.0,
    //        -0.029720517, 0.009656781, 0.0, -0.025281781, 0.018368289, 0.0, -0.018368289, 0.025281781, 0.0, -0.009656781, 0.029720517, 0.0, 0.0, 0.125,
    //        0.75, 0.038627125, 0.11888207, 0.75, 0.073473155, 0.101127125, 0.75, 0.101127125, 0.073473155, 0.75, 0.11888207, 0.038627125, 0.75, 0.125,
    //        7.654043E-18, 0.75, 0.11888207, -0.038627125, 0.75, 0.101127125, -0.073473155, 0.75, 0.073473155, -0.101127125, 0.75, 0.038627125, -0.11888207,
    //        0.75, 1.5308086E-17, -0.125, 0.75, -0.038627125, -0.11888207, 0.75, -0.073473155, -0.101127125, 0.75, -0.101127125, -0.073473155, 0.75,
    //        -0.11888207, -0.038627125, 0.75, -0.125, -2.2962127E-17, 0.75, -0.11888207, 0.038627125, 0.75, -0.101127125, 0.073473155, 0.75, -0.073473155,
    //        0.101127125, 0.75, -0.038627125, 0.11888207, 0.75, 0.0, 0.125, 0.75, 0.038627125, 0.11888207, 0.75, 0.073473155, 0.101127125, 0.75, 0.101127125,
    //        0.073473155, 0.75, 0.11888207, 0.038627125, 0.75, 0.125, 7.654043E-18, 0.75, 0.11888207, -0.038627125, 0.75, 0.101127125, -0.073473155, 0.75,
    //        0.073473155, -0.101127125, 0.75, 0.038627125, -0.11888207, 0.75, 1.5308086E-17, -0.125, 0.75, -0.038627125, -0.11888207, 0.75, -0.073473155,
    //        -0.101127125, 0.75, -0.101127125, -0.073473155, 0.75, -0.11888207, -0.038627125, 0.75, -0.125, -2.2962127E-17, 0.75, -0.11888207, 0.038627125,
    //        0.75, -0.101127125, 0.073473155, 0.75, -0.073473155, 0.101127125, 0.75, -0.038627125, 0.11888207, 0.75, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
    //        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
    //        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0
    //    ]);

    //    var normArrow20 = new Float32Array([0.0, 1.0, 0.0, 0.309017, 0.95105654, 0.0, 0.58778524, 0.809017, 0.0, 0.809017, 0.58778524, 0.0, 0.95105654,
    //        0.309017, 0.0, 1.0, 6.123234E-17, 0.0, 0.95105654, -0.309017, 0.0, 0.809017, -0.58778524, 0.0, 0.58778524, -0.809017, 0.0, 0.309017, -0.95105654,
    //        0.0, 1.2246469E-16, -1.0, 0.0, -0.309017, -0.95105654, 0.0, -0.58778524, -0.809017, 0.0, -0.809017, -0.58778524, 0.0, -0.95105654, -0.309017,
    //        0.0, -1.0, -1.8369701E-16, 0.0, -0.95105654, 0.309017, 0.0, -0.809017, 0.58778524, 0.0, -0.58778524, 0.809017, 0.0, -0.309017, 0.95105654, 0.0,
    //        0.0, 1.0, 0.0, 0.309017, 0.95105654, 0.0, 0.58778524, 0.809017, 0.0, 0.809017, 0.58778524, 0.0, 0.95105654, 0.309017, 0.0, 1.0, 6.123234E-17,
    //        0.0, 0.95105654, -0.309017, 0.0, 0.809017, -0.58778524, 0.0, 0.58778524, -0.809017, 0.0, 0.309017, -0.95105654, 0.0, 1.2246469E-16, -1.0, 0.0,
    //        -0.309017, -0.95105654, 0.0, -0.58778524, -0.809017, 0.0, -0.809017, -0.58778524, 0.0, -0.95105654, -0.309017, 0.0, -1.0, -1.8369701E-16, 0.0,
    //        -0.95105654, 0.309017, 0.0, -0.809017, 0.58778524, 0.0, -0.58778524, 0.809017, 0.0, -0.309017, 0.95105654, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    //        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    //        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    //        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    //        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
    //        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.8944272, 0.4472136, 0.2763932, 0.8506508, 0.4472136, 0.5257311, 0.7236068, 0.4472136, 0.7236068, 0.5257311,
    //        0.4472136, 0.8506508, 0.2763932, 0.4472136, 0.8944272, 5.476787E-17, 0.4472136, 0.8506508, -0.2763932, 0.4472136, 0.7236068, -0.5257311, 0.4472136,
    //        0.5257311, -0.7236068, 0.4472136, 0.2763932, -0.8506508, 0.4472136, 1.0953574E-16, -0.8944272, 0.4472136, -0.2763932, -0.8506508, 0.4472136, -0.5257311,
    //        -0.7236068, 0.4472136, -0.7236068, -0.5257311, 0.4472136, -0.8506508, -0.2763932, 0.4472136, -0.8944272, -1.6430361E-16, 0.4472136, -0.8506508, 0.2763932,
    //        0.4472136, -0.7236068, 0.5257311, 0.4472136, -0.5257311, 0.7236068, 0.4472136, -0.2763932, 0.8506508, 0.4472136, 0.13991924, 0.8834153, 0.4472136,
    //        0.40606144, 0.79694045, 0.4472136, 0.6324555, 0.6324555, 0.4472136, 0.79694045, 0.40606144, 0.4472136, 0.8834153, 0.13991924, 0.4472136, 0.8834153,
    //        -0.13991924, 0.4472136, 0.79694045, -0.40606144, 0.4472136, 0.6324555, -0.6324555, 0.4472136, 0.40606144, -0.79694045, 0.4472136, 0.13991924, -0.8834153,
    //        0.4472136, -0.13991924, -0.8834153, 0.4472136, -0.40606144, -0.79694045, 0.4472136, -0.6324555, -0.6324555, 0.4472136, -0.79694045, -0.40606144, 0.4472136,
    //        -0.8834153, -0.13991924, 0.4472136, -0.8834153, 0.13991924, 0.4472136, -0.79694045, 0.40606144, 0.4472136, -0.6324555, 0.6324555, 0.4472136, -0.40606144,
    //        0.79694045, 0.4472136, -0.13991924, 0.8834153, 0.4472136
    //    ]);

    //    var idxArrow20 = new Uint16Array([0, 1, 20, 20, 1, 21, 1, 2, 21, 21, 2, 22, 2, 3, 22, 22, 3, 23, 3, 4, 23, 23, 4, 24, 4, 5, 24, 24, 5, 25, 5, 6, 25, 25, 6, 26,
    //        6, 7, 26, 26, 7, 27, 7, 8, 27, 27, 8, 28, 8, 9, 28, 28, 9, 29, 9, 10, 29, 29, 10, 30, 10, 11, 30, 30, 11, 31, 11, 12, 31, 31, 12, 32, 12, 13, 32, 32, 13,
    //        33, 13, 14, 33, 33, 14, 34, 14, 15, 34, 34, 15, 35, 15, 16, 35, 35, 16, 36, 16, 17, 36, 36, 17, 37, 17, 18, 37, 37, 18, 38, 18, 19, 38, 38, 19, 39, 19, 0,
    //        39, 39, 0, 20, 40, 41, 42, 40, 42, 43, 40, 43, 44, 40, 44, 45, 40, 45, 46, 40, 46, 47, 40, 47, 48, 40, 48, 49, 40, 49, 50, 40, 50, 51, 40, 51, 52, 40, 52,
    //        53, 40, 53, 54, 40, 54, 55, 40, 55, 56, 40, 56, 57, 40, 57, 58, 40, 58, 59, 60, 61, 62, 60, 62, 63, 60, 63, 64, 60, 64, 65, 60, 65, 66, 60, 66, 67, 60, 67,
    //        68, 60, 68, 69, 60, 69, 70, 60, 70, 71, 60, 71, 72, 60, 72, 73, 60, 73, 74, 60, 74, 75, 60, 75, 76, 60, 76, 77, 60, 77, 78, 60, 78, 79, 80, 81, 100, 81, 82,
    //        101, 82, 83, 102, 83, 84, 103, 84, 85, 104, 85, 86, 105, 86, 87, 106, 87, 88, 107, 88, 89, 108, 89, 90, 109, 90, 91, 110, 91, 92, 111, 92, 93, 112, 93, 94,
    //        113, 94, 95, 114, 95, 96, 115, 96, 97, 116, 97, 98, 117, 98, 99, 118, 99, 80, 119
    //    ]);

    //    this.calcArrow = function (vertices: Float32Array, vectX: Float32Array, vectY: Float32Array, vectZ: Float32Array, nVertices: number, scalation: number): ArrowData {
    //        if (vertices.length !== 3 * vectX.length ||
    //            vertices.length !== 3 * vectY.length ||
    //            vertices.length !== 3 * vectZ.length) {
    //            throw "invalid arrow data";
    //        }

    //        var nArrow = nVertices                          //number of Arrows;
    //        var vertSize = nArrow * sizeVertArrow20;        //number of new Vertices
    //        var idxSize = nArrow * sizeIdxArrow20;          //number of new Elements

    //        var vert = new Float32Array(vertSize);
    //        var posi = new Float32Array(vertSize);
    //        var norms = new Float32Array(vertSize);
    //        var idx = new Uint16Array(idxSize);

    //        var matNorm = new Float64Array(9);      //rotation Matrix
    //        var len: number;                        //lenght of Arrow, scalation factor

    //        var tmpX: number, tmpY: number, tmpZ: number, tmp1: number;
    //        var arwX: number, arwY: number, arwZ: number;                                       //arrow Coordinates X,Y,Z
    //        var radA: number, radB: number, sA: number, sB: number, cA: number, cB: number;     //rad: Radiant, s: sinus, c: cosinus
    //        var vertOff = 0, idxOff = 0;                                                  //Offset for indexing the arrays

    //        for (var i = 0; i < nArrow * 3; i += 3) { //for each Arrow
    //            tmpX = vectX[i];
    //            tmpY = vectY[i];
    //            tmpZ = vectZ[i];
    //            len = Math.sqrt(tmpX * tmpX + tmpY * tmpY + tmpZ * tmpZ); //lenght of the Arrow

    //            if (len < EPSILON) {    //if too small than jump to next
    //                continue;
    //            }
    //            tmp1 = 1 / len; //normalize the length
    //            tmpX *= tmp1;
    //            tmpY *= tmp1;
    //            tmpZ *= tmp1;

    //            tmp1 = Math.sqrt(1 - tmpZ * tmpZ);    //create rotation Matrix for Arrow
    //            if (tmpZ >= 0) {
    //                radA = Math.asin(tmpY > 0 ? -tmp1 : tmp1);
    //                radB = Math.asin(tmpY < 0 ? tmpX / tmp1 : -tmpX / tmp1);

    //                sA = Math.sin(radA);
    //                sB = Math.sin(radB);
    //                cA = Math.cos(radA);
    //                cB = Math.cos(radB);

    //                matNorm[0] = cB;
    //                matNorm[1] = sB;
    //                matNorm[2] = 0;

    //                matNorm[3] = -sB * cA;
    //                matNorm[4] = cB * cA;
    //                matNorm[5] = sA;

    //                matNorm[6] = sA * sB;
    //                matNorm[7] = -cB * sA;
    //                matNorm[8] = cA;
    //            } else {
    //                radA = Math.asin(tmpY > 0 ? tmp1 : -tmp1);
    //                radB = Math.asin(tmpY < 0 ? tmpX / tmp1 : -tmpX / tmp1);

    //                sA = Math.sin(radA);
    //                sB = Math.sin(radB);
    //                cA = Math.cos(radA);
    //                cB = Math.cos(radB);

    //                matNorm[0] = -cB;
    //                matNorm[1] = -sB;
    //                matNorm[2] = 0;

    //                matNorm[3] = sB * cA;
    //                matNorm[4] = -cB * cA;
    //                matNorm[5] = -sA;

    //                matNorm[6] = -sA * sB;
    //                matNorm[7] = cB * sA;
    //                matNorm[8] = -cA;
    //            }

    //            var len = scalation * len;  // multiply by the external Scalation

    //            for (var j = 0; j < nVertArrow20 * 3; j += 3) { //for each vertex in arrow
    //                posi[vertOff + j] = vertices[i];
    //                posi[vertOff + j + 1] = vertices[i + 1];
    //                posi[vertOff + j + 2] = vertices[i + 2];

    //                arwX = vertArrow20[j];
    //                arwY = vertArrow20[j + 1];
    //                arwZ = vertArrow20[j + 2];

    //                //multiply arrow vertex with rotation matrix and scalation factor
    //                vert[vertOff + j] = len * (matNorm[0] * arwX + matNorm[3] * arwY + matNorm[6] * arwZ);
    //                vert[vertOff + j + 1] = len * (matNorm[1] * arwX + matNorm[4] * arwY + matNorm[7] * arwZ);
    //                vert[vertOff + j + 2] = len * (matNorm[2] * arwX + matNorm[5] * arwY + matNorm[8] * arwZ);

    //                arwX = normArrow20[j];
    //                arwY = normArrow20[j + 1];
    //                arwZ = normArrow20[j + 2];

    //                //multiplty arrow norm Vector with rotation matrix
    //                norms[vertOff + j] = matNorm[0] * arwX + matNorm[3] * arwY + matNorm[6] * arwZ;
    //                norms[vertOff + j + 1] = matNorm[1] * arwX + matNorm[4] * arwY + matNorm[7] * arwZ;
    //                norms[vertOff + j + 2] = matNorm[2] * arwX + matNorm[5] * arwY + matNorm[8] * arwZ;

    //            }
    //            for (var j = 0; j < nIdxArrow20 * 3; j += 3) {  //for each index in arrow
    //                idx[idxOff + j] = idxArrow20[j] + vertOff;
    //                idx[idxOff + j + 1] = idxArrow20[j + 1] + vertOff;
    //                idx[idxOff + j + 2] = idxArrow20[j + 2] + vertOff;
    //            }
    //            vertOff += nVertArrow20;
    //            idxOff += (3 * nIdxArrow20);

    //        }
    //        var arrowData: any = {};
    //        arrowData.vertices = new Float32Array(vert, 0, vertOff);
    //        arrowData.normals = new Float32Array(norms, 0, vertOff);
    //        arrowData.position = new Float32Array(posi, 0, vertOff);
    //        arrowData.indices = idx;

    //        return arrowData;
    //    }

    //    this.getNumVertPerArrow = function (): number {
    //        return nVertArrow20;
    //    }

    //    this.getNumElePerArrow = function (): number {
    //        return nIdxArrow20;
    //    }
    //}
