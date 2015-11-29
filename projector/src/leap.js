import Leap from 'leapjs';

// Indicates the current rotation
let theta = { x: 0, y: 0, z: 0 };
let newX, newY, newZ;
let thetaChanged;

// Event handler
let eventHandler;

// // TODO (Sandile): uncomment the leap motion logic
// Leap.loop(frame => {
//   // Only care about the first hand
//   let hand = frame.hands.length > 0 ? frame.hands[0] : null;
//   if (hand) {
//     // Update the theta object
//     newX = hand.pitch();
//     newY = hand.yaw();
//     newZ = hand.roll();
//     // Check what has changed
//     thetaChanged = false;
//     if (theta.x !== newX) {
//       theta.x = newX;
//       if (!thetaChanged) thetaChanged = true;
//     }
//     if (theta.y !== newY) {
//       theta.y = newY;
//       if (!thetaChanged) thetaChanged = true;
//     }
//     if (theta.z !== newZ) {
//       theta.z = newZ;
//       if (!thetaChanged) thetaChanged = true;
//     }
//     // Send socket update if stuff changed
//     if (thetaChanged && eventHandler) {
//       eventHandler(theta);
//     }
//   }
// });

// TODO (Sandile): remove the false rotation logic
setInterval(() => {
  theta.y += 0.05;
  if (eventHandler) eventHandler(theta);
}, 50);

export function bind(newEventHandler) {
  eventHandler = newEventHandler;
}

export function unbind() {
  eventHandler = null;
}
