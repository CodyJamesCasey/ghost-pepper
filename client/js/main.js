var io = require('socket.io-client')

var socket = io.connect();

var c = document.getElementById("leCanvas");
var circleRadius = 20;
var i = circleRadius;
var increasing = true;

function canvasShtuff() {
    var ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.arc(i,50,40,0,2*Math.PI);
    ctx.fillStyle = 'green';
    ctx.fill();
    ctx.stroke();
    if (increasing) {
        i++;
        if (i > c.width - circleRadius) {
            increasing = false;
        }
    } else {
        i--;
        if (i < circleRadius) {
            increasing = true;
        }
    }
    var dataUrl = c.toDataURL("image/jpeg", 0.5);
    socket.emit('paint event', { data: dataUrl });
    requestAnimationFrame(canvasShtuff);
}
requestAnimationFrame(canvasShtuff);