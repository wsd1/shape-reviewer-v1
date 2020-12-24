
import React, { useState, useMemo } from 'react'

import { Table, Button, Checkbox, Space, Divider, Popconfirm } from 'antd';
import {
    EyeOutlined, EyeInvisibleOutlined, BorderOutlined,
    RadiusBottomleftOutlined, DeleteOutlined, MinusOutlined,
    ShrinkOutlined, CheckSquareOutlined, MinusSquareOutlined
} from '@ant-design/icons';

import 'antd/dist/antd.less';
import "./selectedList.css";

//import config from '../config'



const layerId2NameDict = {
    layer_cut: "切割",
    layer_carve: "雕刻",
    layer_fill: "填充",
}

const layerId2Name = (id) => {
    return layerId2NameDict[id] || id; //如果没有 id作名
}





export default function SelectedList({ glbTools, stateGraphs, stateConfig }) {

    //polylineList 结构为 [{layerId, polylineId, layerColor, bbox, isClosed, selected, hidden, length, vertexNum, gapNum},...]
    let { polylineList, layerNames } = useMemo(() => {
        //定义缺省值
        let polylineList = [], layerNames = [];
        if (!stateGraphs) return {
            polylineList, layerNames
        };

        let { layers: graphLayers } = stateGraphs; //{thumbnail, bbox, styles, layers}
        let configStyle = !!stateConfig ? stateConfig.current.STYLE : null;

        layerNames = Object.keys(graphLayers);

        //组织 polylineList
        for (let layerId in graphLayers) {
            let { polylineSet } = graphLayers[layerId];
            for (let polylineId in polylineSet) {
                let { selected, hidden, gapNum, isClosed, length, vertexNum, bbox } = polylineSet[polylineId];
                let layerColor = configStyle? configStyle.layerBaseColor[layerId] : null;
                polylineList.push({ key: polylineId, layerId, polylineId, layerColor, selected, hidden, gapNum, isClosed, length, vertexNum, bbox });
            }
        }
        //polylineList.sort((a,b)=>(a.length-b.length)); //按长度排个序，列表不会乱跳

        return { polylineList, layerNames };
    }, [stateGraphs, stateConfig]);



    const [stateOPs, setStateOPs] = useState({ autoPan: false, hoverFocus: true })
    const columns = [
        {
            title: '选',
            dataIndex: 'selected',
            key: 'selected',
            filters: [
                { text: '仅选中', value: true },
                { text: '未选择', value: false },
            ],
            onFilter: (value, record) => !!record.selected === value,

            render: (selected, record) => {
                let { layerId, polylineId, layerColor } = record;
                return <Button key={'select'} type="link" size={'small'} onClick={() => {
                    glbTools.polylineSelect(layerId, polylineId);
                }}>
                    {selected ? <CheckSquareOutlined style={{ color: layerColor }} /> : <BorderOutlined style={{ color: layerColor }} />}
                </Button>
            },//<CloseOutlined style={{ color: layerColor }} />

            align: 'center', width: 28, ellipsis: false,
            fixed: 'left',
        },

        {
            title: '显',
            dataIndex: 'hidden',
            key: 'hidden',
            filters: [
                { text: '仅显示', value: false },
                { text: '仅隐藏', value: true },
            ],
            onFilter: (value, record) => !!record.hidden === value,

            render: (selected, record) => {
                let { layerId, polylineId, hidden } = record;
                return <Button type="text" size={'small'} onClick={
                    () => {
                        glbTools.setPolylineHidden(layerId, polylineId);
                        //glbTools.setFitBox(...record.bbox)
                    }}>
                    {hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}</Button>
            },//<CloseOutlined style={{ color: layerColor }} />

            align: 'center', width: 28, ellipsis: false,
            fixed: 'left',
        },


        {
            title: '层',
            dataIndex: 'layerId',
            key: 'layerId',
            filters: layerNames.map(id => ({ text: layerId2Name(id), value: id })),
            onFilter: (value, record) => record.layerId === value,
            render: (layerId) => layerId2Name(layerId),
            align: 'center', width: 32, ellipsis: false,
            //fixed: 'left',
        },

        {
            title: '形',
            dataIndex: 'isClosed', key: 'isClosed',
            render: (isClosed, record) => (isClosed ? <BorderOutlined /> : <RadiusBottomleftOutlined />),
            onFilter: (value, record) => record.isClosed === value,
            filters: [
                { text: '环状', value: true },
                { text: '开放', value: false },
            ],
            //sorter: (a, b) => (a.isClosed === b.isClosed ? 0 : a.isClosed ? -1 : 1),
            align: 'center', width: 24, ellipsis: false,
        },

        //线点
        {
            title: '线点',
            dataIndex: 'vertexNum', key: 'vertexNum',

            onFilter: (value, record) => {
                switch (value) {
                    case '<=2':
                        if (record.vertexNum <= 2)
                            return true;
                        break;
                    case '>2':
                        if (record.vertexNum > 2)
                            return true;
                        break;
                    default:
                        break;
                }
                return false;
            },
            filters: [
                { text: '直线(2点)', value: '<=2' },
                { text: '曲线(>2点)', value: '>2' },
            ],

            sorter: (a, b) => a.vertexNum - b.vertexNum,

            align: 'center', width: 36, ellipsis: true,
        },

        //断点
        {
            title: '断点',
            dataIndex: 'gapNum', key: 'gapNum',

            onFilter: (value, record) => {
                switch (value) {
                    case '<1':
                        if (record.gapNum < 1)
                            return true;
                        break;
                    case '>=1':
                        if (record.gapNum >= 1)
                            return true;
                        break;
                    default:
                        break;
                }
                return false;
            },
            filters: [
                { text: '无断点', value: '<1' },
                { text: '有断点', value: '>=1' },
            ],

            sorter: (a, b) => a.gapNum - b.gapNum,

            align: 'center', width: 36, ellipsis: true,
        },

        //长度
        {
            title: '长 mm',
            dataIndex: 'length', key: 'length',

            sorter: (a, b) => a.length - b.length,
            defaultSortOrder: 'descend',

            align: 'center', width: 38, ellipsis: true,
        },

        //操作
        {
            title: '操作',
            dataIndex: 'hidden', key: 'hidden',

            render: (hidden, record) => {
                return (<Space>
                    <Popconfirm title="确认？" okText="删除" cancelText="取消" onConfirm={() => {
                        glbTools.deletePolyline(record.layerId, record.polylineId);
                    }}>
                        <Button shape="circle" danger ><DeleteOutlined /></Button>
                    </Popconfirm>

                    <Button shape="circle" onClick={
                        () => {
                            glbTools.polylinePatch(record.layerId, record.polylineId);
                        }}><ShrinkOutlined /></Button>
                </Space>)
            },

            align: 'left', width: 50, ellipsis: false,
            //fixed: 'right',
        },

        //ID
        {
            title: 'ID',
            dataIndex: 'polylineId', key: 'polylineId',

            render: (polylineId, record) => (polylineId.slice(0, 4).toUpperCase() + '...'),

            align: 'center', width: 42, ellipsis: false,
        },

    ];

    const onChange = (pagination, filters, sorter, extra) => {
        //let { currentDataSource, action } = extra;  //{currentDataSource: [], action: paginate | sort | filter}
    }

    //console.table(polylineList);
    return <Table size="small" bordered
        columns={columns}
        dataSource={polylineList}
        onChange={onChange}
        //pagination={{ pageSize: 30 }}
        scroll={{ x: 600, y: 800 }}//
        onRow={record => ({
            onClick: event => { }, // 点击行
            onDoubleClick: event => { },
            onContextMenu: event => { },
            onMouseEnter: event => {
                if (stateOPs.autoPan)
                    glbTools.setFitBox(...record.bbox);
                if (stateOPs.hoverFocus)
                    glbTools.setPolylineFocus(record.polylineId)
                //glbTools.setPolylineBlink(record.polylineId)
            },  // 鼠标 移入行
            onMouseLeave: event => {
                glbTools.setPolylineFocus(record.polylineId, false)
            },  // 
        })}
        //rowClassName = {record => (record.selected ? 'row-selected' : '')}
        title={(currentPageData) => {

            let isAllSelected = currentPageData.every(({ selected }) => !!selected);
            let isPartSelected = isAllSelected ? false : currentPageData.some(({ selected }) => !!selected);

            let selectedItems = currentPageData.filter(({ selected }) => !!selected);
            let isAllHidden = selectedItems.every(({ hidden }) => !!hidden);
            let isPartHidden = isAllHidden ? false : selectedItems.some(({ hidden }) => !!hidden);

            return <Space >

                <Space>
                    <Button type="link" onClick={() => {
                        let lst = currentPageData.map(({ layerId, polylineId }) => ({ layerId, polylineId }));
                        //如果有选择的，那么就全清空； 若全清空就全选中
                        glbTools.polylinesSelect(lst, !(isAllSelected || isPartSelected));
                    }}>
                        {isAllSelected ?
                            <CheckSquareOutlined /> : isPartSelected ?
                                <MinusSquareOutlined /> : <BorderOutlined />}
                        {isAllSelected ? "清空" : isPartSelected ? "清空" : "全选"}
                    </Button>

                    <Button type="circle" disabled={selectedItems.length === 0} onClick={() => {
                        let lst = selectedItems.map(({ layerId, polylineId }) => ({ layerId, polylineId }));
                        //如果有选择的，那么就全清空； 若全清空就全选中
                        glbTools.setPolylinesHidden(lst, !(isAllHidden || isPartHidden));
                    }}>
                        {isAllHidden ? <EyeInvisibleOutlined /> : isPartHidden ?
                            <MinusOutlined /> : <EyeOutlined />}
                    </Button>

                    <Popconfirm title="确认？" okText="删除" cancelText="取消"
                        onConfirm={() => {
                            glbTools.deletePolylines(selectedItems.map(({ layerId, polylineId }) => ({ layerId, polylineId })));
                        }}>
                        <Button type="circle" danger disabled={selectedItems.length === 0} > <DeleteOutlined /> </Button>
                    </Popconfirm>

                </Space>
                <Divider type="vertical" />
                <Space>
                    <Checkbox checked={stateOPs.autoPan} onChange={() => {
                        setStateOPs(({ autoPan: old, hoverFocus }) => ({ autoPan: !old, hoverFocus }))
                    }}>自动定位</Checkbox>

                    <Checkbox checked={stateOPs.hoverFocus} onChange={() => {
                        setStateOPs(({ autoPan, hoverFocus: old }) => ({ autoPan, hoverFocus: !old }))
                    }}>高亮提示</Checkbox>

                </Space>

            </Space>
        }}
        footer={null}

    />

}
