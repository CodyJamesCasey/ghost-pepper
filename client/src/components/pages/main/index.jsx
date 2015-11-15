import React from 'react';
import IconButton from 'material-ui/lib/icon-button';

// Load component styles
require('./main.scss');

export default class MainPage extends React.Component {
  render() {
    return (
      <div className="main-page">
        <div className="main-page__logo" />
        <div className="main-page__about-button">
          <IconButton
            iconClassName="material-icons"
            tooltipPosition="bottom-left"
            tooltip="About Ghost Pepper"
            iconStyle={{ color: '#ffffff', fontSize: '25px' }}>
            info
          </IconButton>
        </div>
        <div className="main-page__content">
        </div>
        <div className="main-page__footer">
          <div className="main-page__footer-content">
            Written with <i className="material-icons">favorite</i> by Sandile, Ian, Ryan &amp; Cody.
          </div>
        </div>
      </div>
    );
  }
}
