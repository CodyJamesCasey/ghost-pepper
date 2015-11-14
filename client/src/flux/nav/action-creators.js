import {
  CHANGE_ROUTE,
  CHANGE_PAGE_TITLE,
  UPDATE_CURRENT_ROUTE
} from './actions';
import history from '../../history';

export function changeRoute(route) {
  // This isn't a real action, it just calls history
  history.replaceState(null, route);
  // No-op
  return {};
};

export function changePageTitle(pageTitle) {
  return { type: CHANGE_PAGE_TITLE, pageTitle: pageTitle };
};

export function updateCurrentRoute(route) {
  return { type: UPDATE_CURRENT_ROUTE, route: route };
};