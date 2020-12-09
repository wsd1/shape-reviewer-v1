import React, { useState } from 'react';

import { Row, Tabs } from 'antd';

import AddressEdit from '../components/addressEdit'

import 'antd/dist/antd.less';
import "./cloudView.css";



const { TabPane } = Tabs;




export default function CloudView() {
    const [stateAddr, setAddr] = useState({
        //prov: "安徽省", city: "淮南市", area: "田家庵区", detail: "泉山湖D区13号楼1503室", phone: "17017518900", consignee: "丁一"
    });

    return <Row justify="space-around" style={{ height: "inherit" }}>
        <div className="cloud-tabs-container ">
            <Tabs className="cloud-tabs" defaultActiveKey="orders" onChange={() => { }}>

                <TabPane tab="我的订单" key="orders">
                    hahah
                </TabPane>

                <TabPane tab="其他信息" key="address">
                    <AddressEdit addr={stateAddr}
                        setAddr={setAddr}
                        saveAddr={() => { console.log("地址保存：", stateAddr) }}
                        updateAddr={() => {
                            setAddr({
                                prov: "安徽省",
                                city: "淮南市",
                                area: "田家庵区",
                                detail: "泉山湖D区13号楼1503室",
                                phone: "17017518900",
                                consignee: "丁一"
                            })
                        }} />
                </TabPane>
            </Tabs>
        </div>
    </Row>

}

