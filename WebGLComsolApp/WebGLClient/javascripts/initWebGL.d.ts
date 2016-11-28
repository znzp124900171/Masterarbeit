declare var GL_UNI_MVP: string;
declare var GL_UNI_MV: string;
declare var GL_UNI_P: string;
declare var GL_UNI_NORM: string;
declare var GL_UNI_COL: string;
declare var GL_UNI_LIG: string;
declare var GL_UNI_SCL: string;
declare var GL_UNI_TEX: string;
declare var GL_ATTR_VTX: string;
declare var GL_ATTR_POS: string;
declare var GL_ATTR_NRM: string;
declare var GL_ATTR_COL: string;
declare var GL_ATTR_DEF_X: string;
declare var GL_ATTR_DEF_Y: string;
declare var GL_ATTR_DEF_Z: string;
declare class ShaderProgram {
    public id: number;
    public gl: WebGLProgram;
    public attributes: {
        [index: string]: WebGLContextAttributes;
    }[];
    public uniforms: {
        [index: string]: WebGLUniformLocation;
    }[];
}
interface Color {
    name: string;
    value: number[];
}
interface ColorTables {
    name: string;
    size: number;
    tex: Uint8Array;
}
interface Shader {
    name: string;
    id: number;
    vxProgram: string;
    pxProgram: string;
    attributes: string[];
    uniforms: string[];
}
interface Web3DContext {
    setupArrayBuffer(binFloatArray: Float32Array): WebGLBuffer;
    setupElementBuffer(binShortArray: Uint16Array): WebGLBuffer;
    getContext(): WebGLRenderingContext;
    getCanvas(): HTMLElement;
    getPrograms(): ShaderProgram[];
    getTextureName(): string[];
    getColorNames(): string[];
    getColorByName(name: string): number[];
    getTextureByName(name: string): number;
}
declare function Web3DContext(canvas: HTMLElement): void;
