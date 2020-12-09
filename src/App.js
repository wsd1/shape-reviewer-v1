import React, { useEffect } from 'react';
import {
  Switch,
  Route,
  //Link,
  //Redirect
} from "react-router-dom";

import ViewEditor from './views/editor'
import ViewMain from './views/main'

import { ProvideAuth } from "./hooks/useAuth.js";
import loadReCaptcha from "./lib/loadReCaptcha.js"

import config from './config'


function App() {

  //加载 recapcha
  useEffect(() => {
    loadReCaptcha(config.recapcha.site_key, () => {
      window.grecaptcha
        .execute(config.recapcha.site_key, { action: "homepage" })
        .then(token => {
          //console.log(`recaptcha: action "homepage_shape_reviewer_v1" => ${token}`);
        });
      //隐藏badge
      const element = document.querySelector(".grecaptcha-badge");
      if (element) element.style.display = "none";

    });
  }, []);

  //console.log(process.env.PUBLIC_URL);
  return (
    <ProvideAuth>
      <Switch>
        <Route path={process.env.PUBLIC_URL + "/"} exact component={ViewMain} />
        <Route path={process.env.PUBLIC_URL + "/editor"} component={ViewEditor} />
      </Switch>
    </ProvideAuth>
  );
}

export default App;
