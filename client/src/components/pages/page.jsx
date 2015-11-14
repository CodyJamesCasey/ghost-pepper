import React from 'react';

import { dispatch } from 'flux/store';
import { changePageTitle } from 'flux/nav/action-creators';

export default class Page extends React.Component {
  componentDidMount = () => {
    if (this.__title) {
      // Means that a title was defined for this page via the mixin
      dispatch(changePageTitle(this.__title));
    }
  }
}