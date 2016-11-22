var EPSILON = 1E-7;



function Chain(start, end, startIdx, endIdx) {
    this.start = start;
    this.end = end;
    this.startIdx = startIdx;
    this.endIdx = endIdx;
    this.closed = closed;
}

function createSphere(widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength) {
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

            vertex.set([
                -1 * Math.cos(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength),
                Math.cos(thetaStart + v * thetaLength),
                Math.sin(phiStart + u * phiLength) * Math.sin(thetaStart + v * thetaLength)]);

            vertices.set(vertex, index * 3);
            normals.set(vertex, index * 3);

            index++;
        }
        indicesUnsorted.push(indexRow);
    }

    var indices = [];

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

    var geometry;
    geometry.nVertices = vertexCount;
    geometry.vertices = vertices;
    geometry.nElements = indices.length;
    geometry.indices = elementData;
    geometry.normals = normals;

    return geometry;
}

function createArrow120() {
    var nVertArrow20 = 120;
    var nIdxArrow20 = 96;

    var vertices = new Float32Array([
        0.0, 0.03125, 0.0, 0.009656781, 0.029720517, 0.0, 0.018368289,
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

    var normals = new Float32Array([
        0.0, 1.0, 0.0, 0.309017, 0.95105654, 0.0, 0.58778524, 0.809017, 0.0, 0.809017, 0.58778524, 0.0, 0.95105654,
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

    var elementData = new Uint16Array([
        0, 1, 20, 20, 1, 21, 1, 2, 21, 21, 2, 22, 2, 3, 22, 22, 3, 23, 3, 4, 23, 23, 4, 24, 4, 5, 24, 24, 5, 25, 5, 6, 25, 25, 6, 26,
        6, 7, 26, 26, 7, 27, 7, 8, 27, 27, 8, 28, 8, 9, 28, 28, 9, 29, 9, 10, 29, 29, 10, 30, 10, 11, 30, 30, 11, 31, 11, 12, 31, 31, 12, 32, 12, 13, 32, 32, 13,
        33, 13, 14, 33, 33, 14, 34, 14, 15, 34, 34, 15, 35, 15, 16, 35, 35, 16, 36, 16, 17, 36, 36, 17, 37, 17, 18, 37, 37, 18, 38, 18, 19, 38, 38, 19, 39, 19, 0,
        39, 39, 0, 20, 40, 41, 42, 40, 42, 43, 40, 43, 44, 40, 44, 45, 40, 45, 46, 40, 46, 47, 40, 47, 48, 40, 48, 49, 40, 49, 50, 40, 50, 51, 40, 51, 52, 40, 52,
        53, 40, 53, 54, 40, 54, 55, 40, 55, 56, 40, 56, 57, 40, 57, 58, 40, 58, 59, 60, 61, 62, 60, 62, 63, 60, 63, 64, 60, 64, 65, 60, 65, 66, 60, 66, 67, 60, 67,
        68, 60, 68, 69, 60, 69, 70, 60, 70, 71, 60, 71, 72, 60, 72, 73, 60, 73, 74, 60, 74, 75, 60, 75, 76, 60, 76, 77, 60, 77, 78, 60, 78, 79, 80, 81, 100, 81, 82,
        101, 82, 83, 102, 83, 84, 103, 84, 85, 104, 85, 86, 105, 86, 87, 106, 87, 88, 107, 88, 89, 108, 89, 90, 109, 90, 91, 110, 91, 92, 111, 92, 93, 112, 93, 94,
        113, 94, 95, 114, 95, 96, 115, 96, 97, 116, 97, 98, 117, 98, 99, 118, 99, 80, 119
    ]);

    var geometry = { nVertices: nVertArrow20, vertices: vertices, nElements: nIdxArrow20, indices: elementData, normals: normals };

    return geometry;
}

function createCircle20() {
    var nVertCircle = 20;
    var verticesCircle = new Float32Array(nVertCircle * 2);

    for (var i = 0; i < nVertCircle; i++) {
        verticesCircle.set([Math.cos(2 * Math.PI * i / nVertCircle), Math.sin(2 * Math.PI * i / nVertCircle)], 2 * i);
    }

    var geometry;
    geometry.nVertices = nVertCircle;
    geometry.vertices = verticesCircle;

    return geometry;
}

function calcArrow(vertices, vectX, vectY, vectZ, nVertices, scalation) {
    var sampleArrow = createArrow120();

    if (vertices.length !== 3 * vectX.length || vertices.length !== 3 * vectY.length || vertices.length !== 3 * vectZ.length) {
        throw "invalid arrow data";
    }

    var geomData = [];

    var nMaxArrow = Math.floor(MAX_DATA / sampleArrow.nVertices);

    var nBuffer = Math.ceil(nVertices / nMaxArrow);

    var nArrPerBuffer = [];
    var nElePerBuffer = [];

    for (var bufIdx = 0; bufIdx < nBuffer - 1; bufIdx++) {
        nArrPerBuffer[bufIdx] = nMaxArrow;
    }
    nArrPerBuffer[nBuffer - 1] = nVertices - (nBuffer - 1) * nMaxArrow;

    for (var bufIdx = 0; bufIdx < nBuffer; bufIdx++) {
        var nArrow = nArrPerBuffer[bufIdx];
        var nVertBuf = nArrow * sampleArrow.nVertices;
        var nIdxBuf = nArrow * sampleArrow.nElements;

        var vertexBuf = new Float32Array(nVertBuf * 3);
        var posiBuf = new Float32Array(nVertBuf * 3);
        var normalBuf = new Float32Array(nVertBuf * 3);
        var elementBuf = new Uint16Array(nIdxBuf * 3);

        var matRot = new Float32Array(16);
        var rotAxis = new Float32Array(3);
        var yAxis = new Float32Array([0.0, 1.0, 0.0]);

        var matNorm = new Float32Array(9);
        var matVert = new Float32Array(9);
        var len;

        var vector = vec3.create();
        var arw = vec3.create();

        var radTheta, radPhi;
        var vertOff = 0, idxOff = 0;

        for (var i = 0; i < nArrow; i++) {
            var idx = bufIdx * nMaxArrow + i;

            vector.set([vectX[idx], vectY[idx], vectZ[idx]]);

            len = vec3.len(vector);

            vec3.scale(vector, vector, 1 / len);
            console.log(vector[0] + ", " + vector[1] + ", " + vector[2]);

            radTheta = Math.acos(vector[2]);
            radPhi = Math.atan2(vector[1], vector[0]);

            console.log(radTheta);
            console.log(radPhi);

            mat4.identity(matRot);
            mat4.rotateZ(matRot, matRot, radPhi);
            mat3.fromMat4(matNorm, matRot);
            mulMatVec3(rotAxis, matNorm, yAxis);

            mat4.rotate(matRot, matRot, radTheta, rotAxis);

            mat3.fromMat4(matNorm, matRot);
            scaleMat3(matVert, matNorm, scalation * len);

            for (var j = 0; j < sampleArrow.nVertices; j++) {
                var idx1 = j * 3;
                var idx2 = 3 * vertOff + idx1;

                posiBuf.set(vertices.subarray(i * 3, i * 3 + 3), idx2);

                arw = sampleArrow.vertices.subarray(idx1, idx1 + 3);

                mulMatVec3(vector, matVert, arw);
                vertexBuf.set(vector, idx2);

                arw = sampleArrow.normals.subarray(idx1, idx1 + 3);

                mulMatVec3(vector, matNorm, arw);
                normalBuf.set(vector, idx2);
            }

            for (var j = 0; j < sampleArrow.nElements; j++) {
                var idx1 = j * 3;
                var idx2 = idxOff + idx1;

                elementBuf[idx2 + 0] = sampleArrow.indices[idx1 + 0] + vertOff;
                elementBuf[idx2 + 1] = sampleArrow.indices[idx1 + 1] + vertOff;
                elementBuf[idx2 + 2] = sampleArrow.indices[idx1 + 2] + vertOff;
            }
            vertOff += sampleArrow.nVertices;
            idxOff += (3 * sampleArrow.nElements);
        }

        var geometry = { nVertices: nVertBuf, vertices: vertexBuf, nElements: nIdxBuf, indices: elementBuf, normals: normalBuf, position: posiBuf };

        geomData.push(geometry);
    }
    return geomData;
}

function calcArrowLong(vertices, vectX, vectY, vectZ, nVertices, scalation) {
    var sampleArrow = createArrow120();

    if (vertices.length !== 3 * vectX.length || vertices.length !== 3 * vectY.length || vertices.length !== 3 * vectZ.length) {
        throw "invalid arrow data";
    }

    var geomData = [];

    var nMaxArrow = Math.floor(MAX_DATA / sampleArrow.nVertices);

    var nBuffer = Math.ceil(nVertices / nMaxArrow);

    var nArrPerBuffer = [];
    var nElePerBuffer = [];

    for (var bufIdx = 0; bufIdx < nBuffer - 1; bufIdx++) {
        nArrPerBuffer[bufIdx] = nMaxArrow;
    }
    nArrPerBuffer[nBuffer - 1] = nVertices - (nBuffer - 1) * nMaxArrow;

    for (var bufIdx = 0; bufIdx < nBuffer; bufIdx++) {
        var nArrow = nArrPerBuffer[bufIdx];
        var nVertBuf = nArrow * sampleArrow.nVertices;
        var nIdxBuf = nArrow * sampleArrow.nElements;

        var vertexBuf = new Float32Array(nVertBuf * 3);
        var posiBuf = new Float32Array(nVertBuf * 3);
        var normalBuf = new Float32Array(nVertBuf * 3);
        var elementBuf = new Uint16Array(nIdxBuf * 3);

        var matNorm = new Float32Array(9);
        var matVert = new Float32Array(9);
        var len;

        var tmp;
        var tmpV = vec3.create();
        var arw = vec3.create();

        var radA, radB;
        var sA, sB, cA, cB;
        var vertOff = 0, idxOff = 0;

        for (var i = 0; i < nArrow; i++) {
            var idx = bufIdx * nMaxArrow + i;

            tmpV.set([vectX[idx], vectY[idx], vectZ[idx]]);

            len = vec3.len(tmpV);

            vec3.scale(tmpV, tmpV, 1 / len);
            tmp = Math.sqrt(1 - tmpV[2] * tmpV[2]);

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

            var len = scalation * len;

            scaleMat3(matVert, matNorm, len);

            for (var j = 0; j < sampleArrow.nVertices; j++) {
                var idx1 = j * 3;
                var idx2 = 3 * vertOff + idx1;

                posiBuf.set(vertices.subarray(i * 3, i * 3 + 3), idx2);

                arw = sampleArrow.vertices.subarray(idx1, idx1 + 3);

                mulMatVec3(tmpV, matVert, arw);
                vertexBuf.set(tmpV, idx2);

                arw = sampleArrow.normals.subarray(idx1, idx1 + 3);

                mulMatVec3(tmpV, matNorm, arw);
                normalBuf.set(tmpV, idx2);
            }

            for (var j = 0; j < sampleArrow.nElements; j++) {
                var idx1 = j * 3;
                var idx2 = idxOff + idx1;

                elementBuf[idx2 + 0] = sampleArrow.indices[idx1 + 0] + vertOff;
                elementBuf[idx2 + 1] = sampleArrow.indices[idx1 + 1] + vertOff;
                elementBuf[idx2 + 2] = sampleArrow.indices[idx1 + 2] + vertOff;
            }
            vertOff += sampleArrow.nVertices;
            idxOff += (3 * sampleArrow.nElements);
        }

        var geometry = { nVertices: nVertBuf, vertices: vertexBuf, nElements: nIdxBuf, indices: elementBuf, normals: normalBuf, position: posiBuf };

        geomData.push(geometry);
    }
    return geomData;
}

function calcNormals(geomData) {
    var nVertices = geomData.nVertices;
    var nElements = geomData.nElements;
    var indices = geomData.indices;
    var vertices = geomData.vertices;

    var normals = new Float32Array(nVertices * 3);

    for (var i = 0; i < nElements; i++) {
        var idx = i * 3;
        var idx1 = indices[idx] * 3, idx2 = indices[idx + 1] * 3, idx3 = indices[idx + 2] * 3;

        var x1 = vertices.subarray(idx1, idx1 + 3);
        var x2 = vertices.subarray(idx2, idx2 + 3);
        var x3 = vertices.subarray(idx3, idx3 + 3);

        var e12 = vec3.create();
        var e13 = vec3.create();
        var norm = vec3.create();

        vec3.sub(e12, x1, x2);
        vec3.sub(e13, x1, x3);

        vec3.cross(norm, e12, e13);

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

    for (i = 0; i < nVertices; i++) {
        var idx = i * 3;
        var norm = normals.subarray(idx, idx + 3);
        vec3.normalize(norm, norm);
    }
    geomData.normals = normals;
    return geomData;
}

function normalizeScalars(attribCol, min, max) {
    var offset = min;
    var scale = max - min;
    if (scale === 0) {
        return attribCol;
    }

    for (var i = 0; i < attribCol.length; i++) {
        attribCol[i] = (attribCol[i] - offset) / scale;
    }

    return attribCol;
}

function mulMatVec3(out, mat, vec) {
    var a00 = mat[0], a10 = mat[3], a20 = mat[6], a01 = mat[1], a11 = mat[4], a21 = mat[7], a02 = mat[2], a12 = mat[5], a22 = mat[8], x1 = vec[0], x2 = vec[1], x3 = vec[2];

    out[0] = a00 * x1 + a10 * x2 + a20 * x3;
    out[1] = a01 * x1 + a11 * x2 + a21 * x3;
    out[2] = a02 * x1 + a12 * x2 + a22 * x3;

    return out;
}

function scaleMat3(out, mat, s) {
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
//# sourceMappingURL=Geometries.js.map
