import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';

// Pages
import MainPage from 'components/pages/main';
import AboutPage from 'components/pages/about';
import NotFoundPage from 'components/pages/404';
// History
import history from './history';
// Application
import App from 'components/app';

export default function() {
  return (
    <Router history={history}>
      <Route path="/" component={App}>
        <IndexRoute component={MainPage}/>
        <Route path="/about" component={AboutPage}/>
        <Route path="*" component={NotFoundPage}/>
      </Route>
    </Router>
  );
}
