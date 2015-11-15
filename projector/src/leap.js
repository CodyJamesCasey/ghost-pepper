import Leap from 'leapjs';

import { EVENT_LEAP_DATA_UPDATED } from './constants';

export function start(socket) {
  // Indicates the current rotation
  let theta = { x: 0, y: 0, z: 0 };
  let newX, newY, newZ;
  let thetaChanged;

  Leap.loop(frame => {
    // Only care about the first hand
    let hand = frame.hands.length > 0 ? frame.hands[0] : null;
    if (hand) {
      // Update the theta object
      newX = hand.pitch();
      newY = hand.yaw();
      newZ = hand.roll();
      // Check what has changed
      thetaChanged = false;
      if (theta.x !== newX) {
        theta.x = newX;
        if (!thetaChanged) thetaChanged = true;
      }
      if (theta.y !== newY) {
        theta.y = newY;
        if (!thetaChanged) thetaChanged = true;
      }
      if (theta.z !== newZ) {
        theta.z = newZ;
        if (!thetaChanged) thetaChanged = true;
      }
      // Send socket update if stuff changed
      if (thetaChanged) socket.emit(EVENT_LEAP_DATA_UPDATED, theta);
    }
  });
}