import React, { useState } from 'react';

import { Divider, TreeSelect, Drawer, Button, Carousel, Row, Col, Image, Alert } from 'antd';
//import { DownOutlined } from '@ant-design/icons';

import AddressEdit from './addressEdit'
import PlanChart from './planChart'

import 'antd/dist/antd.less';
import "./planSelect.css";

//import config from '../config'

const treeData = [
    {
        title: '木料',
        value: 'wood',
        selectable: false,
        children: [
            {
                title: '优质椴木板',
                value: 'wood-brassBoardBetter',
                selectable: false,
                children: [
                    {
                        title: '优质椴木板【2mm厚】',
                        value: 'wood-brassBoardBetter-2',
                    },
                    {
                        title: '优质椴木板【3mm厚】',
                        value: 'wood-brassBoardBetter-3',
                    },
                    {
                        title: '优质椴木板【4mm厚】',
                        value: 'wood-brassBoardBetter-4',
                    },
                ],
            },
            {
                title: '普通椴木板',
                value: 'wood-brassBoardSimple',
                selectable: false,
                children: [
                    {
                        title: '普通椴木板【4mm厚】',
                        value: 'wood-brassBoardSimple-4',
                    },
                ],
            },
            {
                title: '出口椴木板',
                value: 'wood-brassBoardExport',
                selectable: false,
                children: [
                    {
                        title: '出口椴木板【3mm厚】',
                        value: 'wood-brassBoardExport-3',
                    },
                    {
                        title: '出口椴木板【4mm厚】',
                        value: 'wood-brassBoardExport-4',
                    },
                ],
            },
        ],
    },
    {
        title: '亚克力',
        value: 'arlic',

        selectable: false,
        children: [
            {
                title: '黑色亚克力',
                value: 'arlic-black',
                selectable: false,
                children: [
                    {
                        title: '黑色亚克力【2mm厚】',
                        value: 'arlic-black-2',
                    },
                    {
                        title: '黑色亚克力【3mm厚】',
                        value: 'arlic-black-3',
                    },
                    {
                        title: '黑色亚克力【4mm厚】',
                        value: 'arlic-black-4',
                    },
                ],
            },
            {
                title: '红色亚克力',
                value: 'arlic-red',
                selectable: false,
                children: [
                    {
                        title: '红色亚克力【4mm厚】',
                        value: 'arlic-red-4',
                    },
                ],
            },
            {
                title: '透明亚克力',
                value: 'arlic-transparent',
                selectable: false,
                children: [
                    {
                        title: '透明亚克力【3mm厚】',
                        value: 'arlic-transparent-3',
                    },
                    {
                        title: '透明亚克力【4mm厚】',
                        value: 'arlic-transparent-4',
                    },
                ],
            },
        ],
    },
];

export default function PlanSelect({ visible, pack, handleCancel }) {

    //const { fileName, fileSize, thumbUrl, bbox } = pack;


    const [stateAddr, setAddr] = useState({
        //prov: "安徽省", city: "淮南市", area: "田家庵区", detail: "泉山湖D区13号楼1503室", phone: "17017518900", consignee: "丁一"
    });

    const [statePlan, setPlan] = useState(null)


    let elements = [];

    if (pack) {
        //elements.push(<div className="step-container-center" style={{ width: "300px" }} key="headImage"> <img alt="thumbnail" src={pack.thumbUrl} /></div>)
        elements.push(<div key="materialSelection">
            <Divider orientation="left" style={{ fontSize: 20 }}>STEP1. 选择材料</Divider>
            <Alert className="step-container-left"
                message="降价通知"
                description="4mm厚椴木板促销 单价打9折."
                type="info"
                showIcon
            />
            <Row className="step-container-left">
                <Col span={2}>
                    <h3>选择：</h3>
                </Col>
                <Col span={22}>
                    <TreeSelect
                        style={{ width: '100%' }}
                        value={statePlan}
                        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                        treeData={treeData}
                        placeholder="请选择材料"
                        treeDefaultExpandAll
                        onChange={setPlan}
                    />


                    <div style={{ marginTop: 20 }}>
                        <Carousel autoplay>
                            <div>
                                <Image
                                    height={340}
                                    src="https://www.cut-tec.co.uk/uploaded/thumbnails/db_file_img_3232_1024xauto.jpg"
                                />

                            </div>
                            <div>
                                <Image
                                    height={340}
                                    src="https://www.lasercompanysp.com.br/imagens/informacoes/corte-laser-mdf-01.jpg"
                                />
                            </div>
                            <div>
                                <Image
                                    height={340}
                                    src="http://lasercutsigns.co.uk/wp-content/uploads/2001/05/laser-cut-veneer-mdf-3.png"
                                />
                            </div>

                        </Carousel>
                    </div>
                </Col>


            </Row>


        </div>);
    }

    if (pack) {
        const [min, max] = pack.bbox;
        const brdSize = { width: max[0] - min[0], height: max[1] - min[1] };
        elements.push(<div key="planSelection">
            <Divider orientation="left" style={{ fontSize: 20 }}>STEP2. 规划</Divider>
            <div className="step-container-center" style={{ width: "500px" }} >
                <PlanChart plan={"brass-4-80x80-16x8"} board={brdSize} />
            </div>
        </div>);
    }


    elements.push(<div key="addressSelection">
        <Divider orientation="left" style={{ fontSize: 20 }}>STEP3. 地址</Divider>
        <div className="step-container-center" style={{ width: "500px" }}>
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
        </div>
    </div>);

    elements.push(<div key="payment">
        <Divider orientation="left" style={{ fontSize: 20 }}>STEP4. 支付</Divider>
        <div className="step-container-center">haha</div>
    </div>);



    return <Drawer
        title={`加工文件：${!!pack && pack.fileName}`}
        width={1000}
        onClose={handleCancel}
        visible={visible}
        //bodyStyle={{ paddingBottom: 80 }}
        placement="left"
        mask={true}
        //maskClosable={false}
        //getContainer={false}
        //style={{ position: 'absolute' }}
        footer={
            <div
                style={{
                    textAlign: 'right',
                }}
            >
                <Button onClick={handleCancel} style={{ marginRight: 8 }}> Cancel </Button>
                <Button onClick={handleCancel} type="primary"> Submit </Button>
            </div>
        }
    >

        <div style={{ overflow: "scroll" }}>
            {elements}
        </div>

    </Drawer>


}


