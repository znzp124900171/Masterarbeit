/// <reference path="./Interfaces.ts"/>
/// <reference path="./initWebGL.ts"/>
/// <refernce path="libs/gl-matrix.d.ts"/>

var EPSILON = 1E-7;

// single Geometry
interface Geometry {
    nVertices: number;
    nElements?: number;
    vertices: Float32Array;
    indices?: Uint16Array;
    attributes?: Float32Array[];
    normals?: Float32Array;
    position?: Float32Array;
}

interface WebGLGeom {
    nVertices?: number;
    vertices?: WebGLBuffer;
    nElements?: number;
    indices?: WebGLBuffer;
    normals?: WebGLBuffer;
    position?: WebGLBuffer;
    attributes?: WebGLBuffer[];
} 

// chain are necessary to extract Tubes out of the raw Data
interface Chain {
    start: number;
    end: number;
    startIdx: number;
    endIdx: number;
    closed: boolean;
}

function Chain(start: number, end: number, startIdx: number, endIdx: number) {
    this.start = start;
    this.end = end;
    this.startIdx = startIdx;
    this.endIdx = endIdx;
    this.closed = closed;
} 

//This Function creates a 3D Sphere
function createSphere(widthSegments: number, heightSegments: number, phiStart: number, phiLength: number, thetaStart: number, thetaLength: number): Geometry {

    var thetaEnd = thetaStart + thetaLength;
    var vertexCount = ((widthSegments + 1) * (heightSegments + 1));

    var vertices = new Float32Array(vertexCount * 3);
    var normals = new Float32Array(vertexCount * 3);

    var index = 0;
    var vertex = vec3.create();
    var normal = vec3.create();

    var indicesUnsorted = [];

    for (var y = 0; y <= heightSegments; y++) {
        var v = y / heightSegments;
        var indexRow = [];

        for (var x = 0; x <= widthSegments; x++) {

            var u = x / widthSegments;

            vertex.set([-1 * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                Math.cos(thetaStart + v * thetaLength),
                Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength)]);

            vertices.set(vertex, index * 3);
            normals.set(vertex, index * 3);    // Unit Sphere has vertices end normals identity

            index++;
        }
        indicesUnsorted.push(indexRow);
    }

    var indices = [];

    // here the indexing for the Triangles is created
    for (var y = 0; y < heightSegments; y++) {

        for (var x = 0; x < widthSegments; x++) {

            var v1 = indicesUnsorted[y][x + 1];
            var v2 = indicesUnsorted[y][x];
            var v3 = indicesUnsorted[y + 1][x];
            var v4 = indicesUnsorted[y + 1][x + 1];

            if (y !== 0 || thetaStart > 0) {
                indices.push(v1, v2, v4);
            }
            if (y !== heightSegments - 1 || thetaEnd < Math.PI) {
                indices.push(v2, v3, v4);
            }
        }
    }
    var elementData = new Uint16Array(indices);

    var geometry: Geometry;
    geometry.nVertices = vertexCount;
    geometry.vertices = vertices;
    geometry.nElements = indices.length;
    geometry.indices = elementData;
    geometry.normals = normals;

    return geometry;
}

//This Function creates 3D Arrow with constant 120 Vertices
// As in the Spere the Arrow has 20 width segments
function createArrow120() : Geometry {
    var nVertArrow20 = 120;     //number of Vertices per Arrow
    var nIdxArrow20 = 96;       //number of Triangles per Arrow

    var vertices = new Float32Array([0.0, 0.03125, 0.0, 0.009656781, 0.029720517, 0.0, 0.018368289,
        0.025281781, 0.0, 0.025281781, 0.018368289, 0.0, 0.029720517, 0.009656781, 0.0, 0.03125, 1.9135107E-18,
        0.0, 0.029720517, -0.009656781, 0.0, 0.025281781, -0.018368289, 0.0, 0.018368289, -0.025281781, 0.0, 0.009656781,
        -0.029720517, 0.0, 3.8270214E-18, -0.03125, 0.0, -0.009656781, -0.029720517, 0.0, -0.018368289, -0.025281781, 0.0,
        -0.025281781, -0.018368289, 0.0, -0.029720517, -0.009656781, 0.0, -0.03125, -5.7405317E-18, 0.0, -0.029720517, 0.009656781,
        0.0, -0.025281781, 0.018368289, 0.0, -0.018368289, 0.025281781, 0.0, -0.009656781, 0.029720517, 0.0, 0.0, 0.03125, 0.75, 0.009656781,
        0.029720517, 0.75, 0.018368289, 0.025281781, 0.75, 0.025281781, 0.018368289, 0.75, 0.029720517, 0.009656781, 0.75, 0.03125, 1.9135107E-18,
        0.75, 0.029720517, -0.009656781, 0.75, 0.025281781, -0.018368289, 0.75, 0.018368289, -0.025281781, 0.75, 0.009656781, -0.029720517, 0.75,
        3.8270214E-18, -0.03125, 0.75, -0.009656781, -0.029720517, 0.75, -0.018368289, -0.025281781, 0.75, -0.025281781, -0.018368289, 0.75,
        -0.029720517, -0.009656781, 0.75, -0.03125, -5.7405317E-18, 0.75, -0.029720517, 0.009656781, 0.75, -0.025281781, 0.018368289, 0.75,
        -0.018368289, 0.025281781, 0.75, -0.009656781, 0.029720517, 0.75, 0.0, 0.03125, 0.0, 0.009656781, 0.029720517, 0.0, 0.018368289, 0.025281781,
        0.0, 0.025281781, 0.018368289, 0.0, 0.029720517, 0.009656781, 0.0, 0.03125, 1.9135107E-18, 0.0, 0.029720517, -0.009656781, 0.0, 0.025281781,
        -0.018368289, 0.0, 0.018368289, -0.025281781, 0.0, 0.009656781, -0.029720517, 0.0, 3.8270214E-18, -0.03125, 0.0, -0.009656781, -0.029720517,
        0.0, -0.018368289, -0.025281781, 0.0, -0.025281781, -0.018368289, 0.0, -0.029720517, -0.009656781, 0.0, -0.03125, -5.7405317E-18, 0.0,
        -0.029720517, 0.009656781, 0.0, -0.025281781, 0.018368289, 0.0, -0.018368289, 0.025281781, 0.0, -0.009656781, 0.029720517, 0.0, 0.0, 0.125,
        0.75, 0.038627125, 0.11888207, 0.75, 0.073473155, 0.101127125, 0.75, 0.101127125, 0.073473155, 0.75, 0.11888207, 0.038627125, 0.75, 0.125,
        7.654043E-18, 0.75, 0.11888207, -0.038627125, 0.75, 0.101127125, -0.073473155, 0.75, 0.073473155, -0.101127125, 0.75, 0.038627125, -0.11888207,
        0.75, 1.5308086E-17, -0.125, 0.75, -0.038627125, -0.11888207, 0.75, -0.073473155, -0.101127125, 0.75, -0.101127125, -0.073473155, 0.75,
        -0.11888207, -0.038627125, 0.75, -0.125, -2.2962127E-17, 0.75, -0.11888207, 0.038627125, 0.75, -0.101127125, 0.073473155, 0.75, -0.073473155,
        0.101127125, 0.75, -0.038627125, 0.11888207, 0.75, 0.0, 0.125, 0.75, 0.038627125, 0.11888207, 0.75, 0.073473155, 0.101127125, 0.75, 0.101127125,
        0.073473155, 0.75, 0.11888207, 0.038627125, 0.75, 0.125, 7.654043E-18, 0.75, 0.11888207, -0.038627125, 0.75, 0.101127125, -0.073473155, 0.75,
        0.073473155, -0.101127125, 0.75, 0.038627125, -0.11888207, 0.75, 1.5308086E-17, -0.125, 0.75, -0.038627125, -0.11888207, 0.75, -0.073473155,
        -0.101127125, 0.75, -0.101127125, -0.073473155, 0.75, -0.11888207, -0.038627125, 0.75, -0.125, -2.2962127E-17, 0.75, -0.11888207, 0.038627125,
        0.75, -0.101127125, 0.073473155, 0.75, -0.073473155, 0.101127125, 0.75, -0.038627125, 0.11888207, 0.75, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0
    ]);

    var normals = new Float32Array([0.0, 1.0, 0.0, 0.309017, 0.95105654, 0.0, 0.58778524, 0.809017, 0.0, 0.809017, 0.58778524, 0.0, 0.95105654,
        0.309017, 0.0, 1.0, 6.123234E-17, 0.0, 0.95105654, -0.309017, 0.0, 0.809017, -0.58778524, 0.0, 0.58778524, -0.809017, 0.0, 0.309017, -0.95105654,
        0.0, 1.2246469E-16, -1.0, 0.0, -0.309017, -0.95105654, 0.0, -0.58778524, -0.809017, 0.0, -0.809017, -0.58778524, 0.0, -0.95105654, -0.309017,
        0.0, -1.0, -1.8369701E-16, 0.0, -0.95105654, 0.309017, 0.0, -0.809017, 0.58778524, 0.0, -0.58778524, 0.809017, 0.0, -0.309017, 0.95105654, 0.0,
        0.0, 1.0, 0.0, 0.309017, 0.95105654, 0.0, 0.58778524, 0.809017, 0.0, 0.809017, 0.58778524, 0.0, 0.95105654, 0.309017, 0.0, 1.0, 6.123234E-17,
        0.0, 0.95105654, -0.309017, 0.0, 0.809017, -0.58778524, 0.0, 0.58778524, -0.809017, 0.0, 0.309017, -0.95105654, 0.0, 1.2246469E-16, -1.0, 0.0,
        -0.309017, -0.95105654, 0.0, -0.58778524, -0.809017, 0.0, -0.809017, -0.58778524, 0.0, -0.95105654, -0.309017, 0.0, -1.0, -1.8369701E-16, 0.0,
        -0.95105654, 0.309017, 0.0, -0.809017, 0.58778524, 0.0, -0.58778524, 0.809017, 0.0, -0.309017, 0.95105654, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.8944272, 0.4472136, 0.2763932, 0.8506508, 0.4472136, 0.5257311, 0.7236068, 0.4472136, 0.7236068, 0.5257311,
        0.4472136, 0.8506508, 0.2763932, 0.4472136, 0.8944272, 5.476787E-17, 0.4472136, 0.8506508, -0.2763932, 0.4472136, 0.7236068, -0.5257311, 0.4472136,
        0.5257311, -0.7236068, 0.4472136, 0.2763932, -0.8506508, 0.4472136, 1.0953574E-16, -0.8944272, 0.4472136, -0.2763932, -0.8506508, 0.4472136, -0.5257311,
        -0.7236068, 0.4472136, -0.7236068, -0.5257311, 0.4472136, -0.8506508, -0.2763932, 0.4472136, -0.8944272, -1.6430361E-16, 0.4472136, -0.8506508, 0.2763932,
        0.4472136, -0.7236068, 0.5257311, 0.4472136, -0.5257311, 0.7236068, 0.4472136, -0.2763932, 0.8506508, 0.4472136, 0.13991924, 0.8834153, 0.4472136,
        0.40606144, 0.79694045, 0.4472136, 0.6324555, 0.6324555, 0.4472136, 0.79694045, 0.40606144, 0.4472136, 0.8834153, 0.13991924, 0.4472136, 0.8834153,
        -0.13991924, 0.4472136, 0.79694045, -0.40606144, 0.4472136, 0.6324555, -0.6324555, 0.4472136, 0.40606144, -0.79694045, 0.4472136, 0.13991924, -0.8834153,
        0.4472136, -0.13991924, -0.8834153, 0.4472136, -0.40606144, -0.79694045, 0.4472136, -0.6324555, -0.6324555, 0.4472136, -0.79694045, -0.40606144, 0.4472136,
        -0.8834153, -0.13991924, 0.4472136, -0.8834153, 0.13991924, 0.4472136, -0.79694045, 0.40606144, 0.4472136, -0.6324555, 0.6324555, 0.4472136, -0.40606144,
        0.79694045, 0.4472136, -0.13991924, 0.8834153, 0.4472136
    ]);

    var elementData = new Uint16Array([0, 1, 20, 20, 1, 21, 1, 2, 21, 21, 2, 22, 2, 3, 22, 22, 3, 23, 3, 4, 23, 23, 4, 24, 4, 5, 24, 24, 5, 25, 5, 6, 25, 25, 6, 26,
        6, 7, 26, 26, 7, 27, 7, 8, 27, 27, 8, 28, 8, 9, 28, 28, 9, 29, 9, 10, 29, 29, 10, 30, 10, 11, 30, 30, 11, 31, 11, 12, 31, 31, 12, 32, 12, 13, 32, 32, 13,
        33, 13, 14, 33, 33, 14, 34, 14, 15, 34, 34, 15, 35, 15, 16, 35, 35, 16, 36, 16, 17, 36, 36, 17, 37, 17, 18, 37, 37, 18, 38, 18, 19, 38, 38, 19, 39, 19, 0,
        39, 39, 0, 20, 40, 41, 42, 40, 42, 43, 40, 43, 44, 40, 44, 45, 40, 45, 46, 40, 46, 47, 40, 47, 48, 40, 48, 49, 40, 49, 50, 40, 50, 51, 40, 51, 52, 40, 52,
        53, 40, 53, 54, 40, 54, 55, 40, 55, 56, 40, 56, 57, 40, 57, 58, 40, 58, 59, 60, 61, 62, 60, 62, 63, 60, 63, 64, 60, 64, 65, 60, 65, 66, 60, 66, 67, 60, 67,
        68, 60, 68, 69, 60, 69, 70, 60, 70, 71, 60, 71, 72, 60, 72, 73, 60, 73, 74, 60, 74, 75, 60, 75, 76, 60, 76, 77, 60, 77, 78, 60, 78, 79, 80, 81, 100, 81, 82,
        101, 82, 83, 102, 83, 84, 103, 84, 85, 104, 85, 86, 105, 86, 87, 106, 87, 88, 107, 88, 89, 108, 89, 90, 109, 90, 91, 110, 91, 92, 111, 92, 93, 112, 93, 94,
        113, 94, 95, 114, 95, 96, 115, 96, 97, 116, 97, 98, 117, 98, 99, 118, 99, 80, 119
    ]);

    var geometry: Geometry = { nVertices: nVertArrow20, vertices: vertices, nElements: nIdxArrow20, indices: elementData, normals: normals };

    return geometry

}

function createCircle20(): Geometry {
    var nVertCircle = 20;                           //number of Vertices per Circle
    var verticesCircle = new Float32Array(nVertCircle * 2);

    //creates the default Circle, normal vector is (0,0,1)
    for (var i = 0; i < nVertCircle; i++) {
        verticesCircle.set([Math.cos(2 * Math.PI * i / nVertCircle), Math.sin(2 * Math.PI * i / nVertCircle)], 2 * i);
    }

    var geometry: Geometry;
    geometry.nVertices = nVertCircle;
    geometry.vertices = verticesCircle;

    return geometry;
}

//This Function creates an 3D Arrow for each vertex
function calcArrow(vertices: Float32Array, vectX: Float32Array, vectY: Float32Array, vectZ: Float32Array, nVertices: number, scalation: number): Geometry[] {
    var sampleArrow = createArrow120();                   // here a sample Arrow is created which is copied for each vertex

    if (vertices.length !== 3 * vectX.length ||
        vertices.length !== 3 * vectY.length ||
        vertices.length !== 3 * vectZ.length) {
        throw "invalid arrow data";
    }

    var geomData: Geometry[] = [];

    // The following splitting is necessary as long as WebGL only supports 16bit indexing
    var nMaxArrow = Math.floor(MAX_DATA / sampleArrow.nVertices);   //Maximal Number of Arrows Addressable with 16 bit indices

    var nBuffer = Math.ceil(nVertices / nMaxArrow); //Number of Buffer, necessary to create all Arrows

    // number , size of the splitted Buffers
    var nArrPerBuffer: number[] = [];   //number of Arrows per Buffer
    var nElePerBuffer: number[] = [];    //number of Elements per Buffer

    // Calculate the number of Arrow per Buffer
    for (var bufIdx = 0; bufIdx < nBuffer - 1; bufIdx++) {
        nArrPerBuffer[bufIdx] = nMaxArrow;
    }
    nArrPerBuffer[nBuffer - 1] = nVertices - (nBuffer - 1) * nMaxArrow;

    for (var bufIdx = 0; bufIdx < nBuffer; bufIdx++) {      //for each batch of Arrows

        var nArrow = nArrPerBuffer[bufIdx]                     //number of Arrows in this Batch;
        var nVertBuf = nArrow * sampleArrow.nVertices;    //number of Vertices
        var nIdxBuf = nArrow * sampleArrow.nElements;      //number of Elements

        var vertexBuf = new Float32Array(nVertBuf * 3);          //vertex Buffer
        var posiBuf = new Float32Array(nVertBuf * 3);          //position Buffer
        var normalBuf = new Float32Array(nVertBuf * 3);         //normal Buffer
        var elementBuf = new Uint16Array(nIdxBuf * 3);             //Element Buffer

        var matRot = new Float32Array(16);
        var rotAxis = new Float32Array(3);
        var yAxis = new Float32Array([0.0, 1.0, 0.0]);

        var matNorm = new Float32Array(9);      //Matrix for the normals
        var matVert = new Float32Array(9);      //Matrix for the vertices
        var len: number;                        //lenght of Arrow, scalation factor

        var vector = vec3.create();   //temp Vector
        var arw = vec3.create();    //arrow Coordinates X,Y,Z

        var radTheta: number, radPhi: number;
        var vertOff = 0, idxOff = 0;                            //Offset for indexing the arrays

        for (var i = 0; i < nArrow; i++) {               //for each Arrow
            var idx = bufIdx * nMaxArrow + i;

            vector.set([vectX[idx], vectY[idx], vectZ[idx]]);

            len = vec3.len(vector);
            //if (len < EPSILON) {    //if too small than jump to next
            //    continue;
            //}

            vec3.scale(vector, vector, 1 / len);    //normalize the Temp Vector
            console.log(vector[0] + ", " + vector[1] + ", " + vector[2]);

            radTheta = Math.acos(vector[2]);              //arcos(z/r) with r = 1
            radPhi = Math.atan2(vector[1], vector[0]);  //atan2(y,x)

            console.log(radTheta);
            console.log(radPhi);

            mat4.identity(matRot);
            mat4.rotateZ(matRot, matRot, radPhi);
            mat3.fromMat4(matNorm, matRot);         //extract only the first 3x3 Block
            mulMatVec3(rotAxis, matNorm, yAxis);    //Calculate the other rotation axis

            mat4.rotate(matRot, matRot, radTheta, rotAxis);

            mat3.fromMat4(matNorm, matRot);
            scaleMat3(matVert, matNorm, scalation * len);   // Scale the Matrix 

            // here the vertex and normals are created
            for (var j = 0; j < sampleArrow.nVertices; j++) { //for each vertex in arrow
                var idx1 = j * 3;               //index 1, for accessingt the sample Arrow Data
                var idx2 = 3* vertOff + idx1;      //index 2, for saving the Arrow Data

                // Position of the bottom of the Arrow
                posiBuf.set(vertices.subarray(i * 3, i * 3 + 3), idx2);    //save Position

                // get Arrow Vertex
                arw = sampleArrow.vertices.subarray(idx1, idx1 + 3);

                //multiply arrow vertex with rotation matrix and scalation factor
                mulMatVec3(vector, matVert, arw);
                vertexBuf.set(vector, idx2);                      //save Vertex

                // get Normal
                arw = sampleArrow.normals.subarray(idx1, idx1 + 3);

                //multiplty arrow norm Vector with rotation matrix
                mulMatVec3(vector, matNorm, arw);
                normalBuf.set(vector, idx2);                      //save Normals
            }
            // here the indices are created
            for (var j = 0; j < sampleArrow.nElements; j++) {  //for each index in arrow
                var idx1 = j * 3;
                var idx2 = idxOff + idx1;

                elementBuf[idx2 + 0] = sampleArrow.indices[idx1 + 0] + vertOff; //each Arrow hast an offset of vertOff
                elementBuf[idx2 + 1] = sampleArrow.indices[idx1 + 1] + vertOff;
                elementBuf[idx2 + 2] = sampleArrow.indices[idx1 + 2] + vertOff;
            }
            vertOff += sampleArrow.nVertices;
            idxOff += (3 * sampleArrow.nElements);
        }

        var geometry: Geometry = { nVertices: nVertBuf, vertices: vertexBuf, nElements: nIdxBuf, indices: elementBuf, normals: normalBuf, position: posiBuf };

        geomData.push(geometry);
    }
    return geomData;
}


//This Function creates an 3D Arrow for each vertex
//This function is more complicated, but the atan2 Function in javascript is strange
function calcArrowLong(vertices: Float32Array, vectX: Float32Array, vectY: Float32Array, vectZ: Float32Array, nVertices: number, scalation: number): Geometry[] {
    var sampleArrow = createArrow120();                   // here a sample Arrow is created which is copied for each vertex

    if (vertices.length !== 3 * vectX.length ||
        vertices.length !== 3 * vectY.length ||
        vertices.length !== 3 * vectZ.length) {
        throw "invalid arrow data";
    }

    var geomData: Geometry[] = [];

    // The following splitting is necessary as long as WebGL only supports 16bit indexing
    var nMaxArrow = Math.floor(MAX_DATA / sampleArrow.nVertices);   //Maximal Number of Arrows Addressable with 16 bit indices

    var nBuffer = Math.ceil(nVertices / nMaxArrow); //Number of Buffer, necessary to create all Arrows

    // number , size of the splitted Buffers
    var nArrPerBuffer: number[] = [];   //number of Arrows per Buffer
    var nElePerBuffer: number[] = [];    //number of Elements per Buffer

    // Calculate the number of Arrow per Buffer
    for (var bufIdx = 0; bufIdx < nBuffer - 1; bufIdx++) {
        nArrPerBuffer[bufIdx] = nMaxArrow;
    }
    nArrPerBuffer[nBuffer - 1] = nVertices - (nBuffer - 1) * nMaxArrow;

    for (var bufIdx = 0; bufIdx < nBuffer; bufIdx++) {      //for each batch of Arrows

        var nArrow = nArrPerBuffer[bufIdx]                     //number of Arrows in this Batch;
        var nVertBuf = nArrow * sampleArrow.nVertices;    //number of Vertices
        var nIdxBuf = nArrow * sampleArrow.nElements;      //number of Elements

        var vertexBuf = new Float32Array(nVertBuf * 3);          //vertex Buffer
        var posiBuf = new Float32Array(nVertBuf * 3);          //position Buffer
        var normalBuf = new Float32Array(nVertBuf * 3);         //normal Buffer
        var elementBuf = new Uint16Array(nIdxBuf * 3);             //Element Buffer

        var matNorm = new Float32Array(9);      //Matrix for the normals
        var matVert = new Float32Array(9);      //Matrix for the vertices
        var len: number;                        //lenght of Arrow, scalation factor

        var tmp: number;            //temp Scalar
        var tmpV = vec3.create();   //temp Vector
        var arw = vec3.create();    //arrow Coordinates X,Y,Z

        var radA: number, radB: number;                         //rad: Radiant of A and B
        var sA: number, sB: number, cA: number, cB: number;     // s: sinus, c: cosinus of A and B
        var vertOff = 0, idxOff = 0;                            //Offset for indexing the arrays

        for (var i = 0; i < nArrow; i++) {               //for each Arrow
            var idx = bufIdx * nMaxArrow + i;

            tmpV.set([vectX[idx], vectY[idx], vectZ[idx]]);

            len = vec3.len(tmpV);
            //if (len < EPSILON) {    //if too small than jump to next
            //    continue;
            //}

            vec3.scale(tmpV, tmpV, 1 / len);
            tmp = Math.sqrt(1 - tmpV[2] * tmpV[2]);    //create rotation Matrix for Arrow

            if (tmpV[2] >= 0) {
                radA = Math.asin(tmpV[1] > 0 ? -tmp : tmp);
                radB = Math.asin((tmpV[1] < 0) ? (tmpV[0] / tmp) : (-tmpV[0] / tmp));

                sA = Math.sin(radA);
                sB = Math.sin(radB);
                cA = Math.cos(radA);
                cB = Math.cos(radB);

                matNorm[0] = cB;
                matNorm[1] = sB;
                matNorm[2] = 0;

                matNorm[3] = -sB * cA;
                matNorm[4] = cB * cA;
                matNorm[5] = sA;

                matNorm[6] = sA * sB;
                matNorm[7] = -cB * sA;
                matNorm[8] = cA;
            } else {
                radA = Math.asin((tmpV[1] > 0) ? tmp : -tmp);
                radB = Math.asin((tmpV[1] < 0) ? (tmpV[0] / tmp) : (-tmpV[0] / tmp));

                sA = Math.sin(radA);
                sB = Math.sin(radB);
                cA = Math.cos(radA);
                cB = Math.cos(radB);

                matNorm[0] = -cB;
                matNorm[1] = -sB;
                matNorm[2] = 0;

                matNorm[3] = sB * cA;
                matNorm[4] = -cB * cA;
                matNorm[5] = -sA;

                matNorm[6] = -sA * sB;
                matNorm[7] = cB * sA;
                matNorm[8] = -cA;
            }

            var len = scalation * len;  // multiply by the external Scalation

            scaleMat3(matVert, matNorm, len);   // Scale the Matrix

            // here the vertex and normals are created
            for (var j = 0; j < sampleArrow.nVertices; j++) { //for each vertex in arrow
                var idx1 = j * 3;               //index 1, for accessingt the sample Arrow Data
                var idx2 = 3 * vertOff + idx1;      //index 2, for saving the Arrow Data

                // Position of the bottom of the Arrow
                posiBuf.set(vertices.subarray(i * 3, i * 3 + 3), idx2);    //save Position

                // get Arrow Vertex
                arw = sampleArrow.vertices.subarray(idx1, idx1 + 3);

                //multiply arrow vertex with rotation matrix and scalation factor
                mulMatVec3(tmpV, matVert, arw);
                vertexBuf.set(tmpV, idx2);                      //save Vertex

                // get Normal
                arw = sampleArrow.normals.subarray(idx1, idx1 + 3);

                //multiplty arrow norm Vector with rotation matrix
                mulMatVec3(tmpV, matNorm, arw);
                normalBuf.set(tmpV, idx2);                      //save Normals
            }
            // here the indices are created
            for (var j = 0; j < sampleArrow.nElements; j++) {  //for each index in arrow
                var idx1 = j * 3;
                var idx2 = idxOff + idx1;

                elementBuf[idx2 + 0] = sampleArrow.indices[idx1 + 0] + vertOff; //each Arrow hast an offset of vertOff
                elementBuf[idx2 + 1] = sampleArrow.indices[idx1 + 1] + vertOff;
                elementBuf[idx2 + 2] = sampleArrow.indices[idx1 + 2] + vertOff;
            }
            vertOff += sampleArrow.nVertices;
            idxOff += (3 * sampleArrow.nElements);
        }

        var geometry: Geometry = { nVertices: nVertBuf, vertices: vertexBuf, nElements: nIdxBuf, indices: elementBuf, normals: normalBuf, position: posiBuf };

        geomData.push(geometry);
    }
    return geomData;
}


//This Function calculates the Normal Vectors for each vertex
function calcNormals(geomData: Geometry): Geometry {
    var nVertices = geomData.nVertices;
    var nElements = geomData.nElements;
    var indices = geomData.indices;
    var vertices = geomData.vertices;

    var normals = new Float32Array(nVertices * 3);      // All entries are zero when creating them

    for (var i = 0; i < nElements; i++) {
        var idx = i * 3;
        var idx1 = indices[idx] * 3, idx2 = indices[idx + 1] * 3, idx3 = indices[idx + 2] * 3;

        //var x1: Float32Array = vertices.slice(idx1, idx1 + 3);
        //var x2: Float32Array = vertices.slice(idx2, idx2 + 3);
        //var x3: Float32Array = vertices.slice(idx3, idx3 + 3);

        var x1: Float32Array = vertices.subarray(idx1, idx1 + 3);
        var x2: Float32Array = vertices.subarray(idx2, idx2 + 3);
        var x3: Float32Array = vertices.subarray(idx3, idx3 + 3);

        var e12 = vec3.create();    //edge from x1 to x2
        var e13 = vec3.create();    //edge from x1 to x3
        var norm = vec3.create();   //normal to e12 and e13

        vec3.sub(e12, x1, x2);
        vec3.sub(e13, x1, x3);

        vec3.cross(norm, e12, e13);    //this is the unnormalized Orthogonal Vector to e12 and e13

        // The Orthogonals are interpolate on Nodes (weighting is proportional to size of Triangle)
        normals[idx1] += norm[0];      
        normals[idx1 + 1] += norm[1];
        normals[idx1 + 2] += norm[2];

        normals[idx2] += norm[0];
        normals[idx2 + 1] += norm[1];
        normals[idx2 + 2] += norm[2];

        normals[idx3] += norm[0];
        normals[idx3 + 1] += norm[1];
        normals[idx3 + 2] += norm[2];
    }
    
    // normalize all Orthogonals
    for (i = 0; i < nVertices; i ++) {
        var idx = i * 3;
        var norm: Float32Array = normals.subarray(idx, idx + 3);    //TODO: Check if all operation are by Reference
        vec3.normalize(norm, norm);
    }
    geomData.normals = normals;
    return geomData;
}

// All Color Values should be mapped between 0.0 - 1.0
function normalizeScalars(attribCol: Float32Array, min: number, max: number) : Float32Array {
    var offset = min;
    var scale = max - min;
    if (scale === 0) {  //no Scalation necessary, mono color
        return attribCol;
    }

    for (var i = 0; i < attribCol.length; i++) {
        attribCol[i] = (attribCol[i] - offset) / scale;
    }

    return attribCol;
}

//function calcTube(nVertices: number, nElements: number, vertexData: Float32Array, radius: Float32Array, elementData: Uint32Array, scalation: number): MultiGeom[] {
//    var sampleCirle = createCircle20();
//    var nElementsPerPoint = sampleCirle.nVertices * 2; //here more Triangles per Vertex are necessary for creating the Tube

//    var sampleSphere = createSphere(20, 20, 0, 2 * Math.PI, 0, Math.PI);    //When Chain is not closed use a Sphere as End

//    if (vertexData.length !== 3 * radius.length) {
//        throw "invalid tube data";
//    }

//    var geomData: MultiGeom[] = [];

//    var nVertPerPoint = sampleCirle.nVertices;

//    var chainStack: Chain[];
//    var chain: Chain;
//    var p1_idx: number, p2_idx: number;   //Index Point 1, 2

//    // Extract the Chains out of the line data
//    for (var i = 0; i < nElements; i++) { //For each line
//        p1_idx = elementData.get(i * 2);
//        p2_idx = elementData.get(i * 2 + 1);

//        if (!chain) {
//            chain = new Chain(p1_idx, p2_idx, i * 2, i * 2 + 1);

//        } else {
//            if (elementData.get(chain.end) === p1_idx) {    //Chain goes on
//                chain.end = p2_idx;
//                chain.endIdx = i * 2 + 1;

//            } else {
//                if (chain.start === chain.end) {    // Check if Chain is a loop
//                    chain.closed
//                }
//                chainStack.push(chain);     // save old Chain
//                chain = new Chain(p1_idx, p2_idx, i * 2, i * 2 + 1); // create new Chain
//            }
//        }
//    }
//    chainStack.push(chain);

//    var chainBuffer: Chain[][] = [];
//    var nBuffer = 0;

//    var nElePerChain = 0;
//    var nVertPerChain = 0;

//    var nVertPerBuffer: number[] = [];
//    var nElePerBuffer: number[] = [];

//    // Calculate Buffer sizes 
//    // Distribute the Chains to Vertex Buffers, each of maximal size of 65536
//    for (var i = 0; i < chainStack.length; i++) {

//        chain = chainStack[i];  //get Chain
//        nVertPerChain = (chain.endIdx - chain.startIdx) * nVertPerPoint;  //Calc Number of Vertices in this chain
//        if (chain.closed) {
//            nElePerChain = (chain.endIdx - chain.startIdx) * nElementsPerPoint; // Calc Number of Elements in this chain
//        } else {
//            nElePerChain
//        }


//        if (bufferLength + chainLength > MAX_DATA) {
//            if (chainLength > MAX_DATA) {
//                console.log("Error to much vertices, for construction Tube");
//            } else {
//                // new Buffer must be created
//                bufferCounter++;
//                Chain[bufferCounter] = new Array();
//                Chain[bufferCounter].push(chain);
//                nVertPerBuffer[bufferCounter] = bufferLength;
//                nElePerBuffer
//                bufferLength = chainLength;
//            }
//        } else {
//            Chain[bufferCounter].push(chain);
//            bufferLength = bufferLength + chainLength;
//        }
//    }

//    for (var j = 0; j < chainBuffer.length; j++) {
//        var vert = new Float32Array(vertSize);
//        var posi = new Float32Array(vertSize);
//        var norms = new Float32Array(vertSize);
//        var idx = new Uint16Array(idxSize);

//        var e1_idx: number, e2_idx: number;                 // indices to previous edge (e1) and current edge (e2)
//        var e1 = vec3.create();                             //previous Edge
//        var e2 = vec3.create();                             //this Edge

//        var n1 = vec3.create();           //normal for previous Plain
//        var n2 = vec3.create();           //normal for this Plain
//        var swap: Float32Array;         //var for swapping
//        var tmp = vec3.create();          //temp var

//        var u1 = vec3.create();           // u1 and v1 span previous Plain
//        var v1 = vec3.create();

//        var u2 = vec3.create();           // u2 and v2 span this Plain
//        var v2 = vec3.create();

//        var cut = vec3.create();        // cutting line between Plain 1 and 2
//        var matRot = mat3.create();      //rotation Matrix
//        var matMult = mat3.create();     // Final Multiplication Matrix

//        var p3_idx: number;         //Point 3
//        var p1 = vec3.create();     //previous point
//        var p2 = vec3.create();     //current point
//        var p3 = vec3.create();     //next point

//        var radVert: number;        //the radius of the tube in this point

//        for (var i = 0; i < chainBuffer[j].length; i++) {
//            chain = chainBuffer[j][i];

//            if (chain.closed) { // if chain is closed last Edge is previous Edge

//                e1_idx = chain.endIdx;
//                e2_idx = chain.startIdx;

//                p1_idx = chain.end;
//                p2_idx = chain.start;
//                p3_idx = elementData.get(e2_idx * 2 + 1);
//            }

//            for (var j = chain.startIdx; j < chain.endIdx; j++) {
//                p1_idx = p2_idx;        //shift all Elements
//                p2_idx = p3_idx;
//                p3_idx = elementData.get(j * 2 + 1);

//                p1.set([vertexData.slice(p1_idx * 3, p1_idx * 3 + 3)]);
//                p2.set([vertexData.slice(p2_idx * 3, p2_idx * 3 + 3)]);
//                p2.set([vertexData.slice(p3_idx * 3, p3_idx * 3 + 3)]);

//                // Edge e1  from p2 to p1
//                vec3.sub(e1, p1, p2);
//                vec3.normalize(e1, e1);

//                // Edge e2  from p3 to p2
//                vec3.sub(e2, p2, p3);
//                vec3.normalize(e2, e2);

//                // Create the normalized middle vector of e1 and e2, 
//                vec3.add(u2, e1, e2);
//                vec3.normalize(u2, u2);

//                //create orthogonal vector to e1 and e2
//                vec3.cross(v2, e1, e2);
//                vec3.normalize(v2, v2);

//                //create normal vector of the Plain spanned by u2 and v2,
//                vec3.cross(n2, u2, v2);
//                vec3.normalize(n2, n2);

//                var dot_n1_n2 = vec3.dot(n1, n2);

//                //compare direction to normal n1
//                if (Math.abs(dot_n1_n2) + EPSILON > 1) {    // Plains are parallel copy the Span vectors
//                    vec3.copy(n2, n1);
//                    vec3.copy(u2, u1);
//                    vec3.copy(v2, v1);

//                } else {    //n1 and n2 should point in same direction by at least 90 degree
//                    if (dot_n1_n2 < 0) {
//                        //swapping
//                        swap = u2, u2 = v2, v2 = swap;
//                        vec3.negate(n2, n2);
//                    }

//                    //calculate direction of cutting line of plain1 and plain2 (cross of both normals)
//                    vec3.cross(cut, n1, n2);
//                    vec3.normalize(cut, cut);

//                    //calculate angle between u1 and cut, sign is in direction of v1
//                    var angle_u1_cut = vec3.angle(u1, cut);
//                    vec3.cross(tmp, u1, cut);
//                    var sign = vec3.dot(tmp, n1);
//                    angle_u1_cut = (sign < 0) ? - angle_u1_cut : angle_u1_cut;

//                    // calculate angle between u2 and cut, sign is in direction of v2
//                    var angle_u2_cut = vec3.angle(u2, cut);
//                    vec3.cross(tmp, u2, cut);
//                    sign = vec3.dot(tmp, n2);
//                    angle_u2_cut = (sign < 0) ? - angle_u2_cut : angle_u2_cut;

//                    var angle = angle_u2_cut - angle_u1_cut;

//                    // calculate the position of the 20 vertices for this point
//                    // First create Transformation Matrix
//                    mat3.fromRotation(matRot, angle);

//                    matMult.set(u2, 0);
//                    matMult.set(v2, 3);
//                    matMult.set(n2, 6);

//                    mat3.mul(matMult, matRot, matMult);
//                    mat3.scale(matMult, matMult, Float32Array(radVert * scalation, radVert * scalation));

//                    for (var k = 0; k < nVertCircle; k++) {
//                        //Multiply each Vector by Transformation Matrix

//                    }

//                }
//            }
//        }
//    }
//}

/**
*   multiply Matrix {3x3} with vector3 
*   column Major format, so compatible with gl-matrix
*
*/
function mulMatVec3(out: Float32Array, mat: Float32Array, vec: Float32Array) : Float32Array {
    var a00 = mat[0], a10 = mat[3], a20 = mat[6],
        a01 = mat[1], a11 = mat[4], a21 = mat[7],
        a02 = mat[2], a12 = mat[5], a22 = mat[8],
         
        x1 = vec[0], x2 = vec[1], x3 = vec[2];

    out[0] = a00 * x1 + a10 * x2 + a20 * x3;
    out[1] = a01 * x1 + a11 * x2 + a21 * x3;
    out[2] = a02 * x1 + a12 * x2 + a22 * x3;

    return out;
}

function scaleMat3(out: Float32Array, mat: Float32Array, s: number): Float32Array {
    out[0] = mat[0] * s;
    out[1] = mat[1] * s;
    out[2] = mat[2] * s;
    out[3] = mat[3] * s;
    out[4] = mat[4] * s;
    out[5] = mat[5] * s;
    out[6] = mat[6] * s;
    out[7] = mat[7] * s;
    out[8] = mat[8] * s;

    return out;
}


////TODO: due to the many binary data operation, multicore support would be nice
//// is possible in WebWorkers
//function WorkerPool(workerNr, script, callback) {
//    var freeWorker = [];
//    var work = [];
//    var workId = [];

//    function cb(msg) {
//        var w = msg.currentTarget;
//        var id = w.id;

//        if (workId.length !== 0) {
//            w.id = workId.shift();
//            w.postMessage(work[w.id]);
//        } else
//            freeWorker.push(w);

//        callback(msg.data, id);
//    }

//    for (var i = 0; i < workerNr; i++) {
//        var w = new Worker(script);
//        w.onmessage = cb;
//        w.id = null;
//        freeWorker.push(w);
//    }

//    this.giveWork = function (data, id) {
//        if (freeWorker.length !== 0) {
//            var w = freeWorker.pop();
//            w.id = id;
//            if (data instanceof Array) {
//                for (var i = 0; i < data.length; i++)
//                    w.postMessage(data[i]);
//            } else
//                w.postMessage(data);
//        } else {
//            work[id] = data;
//            workId.push(id);
//        }
//    }
//}
