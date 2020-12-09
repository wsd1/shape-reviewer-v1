import React, { useState } from 'react';


import { Button } from 'antd'; //, Empty
import { LoginOutlined, UserOutlined } from '@ant-design/icons';


import 'antd/dist/antd.less';
//import "./main.css";

import { useAuth } from "../hooks/useAuth.js";
import LayoutMain from '../layouts/layoutMain'
import LocalList from '../views/localList'
import CloudView from './cloudView'
import SignInUp from '../views/signInUp'

import Doc from '../components/doc'

//const readmePath = 'https://github.com/chrvadala/react-svg-pan-zoom/raw/master/README.md'

function ViewMain({ title, drawerTitle }) {

    const auth = useAuth();

    let [stateHelp, setStateHelp] = useState(null);
    const openHelp = (docPath) => {
        setStateHelp({ visible: true, docPath, handleCancel: () => setStateHelp(null) });
    }


    let loginSpot = <Button type="primary" shape="circle"
        icon={auth.user ? <LoginOutlined /> : <UserOutlined />}
        onClick={auth.user ? auth.signout : () => { }} />;

    let ret = <LayoutMain
        loginSpot={loginSpot}
        localView={<LocalList openHelp={openHelp} isLogin={!!auth.user}/>}
        cloudView={auth.user ? <CloudView/> : <SignInUp />}
        embeddedElements={<><Doc {...stateHelp} /></>}
    />;

    return ret;

    //<LayoutMain  loginSpot={null} localView={null} cloudView={null} utilView={null}/>;

}

export default ViewMain;
