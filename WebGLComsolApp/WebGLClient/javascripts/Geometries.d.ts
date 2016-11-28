declare var EPSILON: number;
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
interface Chain {
    start: number;
    end: number;
    startIdx: number;
    endIdx: number;
    closed: boolean;
}
declare function Chain(start: number, end: number, startIdx: number, endIdx: number): void;
declare function createSphere(widthSegments: number, heightSegments: number, phiStart: number, phiLength: number, thetaStart: number, thetaLength: number): Geometry;
declare function createArrow120(): Geometry;
declare function createCircle20(): Geometry;
declare function calcArrow(vertices: Float32Array, vectX: Float32Array, vectY: Float32Array, vectZ: Float32Array, nVertices: number, scalation: number): Geometry[];
declare function calcArrowLong(vertices: Float32Array, vectX: Float32Array, vectY: Float32Array, vectZ: Float32Array, nVertices: number, scalation: number): Geometry[];
declare function calcNormals(geomData: Geometry): Geometry;
declare function normalizeScalars(attribCol: Float32Array, min: number, max: number): Float32Array;
declare function mulMatVec3(out: Float32Array, mat: Float32Array, vec: Float32Array): Float32Array;
declare function scaleMat3(out: Float32Array, mat: Float32Array, s: number): Float32Array;
