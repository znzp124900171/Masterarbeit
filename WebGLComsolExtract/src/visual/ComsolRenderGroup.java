/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import JSONParser.JSONArray;
import JSONParser.JSONObject;
import com.comsol.model.ResultFeature;
import visual.RenderAttributes.Attribute;
import java.io.IOException;
import java.util.List;
import javax.swing.tree.DefaultMutableTreeNode;

/**
 *
 * @author itesegr
 */
public class ComsolRenderGroup implements ITreeNode{
    
      //Keys for Json
    public static final String RENDER_DATA = "renderData";
    public static final String ATTRIBUTES = "attributes";
    
    private final int index;		//index (e.g. Slice number)
    private final String objName;	//Name of this object
    
    private String infoText;
    
    //Children containing the binary Data
    private final ComsolRenderData[] renderData; 
    
    //Attributes defining how to render the data
    private List<Attribute> attributes;
    
    
    public ComsolRenderGroup(ResultFeature result, String type, int index) throws Exception{
        
        this.objName = "Render Group " + index;
        this.index = index;
        
        int nGroups = result.getGroups(index);	//get Number of Render Groups
        
        if(nGroups > 0 ){
            this.renderData = new ComsolRenderData[nGroups];
            
            this.attributes = RenderAttributes.createAttributeList(result, index);	//get All Render Attributes

            for(int i = 0; i < nGroups; i++){
                renderData[i] = new ComsolRenderData(result, type, attributes, index, i);
            }
        } else {
            this.renderData = null;	// no render Data available
        }
        setupInfoText();
    }
    
    public ComsolRenderGroup(JSONObject renderDataJson, int index){
        this.objName = "Render Group " + index;
        this.index = index;
        
        JSONArray rdArray = renderDataJson.getJSONArray(RENDER_DATA);
        
        JSONObject attributes = renderDataJson.getJSONObject(ATTRIBUTES);
        if (attributes != null) {
            this.attributes = RenderAttributes.createAttributeList(attributes);
        }
        this.renderData = new ComsolRenderData[rdArray.length()];
        for(int i = 0; i < rdArray.length(); i++){
            this.renderData[i] = new ComsolRenderData(rdArray.getJSONObject(i), i);
        }
        
        setupInfoText();
    }
    
    private void setupInfoText(){
        StringBuilder sb = new StringBuilder(100);
        sb.append("Render Group: "+ this.infoText);
        sb.append("\nAttributes: ");
        this.infoText = sb.toString();
    }

    public float[] getModelSize(){
        float[] modelSize1 = null, modelSize2 = null;
        for(int i = 0; i < this.renderData.length; i++){
            modelSize2 = this.renderData[i].getModelSize();
            modelSize1 = ComsolResult.compareBoundBox(modelSize1, modelSize2);
        }
        return modelSize1;
    }
    
    @Override
    public String toString(){
        return this.objName;
    }
    
    @Override
    public JSONObject toJSON(){
          if (this.renderData != null){
              JSONObject renderGroupJson = new JSONObject();

              if(this.attributes != null){
                  JSONObject attributes = new JSONObject();
                  for (Attribute attribute : this.attributes){
                          attributes.put(attribute.name, attribute.toJSON());
                  }
                  renderGroupJson.put(ATTRIBUTES, attributes);
              }

              JSONArray renderDataArr = new JSONArray();
              for(ComsolRenderData crd : renderData){
                  JSONObject result = crd.toJSON();
                  renderDataArr.put(result);
              }
              renderGroupJson.put(RENDER_DATA, renderDataArr);  

              return renderGroupJson;
          } else {
              return null;
          }
      } 

    public void saveData(String path) throws IOException{
        if(this.renderData != null){
            for(ComsolRenderData rd : renderData){
                rd.saveData(path + "." + this.index);
            }
        }
        
    }
    
    public void deleteData(String path) throws IOException{
        if(this.renderData != null){
            for(ComsolRenderData rd : renderData){
                rd.deleteData(path + "." + this.index);

            }
        }
    }
    
    @Override
    public DefaultMutableTreeNode getNode(){
        DefaultMutableTreeNode renderGroupNode = new DefaultMutableTreeNode(this, true);
        for(ComsolRenderData rd : renderData){
            renderGroupNode.add(rd.getNode());
        }
        return renderGroupNode;
    }       

    @Override
    public String getInfoText() {
        return this.infoText;
    }
    
}
