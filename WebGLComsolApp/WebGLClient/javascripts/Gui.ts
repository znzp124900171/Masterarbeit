/// <reference path="libs/gl-matrix.d.ts"/>
/// <reference path="libs/jquery.d.ts"/>

interface OrientationPosition {
    x: number,
    y: number
}

interface MotionPosition {
    t: number;  //time
    a: number;  //acceleration
}

function Gui(modelData: ModelCmds, renderer: Renderer, glContext: Web3DContext) {
    var self = this;
    var gl = glContext.getContext();

    var canvas = <HTMLCanvasElement>document.getElementById('webgl');
    var canvas2D = <HTMLCanvasElement>document.getElementById('canvas2D');
    var ctx: CanvasRenderingContext2D = canvas2D.getContext('2d');

    var fontSize: number = parseInt(window.getComputedStyle(document.body).getPropertyValue('font-size')) * 2;

    var jqModelList = $("#model");
    var jqResultList = $("#result");
    var jqPlotList = $("#plot");

    var jqColor = $('#color');
    var jqColorTable = $('#colorTable');

    //request ModelList
    modelData.getModelList(updateModelList);

    var reset = $('#reset');

    var oldOrientation: OrientationPosition = {
        x: 0,
        y: 0
    };

    var oldMotion: MotionPosition = {
        t: 0,
        a: 0
    };

    //Input Handler
    (function () {
        var fullScreenButton = $('#fullScreen');
        var lightButton = $('#light');
        var resetButton = $('#reset');
        var vrButton = $('#vr');

        let navHeader = $('header');
        let navSidebar = $('aside');

        var width;
        var height;

        var pointerMoved = false;
        var pointerOne = null;
        var pointerTwo = null;
        var pointerSpecial = null;
        var lastPosition = {};
        var keydown = null;

        var pointerDown;
        var pointerUp;
        var pointerMove;
        var pointerLeave;

        var handleMouseWheel;
        var handleResize;
        var handleRangeX;
        var handleRangeY;
        var handleRangeZ;

        var vrOn = false;

        var toggleFullScreen;
        var handleFullScreenChange;
        var handleResetView;
        var toggleLight;
        var toggleVR;
        var deviceOrientation;
        var deviceMotion;

        pointerDown = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            if (!pointerOne || evt.pointerId === pointerOne) {
                pointerOne = evt.pointerId;
                lastPosition[pointerOne] = { x: evt.clientX, y: evt.clientY };
            } else if (!pointerTwo) {
                pointerTwo = evt.pointerId;
                lastPosition[pointerTwo] = { x: evt.clientX, y: evt.clientY };
            }
        }
        pointerUp = function (evt) {
            lastPosition[pointerOne] = null;
            lastPosition[pointerTwo] = null;
            pointerOne = null;
            pointerTwo = null;
        }
        pointerMove = function (evt) {
            if (pointerOne) {   //first Pointer
                if (pointerTwo) {   //first and second Pointer => pitch
                    var firstPosition, secondPosition;
                    var newPosition = { x: evt.clientX, y: evt.clientY };
                    var enableRotate: boolean = false;

                    if (evt.pointerId === pointerOne) {
                        firstPosition = lastPosition[pointerOne]
                        secondPosition = lastPosition[pointerTwo];
                        lastPosition[pointerOne] = newPosition;
                    } else if (evt.pointerId === pointerTwo) {
                        firstPosition = lastPosition[pointerTwo];
                        secondPosition = lastPosition[pointerOne];
                        lastPosition[pointerTwo] = newPosition;
                    } else {
                        return;
                    }
                    var difX = firstPosition.x - secondPosition.x;
                    var difY = firstPosition.y - secondPosition.y;
                    var lastDist = Math.sqrt(difX * difX + difY * difY);

                    difX = newPosition.x - secondPosition.x;
                    difY = newPosition.y - secondPosition.y;
                    var newDist = Math.sqrt(difX * difX + difY * difY);

                    var zVal = renderer.getPosition()[2];
                    zVal += (lastDist - newDist) * 0.05;
                    //rangeZ.val(zVal * 50);
                    //rangeZ.slider('refresh');
                    renderer.setZPosition(zVal);

                } else {    //only first Pointer
                    if (evt.button === 0 || evt.buttons & 1 || (evt.button === 2 || evt.buttons & 2) && renderer.getActivePlotGroupType() === 2) { //left Button  => move
                        var oldPosition = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };

                        var renderPosi = renderer.getPosition();

                        var deltaX = (oldPosition.x - newPosition.x) * -1 / width;
                        var deltaY = (oldPosition.y - newPosition.y) / width;
                        renderPosi[0] += deltaX;
                        renderPosi[1] += deltaY;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.setPositionV(renderPosi);
                    } else if ((evt.button === 2 || evt.buttons & 2) && renderer.getActivePlotGroupType() === 3) { //right Button => rotate

                        var position = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };

                        var deltaX = (newPosition.x - position.x) * 100 / width;
                        var deltaY = (newPosition.y - position.y) * 100 / height;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.rotateObject(deltaX, deltaY);

                        console.log('delatX: ' + deltaX + ';  deltaY: ' + deltaY + ';  newPosition.x: ' + newPosition.x + '; position.x' + position.x + ';  newPosition.y: ' + newPosition.y + '; position.y' + position.y);

                    } else if (evt.button === 1 || evt.button & 1) { //middle Button => zoom
                        var position = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };

                        var deltaX = (newPosition.x - position.x) * -1 / width;
                        var deltaY = (newPosition.y - position.y) / width;

                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            var dist = deltaX;
                        } else {
                            var dist = deltaY;
                        }

                        var eyeZ = renderer.getPosition()[2];
                        eyeZ = Math.log(-eyeZ + 1) * 50
                        eyeZ += dist;
                        eyeZ = - Math.exp(eyeZ / 50) + 1;
                        renderer.setZPosition(eyeZ);
                    }
                }
            }
        }
        pointerLeave = function (evt) {
            if (pointerOne) {
                lastPosition[pointerOne] = null;
                pointerOne = null;
            }
            if (pointerTwo) {
                lastPosition[pointerTwo] = null;
                pointerTwo = null;
            }
        }

        //add the keyboard control
        keydown = function (evt) {
            if (vrOn) {
                if (renderer.getSeperation() > 0.01) {//change the seperation of plots in two viewports
                    switch (evt.keyCode) {
                        case 37: // left arrow key
                            renderer.setSeperation(renderer.getSeperation() - 0.01);
                            break;
                        case 39: // right arrow key
                            renderer.setSeperation(renderer.getSeperation() + 0.01);
                            break;
                        case 38: //up arrow key
                            renderer.setZPosition(renderer.getPosition()[2] + 0.2);
                            break;
                        case 40: //bottom arrow key
                            renderer.setZPosition(renderer.getPosition()[2] - 0.2);
                            break;
                    }
                } else {
                    renderer.setSeperation(renderer.getSeperation() + 0.01);
                    alert('values are beyond the bondary')
                }

                if (evt.keyCode === 69) {//exit the VR mode
                    vrButton.click()
                }
            }
            
        }

        deviceOrientation = function(event) {
            let horizonalPosition: number = event.alpha;        // horizonal position
            let verticalPosition: number = event.gamma;         // vertical position

            let orientationDeltaX: number;                      // horizonal change                      
            let orientationDeltaY: number;                      // vertical change
            
            // set the vertical range from 180 grad to 0 grad
            if (verticalPosition < 0) {
                verticalPosition = 180 + verticalPosition;
            }

            // detect the boundary change of vertical position
            if (Math.abs(verticalPosition - oldOrientation.y) > 170) {
                orientationDeltaY = 0;
            } else {
                orientationDeltaY = Math.round((verticalPosition - oldOrientation.y) * 100) * 6 / height; //gain the rotation speed
            }

            // set the horizonal range from 270 grad to 90 grad
            if (verticalPosition > 90) {
                if (horizonalPosition > 270) {
                    horizonalPosition = horizonalPosition - 180;
                } else if (horizonalPosition < 90) {
                    horizonalPosition = horizonalPosition + 180;
                }
            } if (verticalPosition < 90) {
                if (horizonalPosition > 270) {
                    horizonalPosition = horizonalPosition - 180;
                } else if (horizonalPosition < 90) {
                    horizonalPosition = horizonalPosition + 180;
                }
            }
            // detect the boundary change of horizonal position
            if (Math.abs(horizonalPosition - oldOrientation.x) > 170) {
                orientationDeltaX = 0;
            } else {
                orientationDeltaX = Math.round((horizonalPosition - oldOrientation.x) * 100) * 12 / width; //gain the rotation speed
            }

            renderer.rotateObject(orientationDeltaX, orientationDeltaY);

            // store the position for next comparation
            oldOrientation.x = horizonalPosition;
            oldOrientation.y = verticalPosition;
        }

        deviceMotion = function (event) {
            let currentTime = new Date().getTime();
            let currentAcceleration: number;
            let eyeZ = renderer.getPosition()[2];
            let diffTime = currentTime - oldMotion.t;
            let maxAcceleration: number;

            if (event.acceleration.x > event.acceleration.y) {
                if (event.acceleration.x > event.acceleration.z) {
                    maxAcceleration = event.acceleration.x;
                } else {
                    maxAcceleration = event.acceleration.z;
                }
            } else {
                if (event.acceleration.y > event.acceleration.z) {
                    maxAcceleration = event.acceleration.y;
                } else {
                    maxAcceleration = event.acceleration.z;
                }
            }
           
            
            currentAcceleration = maxAcceleration;
            /*
            if (Math.abs(currentAcceleration) > 0.15) {
                eyeZ = Math.log(-eyeZ + 1) * 50
                eyeZ += currentAcceleration;
                eyeZ = - Math.exp(eyeZ / 50) + 1;
                renderer.setZPosition(eyeZ);
            }
            */

            ctx.clearRect(0, 0, canvas2D.width, canvas2D.height);
            ctx.font = '20px arial';
            ctx.fillStyle = 'white';
            ctx.fillText('A: ' + currentAcceleration.toFixed(1) + 'Time: ' + diffTime.toFixed(1), 10, 90);

            oldMotion.a = currentAcceleration;
            oldMotion.t = currentTime;
        }
        //mouse Wheel Event => prevent default and zoom instead
        handleMouseWheel = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta; // rotation degree of Mousewheel

            var eyeZ = renderer.getPosition()[2];
            eyeZ = Math.log(-eyeZ + 1) * 50
            eyeZ += delta / 120;
            eyeZ = - Math.exp(eyeZ / 50) + 1;
            renderer.setZPosition(eyeZ);
        }

        handleResize = function () {
            renderer.setAxisSize(fontSize);
            //Size of the browser
            width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;

            height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;

            //Size of the canvas
            canvas.width = width;

            //adjust the layout in VR mode
            if (vrOn) {
                canvas.height = height;
                renderer.resizeVRCanvas(canvas.width, canvas.height);
                $('.text-box').hide();
            } else {
                canvas.height = height - navHeader.outerHeight();
                renderer.resizeCanvas(canvas.width, canvas.height);
                $('.text-box').show();
            }
        }
        handleRangeX = function (evt) {
            var eyeX = parseFloat(evt.currentTarget.value);
            renderer.setXPosition(eyeX/50);
        };
        handleRangeY = function (evt) {
            var eyeY = parseFloat(evt.currentTarget.value);
            renderer.setYPosition(eyeY/50);
        };
        handleRangeZ = function (evt) {
            var eyeZ = parseFloat(evt.currentTarget.value);
            eyeZ = - Math.exp(eyeZ/50) + 1;
            renderer.setZPosition(eyeZ);
        };

        toggleFullScreen = function () {
            var docElement, request;
            if (((<any>document).fullScreenElement && (<any>document).fullScreenElement !== null) ||            // cast it to any, so Typescript don't throw an exception
                (!(<any>document).mozFullScreen && !(<any>document).webkitIsFullScreen)) {

                docElement = document.documentElement;
                request = docElement.requestFullScreen || docElement.webkitRequestFullScreen || docElement.mozRequestFullScreen || docElement.msRequestFullScreen;

                if (typeof request != "undefined" && request) {
                    request.call(docElement);
                }
            } else {
                docElement = document;
                request = docElement.cancelFullScreen || docElement.webkitCancelFullScreen || docElement.mozCancelFullScreen || docElement.msCancelFullScreen || docElement.exitFullscreen;

                if (typeof request != "undefined" && request) {
                    request.call(docElement);
                }
            }
        };
        handleResetView = function () {
            renderer.resetView();
        }
        toggleLight = function () {
            let lightOn = renderer.toggleLight();
        }
        toggleVR = function () {
            vrOn = renderer.toggleVR();

            if (vrOn) {
                navHeader.hide();
                navSidebar.hide();
                $('#content-wrapper').removeClass('content-wrapper');
                handleResize();
                toggleFullScreen();
            } else {
                $('#content-wrapper').addClass('content-wrapper');
                navHeader.show();
                navSidebar.show();
                handleResize();
            }
        }

        // attach handlers
        canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault(); //no Context menu in webGL
        }, false);

        var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";

        document.addEventListener(mousewheelevt, handleMouseWheel, false);
        document.addEventListener('pointerleave', pointerLeave, false);
        canvas.addEventListener('pointerdown', pointerDown, false);
        document.addEventListener('pointerup', pointerUp, false);
        document.addEventListener('pointermove', pointerMove, false);
        document.addEventListener('keydown', keydown, false);
        window.addEventListener('deviceorientation', deviceOrientation, false);
        window.addEventListener('devicemotion', deviceMotion, false);

        window.onresize = handleResize;
        resetButton.click(handleResetView);
        fullScreenButton.click(toggleFullScreen);

        lightButton.click(toggleLight);
        vrButton.click(toggleVR);

        //initial canvas size
        handleResize();
    } ());

    //change Model
    jqModelList.on('click', 'a.active', function () {
        var newModelID = $(this).attr('data-model');
        var oldModelID = renderer.getActiveModelId(); //get old Model Id from Renderer
        if (newModelID !== oldModelID) {    //if id changed
            renderer.setActiveModelById(newModelID, function () {       //reset the rendering scene, and request Model from server if not exists
                console.log("New modelId: " + newModelID);
                modelData.getPlotGroupMap(newModelID, updatePlotGroupList);
            });
        }
    });

    // change PlotGroup
    jqResultList.on('click', 'a.active', function () {
        var newPlotGroupID = $(this).attr('data-result');
        var oldPlotGroupID = renderer.getActivePlotGroupId();   //get old PlotGroup Id from Renderer
        if (newPlotGroupID !== oldPlotGroupID) {                //if id changed
            //reset view matrix at first
            renderer.resetView();
            renderer.setActivePlotGroupById(newPlotGroupID, function () {       //resets the current PlotGroup, and request PlotGroup Data from server
                var modelID = renderer.getActiveModelId();
                console.log("modelId: " + modelID + " \nNew plotGroupId: " + newPlotGroupID);
                modelData.getPlotMap(modelID, newPlotGroupID, updatePlotList);
            });

        }
    })
    

    // initialize all Color Names and Texture Names as definid in initWebGL
    setColors(glContext.getColorNames());
    setTextures(glContext.getTextureName());

    function setColors(colorList: string[]) {
        var jqColorList = $('#color');
        //add the responding color classes
        for (var i in colorList) {
            var li = $('<li></li>');
            var a = $('<a href="javascript:void(0);" data-skin="skin-blue" class="full-opacity-hover"></a>');
            var span = $('<span></span>');
            var div = $('<div></div>');
            var p = $('<p class="text-center no-margin"></p>');

            span.removeClass();
            if (colorList[i] === 'dark green') {
                span.addClass('dark-green');
            } else if (colorList[i] === 'yellow green') {
                span.addClass('yellow-green');
            } else if (colorList[i] === 'grey dark') {
                span.addClass('gray-dark');
            } else if (colorList[i] === 'grey light') {
                span.addClass('gray-light');
            } else {
                span.addClass(colorList[i]);
            }
            p.text(colorList[i]);
            span.appendTo(div);
            div.appendTo(a);
            a.appendTo(li);
            p.appendTo(li);
            li.appendTo(jqColorList);
        }
    }

    function setTextures(colTable: string[]) {
        var jqColorTableList = $('#colorTable');

        //add the responding color classes
        for (var i in colTable) {
            var li = $('<li></li>');
            var a = $('<a href="javascript:void(0);" data-skin="skin-blue" class="full-opacity-hover"></a>');
            var span = $('<span></span>');
            var div = $('<div></div>');
            var p = $('<p class="text-center no-margin"></p>');

            span.removeClass();
            span.addClass(colTable[i]);
            p.text(colTable[i]);
            span.appendTo(div);
            div.appendTo(a);
            a.appendTo(li);
            p.appendTo(li);
            li.appendTo(jqColorTableList);
        }
    }

    // updates Model Selector is called when model List is received
    function updateModelList(modelList: { modelId: string; name: string }[]): void {
        removeAllPlots();
        jqModelList.find('.treeview-menu').children().filter('li').remove();
        for (var i in modelList) {
            var list = $('<li></li>');
            var selectItem = $('<a></a>');
            selectItem.attr('href', '#');
            selectItem.attr('data-model', modelList[i].modelId);
            selectItem.text(modelList[i].name);
            list.append(selectItem);
            jqModelList.find('.treeview-menu').append(list);

        }
    }

    //updates PlotGroup Selector
    function updatePlotGroupList(plotGroupList: { name: string; id: string }[]): void {
        removeAllPlots();
        jqResultList.find('.treeview-menu').children().remove('li');
        for (var i in plotGroupList) {
            var list = $('<li></li>');
            var selectItem = $('<a></a>');
            selectItem.attr('href', '#');
            selectItem.attr('data-result', plotGroupList[i].id);
            selectItem.text(plotGroupList[i].name);
            list.append(selectItem);
            jqResultList.find('.treeview-menu').append(list);
        }
    }

    //removes All plot form List
    function removeAllPlots() {
        jqPlotList.find(".plotItem").unbind().remove();
    }

    // updates Plot Selector
    function updatePlotList(plotList: { name: string; id: string }[]): void {
        removeAllPlots();
        jqPlotList.find('.treeview-menu').children().remove('li');
        plotList.forEach(function (plot) {
            var list = $('<li></li>');
            var selectItem = $('<a></a>');
            selectItem.attr('href', '#');
            selectItem.attr('data-plot', plot.id);
            selectItem.text(plot.name);
            list.append(selectItem);
            jqPlotList.find('.treeview-menu').append(list);
            jqPlotList.on('click', 'a', function () {
                setPlot(plot.id,$(this).hasClass('active'));
            })
        })
    }

    function setPlot(plotTag: string, activeHandle: boolean) {
        resetPlot();
        var modelId = renderer.getActiveModelId();
        var plotGroupId = renderer.getActivePlotGroupId();

        console.log("modelId: " + modelId + " \nplotGroupId: " + plotGroupId);
        var result = modelData.getPlot(modelId, plotGroupId, plotTag, function (_result: Result) {
            if (activeHandle) {
                renderer.addPlot(_result);
                // if color selected
                jqColor.on('click','a', function () {
                    var colorSelected = $(this).find('span').attr('class');
                    _result.usrColor = colorSelected;
                    renderer.renderScene();
                });
                jqColorTable.on('click','a', function () {
                    _result.usrText = $(this).find('span').attr('class');;
                    renderer.renderScene();
                });
            } else {
                renderer.removePlot(_result);
                renderer.renderScene();
            }
        });
    }

    function resetPlot() {
        jqColor.off('click');
        jqColorTable.off('click');
    }
}

