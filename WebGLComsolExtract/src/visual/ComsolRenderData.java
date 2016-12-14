/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import JSONParser.JSONObject;

import com.comsol.model.ResultFeature;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.List;


import javax.swing.tree.DefaultMutableTreeNode;

import visual.RenderAttributes.Attribute;

/**
 *  
 * Object with all Properties and the binary Data of an single Plot.
 * should only be constructed by the Parent Classes ComsolModel or ComsolResult
 * 
 */
public class ComsolRenderData implements ITreeNode{
    
    public static final String NUM_VERT = "numVert";
    public static final String NUM_ELE = "numEle";
    
    private int size;                   // Size of the Binary Data in Bytes
    
    private final String objName;
    
    private final int index;
    
    private int nDimension;
    
    private int nVertex;                // total Number of Vertices, only for internal usage
    private int nElement;               // total Number of Elements, only for internal usage
     
    private String infoText;        //Text For the Gui
  
    // Binary Data
    private float[][] bufVertex;     //		[3][Number of Vertex]
    private float[][] bufAttrib;     //		[Number of Attributes][Number of Vertex]
    private int[][] bufIndex;      		//		[Number of Triangles][3:Tri, 2:Lines]
    
   /* Constructor by Comsol Model Object
    **  
    **
    */
    public ComsolRenderData(ResultFeature result, String type, List<Attribute> attribs, int indexGroup, int indexData) throws Exception{

        this.objName = "Render Data " + indexData;
        this.index = indexData;
        
        this.nDimension = result.getSDim();
        
        int elementType = ComsolResult.checkType(type); // 0 = unknown, 1 = point, 2 = lines, 3 = triangles

        
        this.bufVertex = result.getVertices(indexGroup, indexData);		//get binary data of all vertices
        this.nVertex = this.bufVertex[0].length;
        System.out.println("length of bufVertx: "+ this.bufVertex[0].length);
        
        int nAttribs = (attribs == null) ? 0 : attribs.size();
        
        if(elementType > 1){	// only lines or triangles need indexing data
            this.bufIndex = result.getElements(indexGroup, indexData);
            this.nElement =  this.bufIndex[0].length; 
            System.out.println("length of bufIndex: "+ this.bufIndex[0].length);
        }else{
        	this.bufIndex = null;	
            this.nElement = 0;
        }
        
        if(nAttribs > 0){	//get all Attributes from Comsol (color, deformation, ...)
            this.bufAttrib = new float[nAttribs][];
            
            for(int i = 0; i < nAttribs; i++){
            	this.bufAttrib[i] = result.getData(indexGroup, indexData, attribs.get(i).name);
            }

        }else{	// if no Attributes then null
        	this.bufAttrib = null;
        }
        
        this.size = calcSize();
        this.setupInfoText();
        
    }

    /* Constructor by File
    **  
    **
    */
    public ComsolRenderData(JSONObject dataObject, int index){
        this.objName = "Render Group " + index;
        this.index = index;
        
        this.nVertex = dataObject.getInt(NUM_VERT);
        this.nElement = dataObject.getInt(NUM_ELE);
        this.calcSize();
        this.setupInfoText();
    }
    
    /**
     * Gets the model size.
     *
     * @return the model size {xMin, xMax, yMin, yMax, zMin, zMax}
     */
    public float[] getModelSize(){
        float xMax, yMax, zMax, xMin, yMin, zMin, tmp;
        xMax = yMax = zMax = Float.NEGATIVE_INFINITY;
        xMin = yMin = zMin = Float.POSITIVE_INFINITY;
        
        for (int j = 0; j < this.bufVertex[0].length; j++) {
            tmp = bufVertex[0][j]; // compare X comp
            if (tmp > xMax){
                xMax = tmp;
            } else if (tmp < xMin){
                xMin = tmp;
            }
            tmp = bufVertex[1][j]; // compare Y comp
            if (tmp > yMax){
                yMax = tmp;
            } else if (tmp < yMin){
                yMin = tmp;
            }
            if(this.nDimension > 2) {
            	tmp = bufVertex[2][j]; // compare Z comp
                if (tmp > zMax){
                    zMax = tmp;
                } else if (tmp < zMin){
                    zMin = tmp;
                }
            }
        }

        return new float[]{xMin, xMax, yMin, yMax, zMin, zMax};
    }

    
    /**
     *  Calculates the Total Size of the binary data
    */
    public final int calcSize() {
        
        int byteSize = 0;
        
        byteSize += 4 *  this.bufVertex[0].length * this.bufVertex.length;	// 4 (4Bytes in Float) * length1 * length2

        if(this.bufIndex != null){
           byteSize += 4 *  this.bufIndex[0].length * this.bufIndex.length;	// 4 (4Bytes in Integer) * length1 * length2
        }
            
        if(this.bufAttrib != null){
           byteSize += 4 *  this.bufAttrib[0].length * this.bufAttrib.length; // 4 (4Bytes in Float) * length1 * length2
        }

        return byteSize;
    }

    
    @Override
    public JSONObject toJSON(){
        JSONObject renderData = new JSONObject();

        renderData.put(NUM_VERT, this.nVertex);

        renderData.put(NUM_ELE, nElement);

        return renderData;
    }
    
    /* Saves the binary
    **
    */
    public void saveData(String path) throws IOException {
        path = path + '.' + this.index + '.' + "bin";	//path to the binary data
        File file = new File(path);			
               
        byte[] byteData = dataToByteArray();
        
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(byteData);
        }
}
    
    /** converts all binary data into a byte Array
    ** Little Endian Format
    * 
    * Structure of Binary Data:
    * 							[Coords: X1, Y1, Z1, X2, Y2, Z2, ...., XN, YN, ZN]
    * 						+ 	[Attributes: Color1, Color2, ... ColorN, DeformationX1 , DeformationX2, ...]
    * 						+	[Indices: Triangle1_Point1, Triangle1_Point2, Triangle1_Point3, Triangle2_Point1, ...]
    * 				
    * 
    *						
    */
    private byte[] dataToByteArray() {
        ByteBuffer bBuf = ByteBuffer.allocate(this.size + 4);
        bBuf.order(ByteOrder.LITTLE_ENDIAN);
        
        byte[] magicNumber = new byte[]{73,84,69,49};	// Magic Number is "ITE", to identify the type of this binary data
        bBuf.put(magicNumber);
        
        for (int j = 0; j < nVertex; j++){

            bBuf.putFloat(bufVertex[0][j]);
            bBuf.putFloat(bufVertex[1][j]); 
            if(this.nDimension == 3){
            	bBuf.putFloat(bufVertex[2][j]);
            }
        }

        if (this.bufAttrib != null){
            for (int j = 0; j < bufAttrib.length; j++){
                for(int k = 0; k < nVertex; k++){
                    bBuf.putFloat(bufAttrib[j][k]);
                }
            }
        }
        
        if(this.bufIndex != null){
        	for(int j = 0; j < nElement; j++){
                for (int k = 0; k < bufIndex.length; k++) {
                    bBuf.putInt(bufIndex[k][j]);
                }       

            }

        }

       byte[] byteArray = new byte[this.size + 4];
       bBuf.flip();
       bBuf.get(byteArray, 0, this.size + 4);
       
       return byteArray;
    }
    

    public void deleteData(String path) throws IOException {
        path = path + '.' + this.index + '.' + "bin";
        File file = new File(path);
        
        if(file.exists()){
            file.delete();
        }
    }
    
    @Override
    public DefaultMutableTreeNode getNode(){
        DefaultMutableTreeNode renderDataNode = new DefaultMutableTreeNode(this, false);
        return renderDataNode;
    }

    /* This method create the info text, to be displayed in the gui
    ** call this method after constructor
    */
    private void setupInfoText() {
        StringBuilder sb = new StringBuilder(100);
        sb.append("Render Data:\n").append("Number of Vertices: ");
        
        sb.append("\nNumber of Elements: ");
       
        sb.append("\nTotal Size (Byte): ").append(this.size);
        
        this.infoText = sb.toString();
        
    }
    
    @Override
    public String getInfoText() {
        return this.infoText;
    }
    
    @Override
    public String toString(){
        return this.objName;
    }
    
}
    
   

    
    