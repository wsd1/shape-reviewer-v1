import React from 'react';


import 'antd/dist/antd.less';
import "./layoutMain.css";

import { Layout, Row, Col } from 'antd';

const { Header, Content, Footer } = Layout;

function LayoutMain({ loginSpot, localView, cloudView, historyOrderView, embeddedElements }) {

  return (
    <Layout className="layout">
      <Header className="layout-header">
        <div className="logo" />
        <div className="rightIconButton">
          {loginSpot}
        </div>
      </Header>

      <Content className="layout-content">
        <Row className="row-content">
          <Col span={4}></Col>
          <Col span={12} className="content-local">
            {localView}
          </Col>
          <Col span={6} className="content-cloud">
            {cloudView}
            {historyOrderView}
          </Col>
        </Row>

        {embeddedElements}
      </Content>

      <Footer style={{ textAlign: 'center' }}>光线工场 ©2020 Created by ucast</Footer>
    </Layout>
  )


}

export default LayoutMain;
