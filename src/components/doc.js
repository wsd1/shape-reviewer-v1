import React, { useEffect, useState, Fragment } from 'react';
import Markdown from 'markdown-to-jsx';
import frontMatter from 'front-matter';

import { Modal, Image, Spin } from 'antd';
import 'antd/dist/antd.less';
//import "./doc.css";

import config from '../config'


function ComponentImage({ alt, src }) {
    if (src.startsWith('http'))
    return <img alt={alt} src={src} />
else
    return <Image //width={500}
        src={config.SOURCE.imgSource + src}
        alt={alt}
    />
}

export default function Doc({ visible, docPath, handleCancel }) {
    const [docInfo, setDocInfo] = useState({});
    useEffect(() => {
        if (!docPath) return;
        setDocInfo({});
        fetch(docPath).then((response) => response.text())
            .then((text) => {
                let docObj = frontMatter(text);
                //let docObj = { content: '#hello ', title: '呵呵呵' }
                //console.dir(docObj);
                setDocInfo(Object.assign({ content: docObj.body }, docObj.attributes));
            })
    }, [docPath]);


    return <Modal
        title={'帮助'}
        visible={visible}
        width={1000}
        style={{ top: 40 }}
        footer={null}
        onCancel={handleCancel}
        destroyOnClose={true}
        {...docInfo}
    >
        {docInfo.content ?
            <Markdown style={{ maxHeight: "500px", overflow: "scroll" }} options={{
                //forceBlock: true,
                overrides: {
                    img: {
                        component: ComponentImage
                    },
                    p: {
                        component: props => {
                            //for (let child of props.children) console.log(child)
                            return props.children.some(
                                child => child.type && child.type === ComponentImage
                            ) ? <Fragment>{props.children}</Fragment> : <p {...props} />
                        },
                    },
                },
            }}>{docInfo.content}</Markdown>
            : <Spin style={{ margin: "80px", display: "block" }} size="large"/>
        }

    </Modal>
}


