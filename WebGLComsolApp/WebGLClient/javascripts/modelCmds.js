var MODEL_PATH = "visual";
var MODEL_LIST = "list.json";
function ModelCmds() {
    var self = this;
    var modelList;
    var modelArray = {};
    var postProcessor;
    var getGuiConfig = function (result) {
        var guiType;
        guiType.uniColor = false;
        guiType.isoTexture = false;
        guiType.colorTexture = false;
        guiType.arrowScale = false;
        guiType.radiusScale = false;
        guiType.deformationScale = false;
        for (var group of result.renderGroup) {
            for (var attr in group.attributes) {
                switch (attr) {
                    case ATTR_VECTORX:
                        guiType.arrowScale = true;
                        break;
                    case ATTR_RAD:
                        guiType.radiusScale = true;
                        break;
                    case ATTR_DEFX:
                        guiType.deformationScale = true;
                        break;
                    case ATTR_COLOR:
                        guiType.colorTexture = true;
                        break;
                    case ATTR_ISO:
                        guiType.isoTexture = true;
                        break;
                    default:
                        guiType.uniColor = true;
                        break;
                }
            }
        }
        return guiType;
    };
    this.setPostProcessor = function (postProc) {
        postProcessor = postProc;
    };
    this.getModel = function (modelId, callback) {
        if (!modelArray[modelId]) {
            requestModel(modelId, callback);
        }
        else {
            callback(modelArray[modelId]);
        }
    };
    this.getPlotGroup = function (modelId, plotGroupTag, callback) {
        self.getModel(modelId, function (model) {
            for (var i in model.results) {
                if (model.results[i].tag === plotGroupTag) {
                    var plotGroup = model.results[i];
                    if (!plotGroup.ready && !plotGroup.requested) {
                        var counter = 0;
                        plotGroup.requested = true;
                        postProcessor.initResultSize(plotGroup);
                        plotGroup.renderGroup.forEach(function (renderGroup, k) {
                            renderGroup.renderData.forEach(function (renderData, j) {
                                counter++;
                                var path = MODEL_PATH + '/' + modelId + '/' + plotGroupTag + '.' + j + '.' + k + '.bin';
                                requestPlot(plotGroup, renderGroup, renderData, path, function () {
                                    postProcessor.preparePlotGroup(model, plotGroup, j, k);
                                    counter--;
                                    if (counter === 0) {
                                        plotGroup.ready = true;
                                        callback(plotGroup);
                                    }
                                });
                            });
                        });
                        break;
                    }
                    else if (plotGroup.ready) {
                        callback(plotGroup);
                    }
                }
            }
        });
    };
    this.getPlot = function (modelId, plotGroupTag, plotTag, callback) {
        self.getModel(modelId, function (model) {
            model.results.forEach(function (plotGroup) {
                if (plotGroup.tag === plotGroupTag) {
                    plotGroup.feature.forEach(function (plot) {
                        if (plot.tag === plotTag) {
                            if (!plot.ready && !plot.requested) {
                                plot.requested = true;
                                var counter = 0;
                                plot.renderGroup.forEach(function (renderGroup, j) {
                                    renderGroup.renderData.forEach(function (renderData, k) {
                                        counter++;
                                        var path = MODEL_PATH + '/' + modelId + '/' + plotGroupTag + '/' + plotTag + '.' + j + '.' + k + '.bin';
                                        requestPlot(plot, renderGroup, renderData, path, function (result, renderGroup, renderData) {
                                            postProcessor.preparePlot(model, plotGroup, plot, renderGroup, renderData);
                                            counter--;
                                            if (counter === 0) {
                                                callback(plot);
                                                plot.ready = true;
                                            }
                                        });
                                    });
                                });
                            }
                            else if (plot.ready) {
                                callback(plot);
                            }
                        }
                    });
                }
            });
        });
    };
    this.getModelList = function (callback) {
        if (modelList == null) {
            requestModelList(callback);
        }
        else {
            callback(modelList);
        }
    };
    this.getPlotGroupMap = function (modelId, callback) {
        self.getModel(modelId, function (model) {
            var plotGroupList = [];
            for (var i in model.results) {
                plotGroupList.push({ name: model.results[i].name, id: model.results[i].tag });
            }
            callback(plotGroupList);
        });
    };
    this.getPlotMap = function (modelId, plotGroupId, callback) {
        self.getModel(modelId, function (model) {
            var plotList = [];
            for (var i in model.results) {
                if (model.results[i].tag === plotGroupId) {
                    var plotGroup = model.results[i];
                    for (var j in plotGroup.feature) {
                        plotList.push({ name: plotGroup.feature[j].name, id: plotGroup.feature[j].tag });
                    }
                }
            }
            callback(plotList);
        });
    };
    function requestModel(modelId, callback) {
        var request = new XMLHttpRequest();
        request.open("GET", MODEL_PATH + "/" + modelId + ".json", true);
        request.onload = function (e) {
            var model = JSON.parse(request.response);
            model.id = modelId;
            modelArray[modelId] = model;
            callback(model);
        };
        request.send();
    }
    function requestPlot(result, renderGroup, renderData, plotURI, callback) {
        var request = new XMLHttpRequest();
        request.open("GET", plotURI, true);
        request.responseType = "arraybuffer";
        request.onload = function (e) {
            renderData.rawData = request.response;
            callback(result, renderGroup, renderData);
        };
        request.send();
    }
    function requestModelList(callback) {
        var request = new XMLHttpRequest();
        request.open("GET", MODEL_PATH + "/" + MODEL_LIST, true);
        request.onload = function () {
            try {
                modelList = JSON.parse(request.response);
                callback(modelList);
            }
            catch (e) {
                handleError(e);
            }
        };
        request.send();
    }
}
