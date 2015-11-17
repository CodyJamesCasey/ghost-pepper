import * as actions from './actions';

export function updateSocketStatus(live, error) {
  return {
    type:   actions.UPDATE_SOCKET_STATUS,
    live:   live,
    error:  error
  };
}

export function updateTunnelStatus(live, error) {
  return {
    type:   actions.UPDATE_TUNNEL_STATUS,
    live:   live,
    error:  error
  };
}

export function updateModelRotationVector(payload) {
  return {
    type:   actions.UPDATE_MODEL_ROTATION_VECTOR,
    x:      payload.x,
    y:      payload.y,
    z:      payload.z
  };
}

export function updateTargetResolution(payload) {
  return {
    type:   actions.UPDATE_TARGET_RESOLUTION,
    width:  payload.width,
    height: payload.height
  };
}

export function updateRenderModel(model) {
  return {
    type:   actions.UPDATE_RENDER_MODEL,
    model:  model
  };
}
