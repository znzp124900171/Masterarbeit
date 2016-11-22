declare var initTouchPointer: () => void;
declare var TYPE_VOLUME: string;
declare var TYPE_SLICE: string;
declare var TYPE_MULTISLICE: string;
declare var TYPE_SURFACE: string;
declare var TYPE_PLOTGROUP3D: string;
declare var TYPE_STREAMLINES: string;
declare var TYPE_LINES: string;
declare var TYPE_ARROW_VOLUME: string;
declare var TYPE_ARROW_SURFACE: string;
declare var TYPE_ARROW_LINE: string;
declare var ATTR_COLOR: string;
declare var ATTR_VECTORX: string;
declare var ATTR_VECTORY: string;
declare var ATTR_VECTORZ: string;
declare var ATTR_ISO: string;
declare var ATTR_RAD: string;
declare var ATTR_DEFX: string;
declare var ATTR_DEFY: string;
declare var ATTR_DEFZ: string;
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
interface CoordSys {
    vertexBuf: WebGLBuffer;
    idxBuf: WebGLBuffer;
}
interface Renderer {
    renderScene(): any;
    setActiveModel(model: Model): any;
    setActiveModelById(modelId: string, callback: () => void): any;
    setActivePlotGroup(plotGroup: Result): any;
    setActivePlotGroupById(plotGroupTag: string, callback: () => void): any;
    addPlot(plot: Result): void;
    removePlot(plot: Result): void;
    getActiveModel(): Model;
    getActiveModelId(): string;
    getActivePlotGroup(): Result;
    getActivePlotGroupId(): string;
    getActivePlots(): Result[];
    getPosition(): Float32Array;
    setPosition(eyeX: number, eyeY: number, eyeZ: number): void;
    setPositionV(eyeVec: Float32Array): void;
    setXPosition(eyeX: number): void;
    setYPosition(eyeY: number): void;
    setZPosition(eyeZ: number): void;
    toggleLight(): boolean;
    rotateObject(x: number, y: number): void;
    resetView(): void;
    resizeCanvas(width: number, height: number): void;
}
interface ModelCmds {
    setPostProcessor(postProc: PostProcessor): any;
    getModel(modelId: string, callback: (model: Model) => void): any;
    getPlotGroup(modelId: string, plotGroup: string, callback: (result: Result) => void): any;
    getPlot(modelId: string, plotGroupTag: string, plotTag: string, callback: (result: Result) => void): any;
    getNumRenderItems(modelId: string, plotGroupId: string, plotId?: string): number;
    getModelList(callback: (modelList: {
        modelId: string;
        name: string;
    }[]) => void): any;
    getPlotGroupMap(modelId: string, callback: (plotGroupMap: {
        name: string;
        id: string;
    }[]) => void): any;
    getPlotMap(modelId: string, plotGroupId: string, callback: (plotMap: {
        name: string;
        id: string;
    }[]) => void): any;
    getTextureGroups(plot: Result): number[];
    getColorGroups(plot: Result): number[];
    getArrowGroups(plot: Result): number[];
}
interface RenderData {
    numVert: number;
    numEle: number;
    rawData?: ArrayBuffer;
    geomData: WebGLGeom[];
}
interface RenderAttribute {
    name: string;
    min?: number;
    max?: number;
    index?: number;
}
interface RenderGroup {
    shaderId?: number;
    geoType?: number;
    renderData: RenderData[];
    attributes?: RenderAttribute[];
}
interface Result {
    name: string;
    type: string;
    tag: string;
    requested?: boolean;
    ready?: boolean;
    boundBox: number[];
    noData?: boolean;
    offset: Float32Array;
    scale: Float32Array;
    renderGroup: RenderGroup[];
    feature: Result[];
    usrColor?: string;
    usrText?: string;
    usrScale?: number;
}
interface Model {
    modelId: string;
    results: Result[];
    name: string;
}
interface PostProcessor {
    prepareModel: (model: Model) => void;
    preparePlotGroup: (model: Model, plotGroup: Result, groupId: number, dataId: number) => void;
    preparePlot: (model: Model, plotGroup: Result, result: Result, renderGroup: RenderGroup, renderData: RenderData) => void;
    initResultSize: (result: Result) => void;
}
