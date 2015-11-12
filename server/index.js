var express   = require('express');
var http      = require('http');
var io        = require('socket.io');
var path      = require('path');

var app     = express();
var server  = http.Server(app);
var socket  = io(server);

app.use('/static', express.static(path.join(__dirname, '..', 'dist')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'dist', 'client.html'));
});

app.get('/projector', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'dist', 'projector.html'));
});

socket.on('connection', function(conn){
  console.log('a user connected');

  conn.on('paint event', function(data) {
    console.log('paint! ', data);
  });
});


server.listen(3000, function() {
  console.log('listening on *:3000');
});