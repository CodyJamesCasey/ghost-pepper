import io from 'socket.io-client';
import Peer from 'peerjs';

import { generate as newUUID } from 'util/uuid';
import {
  updateSocketStatus,
  updateTunnelStatus,
  updateModelRotationVector,
  updateTargetResolution
} from 'flux/action-creators';

const EVENT_CLIENT_READY             = 'client:ready';
const EVENT_PROJECTOR_READY          = 'projector:ready';
const EVENT_ROTATION_VECTOR_CHANGED  = 'projector:vector-changed';
const EVENT_RESOLUTION_CHANGED       = 'projector:resolution-changed';
const EVENT_FRAME_RENDERED           = 'client:frame-rendered';
const EVENT_PROJECTOR_DISCONNECTED   = 'projector:disconnected';

// The function that is only not-null when the tunnel is live; Sends the latest
// frame to the projector.
let emitFrameRendered = null;

/**
 * Starts the socket and tunnel connections respectively. Updates flux state
 * accordingly as the state machine progresses.
 *
 * @param  {Function} dispatch the redux dispatch function
 */
export function start(dispatch) {
  // Connection to the server
  let socket    = io.connect();
  // Connection to the projector
  let tunnel    = null;
  // The id of this client
  let clientId  = newUUID();
  // The peer library reference
  let peer      = new Peer(clientId, {
    host: window.location.hostname,
    path: '/api/peer',
    port: window.location.port
  });

  // Wait until we have a connection
  socket.on('connect', () => {
    // Update the socket connection status
    dispatch(updateSocketStatus(true));
    // Get in the queue for a tunnel
    socket.emit(EVENT_CLIENT_READY, { clientId: clientId });
    // Subscribe to when the tunnel is ready
    socket.on(EVENT_PROJECTOR_READY, payload => {
      // Get the tunnel id
      let { projectorId } = payload;
      // Connect to the tunnel
      tunnel = peer.connect(projectorId);
      // Subscribe to relevant events
      tunnel.on('open', () => {
        // Update the tunnel connection status
        dispatch(updateTunnelStatus(true));
        // Set emitFrameRendered
        emitFrameRendered = (frame) => {
          tunnel.send({
            type:    EVENT_FRAME_RENDERED,
            payload: frame
          });
        };
      });
      tunnel.on('data', data => {
        // Get the type and payload from data
        let { type, payload } = data;
        // Operate differently depending on `type`
        switch (type) {
        case EVENT_ROTATION_VECTOR_CHANGED:
          dispatch(updateModelRotationVector(payload));
          break;
        case EVENT_RESOLUTION_CHANGED:
          dispatch(updateTargetResolution(payload));
          break;
        default:
          // TODO (Sandile): more comprehensive reaction to unknown message
          console.warn('Unknown message from projector received:', data);
          break;
        }
      });
      tunnel.on('close', () => {
        // Update the tunnel connection status
        dispatch(updateTunnelStatus(false));
        // Clear emitFrameRendered
        emitFrameRendered = null;
      });
      tunnel.on('error', err => {
        // Update the tunnel connection status
        dispatch(updateTunnelStatus(false, err));
        // Clear emitFrameRendered
        emitFrameRendered = null;
      });
      socket.on(EVENT_PROJECTOR_DISCONNECTED, () => {
        // Update the tunnel connection status
        dispatch(updateTunnelStatus(false, 'The projector disconnected'));
        // Clear emitFrameRendered
        emitFrameRendered = null;
      });
    });
  });
}

/**
 * Sends a frame of image data to the projector to be shown on the screen. This
 * function only works if the tunnel is currently live.
 *
 * @param  {String} frame serialized frame data in the form of a data url
 */
export function projectFrame(frame) {
  if (emitFrameRendered) {
    // If emitFrameRendered is truthy, it is a function, so proceed
    emitFrameRendered(frame);
  }
}
