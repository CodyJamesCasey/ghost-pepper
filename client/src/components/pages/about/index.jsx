import React from 'react';

// Load component styles
require('./about.scss');

export default class AboutPage extends React.Component {
  render() {
    return (
      <div className="about-page">
        <div className="about-page__content">
          All of our models go here.
        </div>
      </div>
    );
  }
}
