/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import JSONParser.*;
import com.comsol.model.ResultFeature;
import java.io.File;
import java.io.IOException;
import javax.swing.tree.DefaultMutableTreeNode;


/**
 * Object with all Properties of a Comsol Result
 * should only be constructed by the Parent Classes ComsolModel.
 * Contains Children of ComsolRenderData
 * 
 */
public class ComsolResult implements ITreeNode{

    //Keys for JSON
    public static final String NAME = "name";
    public static final String TYPE = "type";
    public static final String TAG = "tag";
    public static final String BOUND_BOX = "boundBox";
    public static final String RENDER_GROUP = "renderGroup";
    public static final String FEATURE = "feature";
    
    private String type;            // Plot Type as String
    private String tag;             // tag from COMSOL
    
    private String infoText;     // contains all information as String
    private String name;            // Display Name from Comsol
    private int dimension;			// dimension of plots, e.g. 3 for 3D-plot, 2 for 2D-plot
    
    private boolean hasData;        // has this Result binary Data in Form of ComsolRenderData
    private ComsolRenderGroup[] renderGroup; //the rendergroups containing the renderdata

    private boolean isPlotGroup;    // is this Result a Plotgroup which contains Children of ComsolResult
    private float[] boundBox;      // boundBox of the geometry
    private ComsolResult[] feature; // Children of ComsolResult; is null, when isPlotGroup is false

    private boolean isExportable;   // can this Result be exported to WebGL (only 3D is allowed)
    
    //Triangles type = 3
    private static final String TYPE_VOLUME = "Volume";
    private static final String TYPE_SLICE = "Slice";
    private static final String TYPE_MULTISLICE = "Multislice";
    private static final String TYPE_SURFACE = "Surface";
    private static final String TYPE_ISOSURFACE = "Isosurface";
    
    //Lines type = 2
    private static final String TYPE_PLOTGROUP3D = "PlotGroup3D";
    private static final String TYPE_PLOTGROUP2D = "PlotGroup2D";
    private static final String TYPE_STREAMLINES = "Streamline";
    private static final String TYPE_LINES = "Lines"; 

    //Points type = 1
    private static final String TYPE_ARROW_VOLUME = "ArrowVolume";
    private static final String TYPE_ARROW_SURFACE = "ArrowSurface";
    private static final String TYPE_ARROW_LINE = "ArrowLine";    

    /**
     * 
     * Constructor via COMSOL
     * 
     * @param result com.comsol.model.ResultFeature
     * @throws Exception
     */
    
    public ComsolResult(ResultFeature result) throws Exception{
        this.name = result.getDisplayString();
        this.type = result.getType();
        this.tag = result.tag();
        this.dimension = result.getSDim();
        
        if(this.dimension != 3){
        	if(this.dimension != 2){
        		if(this.dimension !=1){
        			this.isExportable = false;
                    setupInfoText();
                    return;
        		}
        	}
        }
        
        if(checkType(type) == 0){
            this.isExportable = false;
            setupInfoText();
            return;
        }

        this.isExportable = false; 
        this.hasData = false;
        this.isPlotGroup = result.isPlotGroup();

        int nGroup = result.getRenderGroups(); // number of RenderGroups
        
        if(nGroup > 0){
            this.isExportable = true; 
            this.hasData = true;
            this.renderGroup = new ComsolRenderGroup[nGroup];
            for(int i = 0; i < nGroup; i++){
                
                this.renderGroup[i] = new ComsolRenderGroup(result, type, i);
            }
        }
      
        if(this.isPlotGroup){
            String[] featureList = result.feature().tags();
            this.feature = new ComsolResult[featureList.length];
            for(int i = 0; i < feature.length; i++){
              this.feature[i] = new ComsolResult(result.feature(featureList[i]));
              if(this.feature[i].isExportable){
                  this.isExportable = true;
              }
            }  
        }
      setupModelSize();
      
      setupInfoText();
    }

    /**
     *
     * @param type String from COMSOL
     * @return  the geometric dimension, or 0 when unknown type
     */
    public static final int checkType(String type){

        if(type.equals(TYPE_VOLUME) || type.equals(TYPE_SLICE) || type.equals(TYPE_MULTISLICE) || type.equals(TYPE_ISOSURFACE))
            return 3;
        
        else if(type.equals(TYPE_PLOTGROUP3D) || type.equals(TYPE_PLOTGROUP2D) || type.equals(TYPE_STREAMLINES) || type.equals(TYPE_LINES) || type.equals(TYPE_SURFACE))
            return 2;
            
        else if(type.equals(TYPE_ARROW_VOLUME) || type.equals(TYPE_ARROW_SURFACE) || type.equals(TYPE_ARROW_LINE))
            return 1;
        
        else
            return 0;
    }
    
    /**
     * Constructor via JSON File
     * 
     * @param resultObject
     * @throws JSONException
     */
    public ComsolResult(JSONObject resultObject) throws JSONException{
        this.name = resultObject.getString(NAME);
        this.tag = resultObject.getString(TAG);
        this.type = resultObject.getString(TYPE);
        this.hasData = false;
        JSONArray jsonList = resultObject.optJSONArray(RENDER_GROUP);        
        if(jsonList != null){
            this.hasData = true;
            this.renderGroup = new ComsolRenderGroup[jsonList.length()];
            for (int i = 0; i < jsonList.length(); i++) {
                this.renderGroup[i] = new ComsolRenderGroup(jsonList.getJSONObject(i),i);
            }
        }
        
        this.isPlotGroup = false;
        jsonList = resultObject.optJSONArray(FEATURE);
        if(jsonList != null){
            this.isPlotGroup = true;
            this.feature = new ComsolResult[jsonList.length()];
            for(int i = 0; i < feature.length; i++){
                this.feature[i] = new ComsolResult(jsonList.getJSONObject(i));
            }
        }

        if(this.isPlotGroup) {
            JSONArray jsonArr = resultObject.getJSONArray(BOUND_BOX);
            this.boundBox = new float[jsonArr.length()];
            for(int i = 0; i < jsonArr.length(); i++){
                this.boundBox[i] = (float) jsonArr.getDouble(i);
            }
        }
        
        
        this.isExportable = true;
        setupInfoText();
    }

    // function to create the description
    private void setupInfoText(){
       StringBuilder sb = new StringBuilder(100);
       sb.append("Result Plot Object:");
       sb.append("\nIs exportable: ").append(this.isExportable);
       sb.append("\nIs Plotgroup: ").append(this.isPlotGroup);
       sb.append("\nTag: ").append(this.tag);
       sb.append("\nType: ").append(this.type);
       sb.append("\nDimension: ").append(this.dimension);
       if(this.isExportable){
        if (this.isPlotGroup) {
    		sb.append("\nBounding Box: ").append('\n');
            sb.append(boundBox[0]).append(" - ").append(boundBox[1]).append('\n');
            sb.append(boundBox[2]).append(" - ").append(boundBox[3]).append('\n');
            sb.append(boundBox[4]).append(" - ").append(boundBox[5]);
         }
       }
       this.infoText = sb.toString();
   }

    private void setupModelSize() {
        float[] tmpBox;
        if (this.hasData){  //result has render Data => search in renderData for biggest Model Size
            for (int i = 0; i < this.renderGroup.length; i++){
                tmpBox = this.renderGroup[i].getModelSize();
                this.boundBox = compareBoundBox(boundBox, tmpBox);
            }
        }
        if (this.isPlotGroup && this.isExportable) { //result has sub results => search in this sub results for biggest Model Size
            for (int i = 0; i < this.feature.length; i++) {
                if(this.feature[i].isExportable){
                    tmpBox = this.feature[i].getModelSize();
                    this.boundBox = compareBoundBox(boundBox, tmpBox);
                }
            }
        }
    }
    
    public float[] getModelSize() {
        return this.boundBox;
    }

    @Override
    public JSONObject toJSON(){
       if(this.isExportable){
        JSONObject result = new JSONObject();
        result.put(NAME, this.name);
        result.put(TAG, this.tag);
        result.put(TYPE, this.type);

        if(this.hasData){
            JSONArray jsonArr = new JSONArray();
            for (ComsolRenderGroup rg : renderGroup) {
                jsonArr.put(rg.toJSON());
            }
            result.put(RENDER_GROUP, jsonArr);
        }

        if(this.isPlotGroup){
            JSONArray jsonArr = new JSONArray();
            for (ComsolResult feat : feature) {
                jsonArr.put(feat.toJSON());   
            }
            result.put(FEATURE, jsonArr);
            
            if(this.dimension !=3){
            	this.boundBox[4] = 0;
            	this.boundBox[5] = 0;
            }
            
            JSONArray boundBoxArr = new JSONArray();      
            for(double bound : this.boundBox)
                boundBoxArr.put(bound);
        
            result.put(BOUND_BOX, boundBoxArr);           
        }
        return result;
       }
       return null;
    }

    @Override
    public String toString() {
        return this.name;
    }

    @Override
    public String getInfoText() {
        return this.infoText;
    }

    @Override
    public DefaultMutableTreeNode getNode() {
        DefaultMutableTreeNode root = new DefaultMutableTreeNode(this);
        if(this.hasData){
            for (ComsolRenderGroup renderGroup1 : renderGroup) {
                root.add(renderGroup1.getNode());
            } 
        }
        if(this.isPlotGroup){
            for (ComsolResult feature1 : feature) {
                root.add(feature1.getNode());          
            }
        }
        return root;
    }

    /**
     * saves the binary data of all ComsolRenderData Childs
     * 
     * @param path where the binary Data should be saved
     * @throws IOException
     */
    public void saveData(String path) throws IOException{
        if(this.isExportable){
            path = path + '/' + this.tag;
            if(this.isPlotGroup){
                File f = new File(path);
                f.mkdir();
                for (ComsolResult feature1 : feature) {
                    feature1.saveData(path);
                }
            }
            if(this.hasData){
                for(ComsolRenderGroup rg : renderGroup){
                    rg.saveData(path);
                }
            }  
        }
    }

    /**
     * deletes the binary data of all ComsolRenderData Children
     * 
     * @param path path to delete the binary Data
     * @throws java.io.IOException
     */
    public void deleteData(String path) throws IOException{
        if(this.isExportable){
            path = path + '/' + this.tag;
            if(this.isPlotGroup){
                for (ComsolResult feature1 : feature) {
                    feature1.deleteData(path);
                }
            }
            if(this.hasData){
                for(ComsolRenderGroup renderGroup1 : renderGroup){
                    renderGroup1.deleteData(path);
                }
            }
            File f = new File(path);
            f.delete();
        }
    }   

   
    /**
     *
     * @param refBoundBox
     * @param tmpBoundBox
     * @return 
     */
    static public float[] compareBoundBox (float[] refBoundBox, float[] tmpBoundBox){
        if (refBoundBox != null) {
            refBoundBox[0] = (refBoundBox[0] <= tmpBoundBox[0]) ? refBoundBox[0] : tmpBoundBox[0];
            refBoundBox[1] = (refBoundBox[1] >= tmpBoundBox[1]) ? refBoundBox[1] : tmpBoundBox[1];
            refBoundBox[2] = (refBoundBox[2] <= tmpBoundBox[2]) ? refBoundBox[2] : tmpBoundBox[2];
            refBoundBox[3] = (refBoundBox[3] >= tmpBoundBox[3]) ? refBoundBox[3] : tmpBoundBox[3];
            refBoundBox[4] = (refBoundBox[4] <= tmpBoundBox[4]) ? refBoundBox[4] : tmpBoundBox[4];
            refBoundBox[5] = (refBoundBox[5] >= tmpBoundBox[5]) ? refBoundBox[5] : tmpBoundBox[5];
            return refBoundBox;
        } else {
            return tmpBoundBox;
        }
    }   

}
