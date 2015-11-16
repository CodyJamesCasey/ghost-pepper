import io from 'socket.io-client';
import Peer from 'peerjs';

import { generate as newUUID } from './uuid';
import {
  bind as bindToLeap,
  unbind as unbindFromLeap
} from './leap';
import {
  paint as paintToScreen,
  bind as bindToScreenResize,
  unbind as unbindFromScreenResize,
  clear as clearScreen
} from './screen';

const EVENT_PROJECTOR_READY          = 'projector:ready';
const EVENT_ROTATION_VECTOR_CHANGED  = 'projector:vector-changed';
const EVENT_RESOLUTION_CHANGED       = 'projector:resolution-changed';
const EVENT_FRAME_RENDERED           = 'client:frame-rendered';
const EVENT_CLIENT_DISCONNECTED      = 'client:disconnected';

export function start() {
  // Connection to the server
  let socket      = io.connect();
  // The id of this projector
  let projectorId = newUUID();
  // The peer library reference
  let peer        = new Peer(projectorId, {
    host: window.location.hostname,
    path: '/api/peer',
    port: window.location.port
  });

  // Bind peer listeners
  peer.on('connection', tunnel => {
    tunnel.on('open', () => {
      // Bind the hook functions
      bindToScreenResize((width, height) => tunnel.send({
        type:     EVENT_RESOLUTION_CHANGED,
        payload:  { width, height }
      }));
      bindToLeap(theta => tunnel.send({
        type:     EVENT_ROTATION_VECTOR_CHANGED,
        payload:  theta
      }));
    });
    tunnel.on('data', (data) => {
      switch (data.type) {
      case EVENT_FRAME_RENDERED:
        paintToScreen(data.payload);
        break;
      default:
        console.warn(`Received unknown event type "${data.type}"`);
        break;
      }
    });
    tunnel.on('error', err => {
      console.error('Error via tunnel:', err);
    });
    tunnel.on('close', () => {
      unbindFromLeap();
      unbindFromScreenResize();
      clearScreen();
    });
  });

  // Bind socket listeners
  socket.on(EVENT_CLIENT_DISCONNECTED, () => {
    unbindFromLeap();
    unbindFromScreenResize();
    clearScreen();
  });

  // Signal that the projector is ready
  socket.emit(EVENT_PROJECTOR_READY, { projectorId: projectorId });
}
