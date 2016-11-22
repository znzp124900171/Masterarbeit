/// <refernce path="libs/gl-matrix.d.ts"/>
/// <refernce path="libs/jquery.d.ts"/>
var MODEL_PATH = "visual";
var MODEL_LIST = "list.json";

function ModelCmds() {
    var self: ModelCmds = this;
    var modelList: { modelId: string; name: string }[]; // List containing all Model Names
    var modelArray: { [index: string]: Model } = {};    //  For Each Model the complete Information is there
    var postProcessor: PostProcessor;

    // This function checks which Gui Elements are necessary for this kind of Result
    var getGuiConfig = function (result: Result): GuiConfigType {
        var guiType: GuiConfigType;
        // single Color
        guiType.uniColor = false;

        // texture for Colors
        guiType.isoTexture = false;
        guiType.colorTexture = false;

        // scalation
        guiType.arrowScale = false;
        guiType.radiusScale = false;
        guiType.deformationScale = false;

        for (var group in result.renderGroup) {
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
    } 

    this.setPostProcessor = function(postProc: PostProcessor) {
        postProcessor = postProc;
    }

    // load the model Data from the Server
    this.getModel = function(modelId: string, callback: (model: Model) => void) {
        if (!modelArray[modelId]) {   //null, or undefined
            requestModel(modelId, callback);
        } else {
            callback(modelArray[modelId]);
        }
    }

    // load the binary PlotGroupData from the Server
    // then the plotGroupData is prepared
    // The Callback gets the PlotGrop
    this.getPlotGroup = function(modelId: string, plotGroupTag: string, callback: (result: Result) => void) {
        self.getModel(modelId, function (model: Model) {    // Request model

            for (var i in model.results) {  // For each Plot Group in this model

                if (model.results[i].tag === plotGroupTag) {   // Plot Group equals requested Plot Group
                    var plotGroup = model.results[i];
                    if (!plotGroup.ready && !plotGroup.requested) {
                        var counter = 0;
                        plotGroup.requested = true;
                        postProcessor.initResultSize(plotGroup);    //here the offset and scalation values are created for this PlotGroup

                        // Request all PlotData : All Render Groups + All Data Groups, normally j and k is zero
                        plotGroup.renderGroup.forEach(function (renderGroup: RenderGroup, k: number) {
                            renderGroup.renderData.forEach(function (renderData: RenderData, j: number) {
                                counter++;
                                var path = MODEL_PATH + '/' + modelId + '/' + plotGroupTag + '.' + j + '.' + k + '.bin';  //create Request path
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
                    } else if (plotGroup.ready) {
                        callback(plotGroup);
                    }
                }
            }
        });
    }

    // load the binary Plots from the Server
    // then the plot is prepared
    // The Callback gets the Plot
    this.getPlot = function(modelId: string, plotGroupTag: string, plotTag: string, callback: (result: Result) => void) {
        self.getModel(modelId, function (model: Model) {    //get Model
            model.results.forEach(function (plotGroup: Result) {
                if (plotGroup.tag === plotGroupTag) {                          //search for PlotGroupId
                    plotGroup.feature.forEach(function (plot: Result) {
                        if (plot.tag === plotTag) {                         //search for PlotId
                            if (!plot.ready && !plot.requested) {
                                plot.requested = true;
                                var counter = 0;
                                plot.renderGroup.forEach(function (renderGroup: RenderGroup, j: number) {   //for each RenderGroup
                                    renderGroup.renderData.forEach(function (renderData: RenderData, k: number) {   //for each Render Data
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
                            } else if (plot.ready) {
                                callback(plot);
                            }
                        }
                    });
                }
            });
        });
    }

    // Get the ModelList, so every Model on the server is known
    this.getModelList = function(callback: (modelList: { modelId: string; name: string }[]) => void) {
        if (modelList == null) {    //null, or undefined
            requestModelList(callback);
        } else {
            callback(modelList);
        }
    }

    // Get all PlotGroups from ModelId
    this.getPlotGroupMap = function (modelId: string, callback: (plotGroupMap: { name: string; id: string }[]) => void) {
        self.getModel(modelId, function (model) {
            var plotGroupList = [];
            for (var i in model.results) {  //for Each PlotGroup in this Model
                plotGroupList.push({name: model.results[i].name, id: model.results[i].tag});        //name is for the user, id is unique
            }
            callback(plotGroupList);
        });
    }

    // Get Plots from ModelId and PlotGroupId, by callback
    this.getPlotMap = function (modelId: string, plotGroupId: string, callback: (plotMap: { name: string; id: string }[]) => void) {
        self.getModel(modelId, function (model) {
            var plotList = [];
            for (var i in model.results) {
                if (model.results[i].tag === plotGroupId) {
                    var plotGroup = model.results[i];
                    for (var j in plotGroup.feature) {  // for Each Plot in this PlotGroup
                        plotList.push({ name: plotGroup.feature[j].name, id: plotGroup.feature[j].tag });   //name is for the user, id is unique
                    }
                }
            }
            callback(plotList);
        });
    }

    //this.getArrowGroups = function (plot: Result): number[]{
    //    var iArrow = [];
    //    for (var i in plot.renderGroup) {
    //        var renderGroup = plot.renderGroup[i];
    //        if (renderGroup.attributes[ATTR_ARROW]) {
    //            iArrow.push(i);
    //        }
    //    }
    //    return iArrow;
    //}


    //// get PlotGroup from ModelId and PlotGroupId
    //var getPlotGroupObj = function (modelId: string, plotGroupId: string) : Result{
    //    for (var result in  modelArray[modelId].results) {
    //        if (result.name === plotGroupId) {
    //            return result;
    //        }
    //    }
    //}

    ////get Plot from ModelId, PlotGroupId and PlotId
    //var getPlotObj = function (modelId: string, plotGroupId: string, plot: string) {
    //    var result = getPlotGroupObj(modelId, plotGroupId);
    //    for (var feature in result) {
    //        if (feature.name = plot) {
    //            return feature;
    //        }
    //    }
    //}

    //// get GUIConfig Type by modelId, plotGroupId and PlotId
    //this.getConfigType = function (modelId: string, plotGroupId: string, plot: string) : GuiConfigType {
    //    return getGuiConfig(getPlotObj(modelId, plotGroupId, plot));
    //}


    /**
     * internal XML (Here JSON) Requests
    */

    //Request Model JSON Data from Webserver
    function requestModel(modelId: string, callback: (model: Model) => void) {
        var request = new XMLHttpRequest();
        request.open("GET", MODEL_PATH + "/" + modelId + ".json", true);
        //request.responseType = "json";
        request.onload = function (e) {

            var model = JSON.parse(request.response);
            model.id = modelId;

            //postProcessor.prepareModel(model);
            modelArray[modelId] = model;
            callback(model);

        }
        request.send();
    }

    //Request Binary Plot Data from WebServer
    function requestPlot(result: Result, renderGroup: RenderGroup, renderData: RenderData, plotURI: string, callback: (result: Result, renderGroup: RenderGroup, renderData: RenderData) => void) {

        var request = new XMLHttpRequest();
        request.open("GET", plotURI, true);         //first open than setting response Type, else Error in IE
        request.responseType = "arraybuffer";     
        request.onload = function (e) {
            renderData.rawData = request.response;
            callback(result, renderGroup, renderData);
        }
        request.send();
    }

    //Request Modellist from Server
    function requestModelList(callback: (modelList: { modelId: string; name: string }[]) => void) {
        var request = new XMLHttpRequest();
        request.open("GET", MODEL_PATH + "/" + MODEL_LIST, true);
        //request.responseType = "json";
        request.onload = function () {
            try {
                modelList = JSON.parse(request.response);
                callback(modelList);
            } catch (e) {
                handleError(e);
            }
        }
        request.send();
    }
}