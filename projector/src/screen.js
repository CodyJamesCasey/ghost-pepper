const WINDOW_RESIZE_NOTIFICATION_THRESHOLD = 250;

let img;
let canvas;
let context;
let frameAnimationFrameRef;

let windowWidth = 0;
let windowHeight = 0;
let viewportWidth = 0;
let viewportHeight = 0;
let viewportXOffset = 0;
let viewportYOffset = 0;

let eventHandler;
let lastUpdated = 0;

function onWindowResize() {
  // Record adjusted window size
  adjustWindowDimensions();
  // Keep the canvas the same size as the window
  resizeCanvas();
  // Trigger the event handler
  if (eventHandler && ((new Date()).getTime() - lastUpdated > WINDOW_RESIZE_NOTIFICATION_THRESHOLD)) {
    lastUpdated = (new Date()).getTime();
    eventHandler(window.innerWidth, window.innerHeight);
  }
};

function adjustWindowDimensions() {
  windowWidth = document.body.clientWidth;
  windowHeight = document.body.clientHeight;
  if (windowHeight < windowWidth) {
    viewportWidth = windowHeight;
    viewportHeight = windowHeight;
    viewportXOffset = (windowWidth - windowHeight) / 2;
    viewportYOffset = 0;
  } else {
    viewportWidth = windowWidth;
    viewportHeight = windowWidth;
    viewportXOffset = 0;
    viewportYOffset = (windowHeight - windowWidth) / 2;
  }
}

function resizeCanvas() {
  canvas.width = windowWidth;
  canvas.height = windowHeight;
  context.clearRect(0, 0, windowWidth, windowHeight);
}

function drawFrame() {
  try {
    context.drawImage(
      img,
      viewportXOffset,
      viewportYOffset,
      viewportWidth,
      viewportHeight
    );
  } catch(err) {
    console.error('The image is broken. Could not paint.');
  }
  frameAnimationFrameRef = requestAnimationFrame(drawFrame);
}

export function create(socket) {
  // Create the canvas first
  canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  // Create the canvas context next
  context = canvas.getContext('2d');
  // Init. window & canvas dimensions
  adjustWindowDimensions();
  resizeCanvas();
  // Create the frame painting image last
  img = new Image();
  // Subscribe to window resize
  window.onresize = onWindowResize();
  // Start painting frames
  drawFrame();
}

export function paint(dataUrl) {
  img.src = dataUrl;
  console.log('paint');
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
