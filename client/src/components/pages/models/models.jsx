import React from 'react';

import title from 'mixins/title';
import Page from 'components/pages/page';

// Load component styles
require('./models.scss');

@title('Models')
export default class ModelsPage extends Page {
  render() {
    return (
      <div className="model-page">
        <div className="model-page__content">
          All of our models go here.
        </div>
      </div>
    );
  }
}