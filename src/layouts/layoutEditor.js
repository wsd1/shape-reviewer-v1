import React, { useState } from 'react';


import 'antd/dist/antd.less';
import "./layoutEditor.css";

import { //Layout, 
  Drawer, Button, Badge, Progress, PageHeader, Tabs
} from 'antd';
import { BarsOutlined, RightOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

//const { Header, Content, Footer } = Layout;


function LayoutEditor({ goBack, title, subTitle, tags, issueNum, progress, mainView, layerBorderView, polylineView, configGlobalView, configCurrentView, utilView }) {

  let [stateDrawVisible, setStateDrawVisible] = useState(false);

  const isProcessing = "number" === typeof (progress) && progress > 0;

  const content = <>
    {isProcessing && <div className="main-view-and-drawer-mask" />}
    {isProcessing && <Progress percent={progress} />}
    <div className="main-view-and-drawer">
      {mainView}
      <Drawer
        title={'控制面板'}
        closeIcon={<RightOutlined />}
        onClose={() => setStateDrawVisible(false)}
        visible={stateDrawVisible}
        placement="right"
        mask={false}
        closable={true}
        zIndex={1}
        getContainer={false}
        style={{ position: 'absolute' }}  //这个使得drawer在navBar下面
        headerStyle={{ position: 'absolute', visibility: 'hidden' }} //这个用来消除drawer的header
        bodyStyle={{ paddingTop: 5 }}  //这个用来消除body的上面
        width={480}
      >

        <Tabs tabPosition={'top'}>
          <TabPane tab="层与边框" key="1">
            {layerBorderView}
          </TabPane>
          <TabPane tab="线条" key="2">
            {polylineView}
          </TabPane>
          <TabPane tab="全局设置" key="3">
            {configGlobalView}
          </TabPane>
          <TabPane tab="图纸设置" key="4">
            {configCurrentView}
          </TabPane>
        </Tabs>


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
        tags={tags}
        extra={<Badge count={issueNum}>
          <Button shape="circle" icon={stateDrawVisible ? <RightOutlined /> : <BarsOutlined />} onClick={() => setStateDrawVisible(s => !s)} />
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
