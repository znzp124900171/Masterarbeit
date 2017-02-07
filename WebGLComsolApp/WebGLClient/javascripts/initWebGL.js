var GL_UNI_MVP = "mvpMatrix";
var GL_UNI_MV = "mvMatrix";
var GL_UNI_P = "pMatrix";
var GL_UNI_NORM = "normMatrix";
var GL_UNI_COL = "color";
var GL_UNI_LIG = "lightPosition";
var GL_UNI_SCL = "scale";
var GL_UNI_TEX = "texSampler";
var GL_ATTR_VTX = "vertex";
var GL_ATTR_POS = "position";
var GL_ATTR_NRM = "normal";
var GL_ATTR_COL = "color";
var GL_ATTR_DEF_X = "deformX";
var GL_ATTR_DEF_Y = "deformY";
var GL_ATTR_DEF_Z = "deformZ";
class ShaderProgram {
}
function Web3DContext(canvas) {
    var shaders;
    var colorList;
    var colorTables;
    var programs;
    var textures;
    var gl;
    gl = create3DContext(canvas, null);
    if (!gl) {
        throw "Could not create 3D Context";
    }
    initStaticData();
    programs = initShaders();
    textures = initTextures();
    function create3DContext(canvas, opt_attribs) {
        var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
        var context = null;
        for (var ii = 0; ii < names.length; ++ii) {
            try {
                context = canvas.getContext(names[ii], opt_attribs);
            }
            catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
    }
    function initStaticData() {
        shaders = [{
                name: "unifiedColorShader",
                id: 1,
                vxProgram: "attribute vec3 vertex;\n\
                        uniform mat4 mvpMatrix;\n\
                        \n\
                        void main(void) {\n\
                            gl_Position = mvpMatrix * vec4(vertex, 1.0);\n\
                        }",
                pxProgram: "precision mediump float;\n\
        	            \n\
                        uniform vec3 color;\n\
                        \n\
        	            void main(void) {\n\
                            gl_FragColor = vec4(color,1.0);\n\
                        }",
                attributes: [GL_ATTR_VTX],
                uniforms: [GL_UNI_MVP, GL_UNI_COL]
            },
            {
                name: "unifiedColorLightShader",
                id: 101,
                vxProgram: "attribute vec3 vertex;\n\
                    attribute vec3 normal;\n\
                    \n\
                    uniform mat4 pMatrix, mvMatrix;\n\
                    uniform mat3 normMatrix;\n\
                    \n\
                    varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    void main(void) {\n\
                        vec4 position4 = mvMatrix * vec4(vertex,1.0);\n\
                        gl_Position = pMatrix * position4;\n\
                        varPosition = vec3(position4) / position4.w;\n\
                        varNormal = normMatrix * normal;\n\
                    }",
                pxProgram: "precision mediump float;\n\
                    uniform vec3 color;\n\
                    uniform vec3 lightPosition;\n\
                    \n\
                    varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    const vec3 specColor = vec3(1.0, 1.0, 1.0);\n\
                    \n\
                    void main(void) {\n\
                        vec3 normal = normalize(varNormal);\n\
                        vec3 lightDir = normalize(lightPosition - varPosition);\n\
                        float lambertian = max(dot(lightDir,normal), 0.0);\n\
                        float specular = 0.0;\n\
                        if (lambertian > 0.0) {\n\
                            vec3 viewDir = normalize(-varPosition);\n\
                            \n\
                            vec3 halfDir = normalize(lightDir + viewDir);\n\
                            float specAngle = max(dot(halfDir, normal), 0.0);\n\
                            specular = pow(specAngle, 16.0);\n\
                        }\n\
                        gl_FragColor = vec4(min((0.6 + lambertian) * color, specular) + specular * specColor, 1.0);\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_NRM],
                uniforms: [GL_UNI_LIG, GL_UNI_P, GL_UNI_MV, GL_UNI_NORM, GL_UNI_COL]
            },
            {
                name: "ColorShader",
                id: 2,
                vxProgram: "precision mediump float;\n\
                attribute vec3 vertex;\n\
                    attribute vec3 color;\n\
                    \n\
                    uniform mat4 mvpMatrix;\n\
                    \n\
                    varying vec3 varColor;\n\
                    \n\
                    void main(void ) {\n\
                    gl_Position = mvpMatrix * vec4(vertex, 1.0);\n\
                    varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
                    varying vec3 varColor;\n\
        	        void main(void) {\n\
                        gl_FragColor = vec4(varColor,1.0);\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_COL],
                uniforms: [GL_UNI_MVP]
            },
            {
                name: "ColorLigthShader",
                id: 102,
                vxProgram: "attribute vec3 vertex;\n\
                    attribute vec3 normal;\n\
                    attribute vec3 color;\n\
                    \n\
                    uniform mat4 pMatrix, mvMatrix;\n\
                    uniform mat3 normMatrix;\n\
                    \n\
                    varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    varying vec3 varColor;\n\
                    \n\
                    void main(void ) {\n\
                        vec4 position4 = mvMatrix * vec4(vertex,1.0);\n\
                        gl_Position = pMatrix * position4;\n\
                        varPosition = vec3(position4) / position4.w;\n\
                        varNormal = normMatrix * normal, 0.0;\n\
                        varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
                            uniform vec3 lightPosition;\n\
                            \n\
                            const vec3 specColor = vec3(1.0, 1.0, 1.0);\n\
                            \n\
                            varying vec3 varNormal;\n\
                            varying vec3 varPosition;\n\
                            varying vec3 varColor;\n\
                            \n\
                            void main(void) {\n\
                                vec3 normal = normalize(varNormal);\n\
                                vec3 lightDir = normalize(lightPosition - varPosition);\n\
                                float lambertian = max(dot(lightDir,normal), 0.0);\n\
                                float specular = 0.0;\n\
                                if (lambertian > 0.0) {\n\
                                    vec3 viewDir = normalize(-varPosition);\n\
                                    \n\
                                    vec3 halfDir = normalize(lightDir + viewDir);\n\
                                    float specAngle = max(dot(halfDir, normal), 0.0);\n\
                                    specular = pow(specAngle, 16.0);\n\
                                }\n\
                                gl_FragColor = vec4(min((0.6 + lambertian) * varColor, specColor) + specular * specColor, 1.0);\n\
                            }",
                attributes: [GL_ATTR_VTX, GL_ATTR_COL, GL_ATTR_NRM],
                uniforms: [GL_UNI_LIG, GL_UNI_MV, GL_UNI_P, GL_UNI_NORM]
            },
            {
                name: "ColorTableShader",
                id: 3,
                vxProgram: "attribute vec3 vertex;\n\
                    attribute float color;\n\
        	        \n\
                    uniform mat4 mvpMatrix;\n\
        	        \n\
        	        varying float varColor;\n\
                    \n\
                    void main(void ) {\n\
                        gl_Position = mvpMatrix * vec4(vertex, 1.0);\n\
                        varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
        	        uniform sampler2D texSampler;\n\
                    varying float varColor;\n\
                    \
                    void main(void ) {\n\
                        gl_FragColor = texture2D(texSampler, vec2(varColor, 0.0));\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_COL],
                uniforms: [GL_UNI_MVP, GL_UNI_TEX]
            },
            {
                name: "ColorTableLightShader",
                id: 103,
                vxProgram: "\
                    attribute vec3 vertex;\n\
                    attribute float color;\n\
        	        attribute vec3 normal;\n\
        	        \n\
                    uniform mat4 pMatrix, mvMatrix;\n\
                    uniform mat3 normMatrix;\n\
        	        \n\
        	        varying float varColor;\n\
        	        varying vec3 varNormal;\n\
                    varying vec3 varPosition;\
                    \n\
                    void main(void ) {\n\
                        vec4 position4 = mvMatrix * vec4(vertex,1.0);\n\
                        gl_Position = pMatrix * position4;\n\
                        varPosition = vec3(position4) / position4.w;\n\
                        varNormal = normMatrix * normal;\n\
                        varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
        	        uniform sampler2D texSampler;\n\
                    uniform vec3 lightPosition;\n\
        	        \n\
        	        varying float varColor;\n\
        	        varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    const vec3 specColor = vec3(1.0, 1.0, 1.0);\n\
                    \n\
                    void main(void) {\n\
                        vec3 normal = normalize(varNormal);\n\
                        vec3 lightDir = normalize(lightPosition - varPosition);\n\
                        float lambertian = max(dot(lightDir,normal), 0.0);\n\
                        float specular = 0.0;\n\
                        if (lambertian > 0.0) {\n\
                            vec3 viewDir = normalize(-varPosition);\n\
                            \n\
                            vec3 halfDir = normalize(lightDir + viewDir);\n\
                            float specAngle = max(dot(halfDir, normal), 0.0);\n\
                            specular = pow(specAngle, 16.0);\
                        }\n\
                        vec4 color = texture2D(texSampler, vec2(varColor, 1.0));\n\
                        gl_FragColor = vec4(min((0.6 + lambertian) * vec3(color.r, color.g, color.b), specColor) + specular * specColor, 1.0);\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_COL, GL_ATTR_NRM],
                uniforms: [GL_UNI_MV, GL_UNI_P, GL_UNI_NORM, GL_UNI_LIG, GL_UNI_TEX]
            },
            {
                name: "MultGeomShader",
                id: 4,
                vxProgram: "\
                    attribute vec3 vertex;\n\
                    attribute vec3 position;\n\
                    \n\
                    uniform mat4 mvpMatrix;\n\
                    uniform float scale;\n\
                    uniform vec3 color;\n\
                    \n\
                    varying vec3 varColor;\n\
                    \n\
                    void main(void ){\n\
                        vec3 res = scale * vertex + position;\n\
                        gl_Position = mvpMatrix * vec4(res, 1.0);\n\
                        varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
                    varying vec3 varColor; \n\
                    void main(void ) { \n\
                        gl_FragColor = vec4(varColor, 1.0); \n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_POS],
                uniforms: [GL_UNI_MVP, GL_UNI_SCL, GL_UNI_COL]
            },
            {
                name: "MultiGeomLightShader",
                id: 104,
                vxProgram: "\
                    attribute vec3 vertex;\n\
                    attribute vec3 position;\n\
                    attribute vec3 normal;\n\
                    \n\
                    uniform mat4 pMatrix, mvMatrix;\n\
                    uniform mat3 normMatrix;\n\
                    uniform float scale;\n\
                    \n\
                    varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    void main(void ){\n\
                        vec3 res = scale * vertex + position;\n\
                        vec4 position4 = mvMatrix * vec4(res,1.0);\n\
                        gl_Position = pMatrix * position4;\n\
                        varPosition = vec3(position4) / position4.w;\n\
                        varNormal = normMatrix * normal, 0.0;\n\
                    }",
                pxProgram: "precision mediump float;\n\
                    uniform vec3 color;\n\
                    uniform vec3 lightPosition;\n\
                    \n\
                    const vec3 specColor = vec3(1.0, 1.0, 1.0);\n\
                    \n\
                    varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    void main(void) {\n\
                        vec3 normal = normalize(varNormal);\n\
                        vec3 lightDir = normalize(lightPosition - varPosition);\n\
                        float lambertian = max(dot(lightDir,normal), 0.0);\n\
                        float specular = 0.0;\n\
                        if (lambertian > 0.0) {\n\
                            vec3 viewDir = normalize(-varPosition);\n\
                            \n\
                            vec3 halfDir = normalize(lightDir + viewDir);\n\
                            float specAngle = max(dot(halfDir, normal), 0.0);\n\
                            specular = pow(specAngle, 16.0);\n\
                        }\n\
                        gl_FragColor = vec4(min((0.5 + lambertian) * color, specColor) + specular * specColor, 1.0);\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_POS, GL_ATTR_NRM],
                uniforms: [GL_UNI_MV, GL_UNI_P, GL_UNI_NORM, GL_UNI_LIG, GL_UNI_COL, GL_UNI_SCL]
            }, {
                name: "ColorTextDeformShader",
                id: 5,
                vxProgram: "\
                    attribute vec3 vertex;\n\
                    attribute float color;\n\
                    attribute float deformX;\n\
                    attribute float deformY;\n\
                    attribute float deformZ;\n\
        	        \n\
                    uniform mat4 mvpMatrix;\n\
                    uniform float scale;\n\
        	        \n\
        	        varying float varColor;\n\
                    \n\
                    void main(void ) {\n\
                        gl_Position = mvpMatrix * vec4(vertex + scale * vec3(deformX, deformY, deformZ) , 1.0) ;\n\
                        varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
        	        uniform sampler2D texSampler;\n\
                    varying float varColor;\n\
                    \n\
                    void main(void ) {\n\
                        gl_FragColor = texture2D(texSampler, vec2(varColor, 0.0));\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_COL, GL_ATTR_DEF_X, GL_ATTR_DEF_Y, GL_ATTR_DEF_Z],
                uniforms: [GL_UNI_MVP, GL_UNI_TEX, GL_UNI_SCL]
            },
            {
                name: "ColorTextDeformLightShader",
                id: 105,
                vxProgram: "\
                    attribute vec3 vertex;\n\
                    attribute float color;\n\
                    attribute float deformX;\n\
                    attribute float deformY;\n\
                    attribute float deformZ;\n\
        	        attribute vec3 normal;\n\
        	        \n\
                    uniform float scale;\n\
                    uniform mat4 pMatrix, mvMatrix;\n\
                    uniform mat3 normMatrix;\n\
        	        \n\
        	        varying float varColor;\n\
        	        varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    void main(void ) {\n\
                        vec4 position4 = mvMatrix * vec4(vertex + scale * vec3(deformX, deformY, deformZ)  , 1.0);\n\
                        gl_Position = pMatrix * position4;\n\
                        varPosition = vec3(position4) / position4.w;\n\
                        varNormal = normMatrix * normal, 0.0;\n\
                        varColor = color;\n\
                    }",
                pxProgram: "precision mediump float;\n\
        	        uniform sampler2D texSampler;\n\
                    uniform vec3 lightPosition;\n\
        	        \n\
        	        varying float varColor;\n\
        	        varying vec3 varNormal;\n\
                    varying vec3 varPosition;\n\
                    \n\
                    const vec3 specColor = vec3(1.0, 1.0, 1.0);\n\
                    \n\
                     void main(void) {\n\
                        vec3 normal = normalize(varNormal);\n\
                        vec3 lightDir = normalize(lightPosition - varPosition);\n\
                        float lambertian = max(dot(lightDir,normal), 0.0);\n\
                        float specular = 0.0;\n\
                        if (lambertian > 0.0) {\n\
                            vec3 viewDir = normalize(-varPosition);\n\
                            \n\
                            vec3 halfDir = normalize(lightDir + viewDir);\n\
                            float specAngle = max(dot(halfDir, normal), 0.0);\n\
                            specular = pow(specAngle, 16.0);\n\
                        }\n\
                        vec4 color = texture2D(texSampler, vec2(varColor, 0.0));\n\
                        gl_FragColor = vec4(min((0.5 + lambertian) * vec3(color.r, color.g, color.b), specColor) + specular * specColor, 1.0);\n\
                    }",
                attributes: [GL_ATTR_VTX, GL_ATTR_COL, GL_ATTR_NRM, GL_ATTR_DEF_X, GL_ATTR_DEF_Y, GL_ATTR_DEF_Z],
                uniforms: [GL_UNI_MV, GL_UNI_P, GL_UNI_NORM, GL_UNI_LIG, GL_UNI_TEX, GL_UNI_SCL]
            },
        ];
        colorList = [
            { name: 'black', value: [0.1, 0.1, 0.1] },
            { name: 'red', value: [0.5, 0.0, 0.0] },
            { name: 'blue', value: [0.0, 0.2, 5.0] },
            { name: 'light blue', value: [0.2, 0.4, 0.4] },
            { name: 'green', value: [0.0, 0.5, 0.0] },
            { name: 'dark green', value: [0.1, 0.2, 0.0] },
            { name: 'yellow', value: [0.5, 0.5, 0.0] },
            { name: 'yellow green', value: [0.4, 0.5, 0.0] },
            { name: 'grey dark', value: [0.3, 0.3, 0.3] },
            { name: 'grey light', value: [0.6, 0.6, 0.6] }];
        colorTables = [
            {
                name: "Cyclic",
                size: 7,
                tex: new Uint8Array([255, 0, 0,
                    255, 255, 0,
                    0, 255, 0,
                    0, 255, 255,
                    0, 0, 255,
                    255, 0, 255,
                    255, 0, 0,
                    255, 0, 0]),
            },
            {
                name: "Disco",
                size: 9,
                tex: new Uint8Array([0, 0, 128,
                    0, 0, 255,
                    0, 128, 255,
                    0, 255, 255,
                    128, 128, 255,
                    255, 0, 255,
                    255, 0, 128,
                    255, 0, 0,
                    128, 0, 0])
            },
            {
                name: 'DiscoLight',
                size: 9,
                tex: new Uint8Array([0, 0, 128,
                    0, 0, 255,
                    0, 128, 255,
                    0, 255, 255,
                    128, 192, 255,
                    255, 128, 255,
                    255, 128, 255,
                    255, 64, 128,
                    255, 0, 0,
                    128, 0, 0]),
            },
            {
                name: 'GrayPrint',
                size: 2,
                tex: new Uint8Array([130, 130, 130,
                    242, 242, 242]),
            },
            {
                name: 'GrayScale',
                size: 2,
                tex: new Uint8Array([0, 0, 0,
                    255, 255, 255]),
            },
            {
                name: 'Rainbow',
                size: 9,
                tex: new Uint8Array([0, 0, 128,
                    0, 0, 255,
                    0, 128, 255,
                    0, 255, 255,
                    128, 255, 128,
                    255, 255, 0,
                    255, 128, 0,
                    255, 0, 0,
                    128, 0, 0])
            },
            {
                name: 'RainbowLight',
                size: 4,
                tex: new Uint8Array([0, 0, 255,
                    0, 255, 255,
                    255, 255, 0,
                    255, 0, 0])
            },
            {
                name: 'Thermal',
                size: 17,
                tex: new Uint8Array([0, 0, 0, 64, 0, 0, 128, 0, 0,
                    192, 0, 0, 255, 0, 0, 255, 37, 0,
                    255, 73, 0, 255, 110, 0, 255, 146, 0,
                    255, 183, 0, 255, 219, 0, 255, 255, 0,
                    255, 255, 51, 255, 255, 102, 255, 255, 153,
                    255, 255, 204, 255, 255, 255])
            },
            {
                name: 'ThermalEquidistant',
                size: 4,
                tex: new Uint8Array([0, 0, 0, 255, 0, 0, 255, 255, 0, 255, 255, 255]),
            },
            {
                name: 'Traffic',
                size: 9,
                tex: new Uint8Array([0, 170, 0,
                    0, 255, 0,
                    85, 255, 0,
                    170, 255, 0,
                    255, 255, 0,
                    255, 170, 0,
                    255, 85, 0,
                    255, 0, 0,
                    170, 0, 0]),
            },
            {
                name: 'TrafficLight',
                size: 3,
                tex: new Uint8Array([0, 255, 0,
                    255, 255, 0,
                    0, 255, 0]),
            }
        ];
    }
    function initShaders() {
        var shaderPrograms = [];
        var vxShader, pxShader;
        for (var i = 0; i < shaders.length; i++) {
            var program = new ShaderProgram();
            program.gl = gl.createProgram();
            program.attributes = [];
            program.uniforms = [];
            var programId = shaders[i].id;
            vxShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vxShader, shaders[i].vxProgram);
            gl.compileShader(vxShader);
            if (!gl.getShaderParameter(vxShader, gl.COMPILE_STATUS)) {
                handleError({ name: "Vertex Shader Complilation", message: "Error while compiling VX Shader: " + shaders[i].name + ":\t" + gl.getShaderInfoLog(vxShader) });
            }
            pxShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(pxShader, shaders[i].pxProgram);
            gl.compileShader(pxShader);
            if (!gl.getShaderParameter(pxShader, gl.COMPILE_STATUS)) {
                handleError({ name: "Vertex Shader Complilation", message: "Error while compiling PX Shader: " + shaders[i].name + ":\t" + gl.getShaderInfoLog(pxShader) });
            }
            gl.attachShader(program.gl, vxShader);
            gl.attachShader(program.gl, pxShader);
            gl.linkProgram(program.gl);
            if (!gl.getProgramParameter(program.gl, gl.LINK_STATUS)) {
                handleError({ name: "Shader Program Linking", message: "Error while linking Shader: " + shaders[i].name + ":\t" + gl.getProgramInfoLog(program.gl) });
            }
            for (var j = 0; j < shaders[i].attributes.length; j++) {
                var attrName = shaders[i].attributes[j];
                var attr = gl.getAttribLocation(program.gl, attrName);
                if (attr === -1) {
                    handleError({ name: "Shader Attribute", message: "Error Attribute: " + attrName + " not found." });
                }
                program.attributes[attrName] = attr;
            }
            for (var j = 0; j < shaders[i].uniforms.length; j++) {
                var uniName = shaders[i].uniforms[j];
                var uni = gl.getUniformLocation(program.gl, uniName);
                if (uni === -1) {
                    handleError({ name: "Shader Program Linking", message: "Error Uniform: " + uniName + " not found." });
                }
                program.uniforms[uniName] = uni;
            }
            shaderPrograms[programId] = program;
        }
        return shaderPrograms;
    }
    function initTextures() {
        var texArray = [];
        for (var i = 0; i < colorTables.length; i++) {
            texArray[i] = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texArray[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, colorTables[i].size, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, colorTables[i].tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }
        return texArray;
    }
    this.setupArrayBuffer = function (binFloatArray) {
        var tmpBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tmpBuf);
        gl.bufferData(gl.ARRAY_BUFFER, binFloatArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return tmpBuf;
    };
    this.setupElementBuffer = function (binShortArray) {
        var tmpBuf = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tmpBuf);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, binShortArray, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return tmpBuf;
    };
    this.getContext = function () {
        return gl;
    };
    this.getCanvas = function () {
        return canvas;
    };
    this.getPrograms = function () {
        return programs;
    };
    this.getTextureName = function () {
        var names = [];
        for (var i = 0; i < colorTables.length; i++) {
            names.push(colorTables[i].name);
        }
        return names;
    };
    this.getColorNames = function () {
        var names = [];
        for (var i = 0; i < colorList.length; i++) {
            names.push(colorList[i].name);
        }
        return names;
    };
    this.getColorByName = function (name) {
        for (var i = 0; i < colorList.length; i++) {
            if (colorList[i].name === name) {
                return colorList[i].value;
            }
        }
    };
    this.getTextureByName = function (name) {
        for (var i = 0; i < colorTables.length; i++) {
            if (colorTables[i].name === name) {
                return textures[i];
            }
        }
    };
}
