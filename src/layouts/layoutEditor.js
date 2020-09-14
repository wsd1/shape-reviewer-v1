import React, { useState } from 'react';


import 'antd/dist/antd.css';
import "./layoutEditor.css";

import { //Layout, 
    Drawer, Button, Badge, Progress, PageHeader } from 'antd';
import { BarsOutlined, RightOutlined } from '@ant-design/icons';


//const { Header, Content, Footer } = Layout;


function LayoutEditor({ goBack, title, subTitle, drawerTitle, issueNum, progress, mainView, sideView, utilView }) {

  let [stateDrawVisible, setStateDrawVisible] = useState(false);

  const isProcessing = "number" === typeof (progress) && progress > 0;



  const content = <>
    {isProcessing && <div className="main-view-and-drawer-mask" />}
    {isProcessing && <Progress percent={progress} />}
    <div className="main-view-and-drawer">
      {mainView}
      <Drawer
        title={drawerTitle}
        closeIcon={<RightOutlined />}
        onClose={() => setStateDrawVisible(false)}
        visible={stateDrawVisible}
        placement="right"
        mask={false}
        closable={true}
        zIndex={1}
        getContainer={false}
        style={{ position: 'absolute' }}
        width={300}
      >
        {sideView}
      </Drawer>
    </div>
  </>;


  return (
    <>
      <PageHeader
        ghost={false}
        onBack={goBack}
        title={title}
        subTitle={subTitle}
        extra={<Badge count={issueNum}>
          <Button shape="circle" icon={<BarsOutlined />} onClick={() => setStateDrawVisible(s => !s)} />
        </Badge>}
      >
      </PageHeader>
      {content}
      {utilView}
    </>
  )

  /*
  
    const header = <><Button type="primary" shape="circle" icon={<ArrowLeftOutlined />} onClick={goBack} />
    <span style={{ marginLeft: '30px', color: 'white' }}>{title}</span>
    <div className="rightIconButton">
      <Badge count={issueNum}>
        <Button type="primary" shape="circle" icon={<BarsOutlined />} onClick={() => setStateDrawVisible(s => !s)} />
      </Badge>
    </div></>;

    return (
      <Layout className="layout">
        <Header>
          {header}
        </Header>
  
        <Content >
          {content}
        </Content>
  
        <Footer style={{ textAlign: 'center' }}>光线工场 ©2020 Created by ucast</Footer>
      </Layout>
    );
  */


}

export default LayoutEditor;
