import React from 'react';
import {
  Switch,
  Route,
  //Link,
  //Redirect
} from "react-router-dom";


import ViewEditor from './views/editor'
import ViewMain from './views/main'
function App() {

  return (
    <div>
      <Switch>
        <Route path="/" exact component={ViewMain} />
        <Route path="/editor" component={ViewEditor} />
      </Switch>
    </div>
  );
}

export default App;
