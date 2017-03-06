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