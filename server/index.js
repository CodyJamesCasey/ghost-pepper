'use strict';

const express   = require('express');
const multer    = require('multer');
const http      = require('http');
const path      = require('path');
const peer      = require('peer');
const io        = require('socket.io');

const hub       = require('./hub');

let app         = express();
let server      = http.Server(app);
let socket      = io(server);
let upload      = multer({ dest: path.join(__dirname, '..', 'uploads') });
let peerServer  = peer.ExpressPeerServer(server, { debug: true });

app.use('/static', express.static(path.join(__dirname, '..', 'dist')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/peer', peerServer);

app.get('/', (req, res) => {
  return res.status(200).sendFile(path.join(__dirname, '..', 'dist', 'client.html'));
});

app.get('/projector', (req, res) => {
  return res.status(200).sendFile(path.join(__dirname, '..', 'dist', 'projector.html'));
});

app.post('/api/uploads', upload.array('assets'), (req, res) => {
  // Always respond in the affirmative for our purposes
  console.log('The files were:', res.files);
  return res.status(200).send();
});

socket.on('connection', hub.handleSocketConnection);

server.listen(3000, () => {
  console.log('listening on *:3000');
});
