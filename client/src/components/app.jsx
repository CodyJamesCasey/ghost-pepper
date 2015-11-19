import React from 'react';
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

import theme from '../theme';

// Load component styles
require('./app.scss');

@ThemeDecorator(ThemeManager.getMuiTheme(theme))
export default class App extends React.Component {
  render() {
    return (
      <div className="app">
        {this.props.children}
      </div>
    );
  }
}
