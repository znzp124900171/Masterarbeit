function Gui(modelData, renderer, glContext) {
    var self = this;
    var gl = glContext.getContext();
    var canvas = document.getElementById('webgl');
    var canvas2D = document.getElementById('canvas2D');
    var ctx = canvas2D.getContext('2d');
    var fontSize = parseInt(window.getComputedStyle(document.body).getPropertyValue('font-size')) * 2;
    var jqModelList = $("#model");
    var jqResultList = $("#result");
    var jqPlotList = $("#plot");
    var jqColor = $('#color');
    var jqColorTable = $('#colorTable');
    modelData.getModelList(updateModelList);
    var reset = $('#reset');
    var position = [0, 0, 0];
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
        var orientation;
        pointerDown = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            if (!pointerOne || evt.pointerId === pointerOne) {
                pointerOne = evt.pointerId;
                lastPosition[pointerOne] = { x: evt.clientX, y: evt.clientY };
            }
            else if (!pointerTwo) {
                pointerTwo = evt.pointerId;
                lastPosition[pointerTwo] = { x: evt.clientX, y: evt.clientY };
            }
        };
        pointerUp = function (evt) {
            lastPosition[pointerOne] = null;
            lastPosition[pointerTwo] = null;
            pointerOne = null;
            pointerTwo = null;
        };
        pointerMove = function (evt) {
            if (pointerOne) {
                if (pointerTwo) {
                    var firstPosition, secondPosition;
                    var newPosition = { x: evt.clientX, y: evt.clientY };
                    var enableRotate = false;
                    if (evt.pointerId === pointerOne) {
                        firstPosition = lastPosition[pointerOne];
                        secondPosition = lastPosition[pointerTwo];
                        lastPosition[pointerOne] = newPosition;
                    }
                    else if (evt.pointerId === pointerTwo) {
                        firstPosition = lastPosition[pointerTwo];
                        secondPosition = lastPosition[pointerOne];
                        lastPosition[pointerTwo] = newPosition;
                    }
                    else {
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
                    renderer.setZPosition(zVal);
                }
                else {
                    if (evt.button === 0 || evt.buttons & 1 || (evt.button === 2 || evt.buttons & 2) && renderer.getActivePlotGroupType() === 2) {
                        var oldPosition = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };
                        var renderPosi = renderer.getPosition();
                        var deltaX = (oldPosition.x - newPosition.x) * -1 / width;
                        var deltaY = (oldPosition.y - newPosition.y) / width;
                        renderPosi[0] += deltaX;
                        renderPosi[1] += deltaY;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.setPositionV(renderPosi);
                    }
                    else if ((evt.button === 2 || evt.buttons & 2) && renderer.getActivePlotGroupType() === 3) {
                        var position = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };
                        var deltaX = (newPosition.x - position.x) * 100 / width;
                        var deltaY = (newPosition.y - position.y) * 100 / height;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.rotateObject(deltaX, deltaY);
                        console.log('delatX: ' + deltaX + ';  deltaY: ' + deltaY + ';  newPosition.x: ' + newPosition.x + '; position.x' + position.x + ';  newPosition.y: ' + newPosition.y + '; position.y' + position.y);
                    }
                    else if (evt.button === 1 || evt.button & 1) {
                        var position = lastPosition[evt.pointerId];
                        var newPosition = { x: evt.clientX, y: evt.clientY };
                        var deltaX = (newPosition.x - position.x) * -1 / width;
                        var deltaY = (newPosition.y - position.y) / width;
                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            var dist = deltaX;
                        }
                        else {
                            var dist = deltaY;
                        }
                        var eyeZ = renderer.getPosition()[2];
                        eyeZ = Math.log(-eyeZ + 1) * 50;
                        eyeZ += dist;
                        eyeZ = -Math.exp(eyeZ / 50) + 1;
                        renderer.setZPosition(eyeZ);
                    }
                }
            }
        };
        pointerLeave = function (evt) {
            if (pointerOne) {
                lastPosition[pointerOne] = null;
                pointerOne = null;
            }
            if (pointerTwo) {
                lastPosition[pointerTwo] = null;
                pointerTwo = null;
            }
        };
        keydown = function (evt) {
            if (vrOn) {
                if (renderer.getSeperation() > 0.01) {
                    switch (evt.keyCode) {
                        case 37:
                            renderer.setSeperation(renderer.getSeperation() - 0.01);
                            break;
                        case 39:
                            renderer.setSeperation(renderer.getSeperation() + 0.01);
                            break;
                        case 38:
                            renderer.setZPosition(renderer.getPosition()[2] + 0.2);
                            break;
                        case 40:
                            renderer.setZPosition(renderer.getPosition()[2] - 0.2);
                            break;
                    }
                }
                else {
                    renderer.setSeperation(renderer.getSeperation() + 0.01);
                    alert('values are beyond the bondary');
                }
                if (evt.keyCode === 69) {
                    vrButton.click();
                }
            }
        };
        orientation = function (event) {
            let gamma = event.gamma;
            let beta = event.beta;
            let alpha = event.alpha;
            let gammaChange = Math.round((gamma - position[1]) * 10);
            var deltaX = (beta - position[0]) / width;
            var deltaY = gammaChange / height;
            renderer.rotateObject(deltaX, deltaY);
            position[0] = beta;
            position[1] = gamma;
            ctx.clearRect(0, 0, canvas2D.width, canvas2D.height);
            ctx.font = '20px arial';
            ctx.fillStyle = 'white';
            ctx.fillText('gamma: ' + gammaChange, 10, 90);
        };
        handleMouseWheel = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;
            var eyeZ = renderer.getPosition()[2];
            eyeZ = Math.log(-eyeZ + 1) * 50;
            eyeZ += delta / 120;
            eyeZ = -Math.exp(eyeZ / 50) + 1;
            renderer.setZPosition(eyeZ);
        };
        handleResize = function () {
            renderer.setAxisSize(fontSize);
            width = window.innerWidth
                || document.documentElement.clientWidth
                || document.body.clientWidth;
            height = window.innerHeight
                || document.documentElement.clientHeight
                || document.body.clientHeight;
            canvas.width = width;
            if (vrOn) {
                canvas.height = height;
                renderer.resizeVRCanvas(canvas.width, canvas.height);
                $('.text-box').hide();
            }
            else {
                canvas.height = height - navHeader.outerHeight();
                renderer.resizeCanvas(canvas.width, canvas.height);
                $('.text-box').show();
            }
        };
        handleRangeX = function (evt) {
            var eyeX = parseFloat(evt.currentTarget.value);
            renderer.setXPosition(eyeX / 50);
        };
        handleRangeY = function (evt) {
            var eyeY = parseFloat(evt.currentTarget.value);
            renderer.setYPosition(eyeY / 50);
        };
        handleRangeZ = function (evt) {
            var eyeZ = parseFloat(evt.currentTarget.value);
            eyeZ = -Math.exp(eyeZ / 50) + 1;
            renderer.setZPosition(eyeZ);
        };
        toggleFullScreen = function () {
            var docElement, request;
            if ((document.fullScreenElement && document.fullScreenElement !== null) ||
                (!document.mozFullScreen && !document.webkitIsFullScreen)) {
                docElement = document.documentElement;
                request = docElement.requestFullScreen || docElement.webkitRequestFullScreen || docElement.mozRequestFullScreen || docElement.msRequestFullScreen;
                if (typeof request != "undefined" && request) {
                    request.call(docElement);
                }
            }
            else {
                docElement = document;
                request = docElement.cancelFullScreen || docElement.webkitCancelFullScreen || docElement.mozCancelFullScreen || docElement.msCancelFullScreen || docElement.exitFullscreen;
                if (typeof request != "undefined" && request) {
                    request.call(docElement);
                }
            }
        };
        handleResetView = function () {
            renderer.resetView();
        };
        toggleLight = function () {
            let lightOn = renderer.toggleLight();
        };
        toggleVR = function () {
            vrOn = renderer.toggleVR();
            if (vrOn) {
                navHeader.hide();
                navSidebar.hide();
                $('#content-wrapper').removeClass('content-wrapper');
                handleResize();
                toggleFullScreen();
            }
            else {
                $('#content-wrapper').addClass('content-wrapper');
                navHeader.show();
                navSidebar.show();
                handleResize();
            }
        };
        canvas.addEventListener("contextmenu", function (e) {
            e.preventDefault();
        }, false);
        var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
        document.addEventListener(mousewheelevt, handleMouseWheel, false);
        document.addEventListener('pointerleave', pointerLeave, false);
        canvas.addEventListener('pointerdown', pointerDown, false);
        document.addEventListener('pointerup', pointerUp, false);
        document.addEventListener('pointermove', pointerMove, false);
        document.addEventListener('keydown', keydown, false);
        window.addEventListener('deviceorientation', orientation, false);
        window.onresize = handleResize;
        resetButton.click(handleResetView);
        fullScreenButton.click(toggleFullScreen);
        lightButton.click(toggleLight);
        vrButton.click(toggleVR);
        handleResize();
    }());
    jqModelList.on('click', 'a.active', function () {
        var newModelID = $(this).attr('data-model');
        var oldModelID = renderer.getActiveModelId();
        if (newModelID !== oldModelID) {
            renderer.setActiveModelById(newModelID, function () {
                console.log("New modelId: " + newModelID);
                modelData.getPlotGroupMap(newModelID, updatePlotGroupList);
            });
        }
    });
    jqResultList.on('click', 'a.active', function () {
        var newPlotGroupID = $(this).attr('data-result');
        var oldPlotGroupID = renderer.getActivePlotGroupId();
        if (newPlotGroupID !== oldPlotGroupID) {
            renderer.resetView();
            renderer.setActivePlotGroupById(newPlotGroupID, function () {
                var modelID = renderer.getActiveModelId();
                console.log("modelId: " + modelID + " \nNew plotGroupId: " + newPlotGroupID);
                modelData.getPlotMap(modelID, newPlotGroupID, updatePlotList);
            });
        }
    });
    setColors(glContext.getColorNames());
    setTextures(glContext.getTextureName());
    function setColors(colorList) {
        var jqColorList = $('#color');
        for (var i in colorList) {
            var li = $('<li></li>');
            var a = $('<a href="javascript:void(0);" data-skin="skin-blue" class="full-opacity-hover"></a>');
            var span = $('<span></span>');
            var div = $('<div></div>');
            var p = $('<p class="text-center no-margin"></p>');
            span.removeClass();
            if (colorList[i] === 'dark green') {
                span.addClass('dark-green');
            }
            else if (colorList[i] === 'yellow green') {
                span.addClass('yellow-green');
            }
            else if (colorList[i] === 'grey dark') {
                span.addClass('gray-dark');
            }
            else if (colorList[i] === 'grey light') {
                span.addClass('gray-light');
            }
            else {
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
    function setTextures(colTable) {
        var jqColorTableList = $('#colorTable');
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
    function updateModelList(modelList) {
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
    function updatePlotGroupList(plotGroupList) {
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
    function removeAllPlots() {
        jqPlotList.find(".plotItem").unbind().remove();
    }
    function updatePlotList(plotList) {
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
                setPlot(plot.id, $(this).hasClass('active'));
            });
        });
    }
    function setPlot(plotTag, activeHandle) {
        resetPlot();
        var modelId = renderer.getActiveModelId();
        var plotGroupId = renderer.getActivePlotGroupId();
        console.log("modelId: " + modelId + " \nplotGroupId: " + plotGroupId);
        var result = modelData.getPlot(modelId, plotGroupId, plotTag, function (_result) {
            if (activeHandle) {
                renderer.addPlot(_result);
                jqColor.on('click', 'a', function () {
                    var colorSelected = $(this).find('span').attr('class');
                    _result.usrColor = colorSelected;
                    renderer.renderScene();
                });
                jqColorTable.on('click', 'a', function () {
                    _result.usrText = $(this).find('span').attr('class');
                    ;
                    renderer.renderScene();
                });
            }
            else {
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
