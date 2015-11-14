import React from 'react';

import title from 'mixins/title';
import Page from 'components/pages/page';

// Load component styles
require('./404.scss');

@title('Page Not Found')
export default class NotFoundPage extends Page {
  render() {
    return (
      <div className="not-found-page">Not found page</div>
    );
  }
}