/// <refernce path="libs/gl-matrix.d.ts"/>
/// <refernce path="libs/jquery.d.ts"/>

// in this file all CONSTANT Strings are defined
// and all Object for Typescript IntelliSense support are declared

let initTouchPointer: () => void;

//Comsol Plot Types
let TYPE_VOLUME = "Volume";
let TYPE_SLICE = "Slice";
let TYPE_MULTISLICE = "Multislice";
let TYPE_SURFACE = "Surface";

let TYPE_PLOTGROUP3D = "PlotGroup3D";
let TYPE_PLOTGROUP2D = "PlotGroup2D";
let TYPE_PLOTGROUP1D = "PlotGroup1D";
let TYPE_STREAMLINES = "Streamline";
let TYPE_LINES = "Lines";

let TYPE_ARROW_VOLUME = "ArrowVolume";
let TYPE_ARROW_SURFACE = "ArrowSurface";
let TYPE_ARROW_LINE = "ArrowLine";

//Comsol Attributes, DataTypes
let ATTR_COLOR = "Color";				// linear Mapping to the colorTable
let ATTR_VECTORX = "VectorX";			// X-Value of Vectors
let ATTR_VECTORY = "VectorY";			// Y-Value of Vectors
let ATTR_VECTORZ = "VectorZ";			// Z-Value of Vectors
let ATTR_ISO = "IsoLevel";				// Isolevel mapped to Color
let ATTR_RAD = "Radius";			    // Radius for Lines as Tubes
let ATTR_DEFX = "DeformX";				// Deformation in X-Direction
let ATTR_DEFY = "DeformY";				// Deformation in Y-Direction
let ATTR_DEFZ = "DeformZ";				// Deformation in Z-Direction

interface GuiConfigType {
    uniColor: boolean;

    isoTexture: boolean;
    colorTexture: boolean;

    arrowScale: boolean;
    radiusScale: boolean;
    deformationScale: boolean;
}

interface Background {
    vertexBuf: WebGLBuffer;
    colorBuf: WebGLBuffer;
}

interface ColorLegend {
    vertexBuf: WebGLBuffer;
    indexBuf?: WebGLBuffer;
    colorBuf?: WebGLBuffer;
}

interface CoordSys {
    vertexBuf: WebGLBuffer;
    idxBuf: WebGLBuffer;
}

interface Renderer {
    //updates the Scene
    renderScene();

    //setting and getting Model and Plots
    setActiveModel(model: Model);
    setActiveModelById(modelId: string, callback:() => void);
    setActivePlotGroup(plotGroup: Result);
    setActivePlotGroupById(plotGroupTag: string, callback: () => void);

    addPlot(plot: Result): void;
    removePlot(plot: Result): void ;

    getActiveModel(): Model;
    getActiveModelId(): string;
    getActivePlotGroup(): Result;
    getActivePlotGroupId(): string;
    getActivePlotGroupType(): number;
    getActivePlots(): Result[];

    //userInteraction (rotation, zooming)
    getPosition(): Float32Array;
    setPosition(eyeX: number, eyeY: number, eyeZ: number): void;
    setPositionV(eyeVec: Float32Array): void;
    setXPosition(eyeX: number): void;
    setYPosition(eyeY: number): void;
    setZPosition(eyeZ: number): void;

    toggleLight(): boolean;
    toggleVR(): boolean;
    rotateObject(x: number, y: number): void;
    resetView(): void;
    resizeCanvas(width: number, height: number): void;
    resizeVRCanvas(width: number, height: number): void;

    //VR feature
    getSeperation(): number;
    setSeperation(seperation:number): void;

}

interface ModelCmds {
    setPostProcessor(postProc: PostProcessor);

    getModel(modelId: string, callback: (model: Model) => void);
    getPlotGroup(modelId: string, plotGroup: string, callback: (result: Result) => void);
    getPlot(modelId: string, plotGroupTag: string, plotTag: string, callback: (result: Result) => void);
    getNumRenderItems(modelId: string, plotGroupId: string, plotId?: string): number;

    // Data as Map 
    getModelList(callback: (modelList: { modelId: string; name: string }[]) => void);
    getPlotGroupMap(modelId: string, callback: (plotGroupMap: { name: string; id: string }[]) => void);
    getPlotMap(modelId: string, plotGroupId: string, callback: (plotMap: { name: string; id: string }[]) => void);

    getTextureGroups(plot: Result): number[];
    getColorGroups(plot: Result): number[];
    getArrowGroups(plot: Result): number[];
}

interface RenderData {
    numVert: number;
    numEle: number;

    //stream raw Data
    rawData?: ArrayBuffer;

    geomData: WebGLGeom[];
}

interface RenderAttribute {
    name: string;       // Name of the Comsol Datatype, Attribute
    min?: number;       // Min Value from Comsol
    max?: number;       // Max Value from Comsol
    index?: number;     // Index for Accessing the binary Attribute Array
}

interface RenderGroup {
    shaderId?: number;  //id of the shader to use for this render Group, is set by the Postprocessor
    geoType?: number;   //geometry Type, lines, triangles or Points

    renderData: Array<RenderData>;                      // the binary data is splitted into single render Data objects, all can be rendered by the same shader Program
    attributes?: Array<RenderAttribute>                 // the RenderAttributes to be defined rot this renderGroup
}

interface Result {
    name: string;   // Full Name of the Result
    type: string;   // Types as listed in File "StringKeys"
    tag: string;    // unique Identifier

    requested?: boolean;
    ready?: boolean;

    boundBox: number[]; //boundary Box [minX, maxX, minY, maxY, minZ, maxZ]

    noData?: boolean;   //renderGroup = null;

    offset: Float32Array;   // x,y,z Offset to place the model in the middle of the screen
    scale: Float32Array;    // x=y=z to scale the mode to a box of 1,1,1

    renderGroup: Array<RenderGroup>;    // groups of Rendering Data, which can be all drawn by the same renderer, can be null for Plotgroups
    feature: Array<Result>;             // Sub Results for Plot Groups

    usrColor?: string;  // Name of Color chosen by the User
    usrText?: string;   // Name of Texture chosen by the User
    usrScale?: number;  // Scalation chosen by the User (Arrow and Deformation)
}

interface Model {
    modelId: string;
    results: Array<Result>;
    name: string;
}

interface PostProcessor {
    prepareModel: (model: Model) =>  void;
    preparePlotGroup: (model: Model, plotGroup: Result, groupId: number, dataId: number) => void;
    preparePlot: (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData) => void;
    initResultSize: (result: Result) => void;
}