import React from 'react';
import { connect } from 'react-redux';
import IconButton from 'material-ui/lib/icon-button';
import RefreshIndicator from 'material-ui/lib/refresh-indicator';

// Load component styles
require('./main.scss');

@connect(state => ({
  socketLive: state.socketLive,
  tunnelLive: state.tunnelLive
}))
export default class MainPage extends React.Component {
  renderLoading = () => {
    let classes = 'main-page__loading';
    if (!this.props.socketLive || !this.props.tunnelLive) {
      classes += ' main-page__loading--visible';
    }

    let loadingText = '';
    if (!this.props.socketLive) {
      loadingText = 'Connecting to Server';
    } else if (!this.props.tunnelLive) {
      loadingText = 'Waiting for the Projector';
    }

    return (
      <div className={classes}>
        <RefreshIndicator size={40} left={130} top={0} status="loading" />
        <div className="main-page__loading-summary">{loadingText}</div>
      </div>
    );
  }

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
          {this.renderLoading()}
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
