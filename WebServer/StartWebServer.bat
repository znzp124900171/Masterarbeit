set port=12345
set url=http://localhost:%port%
"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" %url%
%~dp0"\NodeJSWebserver\App\NodeJS\node.exe" "%~dp0ServerScript\app.js" %port% "%~dp0ServerScript\public" "%~dp0visual"
pause