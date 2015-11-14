import history from '../../history';
import { dispatch } from '../store';
import { updateCurrentRoute } from './action-creators';

export function start() {
  history.listen(location => dispatch(updateCurrentRoute(location.pathname)));
};