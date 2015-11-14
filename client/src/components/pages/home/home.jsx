import React from 'react';

import title from 'mixins/title';
import Page from 'components/pages/page';

// Load component styles
require('./home.scss');

@title('Home')
export default class HomePage extends Page {
  render() {
    return (
      <div className="home-page">
        <div className="home-page__content">
          This is a home page i guess.
        </div>
      </div>
    );
  }
}