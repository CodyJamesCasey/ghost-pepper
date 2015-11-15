import React from 'react';

import { Provider, connect } from 'react-redux';

// Load component styles
require('./app.scss');

// @connect(state => ({
//   sidebarVisible:   state.ui.sidebarVisible,
//   currentPageTitle: state.nav.pageTitle
// }))
export default class App extends React.Component {
  render() {
    return (
      <div className="app">
        {this.props.children}
      </div>
    );
  }
}
