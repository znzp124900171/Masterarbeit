/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import JSONParser.JSONArray;
import JSONParser.JSONException;
import JSONParser.JSONObject;
import com.comsol.model.Model;
import com.comsol.model.util.ModelUtil;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.Writer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

import java.util.concurrent.locks.ReentrantReadWriteLock;
import javax.swing.tree.DefaultMutableTreeNode;
import javax.swing.tree.DefaultTreeModel;

/**
 *
 * @author itesegr
 */
public class ComsolData {

    //START static variables

    public static String MODELLIST = "list.json";
    
    // Filter to identify all ".json" files
    public static FilenameFilter fileFilterJson = new FilenameFilter() {
        @Override
        public boolean accept(File dir, String name) {
            if (name.lastIndexOf('.')>0){ // -1 := string does not contain this char
                int lastIndex = name.lastIndexOf('.');
                String str = name.substring(lastIndex);
                if(str.equals(".json")){
                    return true;
                }
            }
            return false;
        }
    };
    
    //END static variables
    
    //START variable declaration
    private final IGuiStatusExchange attachedGui;     // attaced Gui, here: TreeFrame 
    private String activeDirectory;    // last saved Directory
    private boolean isChanged;  // are changes Made to Data
    private boolean isConnected;     // is a connection to comsol server etablished
    
    //Locks
    public ReentrantReadWriteLock leftLock;     //Locks: this.leftModels, this.activeDirectory, this.isChanged
    public ReentrantReadWriteLock rightLock;    //Locks: this.rightModels
    public ReentrantLock comsolLock;    //Locks: all Comsol Commands + access to this.isConnected

    private final List<ComsolModel> leftModels; //model List WebGL
    private final List<ComsolModel> rightModels; //model List COMSOL
    //END of declaration
    
    public ComsolData(IGuiStatusExchange gui){
        attachedGui = gui;
        isConnected = false;
        activeDirectory = null;
        isChanged = false;
        comsolLock = new ReentrantLock();
        leftLock = new ReentrantReadWriteLock();
        rightLock = new ReentrantReadWriteLock();
        leftModels = new ArrayList<>();
        rightModels = new ArrayList<>();
    }
    
    // Exists unsaved Data
    public boolean isUnsavedData(){
        this.leftLock.readLock().lock();
        boolean isChanged = this.isChanged;
        this.leftLock.readLock().unlock();
        return isChanged;
    }
    
    // is connected to Comsol server
    public boolean isConnected() {
        this.comsolLock.lock();
        boolean isConnected = this.isConnected;
        this.comsolLock.unlock();
        return isConnected;
    }

    /*
    **  Set Directory back to null
    */
    public void resetDirectory(){
        this.leftLock.writeLock().lock();
        this.activeDirectory = null;
        this.isChanged = true;
        this.leftLock.readLock().unlock();
    }
    
    /*
    **  Exists Directory to save Data
    */
    public boolean isDirectory(){
        this.leftLock.readLock().lock();
        boolean isDirectory = (this.activeDirectory != null);
        this.leftLock.readLock().unlock();
        return isDirectory;
    }

    /*
    **  removes all Models from the left tree (webGL models)
    */
    public void newModelList(){
        if(!this.isChanged){
            if(this.leftModels.size() > 0){
                this.leftLock.writeLock().lock();
                this.leftModels.clear();
                this.activeDirectory = null;
                this.leftLock.writeLock().unlock();
                this.attachedGui.printFilePath("All Models removed from list.");
            }
        }
        this.attachedGui.setLeftModel(getLeftTreeModel());
    }
    
    /*
    **  removes all Models from the right tree (Comsol models)
    */
    public void removeAllModelRight(){
        if(this.rightModels.size() > 0){
            this.rightLock.writeLock().lock();
            this.rightModels.clear();
            this.rightLock.writeLock().unlock();
            this.attachedGui.printConnectionState("All Models removed from list.");
        }
        this.attachedGui.setLeftModel(getRightTreeModel());
    }
    
    private ComsolModel getModelFromNode(Object node){
        if(node != null && (node instanceof DefaultMutableTreeNode)){
            Object nodeObj = ((DefaultMutableTreeNode) node).getUserObject();
            if(nodeObj != null && (nodeObj instanceof ComsolModel)){
                return (ComsolModel) nodeObj;
            }
        }
        return null;
    }
    
    /*
    **  removes one Model from the left tree (webGL models)
    */
    public void deleteModelLeft(Object node){

        ComsolModel modelDel = getModelFromNode(node);
        if(modelDel != null){
            this.leftLock.writeLock().lock();
            if(leftModels.indexOf(modelDel) != -1){
                this.leftModels.remove(modelDel);
                this.isChanged = true;
                this.leftLock.writeLock().unlock();
                this.attachedGui.printFilePath("Model " + modelDel.toString() + " removed from list.");
        
                if(modelDel.isExported()){
                    try{
                        modelDel.deleteData(activeDirectory);
                        File file = new File(activeDirectory + '/' + modelDel.getID()  + ".json");
                        file.delete();

                    }catch(IOException e){
                        this.attachedGui.printFilePath("Model Files could not be deleted.");
                    }
                }
            }else{
                this.attachedGui.printFilePath("Model " + modelDel.toString() + " not found.");
                leftLock.writeLock().unlock();
            }
        this.attachedGui.setLeftModel(getLeftTreeModel());
        }
    }
     
    /*
    **  removes one Model from the right tree (Comsol models)
    */
    public void removeModelRight(Object node){
        ComsolModel modelDel = getModelFromNode(node);
        if(modelDel != null){
            this.rightLock.writeLock().lock();
            if(this.rightModels.indexOf(modelDel) != -1){
                this.rightModels.remove(modelDel);
                this.rightLock.writeLock().unlock();
                this.attachedGui.setRightModel(getRightTreeModel());
                this.attachedGui.printConnectionState("Model " + modelDel.toString() + " removed from list.");
            }else{
                this.rightLock.writeLock().unlock();
                this.attachedGui.printFilePath("Model " + modelDel.toString() + " not found.");
                this.attachedGui.setRightModel(getRightTreeModel());
            }
        }
    }
    
    /*
    **  add one Model to the left tree (webGL models)
    */
    public void addModel(Object node){
        ComsolModel modelNew = getModelFromNode(node);
        if(modelNew != null){
            leftLock.writeLock().lock();
            try{
                this.leftModels.add(modelNew);
                this.isChanged = true;
            } finally {
                leftLock.writeLock().unlock();
            }
            this.attachedGui.setLeftModel(getLeftTreeModel());
        }
    }
    
    /*
    **  load Comsol Model by File name
    */
    public void loadModel(File file){

        //check if File exist, and is .mph File
        if(file == null || !file.exists() || !file.getName().matches("(?i).*[.]mph$")){
            this.attachedGui.printConnectionState("Can't open this file.");
            return;
        }

        String internalName = StringLib.removeFileExtension(file.getName());    //Model Tag = file name without extension
        this.attachedGui.printConnectionState("Opening Model " + internalName);
        String absPath = file.getAbsolutePath();
        
        Model model = null;
        
        this.comsolLock.lock();
        try{
            if(this.isConnected){
                model = ModelUtil.load(internalName, absPath);
            } else {
                this.attachedGui.printConnectionState("Model could not be loaded, no connection to Comsol Server.");
            }
        }catch(IOException e){
            this.attachedGui.logError(e);
            this.attachedGui.printConnectionState("Model: " + internalName + " could not be loaded.");
        } finally {
            this.comsolLock.unlock();
        }
        
        //model successfully loaded
        if(model != null){
            this.rightLock.writeLock().lock();
            try{
                this.rightModels.add(new ComsolModel(model));
            }catch(Exception e){
                this.attachedGui.logError(e);
                this.attachedGui.printConnectionState("Model: " + internalName + " could not be loaded.");
                return;
            }finally{
                this.rightLock.writeLock().unlock();
            }
            this.attachedGui.printConnectionState("Model: " + internalName + " loaded.");
            this.attachedGui.printError("");
            this.attachedGui.setRightModel(getRightTreeModel());
        }
    }
    
    /*
    **  load Comsol Model by, model must be already loaded into comsol server
    */
    public void loadModel(String modelTag){
        Model model = null;
        this.attachedGui.printConnectionState("Opening Model " + modelTag);
        this.comsolLock.lock();
        try{
            if (this.isConnected){
                model = ModelUtil.model(modelTag);
            } else {
                this.attachedGui.printConnectionState("Model could not be loaded, no connection to Comsol Server.");
            }
        } catch(Exception e){
            this.attachedGui.logError(e);
            this.attachedGui.printConnectionState("Model: " + modelTag + " could not be loaded.");
        } finally {
            this.comsolLock.unlock();
        }

        if(model != null){
            this.rightLock.writeLock().lock();
            try{
                this.rightModels.add(new ComsolModel(model));
            }catch(Exception e){
                this.attachedGui.logError(e);
                this.attachedGui.printConnectionState("Model: " + modelTag + " could not be loaded.");
                return;
            }finally{
                this.rightLock.writeLock().unlock();
            }
            this.attachedGui.printConnectionState("Model: " + modelTag + " loaded.");
            this.attachedGui.printError("");
            this.attachedGui.setRightModel(getRightTreeModel());
        }
    }
    
    /*
    **  load Comsol Model by, model must be already loaded into comsol server
    */
    public void unloadModel(String modelTag){
        Model model = null;
        this.attachedGui.printConnectionState("Unloading Model " + modelTag);
        this.comsolLock.lock();
        try{
            if (this.isConnected){
                ModelUtil.remove(modelTag);
            } else {
                this.attachedGui.printConnectionState("Model could not be unloaded, no connection to Comsol Server.");
            }
        } catch(Exception e){
            this.attachedGui.logError(e);
            this.attachedGui.printConnectionState("Model: " + modelTag + " could not be unloaded.");
        } finally {
            this.comsolLock.unlock();
        }
    }
    
    public String[] getModelTags(){
        comsolLock.lock();
        String modelTags[] = ModelUtil.tags(); 
        comsolLock.unlock();
        return modelTags;
    }
    
    
    public DefaultTreeModel getLeftTreeModel(){
        DefaultTreeModel treeModel;
        DefaultMutableTreeNode rootNode;
        
        rootNode = new DefaultMutableTreeNode("WebGL Models", true);
        leftLock.readLock().lock();
        for(ComsolModel model : leftModels){
            rootNode.add(model.getNode());
        }
        leftLock.readLock().unlock();
        treeModel = new DefaultTreeModel(rootNode);
        return treeModel;
    }
    
    public DefaultTreeModel getRightTreeModel(){
        DefaultTreeModel treeModel;
        DefaultMutableTreeNode rootNode;
        
        rootNode = new DefaultMutableTreeNode("Comsol Models", true);
        rightLock.readLock().lock();
        for(ComsolModel model : rightModels){
            rootNode.add(model.getNode());
        }
        rightLock.readLock().unlock();
        treeModel = new DefaultTreeModel(rootNode);
        return treeModel;
    }

    /*
    **  connects to Comsol Server
    */
    public void connectToComsol(String hostName, int port, boolean isStandalone){
        this.comsolLock.lock();
        try{
            if(!this.isConnected){
                ModelUtil.initStandalone(isStandalone);
                ModelUtil.connect(hostName,port);

                this.isConnected = true;

                this.attachedGui.printConnectionState("connected to Comsol server");
                this.attachedGui.printError("");
            }
        }catch(Exception e){
            this.isConnected = false;    
            this.attachedGui.printConnectionState("connection failed");
            this.attachedGui.logError(e);
        } finally {
            this.comsolLock.unlock();
        }
    }
    
    /*
    **  disconnects from Comsol Server
    */
    public void disconnect(){
        this.comsolLock.lock();
        try{
            if(this.isConnected){
                ModelUtil.disconnect();
                this.isConnected = false;
                this.attachedGui.printConnectionState("disconnected to Comsol server");
                this.attachedGui.printError("");
            }
        }catch(Exception e){
            this.attachedGui.logError(e);
        } finally {
            this.comsolLock.unlock();
        }
    }

    /*
    **  opens Directory and load all Model Files
    */
    public void openModel(File file){
        if(file != null && file.isDirectory()) {
            this.leftLock.writeLock().lock();
            try {
                this.activeDirectory = file.getAbsolutePath();
                File[] modelFiles = file.listFiles(fileFilterJson);
                for (File f : modelFiles){
                    ComsolModel comsolModel = new ComsolModel(new JSONObject(readInTxtFile(f)));
                    this.leftModels.add(comsolModel);
                }
                this.attachedGui.setLeftModel(getLeftTreeModel());
            } catch (JSONException | IOException e){
                this.attachedGui.printFilePath("Error while reading the file");
                this.attachedGui.logError(e);
                this.leftModels.clear();
                this.attachedGui.setLeftModel(getLeftTreeModel());
            } finally {
                this.leftLock.writeLock().unlock();
            }
        }
    }
    
    /*
    **  saves Models into default Directory
    */
    public void saveModel(boolean isStatic){
        if(this.activeDirectory != null){
            saveModel(isStatic, new File(this.activeDirectory));
        }
    }
   
    /*
    **  saves Models into selected Directory
    */
    public void saveModel(boolean isStatic, File file){   
        if(file != null && file.isDirectory()){
            if(this.leftModels.size() > 0 ){
                this.leftLock.readLock().lock();
                try{
                    String directory = file.getAbsolutePath();

                    //save the single Models
                    JSONObject modelObjext;
                    File modelFile;
                    
                    for(ComsolModel comModel : leftModels){
                        if(!comModel.isExported()){
                            this.attachedGui.printFilePath("Saving Model " + comModel.toString());
                            //save Model information in a JSON File
                            modelFile = new File(directory + '/' + comModel.getID() + ".json");
                            modelObjext = comModel.toJSON();
                            try(Writer fileWriter = new FileWriter(modelFile)){
                                modelObjext.write(fileWriter);
                                fileWriter.close();
                            }catch(IOException e){
                                this.attachedGui.logError(e);
                                this.attachedGui.printFilePath("Model could not be saved.");
                                return;
                            }
                            
                            //save Model Plot data as binary bin or base64 Files
                            try{
                                comModel.saveData(directory);
                            }catch(IOException e){
                                this.attachedGui.logError(e);
                                this.attachedGui.printFilePath("Model could not be saved.");
                                return;
                            }
                        }
                    }
                    
                    //save ModelList for static Webserver
                    if(isStatic){
                        JSONArray modelList = new JSONArray();
                        for (ComsolModel ComModel : leftModels){
                            modelList.put(ComModel.getJSONListItem());
                        }
                        File modelListFile = new File(directory + '/' + MODELLIST);
                        
                        try(Writer fileWriter = new FileWriter(modelListFile)){
                             modelList.write(fileWriter);
                             fileWriter.close();
                         }catch(IOException e){
                             this.attachedGui.logError(e);
                             this.attachedGui.printFilePath("Model could not be saved.");
                             return;
                         }
                    }                
                    
                    this.attachedGui.printFilePath("All Models saved.");
                }finally{
                    this.leftLock.readLock().unlock();
                }
                this.leftLock.writeLock().lock();
                this.isChanged = false;
                this.leftLock.writeLock().unlock();
                
            } else {
                this.attachedGui.printFilePath("No data to be saved.");
            }
        }        
           
    }
    
    /*
    **  reads File and return content as string
    */
    private String readInTxtFile(File file) throws IOException{
        BufferedReader br = new BufferedReader(new FileReader(file));
        StringBuilder sb = new StringBuilder();

        String line;
        while((line = br.readLine()) != null){
            sb.append(line);
        }

        return sb.toString();

    }
    
}


