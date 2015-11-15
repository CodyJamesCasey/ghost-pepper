import React from 'react';

// Load component styles
require('./404.scss');

export default class NotFoundPage extends React.Component {
  render() {
    return (
      <div className="not-found-page">Not found page</div>
    );
  }
}
