import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from "react-router-dom";

import { Modal, Space, Button, Row, Tooltip, message } from 'antd';
import {
    PlusOutlined, DeleteOutlined, ShoppingCartOutlined, ClockCircleOutlined,
    ExclamationCircleOutlined, PlusSquareOutlined, WarningTwoTone
} from '@ant-design/icons';
import PlanSelect from '../components/planSelect'


import 'antd/dist/antd.less';
import "./localList.css";

import localforage from 'localforage';
import LZString from 'lz-string'

import _define from '../define'
import {
    prettyFileSize,
    humanRelativeISODate,
    humanISODate,
    //stringWidth 
} from '../lib/util'



import docPath from '../doc/sketchCheckProcess.md'


const localForage = localforage.createInstance({
    name: _define.STORE_KEY
});


function LocalList({ openHelp, isLogin }) {

    const history = useHistory();

    const [cacheList, setCacheList] = useState(null);

    const fileInputRef = useRef();
    const uploadSelect = () => {
        fileInputRef.current.click();
    }

    const handleFileSelectionChange = (file, cb) => {
        if (!file) return;
        //glbTools.initWorker(_define.WORKER_METHOD.PARSE_DXF, file);
        let reader = new FileReader();
        let { name, size } = file;
        reader.onload = function (e) {
            if (e.target.readyState === 2) {
                var data = e.target.result;
                let lzFile = LZString.compress(data);
                console.warn(`Temp file lz save: ${data.length}=>${lzFile.length} ${parseInt(lzFile.length * 100 / data.length)}%`);
                localForage.setItem(_define.KEY_TEMP_FILE, { name, size, lzdata: lzFile }, cb)
            }
        }
        reader.readAsBinaryString(file)
    }

    const openFromCache = (fileName, cb) => {
        localForage.setItem(_define.KEY_TEMP_FILE, { name: fileName }, cb);
    }

    const removeFromCache = (fileName) => {
        localForage.removeItem(`${_define.CACHE_PREFIX}${fileName}`, () => {
            //从 cacheList 剔除掉相应文件名的 项目
            setCacheList(cacheList.filter(cacheItem => (cacheItem.fileName !== fileName)));
        });
    }


    //plan选择器
    let [statePlan, setStatePlan] = useState(null);
    const showPlan = ({ fileName, fileSize, thumbUrl, bbox }) => {
        setStatePlan({ visible: true, pack: { fileName, fileSize, thumbUrl, bbox }, handleCancel: () => setStatePlan(_state => ({ ..._state, visible: false })) });
    }




    useEffect(() => {
        let fileSet = {};
        localForage.iterate((value, key, iterationNumber) => {
            if (key.startsWith(_define.CACHE_PREFIX)) {
                let { _pack } = value; //{_pack, config, editor}
                let { fileName, fileSize, fileHash, dateModify, dateUpload, thumbnail, bbox } = _pack;
                //console.log(hugeJson);
                let thumbUrl = thumbnail ? URL.createObjectURL(new Blob([thumbnail], { type: 'image/svg+xml' })) : null;
                fileSet[fileName] = { fileName, fileSize, fileHash, dateModify, dateUpload, thumbUrl, bbox };
            }
        },
            () => {
                let flist = [];
                for (let filename in fileSet) {
                    flist.push(fileSet[filename]);
                }
                setCacheList(flist);
            })
    }, []);




    function rowsView(cacheItems) {
        return <div className="row-container">
            <div>
                <PlanSelect {...statePlan} />

                <Row className="upload_area_header_row" justify="space-around" align="middle" onClick={uploadSelect}>
                    <Space align="center">
                        <input ref={fileInputRef} type="file" hidden={true} accept=".dxf" id="icon-button-file" onChange={e => handleFileSelectionChange(e.target.files[0], () => history.push(process.env.PUBLIC_URL + "/editor"))} />
                        <PlusOutlined className="upload_plus_icon" />
                        <h2 style={{ margin: 0 }}>添加DXF图纸</h2>
                    </Space>
                </Row>
                {cacheItems.map(({ fileName, fileSize, thumbUrl, fileHash, dateUpload, dateModify, bbox }) => {
                    return (
                        <Row className="row-card" style={{ marginBottom: 20 }} key={fileName} justify="start" align="middle" >
                            <Space>
                                <div className="thumbnail-container" onClick={() => openFromCache(fileName, () => history.push(process.env.PUBLIC_URL + "/editor"))}>
                                    <img className="thumbnail-img" width={280} alt="thumbnail" src={thumbUrl} />
                                </div>


                                <Space direction="vertical">

                                    <h2>{`${fileName}(${prettyFileSize(fileSize)})`}</h2>
                                    <Space align="center">
                                        <ClockCircleOutlined />
                                        {`修改于 ${humanISODate(dateModify)}  (${humanRelativeISODate(dateModify)})`}
                                    </Space>

                                    {/*<p>{`创建于 ${humanISODate(dateUpload)}  (${humanRelativeISODate(dateUpload)})`}</p>*/}
                                    <Space align="center">
                                        <WarningTwoTone twoToneColor="#f5222d" />
                                        尚有问题未处理<Button type="link"
                                            //shape="circle"
                                            size="small" onClick={() => openHelp(docPath)}> 详情 </Button>
                                    </Space>


                                    <Space style={{ marginTop: "10px" }}>
                                        <Button danger onClick={() => {
                                            Modal.confirm({
                                                centered: true,
                                                icon: <ExclamationCircleOutlined />, maskClosable: true,
                                                title: '确定删除 ?', okText: '确认',
                                                onOk: () => { removeFromCache(fileName) }
                                            })
                                        }}><DeleteOutlined />删除</Button>
                                        <Button onClick={() => showPlan({ fileName, fileSize, thumbUrl, bbox })}><PlusSquareOutlined />配置板材</Button>
                                        {isLogin ?
                                            <Button type="primary" onClick={() => {
                                                message.info('加入购物车 完成 ~ ');
                                            }}><ShoppingCartOutlined />加购物车</Button> :
                                            <Tooltip title="需要登录">
                                                <Button type="primary" disabled><ShoppingCartOutlined />加购物车</Button>
                                            </Tooltip>
                                        }

                                    </Space>
                                </Space>

                            </Space>

                        </Row>)
                })}
            </div>
        </div>
    }

    return !!cacheList && cacheList.length > 0 ?
        rowsView(cacheList) :
        <Row justify="space-around" align="middle" style={{ height: "inherit" }}>
            <div className="upload_area_empty" onClick={uploadSelect}>
                <PlusOutlined className="upload_plus_icon" />
                <h3>打开DXF图纸</h3>
                <input ref={fileInputRef} type="file" hidden={true} accept=".dxf" id="icon-button-file" onChange={e => handleFileSelectionChange(e.target.files[0], () => history.push(process.env.PUBLIC_URL + "/editor"))} />
            </div>
        </Row>


}

export default LocalList;
