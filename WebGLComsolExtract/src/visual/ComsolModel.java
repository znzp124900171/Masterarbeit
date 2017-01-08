/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import JSONParser.JSONException;
import JSONParser.JSONObject;
import JSONParser.JSONArray;

import com.comsol.model.Model;

import java.io.File;
import java.io.IOException;
import java.util.Date;

import javax.swing.tree.DefaultMutableTreeNode;

/**
 * This class should be constructed for each Comsol Model
 * 
 * 
 * 
 * 
 */
public class ComsolModel implements ITreeNode {
    
    //Keys for the json File
    public static final String NAME = "name";
    public static final String RESULTS = "results";
    public static String MODEL_ID = "modelId";
    
    private String modelIdentifier;  //unique Tag for this model
    
    private final String name;            // Model Name from Comsol    
    private String infoText;     // Description of this Object for tree Interface
    private ComsolResult result[];  // Children of results
    private boolean isExported;     // Shows if the Object is already exported
    
    /**
     * Constructor via Comsol
     * 
     * @param model com.comsol.model.Model 
     * @throws Exception
     */
    public ComsolModel(Model model) throws Exception{
        
        this.modelIdentifier = StringLib.removeFileExtension(model.name()) + "_" +  String.format("%1$TY-%1$Tm-%1$Td %1$TH-%1$TM-%1$TS", new Date());

        this.name = model.getDisplayString();

        String resultTag[] =  model.result().tags();    
        this.result = new ComsolResult[resultTag.length];
        
        for (int i = 0; i < result.length; i++) {
            this.result[i] = new ComsolResult(model.result(resultTag[i]));
        }
        
        this.isExported = false;
        
        setupInfoText();       
    }

    
    @Override
    public JSONObject toJSON(){
        JSONObject modelJson = new JSONObject();
        
        modelJson.put(NAME, name);
        modelJson.put(MODEL_ID, this.modelIdentifier);
        JSONArray ResultArr = new JSONArray(); 
        for(ComsolResult cr : result){
            JSONObject resultObject = cr.toJSON();
            if(resultObject != null)
                ResultArr.put(resultObject);
        }
        modelJson.put(RESULTS, ResultArr);  
        
        return modelJson;
    }

    public JSONObject getJSONListItem(){
        JSONObject listItem = new JSONObject();
        listItem.put(NAME, this.name);
        listItem.put(MODEL_ID, this.modelIdentifier);
        return listItem;
    }
    
    
    /**
     *
     * Constructor via JSON File
     *
     * @param modelJSON
     * @throws JSONException
     */
    public ComsolModel(JSONObject modelJSON) throws JSONException{
        
        this.name = modelJSON.getString(NAME);

        JSONArray resultArray = modelJSON.getJSONArray(RESULTS);
        if(resultArray != null){
            this.result = new ComsolResult[resultArray.length()];
            for(int i = 0; i < resultArray.length(); i++){
                this.result[i] = new ComsolResult(resultArray.getJSONObject(i));
            }
        }
        this.isExported = true;
        setupInfoText();
    }

    // function to Create the description
    private void setupInfoText(){
        this.infoText = "Model name: " + this.name + '\n';
        if(result != null){
            this.infoText += "Number of Plotgroups: " + this.result.length;
        }
                           
    }
    
    @Override
    public String toString(){
        return this.name;        
    }
    
    
    public String getID(){
        return this.modelIdentifier;
    }
    
    @Override
    public DefaultMutableTreeNode getNode(){
        DefaultMutableTreeNode modelNode = new DefaultMutableTreeNode(this);
        for(ComsolResult res : result){
            modelNode.add(res.getNode());
        }       
        return modelNode;
    }     

    @Override
    public String getInfoText() {
        return this.infoText;
    }

    /**
     * Saves the binary Data of all Render Data Childs 
     * 
     * @param path where the Data should be saved
     * @throws IOException
     */
    public void saveData(String path) throws IOException{
        if(!this.isExported){
            File f = new File(path + '/' + this.modelIdentifier);
            f.mkdir();
            for(ComsolResult res : result){
                res.saveData(f.getPath());
            }
        }
    }

    public boolean isExported(){
        return this.isExported;
    }
    
    public void setExported(boolean exported){
        this.isExported = exported;
    }
    
    /**
     *
     * Delete the binary Data of all Render Data Childs
     * 
     * @param path where the Data is saved
     */
    public void deleteData(String path) throws IOException{
        if(this.isExported){
            File f = new File(path + '/' + this.modelIdentifier);
            if(f.exists()){
                for(ComsolResult res : result){
                    res.deleteData(f.getPath());
                }
            }
            f.delete();
        }
    } 
  }
