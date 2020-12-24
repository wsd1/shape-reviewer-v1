import React, { useState } from 'react';

import { Divider, TreeSelect, Modal, Button, Image, Space, Alert, Row, Col, Descriptions } from 'antd';
//import { DownOutlined } from '@ant-design/icons';

import AddressEdit from './addressEdit'
import PlanChart from './planChart'

import 'antd/dist/antd.less';
import "./detailSetting.css";

//import config from '../config'
import { prettyFileSize } from '../lib/util'


const layerId2NameDict = {
    layer_cut: "切割层",
    layer_carve: "雕刻层",
    layer_fill: "填充层",
  }


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

export default function DetailSetting({ visible, infoPack, handleCancel }) {



    const [stateAddr, setAddr] = useState({
        //prov: "安徽省", city: "淮南市", area: "田家庵区", detail: "泉山湖D区13号楼1503室", phone: "17017518900", consignee: "丁一"
    });

    const [statePlan, setPlan] = useState(null)


    let elements = [];

    if (infoPack) {
        const { fileName, fileSize,
            thumbUrl, bbox, statistic } = infoPack;

        elements.push(
            <Row className="step-container-center" key="headImage">
                <Col span={1}></Col>
                <Col span={8}><img alt="thumbnail" src={thumbUrl} /></Col>
                <Col span={1}></Col>
                <Col span={14}>
                    {!!statistic && (<><Descriptions title={`${fileName}(${prettyFileSize(fileSize)}) 统计信息`} column={4} bordered>

                        {statistic.map(({ layerId = "", polylineNum = 0, ringNum = 0, lineNum = 0, polylineHaveGapNum = 0 }) => (
                            <>
                                <Descriptions.Item label="层" span={4}>{layerId2NameDict[layerId]||layerId}</Descriptions.Item>
                                <Descriptions.Item label="环线">{ringNum}</Descriptions.Item>
                                <Descriptions.Item label="直线">{lineNum}</Descriptions.Item>
                                <Descriptions.Item label="续线">{polylineHaveGapNum}</Descriptions.Item>
                                <Descriptions.Item label="总数">{polylineNum}</Descriptions.Item>
                            </>
                        ))}
                        </Descriptions>
                        <p>【环线：首尾相连的线条】 【续线：中间有断点的线条】</p>
                    </>)


                    }
                </Col>
            </Row>)


        elements.push(<div key="materialSelection">
            <Divider orientation="left" style={{ fontSize: 20 }}>STEP1. 选择材料</Divider>
            <Alert className="step-container-left"
                message="降价通知"
                description="4mm厚椴木板促销 单价打9折."
                type="info"
                showIcon
                closable
            />
            <div className="step-container-left">

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
                    <Space size={[10, 10]} wrap="true" >
                        <Image className="image-item"
                            src="https://www.cut-tec.co.uk/uploaded/thumbnails/db_file_img_3232_1024xauto.jpg"
                        />
                        <Image className="image-item"
                            src="https://www.lasercompanysp.com.br/imagens/informacoes/corte-laser-mdf-01.jpg"
                        />

                        <Image className="image-item"
                            src="http://lasercutsigns.co.uk/wp-content/uploads/2001/05/laser-cut-veneer-mdf-3.png"
                        />
                    </Space>


                    {/*
                    <Carousel autoplay>
                        <div>
                            <Image
                                //height={340}
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
                
                    */}


                </div>

            </div>

            {/*
                <Row className="step-container-left">
                <Col span={2}>
                    <h3>选择：</h3>
                </Col>
                <Col span={22}>
                </Col>
            </Row>
            */}
        </div>);


        const [min, max] = bbox;
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


    return <Modal
        title={"详情"/*(infoPack && infoPack.fileName) || "?"*/}
        width={1000}
        visible={visible}
        onOk={handleCancel}
        onCancel={handleCancel}
        //centered
        style={{ top: 40 }}
        footer={
            <div
                style={{
                    textAlign: 'right',
                }}
            >
                <Button onClick={handleCancel} style={{ marginRight: 8 }}> Cancel </Button>
                <Button onClick={handleCancel} type="primary"> Submit </Button>
            </div>}
    >

        <div style={{ maxHeight: "600px", overflow: "scroll" }}>
            {elements}
        </div>
    </Modal>;
    /*
        return <Drawer
            title={`加工文件：${!!infoPack && fileName}`}
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
    */



}


