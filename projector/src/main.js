import { start as createTunnel } from './tunnel';
import { create as createScreen } from './screen';

// Put the styles in the DOM
require('./projector.scss');

createTunnel();
createScreen();
