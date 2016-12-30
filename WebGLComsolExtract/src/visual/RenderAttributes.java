/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package visual;

import JSONParser.JSONArray;
import JSONParser.JSONObject;
import com.comsol.model.ResultFeature;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 *
 * @author itesegr
 * Here all Attributes for describing the visual data are defined
 * 
 */
public class RenderAttributes {
    
	//Keys for JSON
    public static final String MIN = "min";
    public static final String MAX = "max";
    public static final String NAME = "name";
    public static final String VALUE = "value";
    public static final String INDEX = "index";
    
    //COMSOL Attributes
    public static final String ATTR_COLOR = "Color";				// linear Mapping to the colorTable
    public static final String ATTR_VECTORX = "VectorX";			// X-Value of Vectors
    public static final String ATTR_VECTORY = "VectorY";			// Y-Value of Vectors
    public static final String ATTR_VECTORZ = "VectorZ";			// Z-Value of Vectors
    public static final String ATTR_ISO = "IsoLevel";				// Isolevel mapped to Color
    public static final String ATTR_RAD = "Radius";					// Radius for Lines as Tubes
    public static final String ATTR_DEFX = "DeformX";				// Deformation in X-Direction
    public static final String ATTR_DEFY = "DeformY";				// Deformation in Y-Direction
    public static final String ATTR_DEFZ = "DeformZ";				// Deformation in Z-Direction
    

    public static class Attribute{
        public String name;         //Name of the Attribute
        public float[] values;      //Values of this Attribute for each renderData
        public float min;           //Minimal Value of this Attribute
        public float max;           //Maximal Value of this Attribute
        public int index;           //index for the binary Offset
    
        public JSONObject toJSON(){
            JSONObject jsonObj = new JSONObject();
            jsonObj.put(NAME, this.name);
            jsonObj.put(MAX, this.max);
            jsonObj.put(MIN, this.min);
            jsonObj.put(INDEX, this.index);
            
            return jsonObj;
        }
    }
    
    public static List<Attribute> createAttributeList(JSONObject attributes) {
        List<Attribute> attributeList = new ArrayList<Attribute>();
        Iterator<String> iter = attributes.keys();
        while(iter.hasNext()) {
            JSONObject attrJson = attributes.getJSONObject(iter.next());
            Attribute attribute = new Attribute();
            attribute.name = attrJson.getString(NAME);
            attribute.index = attrJson.getInt(INDEX);
            attribute.max = (float) attrJson.getDouble(MAX);
            attribute.min = (float) attrJson.getDouble(MIN);
            attributeList.add(attribute);
        }
        return attributeList;
    }
    
    public static List<Attribute> createAttributeList(ResultFeature result, int renderIndex) throws Exception {
    	List<Attribute> attributes = new ArrayList<>();
      
    	int indexOffset = 0;

    	String[] comsolAttr = result.getDataTypes(renderIndex);	//get all Attributes from COMSOL
      
    	for (int i = 0; i < comsolAttr.length; i++) {
      	
    		//Color
    		if(comsolAttr[i].equals(ATTR_COLOR)){

			  int numGroups = result.getGroups(renderIndex);
			  
			  float[][] minmax = new float[numGroups][];
			  
			  for (int j = 0; j < numGroups; j++){
			      minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_COLOR);	// Extract min max Value from Comsol
			  }
			
			  Attribute attr = new Attribute();
			  float[] mm = getMinMax(minmax);
			  attr.min = mm[0];
			  attr.max = mm[1];
			
			  attr.name = ATTR_COLOR;
			  attr.index = indexOffset;
			  indexOffset += 1;		  	//Index Pointer should be increased by each found Attribute
			
			  attributes.add(attr);
              
          //Deformation X 
          } else if (comsolAttr[i].equals(ATTR_DEFX)){
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_DEFX);	// Extract min max Value from Comsol
              }
              
              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_DEFX;
              attr.index = indexOffset;
              indexOffset += 1;		  //Index Pointer should be increased by each found Attribute

              attributes.add(attr);
              

          //Deformation Y
          } else if (comsolAttr[i].equals(ATTR_DEFY)){
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_DEFY);	// Extract min max Value from Comsol
              }
              
              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_DEFY;
              attr.index = indexOffset;
              indexOffset += 1;		  //Index Pointer should be increased by each found Attribute

              attributes.add(attr);

          //Deformation Z
          } else if (comsolAttr[i].equals(ATTR_DEFZ)){
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_DEFZ);	// Extract min max Value from Comsol
              }
              
              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_DEFZ; 
              attr.index = indexOffset;
              indexOffset += 1;		  //Index Pointer should be increased by each found Attribute

              attributes.add(attr);

              
          //IsoLevel
          } else if (comsolAttr[i].equals(ATTR_ISO)) {
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_ISO);  // Extract min max Value from Comsol
              }

              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_ISO;
              attr.index = indexOffset;
              indexOffset += 1;

              attributes.add(attr);

              
          //Radius
          } else if (comsolAttr[i].equals(ATTR_RAD)) {
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_RAD);
              }
              
              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];
              attr.name = ATTR_RAD;
              attr.index = indexOffset;
              indexOffset += 1;
              attributes.add(attr);
              
          //Vector X
          } else if (comsolAttr[i].equals(ATTR_VECTORX)) {
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_VECTORX);
              }
              
              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_VECTORX;
              attr.index = indexOffset;
              indexOffset += 1;		  //Index Pointer should be increased by each found Attribute

              attributes.add(attr);
          
          //Vector Y
          } else if (comsolAttr[i].equals(ATTR_VECTORY)) {
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_VECTORY);
              }

              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_VECTORY;
              attr.index = indexOffset;
              indexOffset += 1;		  //Index Pointer should be increased by each found Attribute

              attributes.add(attr);
              
          //Vector Z
          } else if (comsolAttr[i].equals(ATTR_VECTORZ)) {
              float[][] minmax = new float[result.getGroups(renderIndex)][];
              for (int j = 0; j < result.getGroups(renderIndex); j++){
                  minmax[j] = result.getDataMinMax(renderIndex, j, ATTR_VECTORZ);
              }

              Attribute attr = new Attribute();
              float[] mm = getMinMax(minmax);
              attr.min = mm[0];
              attr.max = mm[1];

              attr.name = ATTR_VECTORZ;
              attr.index = indexOffset;
              indexOffset += 1;		  //Index Pointer should be increased by each found Attribute

              attributes.add(attr);
          }
    	}
    	return attributes;
    }
    
    private static final float[] getMinMax(float[][] minmax){
        float[] mm = new float[]{Float.POSITIVE_INFINITY, Float.NEGATIVE_INFINITY};
        for (int i = 0; i < minmax.length; i++) {
            mm[0] = (mm[0] <= minmax[i][0]) ? mm[0] : minmax[i][0];
            mm[1] = (mm[1] >= minmax[i][0]) ? mm[1] : minmax[i][1];
        }
        return mm;
    }

}
