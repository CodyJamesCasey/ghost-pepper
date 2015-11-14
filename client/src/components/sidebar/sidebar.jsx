import React from 'react';
import LeftNav from 'material-ui/lib/left-nav';
import MenuItem from 'material-ui/lib/menu/menu-item';

import { dispatch } from 'flux/store';
import { hideSidebar } from 'flux/ui/action-creators';
import { changeRoute } from 'flux/nav/action-creators';

// Load component styles
require('./sidebar.scss');

export default class Sidebar extends React.Component {
  static propTypes = {
    visible: React.PropTypes.bool.isRequired
  }

  static menuItems = [
    { route: '/', text: 'Home' },
    { route: 'models', text: 'Models' }
  ]

  state = {
    navOpen: false
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.visible !== this.props.visible) {
      if (nextProps.visible) this.openLeftNav();
      else this.closeLeftNav();
    }
  }

  openLeftNav = () => {
    this.refs.leftNav.open();
  }

  closeLeftNav = () => {
    this.refs.leftNav.close();
  }

  handleLeftNavOpened = () => {
    this.setState({ navOpen: true });
  }

  handleLeftNavClosed = () => {
    this.setState({ navOpen: false });
    dispatch(hideSidebar());
  }

  handleMenuItemClicked = (event, selectedIndex, menuItem) => {
    if (menuItem) {
      changeRoute(menuItem.route);
    }
  }

  render() {
    return (
      <LeftNav
        ref="leftNav"
        docked={false}
        onChange={this.handleMenuItemClicked}
        onNavOpen={this.handleLeftNavOpened}
        onNavClose={this.handleLeftNavClosed}
        menuItems={Sidebar.menuItems} />
    );
  }
}