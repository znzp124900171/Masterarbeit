function Gui(modelData, renderer, glContext) {
    let self = this;
    let gl = glContext.getContext();
    let canvas = document.getElementById('webgl');
    let jqModelList = $("#model");
    let jqResultList = $("#result");
    let jqPlotList = $("#plot");
    let jqColor = $('#color');
    let jqColorTable = $('#colorTable');
    modelData.getModelList(updateModelList);
    let reset = $('#reset');
    (function () {
        let fullScreenButton = $('#fullScreen');
        let lightButton = $('#light');
        let resetButton = $('#reset');
        let vrButton = $('#vr');
        let navHeader = $('header');
        let navSidebar = $('aside');
        let width;
        let height;
        let pointerMoved = false;
        let pointerOne = null;
        let pointerTwo = null;
        let pointerSpecial = null;
        let lastPosition = {};
        let keydown = null;
        let pointerDown;
        let pointerUp;
        let pointerMove;
        let pointerLeave;
        let handleMouseWheel;
        let handleResize;
        let handleRangeX;
        let handleRangeY;
        let handleRangeZ;
        let vrOn = false;
        let toggleFullScreen;
        let handleFullScreenChange;
        let handleResetView;
        let toggleLight;
        let toggleVR;
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
                    let firstPosition, secondPosition;
                    let newPosition = { x: evt.clientX, y: evt.clientY };
                    let enableRotate = false;
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
                    let difX = firstPosition.x - secondPosition.x;
                    let difY = firstPosition.y - secondPosition.y;
                    let lastDist = Math.sqrt(difX * difX + difY * difY);
                    difX = newPosition.x - secondPosition.x;
                    difY = newPosition.y - secondPosition.y;
                    let newDist = Math.sqrt(difX * difX + difY * difY);
                    let zVal = renderer.getPosition()[2];
                    zVal += (lastDist - newDist) * 0.05;
                    renderer.setZPosition(zVal);
                }
                else {
                    if (evt.button === 0 || evt.buttons & 1 || (evt.button === 2 || evt.buttons & 2) && renderer.getActivePlotGroupType() === 2) {
                        let oldPosition = lastPosition[evt.pointerId];
                        let newPosition = { x: evt.clientX, y: evt.clientY };
                        let renderPosi = renderer.getPosition();
                        let deltaX = (oldPosition.x - newPosition.x) * -1 / width;
                        let deltaY = (oldPosition.y - newPosition.y) / width;
                        renderPosi[0] += deltaX;
                        renderPosi[1] += deltaY;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.setPositionV(renderPosi);
                    }
                    else if ((evt.button === 2 || evt.buttons & 2) && renderer.getActivePlotGroupType() === 3) {
                        let position = lastPosition[evt.pointerId];
                        let newPosition = { x: evt.clientX, y: evt.clientY };
                        let deltaX = (newPosition.x - position.x) * 100 / width;
                        let deltaY = (newPosition.y - position.y) * 100 / height;
                        lastPosition[evt.pointerId] = newPosition;
                        renderer.rotateObject(deltaX, deltaY);
                        updateAxisPosition(deltaX, deltaY, width, height);
                    }
                    else if (evt.button === 1 || evt.button & 1) {
                        let position = lastPosition[evt.pointerId];
                        let newPosition = { x: evt.clientX, y: evt.clientY };
                        let deltaX = (newPosition.x - position.x) * -1 / width;
                        let deltaY = (newPosition.y - position.y) / width;
                        if (Math.abs(deltaX) > Math.abs(deltaY)) {
                            var dist = deltaX;
                        }
                        else {
                            var dist = deltaY;
                        }
                        let eyeZ = renderer.getPosition()[2];
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
        console.log(canvas.getBoundingClientRect().width);
        keydown = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
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
        };
        handleMouseWheel = function (evt) {
            if (evt.preventDefault) {
                evt.preventDefault();
            }
            let delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta;
            let eyeZ = renderer.getPosition()[2];
            eyeZ = Math.log(-eyeZ + 1) * 50;
            eyeZ += delta / 120;
            eyeZ = -Math.exp(eyeZ / 50) + 1;
            renderer.setZPosition(eyeZ);
        };
        handleResize = function () {
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
            }
            else {
                canvas.height = height - navHeader.outerHeight();
                renderer.resizeCanvas(canvas.width, canvas.height);
            }
            console.log(canvas.getBoundingClientRect().width);
        };
        handleRangeX = function (evt) {
            let eyeX = parseFloat(evt.currentTarget.value);
            renderer.setXPosition(eyeX / 50);
        };
        handleRangeY = function (evt) {
            let eyeY = parseFloat(evt.currentTarget.value);
            renderer.setYPosition(eyeY / 50);
        };
        handleRangeZ = function (evt) {
            let eyeZ = parseFloat(evt.currentTarget.value);
            eyeZ = -Math.exp(eyeZ / 50) + 1;
            renderer.setZPosition(eyeZ);
        };
        toggleFullScreen = function () {
            let docElement, request;
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
        let mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
        document.addEventListener(mousewheelevt, handleMouseWheel, false);
        document.addEventListener('pointerleave', pointerLeave, false);
        canvas.addEventListener('pointerdown', pointerDown, false);
        document.addEventListener('pointerup', pointerUp, false);
        document.addEventListener('pointermove', pointerMove, false);
        document.addEventListener('keydown', keydown, false);
        window.onresize = handleResize;
        resetButton.click(handleResetView);
        fullScreenButton.click(toggleFullScreen);
        lightButton.click(toggleLight);
        vrButton.click(toggleVR);
        document.onkeypress = function (event) {
            let isEscape = false;
            let docElement, request;
            if ('key' in event) {
                isEscape = (event.key == "Escape" || event.key == "Esc");
            }
            else {
                isEscape = (event.keyCode === 27);
            }
            if (isEscape && vrOn) {
                vrButton.click();
            }
        };
        handleResize();
    }());
    jqModelList.on('click', 'a.active', function () {
        let newModelID = $(this).attr('data-model');
        let oldModelID = renderer.getActiveModelId();
        if (newModelID !== oldModelID) {
            renderer.setActiveModelById(newModelID, function () {
                console.log("New modelId: " + newModelID);
                modelData.getPlotGroupMap(newModelID, updatePlotGroupList);
            });
        }
    });
    jqResultList.on('click', 'a.active', function () {
        let newPlotGroupID = $(this).attr('data-result');
        let oldPlotGroupID = renderer.getActivePlotGroupId();
        if (newPlotGroupID !== oldPlotGroupID) {
            renderer.resetView();
            renderer.setActivePlotGroupById(newPlotGroupID, function () {
                let modelID = renderer.getActiveModelId();
                console.log("modelId: " + modelID + " \nNew plotGroupId: " + newPlotGroupID);
                modelData.getPlotMap(modelID, newPlotGroupID, updatePlotList);
            });
        }
    });
    setColors(glContext.getColorNames());
    setTextures(glContext.getTextureName());
    function setColors(colorList) {
        let jqColorList = $('#color');
        for (let i in colorList) {
            let li = $('<li></li>');
            let a = $('<a href="javascript:void(0);" data-skin="skin-blue" class="full-opacity-hover"></a>');
            let span = $('<span></span>');
            let div = $('<div></div>');
            let p = $('<p class="text-center no-margin"></p>');
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
        let jqColorTableList = $('#colorTable');
        for (let i in colTable) {
            let li = $('<li></li>');
            let a = $('<a href="javascript:void(0);" data-skin="skin-blue" class="full-opacity-hover"></a>');
            let span = $('<span></span>');
            let div = $('<div></div>');
            let p = $('<p class="text-center no-margin"></p>');
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
        for (let i in modelList) {
            let list = $('<li></li>');
            let selectItem = $('<a></a>');
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
        for (let i in plotGroupList) {
            let list = $('<li></li>');
            let selectItem = $('<a></a>');
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
            let list = $('<li></li>');
            let selectItem = $('<a></a>');
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
        let modelId = renderer.getActiveModelId();
        let plotGroupId = renderer.getActivePlotGroupId();
        console.log("modelId: " + modelId + " \nplotGroupId: " + plotGroupId);
        let result = modelData.getPlot(modelId, plotGroupId, plotTag, function (_result) {
            if (activeHandle) {
                renderer.addPlot(_result);
                jqColor.on('click', 'a', function () {
                    let colorSelected = $(this).find('span').attr('class');
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
    function updateAxisPosition(deltaX, deltaY, width, height) {
        let xAxis = $('p[data-axis="x"]');
        let yAxis = $('p[data-axis="y"]');
        let zAxis = $('p[data-axis="z"]');
        xAxis.position().top = 50 + 0.7 * width + deltaY;
        xAxis.position().left = 230 + 0.2 * width + deltaX;
        alert(xAxis.position().top);
    }
}
