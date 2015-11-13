var io = require('socket.io-client')

var socket = io.connect();

var c = document.getElementById("leCanvas");
var ctx = c.getContext("2d");

socket.on('img event', function(data) {
    console.log(data);
});