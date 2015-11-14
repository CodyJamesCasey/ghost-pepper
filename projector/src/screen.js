import { EVENT_IMAGE_UPDATED, EVENT_SCREEN_SIZE_CHANGED } from './constants';

let img;
let canvas;

export function create(socket) {
  let width = window.innerWidth;
  let height = window.innerHeight;
  // Send over the current constraints
  socket.emit(EVENT_SCREEN_SIZE_CHANGED, { width, height });
  // Create the canvas first
  canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);
  // Create the canvas context next
  context = canvas.getContext('2d');
  // Create the image last
  img = new Image();
  img.onload = () => context.drawImage(img, 0, 0);
  // Start listening to incoming socket events
  socket.on(EVENT_IMAGE_UPDATED, imgDataUrl => paint(imgDataUrl));
}

function paint(dataUrl) {
  img.src(dataUrl);
}