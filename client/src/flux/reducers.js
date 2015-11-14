import { combineReducers } from 'redux';

const reducers = combineReducers({
  nav:      require('./nav/reducer'),
  ui:       require('./ui/reducer')
});

export default reducers;