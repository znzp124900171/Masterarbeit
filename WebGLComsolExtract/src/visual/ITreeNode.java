/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import JSONParser.JSONObject;
import javax.swing.tree.DefaultMutableTreeNode;

/**
 *
 * @author Sebastian
 */
public interface ITreeNode {
    
    /**
     * 
     * @return an description of this Object be displayed
     */
    public String getInfoText();

    /**
     *
     * @return TreeNode, when Object has Childs the will also returned as Child of this TreeNode
     */
    public DefaultMutableTreeNode getNode();   

    /**
     *
     * @return the meta information in form of an JSON Object
     */
    public JSONObject toJSON();
}
