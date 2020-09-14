import React, { useState } from 'react';


import { Button } from 'antd'; //, Empty
import { LoginOutlined, UserOutlined } from '@ant-design/icons';


import 'antd/dist/antd.css';
//import "./main.css";

import LayoutMain from '../layouts/layoutMain'
import LocalList from '../views/localList'

import Doc from '../components/doc'

import doc2Path from '../doc/test2.md'
const readmePath = 'https://github.com/chrvadala/react-svg-pan-zoom/raw/master/README.md'

function ViewMain({ title, drawerTitle }) {

    let [stateLogin, setStateLogin] = useState(false);
    let [stateDoc, setStateDoc] = useState(null);
    const openDoc = (docPath) =>{
        setStateDoc({ visible: true, docPath, handleCancel: () => setStateDoc(null) })
    } 

    let loginSpot = <Button type="primary" shape="circle" icon={stateLogin ? <UserOutlined /> : <LoginOutlined />} onClick={() => setStateLogin(s => !s)} />;

    return <LayoutMain
        loginSpot={loginSpot}
        localView={<LocalList openDoc={openDoc}/>}
        cloudView={<div>
            <Button onClick={() => openDoc(doc2Path)}> open1 </Button>
            <Button onClick={() => openDoc(readmePath)}> open1 </Button>
        </div>
            //<Empty style={{marginTop: "200px"}} description={false} />
        } 
        utilView={<Doc {...stateDoc} />}
        />;
}

export default ViewMain;
