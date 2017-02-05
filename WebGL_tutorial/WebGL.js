		var canvas;
		var gl = null;

		var cubeVerticesBuffer;
		var cubeVerticesTextureCoordBuffer;
		var cubeVerticesIndexBuffer;
		var cubeRotation = 0.0;
		var lastCubeUpdateTime = 0;
		var step;
		var degree = 0;

		var cubeImage;
		var cubeTexture;

		var shaderProgram;
		var normalMatrix = mat4.create();
		var mvMatrix = mat4.create();
		var pMatrix = mat4.create();
		var vertexPositionAttribute;
		var vertexNormalAttribute;
		var textureCoordAttribute;

		var colorTable = new Uint8Array([
				0,0,128,
				0,0,255,
				0,128,255,
				0,255,255,
				128,128,255,
				255,0,255,
				255,0,128,
				255,0,0,
				128,0,0
			]);

		function initGL(canvas){
			try {
				gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
				gl.viewportWidth = canvas.width;
				gl.viewportHeight = canvas.height;
			}
			catch(e){
			}

			if (!gl) {
            	alert("Could not initialise WebGL, sorry :-(");
        	}
		}

		function getShader(gl,id){

			var shaderScript = document.getElementById(id);

			if(!shaderScript){
				return null;
			}

			var theSource = '';
			var currentChild = shaderScript.firstChild;

			while(currentChild){
				if(currentChild.nodeType == 3){
					theSource += currentChild.textContent;
				}

				currentChild = currentChild.nextSibling;
			}

			var shader;

			if(shaderScript.type == 'x-shader/x-fragment'){
				shader = gl.createShader(gl.FRAGMENT_SHADER);
			}else if(shaderScript.type == 'x-shader/x-vertex'){
				shader = gl.createShader(gl.VERTEX_SHADER);
			}else {
				return null;
			}

			gl.shaderSource(shader, theSource);

			gl.compileShader(shader);

			if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
				alert('An error occurred compiling the shaders: '+ gl.getShaderInfoLog(shader));
				return null;
			}

			return shader;
		}

		function initShaders(){
			var fragmentShader = getShader(gl,'shader-fs');
			var vertexShader = getShader(gl,'shader-vs');

			shaderProgram = gl.createProgram();
			gl.attachShader(shaderProgram, vertexShader);
			gl.attachShader(shaderProgram, fragmentShader);
			gl.linkProgram(shaderProgram);

			if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
				alert('Unable to initialize the shader program.');
			}

			gl.useProgram(shaderProgram);


			vertexPositionAttribute = gl.getAttribLocation(shaderProgram, 'aVertexPosition');
			gl.enableVertexAttribArray(vertexPositionAttribute);
			shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
        	shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

        	shaderProgram.nUniform = gl.getUniformLocation(shaderProgram, "uNormalMatrix");


        	textureCoordAttribute = gl.getAttribLocation(shaderProgram, "color");
        	gl.enableVertexAttribArray(textureCoordAttribute);
		}


		function updateMatrixUniforms(){
			gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
			gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
			mat4.invert(normalMatrix,mvMatrix);
			mat4.transpose(normalMatrix,normalMatrix);
			gl.uniformMatrix4fv(shaderProgram.nUniform, false, new Float32Array(normalMatrix));
		}

		function initBuffers(){

			// Create a buffer for the cube's vertices.
			cubeVerticesBuffer = gl.createBuffer();

			// Select the cubeVerticesBuffer as the one to apply vertex
			// operations to from here out.
			gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

			var vertices = [
				// Front face
				-1.0, -1.0,  1.0,
				1.0, -1.0,  1.0,
				1.0,  1.0,  1.0,
				-1.0,  1.0,  1.0,

				// Back face
				-1.0, -1.0, -1.0,
				-1.0,  1.0, -1.0,
				1.0,  1.0, -1.0,
				1.0, -1.0, -1.0,

				// Top face
				-1.0,  1.0, -1.0,
				-1.0,  1.0,  1.0,
				1.0,  1.0,  1.0,
				1.0,  1.0, -1.0,

				// Bottom face
				-1.0, -1.0, -1.0,
				1.0, -1.0, -1.0,
				1.0, -1.0,  1.0,
				-1.0, -1.0,  1.0,

				// Right face
				1.0, -1.0, -1.0,
				1.0,  1.0, -1.0,
				1.0,  1.0,  1.0,
				1.0, -1.0,  1.0,

				// Left face
				-1.0, -1.0, -1.0,
				-1.0, -1.0,  1.0,
				-1.0,  1.0,  1.0,
				-1.0,  1.0, -1.0
			];

			// Now pass the list of vertices into WebGL to build the shape. We
			// do this by creating a Float32Array from the JavaScript array,
			// then use it to fill the current vertex buffer.
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

			// Map the texture onto the cube's faces.

			cubeVerticesTextureCoordBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);

			var textureCoordinates = [
			  // Front
			  0.0,  0.0,
			  1.0,  0.0,
			  1.0,  1.0,
			  0.0,  1.0,
			  // Back
			  0.0,  0.0,
			  1.0,  0.0,
			  1.0,  1.0,
			  0.0,  1.0,
			  // Top
			  0.0,  0.0,
			  1.0,  0.0,
			  1.0,  1.0,
			  0.0,  1.0,
			  // Bottom
			  0.0,  0.0,
			  1.0,  0.0,
			  1.0,  1.0,
			  0.0,  1.0,
			  // Right
			  0.0,  0.0,
			  1.0,  0.0,
			  1.0,  1.0,
			  0.0,  1.0,
			  // Left
			  0.0,  0.0,
			  1.0,  0.0,
			  1.0,  1.0,
			  0.0,  1.0
			];

			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),gl.STATIC_DRAW);

			// Build the element array buffer; this specifies the indices
			// into the vertex array for each face's vertices.

			cubeVerticesIndexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

			// This array defines each face as two triangles, using the
			// indices into the vertex array to specify each triangle's
			// position.

			var cubeVertexIndices = [
				0,  1,  2,      0,  2,  3,    // front
				4,  5,  6,      4,  6,  7,    // back
				8,  9,  10,     8,  10, 11,   // top
				12, 13, 14,     12, 14, 15,   // bottom
				16, 17, 18,     16, 18, 19,   // right
				20, 21, 22,     20, 22, 23    // left
			]

			// Now send the element array to GL

			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

			cubeVerticesNormalBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);

			var vertexNormals = [
			  // Front
			   0.0,  0.0,  1.0,
			   0.0,  0.0,  1.0,
			   0.0,  0.0,  1.0,
			   0.0,  0.0,  1.0,
			  
			  // Back
			   0.0,  0.0, -1.0,
			   0.0,  0.0, -1.0,
			   0.0,  0.0, -1.0,
			   0.0,  0.0, -1.0,
			  
			  // Top
			   0.0,  1.0,  0.0,
			   0.0,  1.0,  0.0,
			   0.0,  1.0,  0.0,
			   0.0,  1.0,  0.0,
			  
			  // Bottom
			   0.0, -1.0,  0.0,
			   0.0, -1.0,  0.0,
			   0.0, -1.0,  0.0,
			   0.0, -1.0,  0.0,
			  
			  // Right
			   1.0,  0.0,  0.0,
			   1.0,  0.0,  0.0,
			   1.0,  0.0,  0.0,
			   1.0,  0.0,  0.0,
			  
			  // Left
			  -1.0,  0.0,  0.0,
			  -1.0,  0.0,  0.0,
			  -1.0,  0.0,  0.0,
			  -1.0,  0.0,  0.0
			];

			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
		}

		function initTextures() {
			cubeTexture = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 9,1,0,gl.RGB, gl.UNSIGNED_BYTE, colorTable);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			// Prevents s-coordinate wrapping (repeating).
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			// Prevents t-coordinate wrapping (repeating).
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}


		function drawScene(timestep){

			gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
	        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	        mat4.perspective(pMatrix, 45.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
	        mat4.identity(mvMatrix);
	        mat4.lookAt(mvMatrix,[0,0,4],[0,0,2],[0,2,0]);


	        // set the vertex
	        mat4.translate(mvMatrix, mvMatrix, [-0.0, 0.0, -6.0]);

	        // Draw the cube by binding the array buffer to the cube's vertices
			// array, setting attributes, and pushing it to GL.
	        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
	        gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	        // Set the texture coordinates attribute for the vertices.
			gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);
			gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

			//
			gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesNormalBuffer);
			gl.vertexAttribPointer(vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

			degree = degree + 3.14/360;

			mat4.rotate(mvMatrix,mvMatrix,degree,[1,1,1]);

			// Specify the texture to map onto the faces.
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
			gl.uniform1i(gl.getUniformLocation(shaderProgram, "uSampler"), 0);

	        //draw the cube
	        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);
	        updateMatrixUniforms();
	        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
		}


		function webGLStart(){
			var canvas = document.getElementById('glcanvas');
			initGL(canvas);
			if (gl) {
		    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		    gl.clearDepth(1.0);                 // Clear everything
		    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

		    // Initialize the shaders; this is where all the lighting for the
		    // vertices and so forth is established.

		    initShaders();

		    // Here's where we call the routine that builds all the objects
		    // we'll be drawing.

		    initBuffers();

		    // Next, load and set up the textures we'll be using.

		    initTextures();

		    // Set up to draw the scene periodically.

		    fpsInterval = 1000/60;
			   then = Date.now();
			   startTime = then;

				(function animloop(time){
			        now = Date.now();
			        elapsed = now - then;
			       if(elapsed > fpsInterval){
						drawScene(time);
			       }
					requestAnimationFrame(animloop);
			   })();
		  }
		}