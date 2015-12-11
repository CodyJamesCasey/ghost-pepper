mocha.setup('bdd');
var superagent = require('superagent');
var chai = require("chai");
chai.config.includeStack = true;
var expect = chai.expect;
var Peer = require("peerjs");

var port = 3000;

var io = require('socket.io-client');
var socketURL = 'http://0.0.0.0:' + port;
var options ={
  transports: ['websocket'],
  'force new connection': true
};

var UUID_REGEX = /[xy]/g;
var UUID_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

var generate = function() {
  return UUID_TEMPLATE.replace(UUID_REGEX, c => {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

var EVENT_PROJECTOR_READY          = 'projector:ready';
var EVENT_ROTATION_VECTOR_CHANGED  = 'projector:vector-changed';
var EVENT_RESOLUTION_CHANGED       = 'projector:resolution-changed';
var EVENT_PROJECTOR_DISCONNECTED   = 'projector:disconnected';
var EVENT_FRAME_RENDERED           = 'client:frame-rendered';
var EVENT_CLIENT_DISCONNECTED      = 'client:disconnected';
var EVENT_CLIENT_READY             = 'client:ready';

describe('clientpage', function(){
  it('should respond to GET',function(done){
    superagent
      .get('http://localhost:' + port)
      .end(function(err, res){
        expect(res.status).to.equal(200);
        done();
    })
  });
});

describe('socketconnect', function(){
  it('should connect to server',function(done){
    var socket = io.connect(socketURL, options);
    socket.on('connect', function() {
      expect(true);
      done();
    });
  });
});

describe('socketconnect', function(){
  it('should know that projector is ready',function(done){
    var projector = io.connect(socketURL, options);
    projector.on('connect', function() {
      var projectorId  = generate();
      projector.emit(EVENT_PROJECTOR_READY, {projectorId: projectorId});
    });

    var client = io.connect(socketURL, options);
    client.on('connect', function() {
      var clientId  = generate();
      client.emit(EVENT_CLIENT_READY, { clientId: clientId });
      client.on(EVENT_PROJECTOR_READY, function() {
        expect(true);
        done();
      });
    });
  });
});

describe('uploadsroute', function(){
  it('should respond to POST',function(done){
    superagent
      .post('http://localhost:' + port + '/api/uploads')
      .end(function(err, res){
        expect(res.status).to.equal(200);
        done();
    })
  });
});

describe('projectorpage', function(){
  it('should respond to GET',function(done){
    superagent
      .get('http://localhost:' + port + '/projector')
      .end(function(err, res){
        expect(res.status).to.equal(200);
        done();
    })
  });
});
/*
describe('projectorWebRTC', function() {
  it('should respond to connection',function(done) {
    var projectorId  = generate();
    var peer        = new Peer(projectorId, {
      host: 'localhost',
      path: '/api/peer',
      port: 3000
    });
    peer.on('connection', tunnel => {
      tunnel.on('open', () => {
        expect(true);
        done();
      });
    });

    var client = io.connect(socketURL, options);
    client.on('connect', function() {
      var clientId  = generate();
      client.emit(EVENT_CLIENT_READY, { clientId: clientId });
      client.on(EVENT_PROJECTOR_READY, function() {
        peer.connect(projectorId);
      });
    });
    var projector = io.connect(socketURL, options);
    projector.emit(EVENT_PROJECTOR_READY, { projectorId: projectorId });
  });
});
*/
mocha.run();
