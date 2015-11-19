import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from 'flux/store';
import getRoutes from 'routes';
import { start as startEmitters } from 'flux/emitters';

// Needed for onTouchTap
// Can go away when react 1.0 release
// Check this repo:
// https://github.com/zilverline/react-tap-event-pluginx
require('react-tap-event-plugin')();

// Adds roboto CSS to the <head/> of the page
require('roboto-fontface/css/roboto-fontface.css');

// Adds base CSS to the <head/> of the page
require('./base.scss');

// Adds icon font to the page
require('./icons.scss');

// Start the flux emitters
startEmitters(store.dispatch);

// Create the app element
let appEl = document.createElement('div');
appEl.style.width = '100%';
appEl.style.height = '100%';
document.body.appendChild(appEl);

// Render the application
ReactDOM.render(
  (<Provider store={store}>{getRoutes()}</Provider>),
  appEl
);
