
// print process.argv
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

var express = require('express');


// JavaScript source code
var app = express();

// all environments
app.set('port', parseInt(process.argv[2],10));
app.use('/', express.static(process.argv[3]));					//WebFrameWork
app.use('/visual', express.static(process.argv[4]));			//3D Plots

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
	console.log('public: ' + process.argv[3]);
	console.log('Models: ' + process.argv[4]);
});
//# sourceMappingURL=app.js.map
