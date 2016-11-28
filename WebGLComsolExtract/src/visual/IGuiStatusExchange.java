/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import javax.swing.tree.DefaultTreeModel;

/**
 *
 * @author itesegr
 */
public interface IGuiStatusExchange {
    
    public void printError(String error);
    
    public void printConnectionState(String connectionState);
    
    public void printFilePath(String filePath);
    
    public void updateProgressBar(int percent);
    
    public void setRightModel(DefaultTreeModel treeModel);;
    
    public void setLeftModel(DefaultTreeModel treeModel);

    public void logError(Exception err);
}
