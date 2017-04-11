//Make sure jQuery has been loaded before app.js
if (typeof jQuery === "undefined") {
    throw new Error("GUI requires jQuery");
}
/* GUI
 *
 * @type Object
 * @description $.GUI is the main object for the template's app.
 *              It's used for implementing functions and options related
 *              to the template. Keeping everything wrapped in an object
 *              prevents conflict with other plugins and is a better
 *              way to organize our code.
 */
$.GUI = {};
/* --------------------
 * - GUI Options -
 * --------------------
 * Modify these options to suit your implementation
 */
$.GUI.options = {
    //Add slimscroll to navbar menus
    //This requires you to load the slimscroll plugin
    //in every page before app.js
    navbarMenuSlimscroll: true,
    navbarMenuSlimscrollWidth: "3px",
    navbarMenuHeight: "200px",
    //General animation speed for JS animated elements such as box collapse/expand and
    //sidebar treeview slide up/down. This options accepts an integer as milliseconds,
    //'fast', 'normal', or 'slow'
    animationSpeed: 500,
    //Sidebar push menu toggle button selector
    sidebarToggleSelector: "[data-toggle='offcanvas']",
    //Activate sidebar push menu
    sidebarPushMenu: true,
    //Activate sidebar slimscroll (requires SlimScroll Plugin)
    sidebarSlimScroll: true,
    //Activate controlsidebar slimscroll
    contraolSidebarScroll: true,
    //Enable sidebar expand on hover effect for sidebar mini
    //This option is forced to true if both the fixed layout and sidebar mini
    //are used together
    sidebarExpandOnHover: false,
    //Enable Fast Click. Fastclick.js creates a more
    //native touch experience with touch devices. If you
    //choose to enable the plugin, make sure you load the script
    //before GUI's app.js
    enableFastclick: false,
    //Control Sidebar Tree views
    enableControlTreeView: true,
    //Control Sidebar Options
    enableControlSidebar: true,
    controlSidebarOptions: {
        //Which button should trigger the open/close event
        toggleBtnSelector: "[data-toggle='control-sidebar']",
        //The sidebar selector
        selector: ".control-sidebar",
        //Enable slide over content
        slide: true
    },
    //Define the set of colors to use globally around the website
    colors: {
        lightBlue: "#3c8dbc",
        red: "#f56954",
        green: "#00a65a",
        aqua: "#00c0ef",
        yellow: "#f39c12",
        blue: "#0073b7",
        navy: "#001F3F",
        teal: "#39CCCC",
        olive: "#3D9970",
        lime: "#01FF70",
        orange: "#FF851B",
        fuchsia: "#F012BE",
        purple: "#8E24AA",
        maroon: "#D81B60",
        black: "#222222",
        gray: "#d2d6de"
    },
    //The standard screen sizes that bootstrap uses.
    //If you change these in the variables.less file, change
    //them here too.
    screenSizes: {
        xs: 480,
        sm: 768,
        md: 992,
        lg: 1200
    }
};
/* ------------------
 * - Implementation -
 * ------------------
 * The next block of code implements GUI's
 * functions and plugins as specified by the
 * options above.
 */
$(function () {
    "use strict";
    //Fix for IE page transitions
    $("body").removeClass("hold-transition");
    //Extend options if external options exist
    if (typeof GUIOptions !== "undefined") {
        $.extend(true, $.GUI.options, GUIOptions);
    }
    //Easy access to options
    var o = $.GUI.options;
    //Set up the object
    _init();
    //Activate the layout maker
    $.GUI.layout.activate();
    //Enable sidebar tree view controls
    if (o.enableControlTreeView) {
        $.GUI.tree('.sidebar');
    }
    //Enable control sidebar
    if (o.enableControlSidebar) {
        $.GUI.controlSidebar.activate();
    }
    //Add slimscroll to navbar dropdown
    if (o.navbarMenuSlimscroll && typeof $.fn.slimscroll !== 'undefined') {
        $(".navbar .menu").slimscroll({
            height: o.navbarMenuHeight,
            alwaysVisible: false,
            size: o.navbarMenuSlimscrollWidth
        }).css("width", "100%");
    }
    //Activate sidebar push menu
    if (o.sidebarPushMenu) {
        $.GUI.pushMenu.activate(o.sidebarToggleSelector);
    }
    //Activate fast click
    if (o.enableFastclick && typeof FastClick !== 'undefined') {
        FastClick.attach(document.body);
    }
    /*
     * INITIALIZE BUTTON TOGGLE
     * ------------------------
     */
    $('.btn-group[data-toggle="btn-toggle"]').each(function () {
        var group = $(this);
        $(this).find(".btn").on('click', function (e) {
            group.find(".btn.active").removeClass("active");
            $(this).addClass("active");
            e.preventDefault();
        });
    });
});
/* ----------------------------------
 * - Initialize the GUI Object -
 * ----------------------------------
 * All GUI functions are implemented below.
 */
function _init() {
    'use strict';
    /* Layout
     * ======
     * Fixes the layout height in case min-height fails.
     *
     * @type Object
     * @usage $.GUI.layout.activate()
     *        $.GUI.layout.fix()
     *        $.GUI.layout.fixSidebar()
     */
    $.GUI.layout = {
        activate: function () {
            let _this = this;
            _this.fix();
            _this.fixSidebar();
            _this.fixControlSidebar();
            $('body, html, .wrapper').css('height', '100vh');
            $(window, ".wrapper").resize(function () {
                _this.fix();
                _this.fixSidebar();
            });
        },
        fix: function () {;
            //Get window height and the wrapper height
            let footer_height = $('.main-footer').outerHeight() || 0;
            let neg = $('.main-header').outerHeight() + footer_height;
            let window_height = $(window).height();
            let sidebar_height = $(".sidebar").height() || 0;
            
            // set the content height
            $(".content-wrapper").css('height', window_height - neg);
        },
        fixSidebar: function () {
            //Enable slimscroll
            if ($.GUI.options.sidebarSlimScroll) {
                if (typeof $.fn.slimScroll !== 'undefined') {
                    //Destroy if it exists
                    $(".sidebar").slimScroll({ destroy: true }).height("auto");
                    //Add slimscroll
                    $(".sidebar").slimScroll({
                        height: ($(window).height() - $(".main-header").height()) + "px",
                        color: "rgba(0,0,0,0.2)",
                        size: "3px"
                    });
                }
            }
        },
        fixControlSidebar: function () {
            //Enable slimscroll
            if ($.GUI.options.contraolSidebarScroll) {
                if (typeof $.fn.slimScroll !== 'undefined') {
                    //Destroy if it exists
                    $(".control-sidebar").slimScroll({ destroy: true }).height("auto");
                    //Add slimscroll
                    $(".control-sidebar").slimScroll({
                        height: ($(window).height() - $(".main-header").height()) + "px",
                        color: "rgba(0,0,0,0.2)",
                        size: "3px"
                    });
                }
            }
        }
    };
    /* PushMenu()
     * ==========
     * Adds the push menu functionality to the sidebar.
     *
     * @type Function
     * @usage: $.GUI.pushMenu("[data-toggle='offcanvas']")
     */
    $.GUI.pushMenu = {
        activate: function (toggleBtn) {
            //Get the screen sizes
            var screenSizes = $.GUI.options.screenSizes;
            //Enable sidebar toggle
            $(document).on('click', toggleBtn, function (e) {
                e.preventDefault();
                //Enable sidebar push menu
                if ($(window).width() > (screenSizes.sm - 1)) {
                    if ($("body").hasClass('sidebar-collapse')) {
                        $("body").removeClass('sidebar-collapse').trigger('expanded.pushMenu');
                    }
                    else {
                        $("body").addClass('sidebar-collapse').trigger('collapsed.pushMenu');
                    }
                }
                else {
                    if ($("body").hasClass('sidebar-open')) {
                        $("body").removeClass('sidebar-open').removeClass('sidebar-collapse').trigger('collapsed.pushMenu');
                    }
                    else {
                        $("body").addClass('sidebar-open').trigger('expanded.pushMenu');
                    }
                }
            });
            $(".content-wrapper").click(function () {
                //Enable hide menu when clicking on the content-wrapper on small screens
                if ($(window).width() <= (screenSizes.sm - 1) && $("body").hasClass("sidebar-open")) {
                    $("body").removeClass('sidebar-open');
                }
            });
            //Enable expand on hover for sidebar mini
            if ($.GUI.options.sidebarExpandOnHover ||
                ($('body').hasClass('fixed') &&
                    $('body').hasClass('sidebar-mini'))) {
                this.expandOnHover();
            }
        },
        expandOnHover: function () {
            var _this = this;
            var screenWidth = $.GUI.options.screenSizes.sm - 1;
            //Expand sidebar on hover
            $('.main-sidebar').hover(function () {
                if ($('body').hasClass('sidebar-mini') &&
                    $("body").hasClass('sidebar-collapse') &&
                    $(window).width() > screenWidth) {
                    _this.expand();
                }
            }, function () {
                if ($('body').hasClass('sidebar-mini') &&
                    $('body').hasClass('sidebar-expanded-on-hover') &&
                    $(window).width() > screenWidth) {
                    _this.collapse();
                }
            });
        },
        expand: function () {
            $("body").removeClass('sidebar-collapse').addClass('sidebar-expanded-on-hover');
        },
        collapse: function () {
            if ($('body').hasClass('sidebar-expanded-on-hover')) {
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
        var animationSpeed = $.GUI.options.animationSpeed;

        $(document).off('click', menu + ' li a')
            .on('click', menu + ' li a', function (e) {
            //Get the clicked link and the next element
            var $this = $(this);
            var checkElement = $this.next();

            //Check if the next element is a menu and is visible
            if ((checkElement.is('.treeview-menu')) && (checkElement.is(':visible')) && (!$('body').hasClass('sidebar-collapse'))) {
                //Close the menu
                checkElement.slideUp(animationSpeed, function () {
                    checkElement.removeClass('menu-open');
                });
                checkElement.parent("li").removeClass("active");
            }
            else if ((checkElement.is('.treeview-menu')) && (!checkElement.is(':visible'))) {
                //Get the parent menu
                var parent = $this.parents('ul').first();
                //Close all open menus within the parent
                var ul = parent.find('ul:visible').slideUp(animationSpeed);
                //Remove the menu-open class from the parent
                ul.removeClass('menu-open');
                //Get the parent li
                var parent_li = $this.parent("li");
                //Open the target menu and add the menu-open class
                checkElement.slideDown(animationSpeed, function () {
                    //Add the class active to the parent li
                    checkElement.addClass('menu-open');
                    parent.find('li.active').removeClass('active');
                    parent_li.addClass('active');
                });
            }
            //if this isn't a link, prevent the page from being redirected
            if (checkElement.is('.treeview-menu')) {
                e.preventDefault();
            }

            });

        // load the files and data
        $('.treeview-menu').on('click','a', function () {
            var $this = $(this);
            var modelSeleted = $this.is('[data-model]');
            var plotGroupSeleted = $this.is('[data-result]');
            var plotSelected = $this.is('[data-plot]');
            var active = $this.hasClass('active'); // true === active, false === deactive

            if (modelSeleted) {
                if ((!$('body').hasClass('sidebar-collapse'))) {
                    if (!active) {
                        $('#model').find('a.active').removeClass('active');
                        $this.addClass('active');
                    }
                    $('#model').find('ul:visible').slideUp(animationSpeed, function () {
                        $('#result').find('ul').slideDown(animationSpeed, function () {
                            $('#result ul').addClass('menu-open');
                            $('#model').removeClass('active');
                            $('#result').addClass('active');
                        })
                    }).removeClass('menu-open');
                } else {
                    if (!active) {
                        $('#model').find('a.active').removeClass('active');
                        $this.addClass('active');
                    }
                }
            };

            if (plotGroupSeleted) {
                if ((!$('body').hasClass('sidebar-collapse'))) {
                    if (!active) {
                        $('#result').find('a.active').removeClass('active');
                        $this.addClass('active');
                    }
                    $('#result').find('ul:visible').slideUp(animationSpeed, function () {
                        $('#plot').find('ul').slideDown(animationSpeed, function () {
                            $('#plot ul').addClass('menu-open');
                            $('#result').removeClass('active');
                            $('#plot').addClass('active');
                        })
                    }).removeClass('menu-open');
                } else {
                    $('#result').find('a.active').removeClass('active');
                    $this.addClass('active');
                }
            }

            if (plotSelected) {
                if (active) {
                    $('#plot .active').removeClass('active');
                } else {
                    $('#plot .active').removeClass('active');
                    $(this).addClass('active');
                }
            }
        });
        
    };
    /* ControlSidebar
     * ==============
     * Adds functionality to the right sidebar
     *
     * @type Object
     * @usage $.GUI.controlSidebar.activate(options)
     */
    $.GUI.controlSidebar = {
        //instantiate the object
        activate: function () {
            //Get the object
            let _this = this;
            //Update options
            let o = $.GUI.options.controlSidebarOptions;
            //Get the sidebar
            let sidebar = $(o.selector);
            //The toggle button
            let btn = $(o.toggleBtnSelector);
            //Listen to the click event
            btn.on('click', function (e) {
                e.preventDefault();
                //If the sidebar is not open
                if (!sidebar.hasClass('control-sidebar-open') &&
                    !$('body').hasClass('control-sidebar-open')) {
                    //Open the sidebar
                    _this.open(sidebar, o.slide);
                }
                else {
                    _this.close(sidebar, o.slide);
                }
            });
            //force the sidebar's height equal to the height of window
            $('.control-sidebar').outerHeight('100vh');
        },
        //Open the control sidebar
        open: function (sidebar, slide) {
            //Slide over content
            if (slide) {
                sidebar.addClass('control-sidebar-open');
            }
            else {
                //Push the content by adding the open class to the body instead
                //of the sidebar itself
                $('body').addClass('control-sidebar-open');
            }
        },
        //Close the control sidebar
        close: function (sidebar, slide) {
            if (slide) {
                sidebar.removeClass('control-sidebar-open');
            }
            else {
                $('body').removeClass('control-sidebar-open');
            }
        }
    };
}