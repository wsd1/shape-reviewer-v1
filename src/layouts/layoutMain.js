import React from 'react';


import 'antd/dist/antd.css';
import "./layoutMain.css";

import { Layout, Row, Col } from 'antd';
import { CloudOutlined, LaptopOutlined } from '@ant-design/icons';



const { Header, Content, Footer } = Layout;



function LayoutMain({ loginSpot, localView, cloudView, utilView }) {

  return (
    <Layout className="layout">
      <Header>
        <div className="logo" />


        <div className="rightIconButton">
          {loginSpot}
        </div>

      </Header>



      <Content className="site-content">

        <Row>
          <Col span={12}>
            <div className="content-sign-container-left">
              <LaptopOutlined className="content-sign" style={{fontSize: "30px"}}/>
            </div>

            <div className="content-local">
            {localView}
            </div>


          </Col>

          <Col span={12}>

            <div className="content-sign-container-right">
              <CloudOutlined className="content-sign" style={{fontSize: "30px"}}/>
            </div>


            <div className="content-cloud">
            {cloudView}
            </div>

          </Col>
        </Row>

        {utilView}
      </Content>


      <Footer style={{ textAlign: 'center' }}>光线工场 ©2020 Created by ucast</Footer>
    </Layout>
  )


}

export default LayoutMain;
