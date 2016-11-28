/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

package visual;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 *
 * @author itesegr
 */
public class StringLib {
   
    
    public static String removeFileExtension(String input){
        String res = input.replaceAll("[.][\\w]*$", "");
        return res;
    }
            
}
