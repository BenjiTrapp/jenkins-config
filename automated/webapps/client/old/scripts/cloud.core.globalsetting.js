 /**
 *  Copyright (C) 2010 Cloud.com, Inc.  All rights reserved.
 * 
 * This software is licensed under the GNU General Public License v3 or later.
 * 
 * It is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

function afterLoadGlobalSettingJSP() {
    var $actionLink = $("#right_panel_content #tab_content_details #action_link");
    bindActionLink($actionLink);
    /*    
	$actionLink.bind("mouseover", function(event) {	    
		$(this).find("#action_menu").show();    
		return false;
	});
	$actionLink.bind("mouseout", function(event) {       
		$(this).find("#action_menu").hide();    
		return false;
	});	   	
	*/
					
    populateGlobalSettingGrid();
    
    //actions      
    var $actionList = $("#right_panel_content #tab_content_details #action_link #action_menu").find("#action_list").empty();        
    var $listItem = $("#action_list_item").clone();
    $listItem.find("#link").text(dictionary["label.action.edit.global.setting"]);   
    $listItem.bind("click", function(event) {        
        doEditGlobalSetting();
        return false;
    });
    $actionList.append($listItem.show());
    
    //dialogs
    initDialogWithOK("dialog_alert_restart_management_server");   
}

function populateGlobalSettingGrid() {  
    var $thisTab = $("#right_panel_content #tab_content_details");  
    $thisTab.find("#tab_container").hide(); 
    $thisTab.find("#tab_spinning_wheel").show();   
 
    $.ajax({
        data: createURL("command=listConfigurations"),
        dataType: "json",
        success: function(json) {           
            var items = json.listconfigurationsresponse.configuration;
            $container = $("#tab_content_details").find("#grid_content").empty();
            $templateText = $("#globalsetting_template_text");    
            $templatePassword = $("#globalsetting_template_password");          
            if(items != null && items.length > 0) {
                for(var i=0; i<items.length; i++) {
                    var $newTemplate;
                    if(items[i].name.toLowerCase().indexOf("password") == -1)
                        $newTemplate = $templateText.clone();
                    else
                        $newTemplate = $templatePassword.clone();
                    globalsettingJSONToTemplate(items[i], $newTemplate);
                    $container.append($newTemplate.show());
                }
            }    
            $thisTab.find("#tab_spinning_wheel").hide();    
            $thisTab.find("#tab_container").show();            
        }
    });    
}

var globalsettingGridIndex = 0;
function globalsettingJSONToTemplate(jsonObj, template) {      
    (globalsettingGridIndex++ % 2 == 0)? template.addClass("even"): template.addClass("odd");		
	template.find("#name").text(fromdb(jsonObj.name));	
	template.find("#value").text(fromdb(jsonObj.value));	
	template.find("#value_edit").val(fromdb(jsonObj.value));	
	template.find("#description").text(fromdb(jsonObj.description));
}

function doEditGlobalSetting() {
    var $detailsTab = $("#right_panel_content #tab_content_details"); 
    var $readonlyFields  = $detailsTab.find("#globalsetting_template_text #value, #globalsetting_template_password #password_mask");
    var $editFields = $detailsTab.find("#value_edit"); 
                 
    $readonlyFields.hide();
    $editFields.show();  
    $detailsTab.find("#cancel_button, #save_button").show();
    
    $detailsTab.find("#cancel_button").unbind("click").bind("click", function(event){    
        $editFields.hide();
        $readonlyFields.show();   
        $("#save_button, #cancel_button").hide();       
        return false;
    });
    $detailsTab.find("#save_button").unbind("click").bind("click", function(event){        
        doEditGlobalSetting2($readonlyFields, $editFields);   
        return false;
    });   
}

function doEditGlobalSetting2($readonlyFields, $editFields) {        
    var isChanged = false;
    
    $("#right_panel_content #tab_content_details").find("#globalsetting_template_text,#globalsetting_template_password").each(function(index) {        
        var $thisRow =$(this);  
        
        if($thisRow.find("#value_edit").val() != $thisRow.find("#value").text()) {            
            // validate values        
            var isValid = true;					
            isValid &= validateString("Value", $thisRow.find("#value_edit"), $thisRow.find("#value_edit_errormsg"), true);					
            if (!isValid) 
                return;						
        		        
	        var name = $thisRow.find("#name").text();
            var value = $thisRow.find("#value_edit").val();
          
            $.ajax({
              data: createURL("command=updateConfiguration&name="+todb(name)+"&value="+todb(value)),
	            dataType: "json",
	            async: false,
	            success: function(json) {		              	           
		            var jsonObj = json.updateconfigurationresponse.configuration;	
		            globalsettingJSONToTemplate(jsonObj, $thisRow);  
		            isChanged = true;
	            }
            });		           
        }
    });         
    
	$editFields.hide();      
    $readonlyFields.show();       
    $("#save_button, #cancel_button").hide();   
    
    if(isChanged == true)     
         $("#dialog_alert_restart_management_server").dialog("open"); 		    	       
}
