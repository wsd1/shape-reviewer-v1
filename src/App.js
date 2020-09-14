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
  console.log(process.env.PUBLIC_URL);
  
  return (
    <div>
      <Switch>
        <Route path={process.env.PUBLIC_URL + "/"} exact component={ViewMain} />
        <Route path={process.env.PUBLIC_URL + "/editor"} component={ViewEditor} />
      </Switch>
    </div>
  );
}

export default App;
