var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.use('/static', express.static(path.join(__dirname, '..', 'dist')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/ghost-pepper', function (req, res) {
  res.sendFile(path.join(__dirname, '..', 'dist', 'ghost-pepper.html'));
});

io.on('connection', function(socket){
  console.log('a user connected');

  socket.on('paint event', function(data) {
    io.emit('img event', data);
  });

  socket.on('leap event', function(data) {
    io.emit('gesture event', data);
  });
});


http.listen(3000, function(){
    console.log('listening on *:3000');
});