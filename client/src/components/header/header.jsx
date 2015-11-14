import React from 'react';
import FontIcon from 'material-ui/lib/font-icon';
import IconButton from 'material-ui/lib/icon-button';

import { dispatch } from 'flux/store';
import { showSidebar } from 'flux/ui/action-creators';

// Load component styles
require('./header.scss');

export default class Header extends React.Component {
  static propTypes = {
    currentPageTitle: React.PropTypes.string.isRequired
  }

  props = {
    currentPageTitle: ''
  }

  onMenuClicked = () => {
    dispatch(showSidebar());
  }

  render() {
    return (
      <div className="header">
        <div className="header__left">
          <IconButton
            style={{ verticalAlign: 'middle' }}
            onClick={this.onMenuClicked}>
            <FontIcon
              className="material-icons"
              color={'rgba(0,0,0,0.5)'}>
              menu
            </FontIcon>
          </IconButton>
          <div className="header__title">
            Ghost&nbsp;Pepper&nbsp;
            <i className="material-icons header__title-separator">&#xE037;</i>
            &nbsp;
            <span className="header__subtitle">
              {this.props.currentPageTitle}
            </span>
          </div>
        </div>
      </div>
    );
  }
}