import assign from 'object-assign';

import { SHOW_SIDEBAR, HIDE_SIDEBAR } from './actions';

const INITIAL_STATE = {
  sidebarVisible: false
};

export default function UIReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case SHOW_SIDEBAR:
    return assign({}, state, { sidebarVisible: true });
  case HIDE_SIDEBAR:
    return assign({}, state, { sidebarVisible: false });
  default:
    return state;
  }
};