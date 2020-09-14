import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from "react-router-dom";

import { List, Popconfirm, Space, Tooltip, Button, Badge, Spin } from 'antd';
import { MessageOutlined, LikeOutlined, StarOutlined, 
        PlusOutlined, DeleteOutlined, ArrowRightOutlined,
        BugOutlined } from '@ant-design/icons';



import 'antd/dist/antd.css';
import "./localList.css";

import localforage from 'localforage';
import LZString from 'lz-string'

import _define from '../define'
import { prettyFileSize } from '../lib/util'

import docPath from '../doc/sketchCheckProcess.md'


var localForage = localforage.createInstance({
    name: _define.STORE_KEY
});

const IconText = ({ icon, text }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);


function LocalList({openDoc}) {

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
        //alert(`${fileName}`);
        localForage.setItem(_define.KEY_TEMP_FILE, { name: fileName}, cb);
    }

    const removeFromCache = (fileName) => {
        localForage.removeItem(`${_define.CACHE_PREFIX}${fileName}`, () => {
            //从 cacheList 剔除掉相应文件名的 项目
            setCacheList(cacheList.filter(cacheItem => (cacheItem.fileName !== fileName)));
        });
    }


    useEffect(() => {
        let fileSet = {};
        localForage.iterate((value, key, iterationNumber) => {
            if (key.startsWith(_define.CACHE_PREFIX)) {
                let {_pack} = value; //{_pack, config, editor}
                let { fileName, fileSize, fileHash, dateModify, dateUpload, thumbnail } = _pack;
                //console.log(hugeJson);
                let thumbUrl = thumbnail ? URL.createObjectURL(new Blob([thumbnail], { type: 'image/svg+xml' })) : null;
                fileSet[fileName] = { fileName, fileSize, fileHash, dateModify, dateUpload, thumbUrl };
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

    const headr = <Tooltip placement="bottom" title="打开DXF图纸">
        <div className="upload_area" onClick={uploadSelect}>
            <PlusOutlined className="upload_plus" />
            <input ref={fileInputRef} type="file" hidden={true} accept=".dxf" id="icon-button-file" onChange={e => handleFileSelectionChange(e.target.files[0], ()=>history.push("/editor"))} />
        </div>
    </Tooltip>

    if(!cacheList)
        return <Spin style={{marginTop: "200px", display: "block"}} size="large" />
    else
        return (
            <>
                <List
                    itemLayout="vertical"
                    size="large"
                    dataSource={cacheList}
                    header={headr}
                    footer={<div>-- 底线在此 --</div>}
                    renderItem={item => (
                        <List.Item
                            key={item.fileName}
                            actions={[
                                <IconText icon={StarOutlined} text="156" key="list-vertical-star-o" />,
                                <IconText icon={LikeOutlined} text="156" key="list-vertical-like-o" />,
                                <IconText icon={MessageOutlined} text="2" key="list-vertical-message" />,
                            ]}
                            extra={null}>

                            <List.Item.Meta
                                title={null}
                                description={null} />

                            <h2>{`${item.fileName}(${prettyFileSize(item.fileSize)})`}</h2>
                            

                            <Space align="start" size={40} >
                                <a href={'/#'} onClick={()=>openFromCache(item.fileName, ()=>history.push("/editor"))}>
                                    <img className="thumbnail-img"
                                        width={280}
                                        alt="thumbnail"
                                        src={item.thumbUrl} />
                                </a>
                                <div>
                                    <Space direction="vertical">
                                        <p>{`hash: ${item.fileHash}`}</p>
                                        <p>{`上传: ${item.dateUpload}`}</p>
                                        <p>{`修改: ${item.dateModify}`}</p>
                                        <Space>
                                            <Badge dot ><BugOutlined /> 图纸尚未处理完毕</Badge>

                                            <Button shape="circle" size="small" onClick={() => openDoc(docPath)}> ? </Button>

                                        </Space>
                                        <Space style={{marginTop: "20px"}}>
                                            <Popconfirm title="确定删除 ?" okText="Yes" cancelText="No" onConfirm={()=>{removeFromCache(item.fileName)}}>
                                                <Button danger><DeleteOutlined />删除</Button>
                                            </Popconfirm>
                                            <Button><ArrowRightOutlined />进阶</Button>

                                        </Space>
                                    </Space>

                                </div>
                            </Space>
                            <div className="list-item-left">
                            </div>
                            <div className="list-item-right">
                            </div>



                        </List.Item>
                    )}
                />
            </>
        );
}

export default LocalList;
