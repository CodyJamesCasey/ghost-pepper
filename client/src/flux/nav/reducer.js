import assign from 'object-assign';

import history from '../../history';
import {
  CHANGE_PAGE_TITLE,
  UPDATE_CURRENT_ROUTE
} from './actions';

const INITIAL_STATE = {
  pageTitle:    '',
  currentRoute: (() => {
    // Get the current hash as the default
    let hash = location.hash || '';
    let queryIndex = hash.indexOf('?');
    if (queryIndex !== 0) {
      hash = hash.substr(0, queryIndex);
    }
    if (hash.charAt(0) === '#') {
      hash = hash.slice(1);
    }
    return hash;
  })()
};

export default function NavReducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case UPDATE_CURRENT_ROUTE:
    // Like "CHANGE_ROUTE", but this is only invoked from outside of flux
    return assign({}, state, { currentRoute: action.route });
  case CHANGE_PAGE_TITLE:
    return assign({}, state, { pageTitle: action.pageTitle });
  default:
    return state;
  }
};