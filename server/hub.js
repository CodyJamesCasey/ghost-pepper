'use strict';

const SOCKET_DISCONNECTED           = 'disconnect';
const EVENT_CLIENT_READY            = 'client:ready';
const EVENT_PROJECTOR_READY         = 'projector:ready';
const EVENT_CLIENT_DISCONNECTED     = 'client:disconnected';
const EVENT_PROJECTOR_DISCONNECTED  = 'projector:disconnected';

const clientMap           = new Map();
const clientQueue         = [];
let   currentProjectorId  = null;
let   currentProjector    = null;
let   currentClientId     = null;

function onClientReady(conn, payload) {
  // Grab the client id
  let clientId = payload.clientId;
  console.log(`Client with id "${clientId}" is ready.`);
  // Put this thing in the client map
  clientMap.set(clientId, conn);
  // Attach the client id to this connection
  conn.__clientId = clientId;
  // Check if we have a projector at all
  if (currentProjectorId) {
    // Check if we have a current client yet
    if (!currentClientId) {
      // The projector is ready for this client
      currentClientId = clientId;
      // Send EVENT_PROJECTOR_READY back the client
      conn.emit(EVENT_PROJECTOR_READY, {
        projectorId: currentProjectorId
      });
      console.log(`Client with id "${clientId}" was made the current client.`);
    } else {
      clientQueue.push(clientId);
      console.log(`Client with id "${clientId}" was placed in the client queue since the projector is busy.`);
    }
  } else {
    clientQueue.push(clientId);
    console.log(`Client with id "${clientId}" was placed in the client queue since no projector exists yet.`);
  }
}

function onClientDisconnect(conn, clientId) {
  let clientQueueIndex;
  // Remove this client from the map
  clientMap.delete(clientId);
  console.log(`Client with id "${clientId}" disconnected.`);
  // Check if its the current client
  if (currentClientId === clientId) {
    currentProjector.emit(EVENT_CLIENT_DISCONNECTED, {});
    // Clear the current client id
    currentClientId = null;
    // Check if there are any clients left in the queue
    if (clientQueue.length > 0) {
      let nextClientId = clientQueue.shift();
      let nextClient = clientMap.get(nextClientId);
      // Update the currentClientId
      currentClientId = nextClientId;
      // Notify the client in question
      nextClient.emit(EVENT_PROJECTOR_READY, {
        projectorId: currentProjectorId
      });
      console.log(`Client with id "${nextClientId}" was made the current client.`);
    }
  } else if ((clientQueueIndex = clientQueue.indexOf(clientId)) !== -1) {
    // Remove this client from the queue
    clientQueue.splice(clientQueueIndex, 1);
    console.log(`Client with id "${clientId}" was removed from the client queue.`);
  }
}

function onProjectorReady(conn, payload) {
  if (!currentProjectorId) {
    // Grab the projector id
    let projectorId = payload.projectorId;
    console.log(`Projector with id "${projectorId}" is ready.`);
    // Set the projector variables
    currentProjectorId = projectorId;
    currentProjector = conn;
    // Attach the projector id to this connection
    conn.__projectorId = projectorId;
    // Check if there are any clients waiting
    if (clientQueue.length > 0) {
      let nextClientId = clientQueue.shift();
      let nextClient = clientMap.get(nextClientId);
      // Update the currentClientId
      currentClientId = nextClientId;
      // Notify the client in question
      nextClient.emit(EVENT_PROJECTOR_READY, {
        projectorId: currentProjectorId
      });
      console.log(`Client with id "${nextClientId}" was made the current client.`);
    }
  }
}

function onProjectorDisconnected(conn, projectorId) {
  // Only continue if this projector is our projector
  if (projectorId === currentProjectorId) {
    // Clear the current projector information
    currentProjectorId = null;
    currentProjector = null;
    console.log(`Projector with id "${projectorId}" disconnected.`);
    // Notify the current client if it exists
    if (currentClientId) {
      // Notify the client
      let currentClient = clientMap.get(currentClientId);
      currentClient.emit(EVENT_PROJECTOR_DISCONNECTED, {});
      // Now, put it at the front of the queue
      clientQueue.unshift(currentClientId);
      console.log(`Client with id "${currentClientId}" was put at the beginning of the client queue.`);
      // Clear the current client information
      currentClientId = null;
    }
  }
}

function onSocketDisconnected(conn) {
  // Get the appropriate id from the connection
  let projectorId = conn.__projectorId;
  let clientId = conn.__clientId;
  // Only continue if the id is bound properly
  if (projectorId) onProjectorDisconnected(conn, projectorId);
  else if (clientId) onClientDisconnect(conn, clientId);
}

function handleSocketConnection(conn) {
  conn.on(EVENT_CLIENT_READY, onClientReady.bind(null, conn));
  conn.on(EVENT_PROJECTOR_READY, onProjectorReady.bind(null, conn));
  conn.on(SOCKET_DISCONNECTED, onSocketDisconnected.bind(null, conn));
}

module.exports = {
  handleSocketConnection: handleSocketConnection
};
