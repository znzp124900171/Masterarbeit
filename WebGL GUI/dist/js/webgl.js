/*! AdminLTE app.js
 * ================
 * Main JS application file for WebGL application
 * 
 *
 * @Author  Nan Zhao
 * @Email   st120547@stud.uni-stuttgart.de
 */

//Make sure jQuery has been loaded before app.js
if (typeof jQuery === "undefined") {
  throw new Error("AdminLTE requires jQuery");
}

/* GUI
 *
 * @type Object
 * @description $.GUI is the main object for the template's app.
 *              It's used for implementing functions and options related
 *              to the template. Keeping everything wrapped in an object
 *              prevents conflict with other plugins and is a better
 *              way to organize the code.
 */
$.GUI = {};

/* --------------------
 * - GUI Options -
 * --------------------
 * Modify these options to suit your implementation
 */
$.GUI.options = {
    //Sidebar push menu toggle button selector
    sidebarToggleSelector: "[data-toggle='offcanvas']",
    //Activate sidebar push menu
    sidebarPushMenu: true,
    //Enable sidebar expand on hover effect for sidebar mini
    //This option is forced to true if both the fixed layout and sidebar mini
    //are used together
    sidebarExpandOnHover: false,
    //The standard screen sizes that bootstrap uses.
    //If you change these in the variables.less file, change
    //them here too.
    //Control Sidebar Tree views
    enableControlTreeView: true,
    screenSizes: {
        xs: 480,
        sm: 768,
        md: 992,
        lg: 1200
    }
}

function _init() {
    'use strict';

    //Fix for IE page transitions
    $("body").removeClass("hold-transition");

    var o = $.GUI.options;

    //Enable sidebar tree view controls
    if (o.enableControlTreeView) {
        $.GUI.tree('.sidebar');
    }
    /* PushMenu()
    * ==========
    * Adds the push menu functionality to the sidebar.
    *
    * @type Function
    * @usage: $.AdminLTE.pushMenu("[data-toggle='offcanvas']")
    */
    $.GUI.pushMenu = {
        activate: function (toggleBtn) {
            //Get the screen sizes
            var screenSize = $.GUI.options.screenSize;

            //Enable sidebar toggle
            $(document).on('click',toggleBtn,function(e) {
                //If this method is called, the default action of the event will not be triggered.
                e.preventDefault();

                //Enable sidebar push menu
                if ($(window).width() > (screenSizes.sm - 1)) {
                    if ($('body').hasClass('sidebar-collapse')) {
                        $('body').removeClass('sidebar-collapse').trigger('expanded.pushMenu');
                    } else {
                        $('body').addClass('sidebar-collapse').trigger('collapsed.pushMenu');
                    }
                }
                //Handle sidebar push menu for small screenSize
                else {
                    if ($('body').hasClass('sidebar-open')) {
                        $('body').removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu');
                    } else {
                        $('body').addClass('sidebar-open').trigger('expanded.pushMenu');
                    }
                }
            });

            $('.content-wrapper').click(function () {
                //Enable hide menu when clicking on the content-wrapper on small screens
                if ($(window).width <= (screenSizes.sm - 1) && $('body').hasClass('sidebar-open')) {
                    $('body').removeClass('sidebar-open');
                }
            });

            //Enable expand on hover for sidebar mini
            if ($.GUI.options.sidebarExpandOnHover || $('body').hasClass('sidebar-mini')) {
                this.expandOnHover();
            }
        },
        expandOnHover: function() {
            var _this = this;
            var screenWidth = $.GUI.options.screenSize.sm - 1;
            //Expand sidebar on hover
            $('.main-sidebar').hover(function() {
                if ($('body').hasClass('sidebar-mini') && $('body').hasClass('sidebar-collapse') && $('window').width() > screenWidth) {
                    _this.expand();
                }
            }, function() {
                if ($('body').hasClass('sidebar-mini') && $('body').hasClass('sidebar-expand-on-hover') && $(window).width() > screenWidth) {
                    _this.collapse();
                }
            });
        },
        expand: function () {
            $('body').removeClass('sidebar-collapse').addClass('sidebar-expanded-on-hover');
        },
        collapse: function() {
            if($('body').hasClass('sidebar-expanded-on-hover')) {
                $('body').removeClass('sidebar-expanded-on-hover').addClass('sidebar-collapse');
            }
        }
    };

    /* Tree()
    * ======
    * Converts the sidebar into a multilevel
    * tree view menu.
    *
    * @type Function
    * @Usage: $.GUI.tree('.sidebar')
    */
    $.GUI.tree = function (menu) {
        var _this = this;
    }
}

// slider of x-axis
$("#xAxis").slider();
$("#xAxis").on("slide", function(slideEvt) {
    $("#xPosition").text(slideEvt.value);
});

// slider of x-axis
$("#yAxis").slider();
$("#yAxis").on("slide", function(slideEvt) {
    $("#yPosition").text(slideEvt.value);
});

// slider of x-axis
$("#zAxis").slider();
$("#zAxis").on("slide", function(slideEvt) {
    $("#zPosition").text(slideEvt.value);
});

$('.slider').addClass('control-sidebar-subheading');

$("[name='my-checkbox']").bootstrapSwitch();

