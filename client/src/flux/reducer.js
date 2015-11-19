import assign from 'object-assign';

import * as actions from './actions';

const INITIAL_STATE = {
  socketLive:               false,
  socketError:              null,
  tunnelLive:               false,
  tunnelError:              null,
  currentModel:             null,
  currentModelBoundingBox:  null,
  rotationVector:           {
    x: 0,
    y: 0,
    z: 0
  },
  targetResolution:         {
    width:  900,
    height: 600
  }
};

export default function reducer(state = INITIAL_STATE, action) {
  // Create variables
  let clonedState;
  // Handle every different kind of action
  switch (action.type) {
  case actions.UPDATE_SOCKET_STATUS:
    return assign({}, state, {
      socketLive:   action.live,
      socketError:  action.error
    });
  case actions.UPDATE_TUNNEL_STATUS:
    return assign({}, state, {
      tunnelLive:   action.live,
      tunnelError:  action.error
    });
  case actions.UPDATE_MODEL_ROTATION_VECTOR:
    return assign({}, state, {
      rotationVector: {
        x: action.x,
        y: action.y,
        z: action.z
      }
    });
  case actions.UPDATE_TARGET_RESOLUTION:
    return assign({}, state, {
      targetResolution: {
        width: action.width,
        height: action.height
      }
    });
  case actions.UPDATE_3D_MODEL:
    let clonedState = assign({}, state);
    // Update the model
    clonedState.currentModel = action.model;
    clonedState.currentModelBoundingBox = action.boundingBox;
    // Update state with new model
    return clonedState;
  default:
    return state;
  }
};
