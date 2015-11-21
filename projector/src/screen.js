const WINDOW_RESIZE_NOTIFICATION_THRESHOLD = 250;

let img;
let canvas;
let context;

let eventHandler;
let lastUpdated = 0;

window.onresize = () => {
  if (eventHandler && ((new Date()).getTime() - lastUpdated > WINDOW_RESIZE_NOTIFICATION_THRESHOLD)) {
    lastUpdated = (new Date()).getTime();
    eventHandler(window.innerWidth, window.innerHeight);
  }
};

export function create(socket) {
  // Create the canvas first
  canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  // Create the canvas context next
  context = canvas.getContext('2d');
  // Create the image last
  img = new Image();
}

export function paint(dataUrl) {
  img.src = dataUrl;
  console.log('paint');
  context.drawImage(img, 0, 0);
}

export function clear() {
  // TODO (Sandile): clear the screen
}

export function bind(newEventHandler) {
  eventHandler = newEventHandler;
  // Trigger initial event
  eventHandler(window.innerWidth, window.innerHeight);
  lastUpdated = (new Date()).getTime();
}

export function unbind() {
  eventHandler = null;
}
