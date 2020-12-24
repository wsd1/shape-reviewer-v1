import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from "react-router-dom";

import { Modal, Space, Button, Row, Tooltip, message, Popover, Tag, Badge } from 'antd';
import {
    PlusOutlined, CloseOutlined, ShoppingOutlined, ClockCircleOutlined,
    ExclamationCircleOutlined, SettingOutlined,
    ProfileOutlined, ExclamationCircleTwoTone, CheckCircleTwoTone,
} from '@ant-design/icons';



import DetailSetting from '../components/detailSetting'


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

/*
const downloadLzData = function (lzdata, filename = 'reviewed.dxf') {
    let fileDat = LZString.decompress(lzdata);
    if (!fileDat) {
        console.warn('downloadLzData(lzdata: NULL)');
        return;
    }
    const contentType = 'application/octet-stream';
    var blob = new Blob([fileDat], { type: contentType }),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a')
    a.download = filename;
    a.href = window.URL.createObjectURL(blob)
    a.dataset.downloadurl = [contentType, a.download, a.href].join(':')
    e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    a.dispatchEvent(e)
}
*/

const downloadLink = function (lzdata, filename = 'reviewed.dxf') {
    let fileDat = LZString.decompress(lzdata);
    if (!fileDat) {
        console.warn('downloadLink(lzdata: NULL)');
        return null;
    }
    return <a download={filename}
        href={window.URL.createObjectURL(new Blob([fileDat], { type: 'application/octet-stream' }))}>
        下载DXF </a>
}


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
    const showPlan = ({ fileName, fileSize, thumbUrl, bbox, statistic }) => {
        setStatePlan({ visible: true, infoPack: { fileName, fileSize, thumbUrl, bbox, statistic }, handleCancel: () => setStatePlan(_state => ({ ..._state, visible: false })) });
    }

    useEffect(() => {
        let fileSet = {};
        localForage.iterate((value, key, iterationNumber) => {
            if (key.startsWith(_define.CACHE_PREFIX)) {
                let { _pack, statistic, checklist, lzDXF } = value; //{_pack, config, editor, statistic, checklist}
                let { fileName, fileSize, fileHash, dateModify, dateUpload, thumbnail, bbox } = _pack;
                //console.log(hugeJson);
                //statistic: {layerId, polylineNum, ringNum, lineNum, polylineHaveGapNum}
                let thumbUrl = thumbnail ? URL.createObjectURL(new Blob([thumbnail], { type: 'image/svg+xml' })) : null;
                fileSet[fileName] = {
                    fileName, fileSize, fileHash, dateModify, dateUpload, thumbUrl, bbox,
                    statistic: statistic || [],
                    checklist: checklist || [],
                    lzDXF
                };
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
                <DetailSetting {...statePlan} />

                <Row className="upload_area_header_row" justify="space-around" align="middle" onClick={uploadSelect}>
                    <Space align="center">
                        <input ref={fileInputRef} type="file" hidden={true} accept=".dxf" id="icon-button-file" onChange={e => handleFileSelectionChange(e.target.files[0], () => history.push(process.env.PUBLIC_URL + "/editor"))} />
                        <PlusOutlined className="upload_plus_icon" />
                        <h2 style={{ margin: 0 }}>添加DXF图纸</h2>
                    </Space>
                </Row>
                {cacheItems.map(({ fileName, fileSize, thumbUrl, fileHash, dateUpload, dateModify, bbox, lzDXF, statistic, checklist }) => {
                    /*
                        checklist = [
                            { name: 'gap', message: '断点: 设定完成', result: "pass" },
                            { name: 'border', message: '边框: 未指定', result: "pass" },
                            { name: 'layer', message: '图层: 有未指定操作层', result: "warn" },
                            { name: 'plan', message: '板材: 未正确配置', result: "warn" },
                        ]
                    */

                    //检查项目渲染
                    const checklistGen = (issues) => {
                        let issueEles = issues.map(({ name, message, result }) => {
                            return <p key={name}>
                                {result === "pass" ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : <ExclamationCircleTwoTone twoToneColor="#eb2f46" />}
                                <span style={{ marginLeft: 10 }}>{message}</span>
                            </p>
                        })
                        return <>
                            {issueEles}
                            <div style={{ textAlign: "right" }}>
                                <Button type="link" size="small" onClick={() => openHelp(docPath)}> 如何处理图纸 </Button>
                            </div>
                        </>;
                    }

                    //弹出检查项目消息框
                    const popupIssues = <Popover title="检查项目：" placement="rightTop" trigger="hover"
                        content={checklistGen(checklist)} >尚有问题?</Popover>;

                    //列表存在 且并非都是pass
                    const checklistHasIssues = checklist.length > 0 && !checklist.every(item => item.result === "pass");

                    return (
                        <Row className="row-card" key={fileName} justify="start" align="middle" >

                            <Button className="row-remove" shape="circle" type="text" onClick={() => {
                                Modal.confirm({
                                    centered: true,
                                    icon: <ExclamationCircleOutlined />, maskClosable: true,
                                    title: '将删除浏览器本地存储的图纸，确定继续 ?', okText: '确认', okType: 'danger',
                                    onOk: () => { removeFromCache(fileName) }
                                })
                            }}><CloseOutlined /></Button>

                            <Space size={40}>

                                <Badge.Ribbon style={{/*height:40*/ }} placement="end" color={checklistHasIssues ? "#ff4d4f" : "green"} text={checklistHasIssues ? popupIssues : "检查通过"}>
                                    <img className="thumbnail-img" width={280} alt="thumbnail" src={thumbUrl}
                                        onClick={() => openFromCache(fileName, () => history.push(process.env.PUBLIC_URL + "/editor"))}
                                    />
                                </Badge.Ribbon>



                                <Space direction="vertical">
                                    <h2>{`${fileName}(${prettyFileSize(fileSize)})`}</h2>
                                    <Space align="center">
                                        <ClockCircleOutlined />
                                        {`修改于 ${humanISODate(dateModify)}  (${humanRelativeISODate(dateModify)})`}
                                    </Space>

                                    {/*<p>{`创建于 ${humanISODate(dateUpload)}  (${humanRelativeISODate(dateUpload)})`}</p>*/}
                                    <Space align="center" size={5}>
                                        <Tag icon={<ProfileOutlined />} color="blue" onClick={() => {
                                            /*downloadLzData(lzDXF, `reviewed_${fileName}`)*/
                                        }}> 图纸信息</Tag>

                                        {downloadLink(lzDXF, `_${fileName}`)}
                                    </Space>


                                    <Space style={{ marginTop: "10px" }}>

                                        <Button onClick={() => showPlan({ fileName, fileSize, thumbUrl, bbox, statistic })}><SettingOutlined />详细</Button>


                                        {!isLogin ? <Tooltip title="需要登录"><Button disabled><ShoppingOutlined />下单</Button></Tooltip> :
                                            (checklistHasIssues ? <Tooltip title="图纸尚有问题"><Button disabled><ShoppingOutlined />下单</Button></Tooltip> :
                                                <Button type="primary" onClick={() => { message.info('加入购物车 完成 ~ '); }}><ShoppingOutlined />下单</Button>)
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
