import React from 'react';
import { Router, Route, IndexRoute } from 'react-router';

// Pages
import HomePage from 'components/pages/home/home';
import ModelsPage from 'components/pages/models/models';
import NotFoundPage from 'components/pages/404/404';
// History
import history from './history';
// Application
import App from 'components/app';

export default function() {
  return (
    <Router history={history}>
      <Route path="/" component={App}>
        <IndexRoute component={HomePage}/>
        <Route path="/models" component={ModelsPage}/>
        <Route path="*" component={NotFoundPage}/>
      </Route>
    </Router>
  );
}