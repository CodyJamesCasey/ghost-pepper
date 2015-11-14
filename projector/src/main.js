import { connect as createSocketConnection } from 'socket.io-client';

import { start as listenToLeap } from './leap';
import { create as createScreen } from './screen';

// Create the socket connection first
let socket = createSocketConnection();
// Start listening to leap motion events
listenToLeap(socket);
// Create the screen listener
createScreen(socket);