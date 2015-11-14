import React from 'react';

import { Provider, connect } from 'react-redux';

import Header from 'components/header/header';
import Sidebar from 'components/sidebar/sidebar';

// Load component styles
require('./app.scss');

@connect(state => ({
  sidebarVisible:   state.ui.sidebarVisible,
  currentPageTitle: state.nav.pageTitle
}))
export default class App extends React.Component {
  render() {
    return (
      <div className="app">
        <Sidebar visible={this.props.sidebarVisible} />
        <div className="app__top-section">
          <Header currentPageTitle={this.props.currentPageTitle} />
        </div>
        <div className="app__middle-section">
          {this.props.children}
        </div>
      </div>
    );
  }
}