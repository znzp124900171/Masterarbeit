/// <reference path="libs/gl-matrix.d.ts"/>
/// <reference path="libs/jquery.d.ts"/>

function Gui(modelData: ModelCmds, renderer: Renderer, glContext: Web3DContext) {
    var self = this;
    var gl = glContext.getContext();

    var canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('webgl');

    var jqModelList = $("#model");
    var jqResultList = $("#result");
    var jqPlotList = $("#plot");

    //request ModelList
    modelData.getModelList(updateModelList);

    var reset = $('#reset');

    //Input Handler
    (function () {
        var fullScreenButton = $('#fullScreen');
        var lightButton = $('#light');
        var resetButton = $('#reset');

        var rangeX = <any>$('#xPosi');
        var rangeY = <any>$('#yPosi');
        var rangeZ = <any>$('#zPosi');

        var width;
        var height;

        var pointerMoved = false;
        var pointerOne = null;
        var pointerTwo = null;
        var pointerSpecial = null;
        var lastPosition = {};

        var pointerDown;
        var pointerUp;
        var pointerMove;
        var pointerLeave;

        var handleMouseWheel;
        var handleResize;
        var handleRangeX;
        var handleRangeY;
        var handleRangeZ;

        var toggleFullScreen;
        var handleFullScreenChange;
        var handleResetView;
        var toggleLight;

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

                    console.log(renderer.getActivePlotGroupType);

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
                    rangeZ.val(zVal * 50);
                    rangeZ.slider('refresh');
                    renderer.setZPosition(zVal);

                } else {    //only first Pointer
                    if (evt.button === 0 || evt.buttons & 1) { //left Button  => move
                        var oldPosition = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };

                        var renderPosi = renderer.getPosition();

                        var deltaX = (oldPosition.x - newPosition.x) * -1 / width;
                        var deltaY = (oldPosition.y - newPosition.y) / width;
                        renderPosi[0] += deltaX;
                        renderPosi[1] += deltaY;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.setPositionV(renderPosi);

                        rangeX.val(renderPosi[0] * 50);
                        rangeX.slider('refresh');
                        rangeY.val(renderPosi[1] * 50);
                        rangeY.slider('refresh');
                    } else if (evt.button === 2 || evt.buttons & 2) { //right Button => rotate
                        var position = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };

                        var deltaX = (newPosition.x - position.x) * 100 / width;
                        var deltaY = (newPosition.y - position.y) * 100 / height;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.rotateObject(deltaX, deltaY);
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
                        rangeZ.val(eyeZ);
                        rangeZ.slider('refresh');
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

        //mouse Wheel Event => prevent default and zoom instead
        handleMouseWheel = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta; // rotation degree of Mousewheel

            var eyeZ = renderer.getPosition()[2];
            eyeZ = Math.log(-eyeZ + 1) * 50
            eyeZ += delta / 120;
            rangeZ.val(eyeZ);
            rangeZ.slider('refresh');
            eyeZ = - Math.exp(eyeZ / 50) + 1;
            renderer.setZPosition(eyeZ);
        }

        handleResize = function () {
            width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;

            height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;

            canvas.width = width;
            canvas.height = height;
            renderer.resizeCanvas(width, height);
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
        handleFullScreenChange = function () {
            if (((<any>document).fullScreenElement && (<any>document).fullScreenElement !== null) ||                            // cast it to any so typescript ignores error "property not available"
                (!(<any>document).mozFullScreen && !(<any>document).webkitIsFullScreen && !(<any>document).msFullscreenElement)) {

                fullScreenButton.removeClass("ui-btn-active");
            } else {
                fullScreenButton.addClass("ui-btn-active");
            }
        };
        handleResetView = function () {
            renderer.resetView();
            var eye = renderer.getPosition();
            rangeX.val(eye[0] * 50);
            rangeX.slider('refresh');
            rangeY.val(eye[1] * 50);
            rangeY.slider('refresh');
            rangeZ.val(Math.log(-eye[2] + 1) * 50);
            rangeZ.slider('refresh');

        }
        toggleLight = function () {
            var lightOn = renderer.toggleLight();
            if (lightOn) {
                lightButton.addClass('ui-btn-active');
            } else {
                lightButton.removeClass('ui-btn-active');
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

        window.onresize = handleResize;
        resetButton.click(handleResetView);
        fullScreenButton.click(toggleFullScreen);
        var onFullscreenChange = "webkitfullscreenchange mozfullscreenchange fullscreenchange msfullscreenchange";
        $(document).on(onFullscreenChange, handleFullScreenChange);

        rangeX.click(handleRangeX);
        rangeY.click(handleRangeY);
        rangeZ.click(handleRangeZ);
        lightButton.click(toggleLight);


        //initial canvas size
        handleResize();
    } ());

    //change Model
    jqModelList.on('click', 'a[class="active"]', function () {
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
    jqResultList.on('click', 'a[class="active"]', function () {
        var newPlotGroupID = $(this).attr('data-result');
        var oldPlotGroupID = renderer.getActivePlotGroupId();   //get old PlotGroup Id from Renderer
        if (newPlotGroupID !== oldPlotGroupID) {                //if id changed
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
        var select = <any>$("#tmpColor").find("select");
        select.find("option").remove();
        var option;
        for (var i in colorList) {
            option = $("<option></option>").text(colorList[i]);
            option.appendTo(select);
        }
        select.select().select('refresh');
    }

    function setTextures(colTable: string[]) {
        var select = <any>$("#tmpTexture").find("select");
        select.find("option").remove();
        var option;
        for (var i in colTable) {
            option = $("<option></option>").text(colTable[i]);
            option.appendTo(select);
        }
        select.select().select('refresh');
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
        console.log('activeHandle' + activeHandle);
        var modelId = renderer.getActiveModelId();
        var plotGroupId = renderer.getActivePlotGroupId();
        console.log("modelId: " + modelId + " \nplotGroupId: " + plotGroupId);
        var result = modelData.getPlot(modelId, plotGroupId, plotTag, function (_reuslt: Result) {
            if (activeHandle) {
                renderer.addPlot(_reuslt);
            } else {
                renderer.removePlot(_reuslt);
                renderer.renderScene();
            }
        });
    }

}

