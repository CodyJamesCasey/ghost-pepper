var io = require('socket.io-client')

var socket = io.connect();

var c = document.getElementById("leCanvas");
var ctx = c.getContext("2d");

var imageObj = new Image();
imageObj.onload = function() {
  ctx.drawImage(this, 0, 0);
};

socket.on('img event', function(data) {
  imageObj.src = data;
});

var motion = function(leapData) {
  var data = leapData;
  socket.emit('leap event', data);
};

var cats = {};
var Cat = function() {
var cat = this;
var img = document.createElement('img');
img.src = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/109794/cat_2.png';
img.style.position = 'absolute';
img.onload = function () {
  cat.setTransform(
    [
      window.innerWidth/2,
      window.innerHeight/2
    ],
    0 );
  document.body.appendChild(img);
}

cat.setTransform = function(position, rotation) {
    img.style.left = position[0] - img.width  / 2 + 'px';
    img.style.top  = position[1] - img.height / 2 + 'px';

    img.style.transform = 'rotate(' + -rotation + 'rad)';

    img.style.webkitTransform = img.style.MozTransform = img.style.msTransform =
    img.style.OTransform = img.style.transform;
  };
};

Leap.loop(function(frame) {
frame.hands.forEach(function(hand, index) {
  var cat = ( cats[index] || (cats[index] = new Cat()) );
  cat.setTransform(hand.screenPosition(), hand.roll());
  motion(hand.screenPosition(), hand.roll());
});
}).use('screenPosition', {scale: 0.25});

cats[0] = new Cat();