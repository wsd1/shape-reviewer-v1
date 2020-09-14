import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useHistory } from "react-router-dom";

import { message, Spin, Button, Select, Space, Divider, Badge, Popconfirm, Row, Col } from 'antd';
import { EyeInvisibleOutlined, EyeOutlined, MenuOutlined, SplitCellsOutlined, LayoutOutlined, GroupOutlined, BorderOutlined } from '@ant-design/icons';


import {
  fitSelection,
  INITIAL_VALUE,
  TOOL_AUTO, TOOL_SELECT, TOOL_CUT, ACTION_SELECT
} from 'react-svg-pan-zoom';

import useShapeWorker from '../hooks/useShapeWorker'
import config from '../config'
import _define from '../define'
import {
  bboxPretty,
  verticesBbox,
  mirrorVertical,
  prettyFileSize
} from '../lib/util'


import useSize from '../hooks/useSize'

import SvgPanZoom from '../components/svgPanZoom'
import Doc from '../components/doc'


import 'antd/dist/antd.css';
import './editor.css'

import LayoutEditor from '../layouts/layoutEditor'


import toolsHelpPath from '../doc/editorTools.md'
import issueHelpPath from '../doc/editorIssues.md'


const layerId2NameDict = {
  layer_cut: <><SplitCellsOutlined />    {"切割层"}</>,
  layer_carve: <><LayoutOutlined />    {"雕刻层"}</>,
  layer_fill: <><GroupOutlined />    {"填充层"}</>,
}

const layerId2Name = (id) => {
  return layerId2NameDict[id] || id; //如果没有 id作名
}


//从多主题的进度对象中 提取最小进度数字
//返回的 stateProgress 内部类如 {PARSE_DXF: 30, SET_LAYER: 20} 这种
const generalProgress = (_stateProgress) => {
  let min = 100;
  for (let topic in _stateProgress) {
    if (_stateProgress[topic] < min)
      min = _stateProgress[topic];
  }
  return min;
}


const prettyViewboxStr = bbox => {
  let [min, max] = bboxPretty(bbox);
  return `${min[0]} ${min[1]} ${(max[0] - min[0])} ${(max[1] - min[1])}`;
}

//import Worker from 'worker-loader!./blueprint.worker.js';
//const createWorker = () => new Worker();
const getPathFromPublic = path => `${process.env.PUBLIC_URL}/${path}`;
const workerPath = getPathFromPublic('shape.worker.js');
const createWorker = () => new Worker(workerPath); //,{ type: 'module' }

const createSvgURL = graphsThumbnail => URL.createObjectURL(new Blob([graphsThumbnail], { type: 'image/svg+xml' }));

const glbTools = {};

function ViewEditor() {

  const history = useHistory();

  //auto size
  const viewRef = useRef();
  const viewSize = useSize(viewRef);


  //svgPanZoom的 value和tool
  const [panZoomTool, setPanZoomTool] = useState(TOOL_AUTO);
  const [panZoomValue, setPanZoomValue] = useState(INITIAL_VALUE);



  const [stateProgress, setStateProgress] = useState(null);
  const [stateWorkerInfo, setStateWorkerInfo] = useState(null);
  const [stateGraphs, setStateGraphs] = useState(null);

  //文档相关
  const [stateDoc, setStateDoc] = useState(null);
  const openDoc = useCallback(
    (docPath) => {
      setStateDoc({ visible: true, docPath, handleCancel: () => setStateDoc(null) })
    }, [setStateDoc]
  )


  //worker相关
  //在worker的message事件中 被更新的几个关键state

  //下面这个结构用于在 worker msg中更新几个 state
  //其依赖于setState的函数，变化了就需要更新
  let workerStateHandles = useMemo(() => ({
    info: {
      setState: setStateWorkerInfo,
      process: (handle, { info }) => {
        if (!info) return;
        handle.setState(info);
      }
    },

    message: {
      process: (handle, { message: msg }) => {
        if (!msg) return;
        if ('success' === msg.type)
          message.success(msg.message);
        else if ('warn' === msg.type)
          message.warn(msg.message);
        else if ('error' === msg.type)
          message.error(msg.message);
      }
    },

    progress: {
      //state: stateProgress,
      setState: setStateProgress,
      process: (handle, { progress }) => {
        handle.setState(progress);
        //console.log(`REMOVEME worker set progress:`); 
        //console.dir(progress);
      }
    },

    //如果内部传递过来 editor那么就更新到编辑器上
    editor: {
      setState: setPanZoomValue,
      process: (handle, { editor }) => {
        if (!!editor)
          handle.setState(editorOld => {
            //console.log('editorOld');
            //console.dir(editorOld);
            //console.log('editorNew');
            //console.dir(editor);
            //let {version, a,b,c,d,e,f, SVGHeight, SVGWidth, SVGMinX, SVGMinY, viewerHeight, viewerWidth} = editor;
            return editor;
          });
        //console.log(`REMOVEME worker set progress:`); 
        //console.dir(progress);
      }
    },


    graphs: {
      //state: stateGraphs,
      setState: setStateGraphs,
      process: (handle, { graphs }) => {
        if (!graphs) return;
        let { layers: newGraphLayers } = graphs; //{thumbnail, bbox, styles, layers}

        handle.setState(old => {
          if (!old || !old.layers) return graphs; //只有 layers 成员会在 本地 改动，只要之前没有这个，那就直接更新
          let { layers: oldGraphLayers } = old;

          //下面将 老的信息中所有 polyline的 selected信息 搬到新的数据中
          for (let layerId in newGraphLayers) {
            if (!oldGraphLayers[layerId]) continue; //如果，老的 没有这个层 就略过
            if (oldGraphLayers[layerId].hidden)
              newGraphLayers[layerId].hidden = true;  //继承 每一层的 hidden 属性
            let newPolylineSet = newGraphLayers[layerId].polylineSet;
            let oldPolylineSet = oldGraphLayers[layerId].polylineSet;
            for (let polylineId in newPolylineSet)
              if (!!oldPolylineSet[polylineId] && oldPolylineSet[polylineId].selected)
                newPolylineSet[polylineId].selected = true; //继承 每一条曲线的 selected 属性
          }

          return graphs; //现在  graphs.layers中每个层的选中线条都加上了 selected
        });

      }
    },
  }), [setStateWorkerInfo, setStateProgress, setStateGraphs, setPanZoomValue]);

  //worker 启动  ！！！！
  const { command: workerCommand } = useShapeWorker(createWorker, workerStateHandles);

  //当前缩放参数
  //const [scaleLevel, setScaleLevel] = useState(1);

  //ref 设定 ，并为 glbTools 增加设定隐藏显示功能函数 setRefVisibility
  const graphRefs = useRef({});
  //const setRefCallback = (id, el) => { graphRefs.current[id] = el; }
  const graphRefsFnGen = id => {
    return (el) => { graphRefs.current[id] = el }
  };
  //放弃 通过 ref设定隐藏的方式 ，后面采用 react的通用方式
  glbTools.setRefVisibility = useCallback((id, on = true) => {
    //console.log(`DELME:${id}`);
    if (graphRefs.current[id])
      graphRefs.current[id].style.visibility = on ? "visible" : "hidden";
  }, [graphRefs]);




  const { setLayerHidden, setLayerTarget } = useMemo(() => {
    const setLayerHidden = (layerId, isHidden) => {
      setStateGraphs(old => {
        let { layers } = old; //{thumbnail, bbox, styles, layers}
        if (!layers[layerId]) {
          console.warn(`不可能，当前的stateGraphs肯定能找到 layerId:${layerId}`);
          return old;
        }
        //设定 值
        if ("boolean" === typeof (isHidden)) {
          if (!!isHidden === !!layers[layerId].hidden)
            return old;
          else {
            if (isHidden)
              layers[layerId].hidden = true;
            else
              delete layers[layerId].hidden;

            return Object.assign({}, old);
          }
        }
        //设定 翻转
        else {
          if (!!layers[layerId].hidden)
            delete layers[layerId].hidden;
          else
            layers[layerId].hidden = true;

          return Object.assign({}, old);
        }
      })
    };

    //层 设定 目标
    const setLayerTarget = (layerId, target) => {
      setStateGraphs(old => {
        let { layers } = old; //{thumbnail, bbox, styles, layers}
        if (!layers[layerId]) {
          console.warn(`不可能，当前的stateGraphs肯定能找到 layerId:${layerId}`);
          return old;
        }

        //目标 就是自己 
        if (layerId === target) {
          delete layers[layerId].layerTarget;
          return Object.assign({}, old);
        }


        //设定 值
        if (layers[layerId].layerTarget === target) //完全相等 包括 target为空的情况
          return old;
        else if (!!target) {  //target不为空
          layers[layerId].layerTarget = target;
          return Object.assign({}, old);
        }
        else { //target为空
          delete layers[layerId].layerTarget;
          return Object.assign({}, old);
        }
      })
    }

    return { setLayerHidden, setLayerTarget };
  }, [setStateGraphs]);

  const setLayer = useCallback(
    () => {
      let { layers } = stateGraphs;
      //下面构造 params， {layerId: {layerTarget}, ...} 

      let params = {};
      for (let layerId in layers) {
        if (!!layers[layerId].layerTarget)
          params[layerId] = { layerTarget: layers[layerId].layerTarget };
      }

      if (Object.keys(params).length > 0)
        workerCommand({ method: _define.WORKER_METHOD.SET_LAYER, params })

    },
    [stateGraphs, workerCommand]); //这个选择函数 依赖 stateGraphs，因为其内 层面有 hidden属性


  glbTools.workerCommand = (method, params) => workerCommand({ method, params });
  //glbTools.onScaleChange = setScaleLevel;

  glbTools.onSave = (tool, value) => {
    //glbTools.workerCommand(_define.WORKER_METHOD.SAVE, { editor: value });
    workerCommand({ method: _define.WORKER_METHOD.SAVE, params: { editor: value } })
  };

  glbTools.onUndo = () => {
    //glbTools.workerCommand(_define.WORKER_METHOD.UNDO, {});
    workerCommand({ method: _define.WORKER_METHOD.UNDO, params: {} })
  };

  glbTools.onRedo = () => {
    //glbTools.workerCommand(_define.WORKER_METHOD.REDO, {});
    workerCommand({ method: _define.WORKER_METHOD.REDO, params: {} })
  };

  glbTools.onSelect = useCallback(
    (start, end) => {
      //console.log(`EMOVEME: select [${start[0]},${start[1]}][${end[0]},${end[1]}]`);
      let { layers } = stateGraphs;
      //下面构造 params， {layerId: box, ...} 
      let params = {};
      for (let layerId in layers) {
        if (!!layers[layerId].hidden) continue; //当前隐藏的层 肯定不作为 select 的对象
        params[layerId] = [start, end];
      }
      //console.log('Issue select');
      //glbTools.workerCommand(_define.WORKER_METHOD.SELECT, params);
      workerCommand({ method: _define.WORKER_METHOD.SELECT, params })
    },
    [stateGraphs, workerCommand]);

  glbTools.onDelete = useCallback(
    () => {
      let { layers } = stateGraphs;
      //下面构造 params， {layerId: [polylineId1, ...], ...} 
      let params = {};
      for (let layerId in layers) {
        params[layerId] = [];
        let { polylineSet } = layers[layerId];
        for (let polylineId in polylineSet) {
          if (polylineSet[polylineId].selected) //从每一层 找出 selected 的线条
            params[layerId].push(polylineId);
        }
        if (0 === params[layerId].length)
          delete params[layerId];
      }

      if (Object.keys(params).length > 0)
        //glbTools.workerCommand(_define.WORKER_METHOD.DELETE, params); //发布指令 删除线条
        workerCommand({ method: _define.WORKER_METHOD.DELETE, params })

    },
    [stateGraphs, workerCommand]);

  glbTools.onBorderSet = useCallback(
    () => {
      let { layers } = stateGraphs;
      //下面构造 params， {layerId: [polylineId1, ...], ...} 
      let params = {};
      for (let layerId in layers) {
        params[layerId] = [];
        let { polylineSet } = layers[layerId];
        for (let polylineId in polylineSet) {
          if (polylineSet[polylineId].selected) //从每一层 找出 selected 的线条
            params[layerId].push(polylineId);
        }
        if (0 === params[layerId].length)
          delete params[layerId];
      }
      //什么都不选 调用该方法 将使用所有线条的 bbox 计算 边框
      //if (Object.keys(params).length > 0)
      workerCommand({ method: _define.WORKER_METHOD.SET_BORDER, params })
    },
    [stateGraphs, workerCommand]);


  glbTools.onHelp = () => openDoc(toolsHelpPath);

  // viewerMouseEvent 定义如下：
  //{SVGViewer: svgDomNode, originalEvent, value, x, y, scaleFactor, translationX, translationY}
  glbTools.onSvgClick = useCallback((viewerMouseEvent, tool) => {

    let { originalEvent: event, x: svgX, y: svgY, value: editorValue } = viewerMouseEvent;
    //event.preventDefault();

    //select 工具会在 拖拽选择之后 释放一个click事件，这里通过最近的value中记录判断之前是否拖拽
    //console.dir(editorValue);
    if (TOOL_SELECT === tool &&
      editorValue.startX !== editorValue.endX &&
      editorValue.startY !== editorValue.endY &&
      editorValue.lastAction === ACTION_SELECT)
      return;


    let domElement = event.target;
    //console.log(`OnSVGClick:[${svgX},${svgY}]`);
    //console.log(`click with TOOL: ${tool}`)
    //console.dir(viewerMouseEvent);


    //尝试找出 layerId 和 polylineId
    let layerId = '', polylineId = '';
    polylineId = domElement.id;
    layerId = domElement.parentElement.id;
    //如果path没有id，那么可能是在外围 g 标签内
    if ('' === polylineId) {
      polylineId = domElement.parentElement.id;
      layerId = domElement.parentElement.parentElement.id;
    }

    //通过格式核查
    if ('' !== layerId && !layerId.startsWith('layer_')) {
      if (!polylineId && !layerId)
        console.warn(`真是奇了他喵的怪了，选择的是啥玩意~ polylineId:${polylineId}, layerId:${layerId}`);
      polylineId = layerId = '';
    }

    //空点
    if ('' === polylineId) {
      if (TOOL_SELECT === tool || TOOL_AUTO === tool || TOOL_CUT === tool) {
        //清理所有的选择线条的 selected 属性
        setStateGraphs(stateGraphsOld => {
          let { layers } = stateGraphsOld;
          let clearCnt = 0;
          //下面清除所有线条的 selected 的标记
          for (let layerId in layers) {
            let { polylineSet } = layers[layerId];
            for (let polylineId in polylineSet) {
              if (polylineSet[polylineId].selected) { //从每一层 找出 selected 的线条
                delete polylineSet[polylineId].selected;
                clearCnt++;
              }
            }
          }
          if (clearCnt === 0)
            return stateGraphsOld;
          else
            return Object.assign({}, stateGraphsOld);
        })
      }
    }



    //点击到线条
    else {
      //console.log(`onclick layerId: ${layerId} polylineId: ${polylineId}`);
      if (TOOL_SELECT === tool || TOOL_AUTO === tool) {
        //切换线条的选择状态
        setStateGraphs(stateGraphsOld => {
          let { layers } = stateGraphsOld; //{thumbnail, bbox, styles, layers}
          if (!layers[layerId] || !layers[layerId].polylineSet[polylineId]) {
            console.warn(`REMOVEME: 不可能，当前的stateGraphs肯定能找到 layerId:${layerId} polylineId:${polylineId}`);
            return stateGraphsOld;
          }

          if (layers[layerId].polylineSet[polylineId].selected)
            delete layers[layerId].polylineSet[polylineId].selected;
          else
            layers[layerId].polylineSet[polylineId].selected = true;
          //console.log(`select toggle!! layerId: ${layerId} polylineId: ${polylineId}`);
          //}
          return Object.assign({}, stateGraphsOld);
        })

      }

      else if (TOOL_CUT === tool) {
        //console.log(`Click with ${tool} on polyline:${polylineId}@${layerId}, position:[${svgX},${svgY}]`);

        let params = {
          layerId,
          polylineId,
          point: [svgX, svgY],
        };

        //这里使用了 从worker传来的 info中的缺省断点参数，也可以不用，worker中会自动使用缺省的
        if (!!stateWorkerInfo) {
          params.gap = stateWorkerInfo.params.breakDefault;
        }
        //glbTools.workerCommand(_define.WORKER_METHOD.BREAK, params); //发布指令 删除线条
        workerCommand({ method: _define.WORKER_METHOD.BREAK, params })
      }
    }

  }, [setStateGraphs, stateWorkerInfo, workerCommand]);


  //未分配层结构 (隐藏 目标层等)输出，主要用途是 给旁边用来 做层面选取
  //结构为  [{ layerId, hidden, layerTarget, isWellknown, layerOptions }] isWellknown:表示该层设定已经是知名层
  let { uiLayersInfo, layerHasIssue, borderHasIssue } = useMemo(() => {
    let uiLayersInfo = [], layerHasIssue = false;
    if (!stateGraphs) return { uiLayersInfo, layerHasIssue };

    let { layers: graphLayers, styles: graphStyles } = stateGraphs; //{thumbnail, bbox, styles, layers}
    for (let layerId in graphLayers) {

      let isWellknown = !!graphStyles.layerBaseColor[layerId]; //检查是否知名层
      //如果已经是 知名层，那就不用提取了
      if (!isWellknown) layerHasIssue = true;

      let { hidden, layerTarget } = graphLayers[layerId];
      let layerOptions = Object.keys(graphStyles.layerBaseColor); //通过 配置范畴中的 layerBaseColor 字段找到所有支持的层

      uiLayersInfo.push({ layerId, hidden, layerTarget, layerOptions, isWellknown });
    }


    return { uiLayersInfo, layerHasIssue, borderHasIssue: !stateWorkerInfo.border };
  }, [stateGraphs, stateWorkerInfo]);



  /*

 层设定 上下文菜单
 
 弹出菜单不难，麻烦的是 点击其他地方 关闭菜单，放弃该UI元素，采用其他方式实现 选择层面

参考：

https://stackoverflow.com/questions/49381837/open-context-menu-on-table-row-right-click
https://github.com/AlastairTaft/contextmenu
https://ahooks.js.org/hooks/dom/use-click-away/
https://github.com/alibaba/hooks/blob/master/packages/hooks/src/useClickAway/index.ts



.layer-set-popup {
  animation-name: fadeIn;
  animation-duration: 0.4s;
  background-clip: padding-box;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  left: 0px;
  list-style-type: none;
  margin: 0;
  outline: none;
  padding: 0;
  position: absolute;
  text-align: left;
  top: 0px;
  overflow: hidden;
  -webkit-box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}


  const Popup = ({visible, x, y}) => visible &&
  <ul className="layer-set-popup" style={{left: `${x}px`, top: `${y}px`}}>
    <li>Like it</li>
    <li>Bookmark</li>
  </ul>

    const [anchorEl, setAnchorEl] = React.useState(null);
    glbTools.onLayerSet = useCallback(
      event => setAnchorEl(event.currentTarget),
      [setAnchorEl],
    )
    const handleLayerSetClose = () => setAnchorEl(null);
  */





  //根据 worker传回的图形元素数据 构造输出 svg元素
  //输出 缩略图url bbox的string def部分 主界面元素 
  let { //thumbnailUrl, 
    viewBoxStr, mainDefs, mainSvgGroups, borderPath } = useMemo(() => {

      if (!stateGraphs) return {
        thumbnailUrl: config.UI.thumbnailUrlDefault,
        viewBoxStr: config.UI.viewboxStrDefault,
        mainDefs: null,
        mainSvgGroups: null,
        borderPath: null,
      };

      let { thumbnail, bbox: graphBbox, styles: graphStyles, layers: graphLayers, border: graphBorderPathData } = stateGraphs;

      //下面输出 四小龙
      let thumbnailUrl = !!thumbnail ? createSvgURL(thumbnail) : config.UI.thumbnailUrlDefault;

      let viewBoxStr = !!graphBbox ? prettyViewboxStr(graphBbox) : config.UI.viewboxStrDefault;



      let mainDefs = graphStyles ? (<defs>
        <pattern id="patternBorder" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0h2v2h-2z M2 2h2v2h-2z" fill="#fff200" />
          <path d="M2 0h2v2h-2z M0 2h2v2h-2z" fill="#1d1d1d" />
        </pattern>
        <pattern id="patternGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M0 0h10v10h-10z" {...graphStyles.background}></path>
          <path d="M10 0V10H-10" {...graphStyles.backgroundGrid}></path>
        </pattern>
        <marker id="markerVertex" orient="auto" refX="0.2" refY="0.2" markerUnits="strokeWidth" markerWidth="0.4" markerHeight="0.4" >
          <circle cx="0.2" cy="0.2" r="0.2" {...graphStyles.vertex} />
        </marker>
        <marker id="markerVertexEnd" orient="auto" refX="0.1" refY="0.1" markerUnits="strokeWidth" markerWidth="0.2" markerHeight="0.2" >
          <circle cx="0.1" cy="0.1" r="0.1" {...graphStyles.vertexEnd} />
        </marker>
        <marker id="markerArrowOnStart" orient="auto" refY="0" refX="0" markerUnits="strokeWidth">
          <path d="M 2,0 l 4,-2, 0,4 z" strokeWidth="3" stroke="#f00"></path>
        </marker>
      </defs>) : null;

      let mainSvgGroups = null;
      //开始处理层面图形元素
      if (!!graphLayers) {
        mainSvgGroups = [];
        //let graphLayers = stateGraphs.layers;
        //let graphStyles = stateGraphs.styles;

        //根据 缩放等级调整 线条宽度
        //styleStrokeWidthModify(graphStyles, scaleLevel);

        //处理每一个层面
        for (let layerId in graphLayers) {
          let { hidden: currentLayerHidden, layerTarget: currentLayerTarget, polylineSet: currentLayerPolylineSet } = graphLayers[layerId];

          if (currentLayerHidden)//忽略隐藏的层面
            continue;

          //将每根线条都放置到 <path> 或 <g> 标签中
          let pathGroup = [];
          for (let plylnId in currentLayerPolylineSet) {
            let { path, gaps, selected } = currentLayerPolylineSet[plylnId];
            let attributes = {
              key: plylnId, id: plylnId,
              //onMouseEnter: (e) => handleMouseOver(e, true),
              //onMouseLeave: (e) => handleMouseOver(e, false),
              //onContextMenu: handleRightClickWrapper,
              //onClick: handleClickWrapper,
              ref: graphRefsFnGen(plylnId),
              className: "svgPath"
            }

            //检查是否是选择的线条，若是除了应用 相应样式，同时加粗
            let selectedGroupAttributes = selected ? { ...graphStyles.polylineGroupSelected, strokeWidth: 2 * graphStyles.polylineGroup['strokeWidth'] } : {};
            //if (selected) console.log(`selected: layerId: ${layerId} polylineId: ${plylnId}`);
            let selectedAttributes = selected ? { ...graphStyles.polylineSelected } : {};

            pathGroup.push(
              !!gaps && gaps.length > 0 ?
                <g {...attributes} {...selectedGroupAttributes}> <path {...selectedAttributes} d={path} /><path {...graphStyles.gaps} d={gaps} /></g> :
                <path {...attributes} {...selectedGroupAttributes} {...selectedAttributes} d={path} />
            );
          }


          //层样式 先设定配置基础
          let layerStyle = Object.assign({}, graphStyles.polylineGroup);
          //若知名层 设定 颜色
          if (!!graphStyles.layerBaseColor[layerId])
            layerStyle.stroke = graphStyles.layerBaseColor[layerId];

          //若设定target 设定 线型
          if (!!currentLayerTarget) {
            layerStyle.strokeDasharray = "5,1";
            //若是知名层 也设定颜色
            if (!!graphStyles.layerBaseColor[currentLayerTarget]) {
              layerStyle.stroke = graphStyles.layerBaseColor[currentLayerTarget];
            }
          }

          //transform='scale(1,-1)'
          mainSvgGroups.push(<g {...layerStyle} key={layerId} id={layerId} ref={graphRefsFnGen(layerId)}>{pathGroup}</g>);
        }
        //复原 线条宽度
        //styleStrokeWidthRestore(graphStyles);
      }

      let borderPath = graphBorderPathData ? <path d={graphBorderPathData} fill={graphStyles.borderArea.fill} /> : null;

      return { thumbnailUrl, viewBoxStr, mainDefs, mainSvgGroups, borderPath }
    },
      [stateGraphs]); //依赖 worker的graph , scaleLevel




  //视野定位 依赖 setPanZoomValue
  glbTools.setFitBox = useCallback(
    (min, max) => {
      [min, max] = bboxPretty([min, max], 2 / 1); //提供长宽比很重要
      [min, max] = verticesBbox(mirrorVertical([min, max]));  //所有坐标都是竖向镜像的，所以...
      setPanZoomValue(oldValue => {
        let newValue = fitSelection(oldValue, ...min, max[0] - min[0], max[1] - min[1]);
        //updateScale(newValue);
        return newValue;
      })
      //console.log(`<path d="M${min[0]} ${min[1]}h${max[0]-min[0]}v${max[1]-min[1]}h${min[0]-max[0]}z"/>`)
      //let center = [(max[0] + min[0])/2, (max[1] + min[1])/2];
      //setPanZoomValue(oldValue => (setPointOnViewerCenter(oldValue, ...center, 1)))
    },
    [setPanZoomValue],
  )


  let svgPanZoomAttributes = {
    viewSize,
    glbTools,
    editorTool: panZoomTool,
    editorValue: panZoomValue,
    onChangeEditorTool: setPanZoomTool,
    onChangeEditorValue: setPanZoomValue,
  };
  let issueNum = 0;
  if (layerHasIssue) issueNum++;
  if (borderHasIssue) issueNum++;

  let mainViewContent = (<>
    <SvgPanZoom {...svgPanZoomAttributes} >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewBoxStr}>
        {mainDefs}
        {mainSvgGroups}
        {borderPath}
      </svg>
    </SvgPanZoom>
  </>);




  //  <img className="side-thumbnail-img" width={250} alt="thumbnail" src={thumbnailUrl} />

  //  <Badge status={layerHasIssue?"error":"success"} />
  let sideViewContent = (<Space direction="vertical">

    <Space direction="vertical" >

      <h2>层：</h2>

      {uiLayersInfo.map(({ layerId, hidden, layerTarget, layerOptions, isWellknown }) => (
        <Space key={layerId} size={'large'}>

          {<><Badge status={isWellknown ? "success" : "error"}><MenuOutlined /></Badge></>}
          <Select defaultValue={layerTarget || layerId} value={layerTarget || layerId} allowClear style={{ width: 160 }} onChange={(val) => {
            //console.log(`${layerId} => ${val}`);
            setLayerTarget(layerId, val)
          }}>
            {layerOptions.map(layerOpt => (<Select.Option key={layerOpt} value={layerOpt}>{layerId2Name(layerOpt)}</Select.Option>))}
          </Select>
          <Button shape="circle" icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => { setLayerHidden(layerId) }} />
        </Space>
      ))}

      <Row align="middle" style={{ marginTop: 10 }}>

        {//红点提示
          layerHasIssue &&
          <Col span={12}>
            <Button style={{ marginTop: 5 }} onClick={() => openDoc(issueHelpPath)} type="link" size="small" > 为什么有红点? </Button>
          </Col>
        }

        {//自动隐藏的设定按钮 uiLayersInfo 数组中只要有成员的layerTarget的属性有效，就表示被设定了
          uiLayersInfo.some(({ layerTarget }) => (!!layerTarget)) &&
          <Col span={12} style={{ textAlign: "right", marginTop: 10 }}>
            <Popconfirm title="本操作不可撤销！！" okText="继续合并" cancelText="取消" onConfirm={setLayer}>
              <Button type="primary" > 设定层 </Button>
            </Popconfirm>
          </Col>
          // <div style={{ textAlign: "right", marginTop: 10 }}></div>
        }
      </Row>




    </Space>

    <Divider />

    <>
      <h2>边框：</h2>
      <p><Badge status={borderHasIssue ? "error" : "success"}><BorderOutlined /></Badge>    {borderHasIssue ? "尚未设定边框" : "边框已经设定"}</p>
    </>

  </Space>
  );


  let isLoaded = !!stateGraphs;

  let layoutAttributes = {
    goBack: () => history.goBack(),
    title: isLoaded ? `${stateWorkerInfo.fileName} ` : ``,
    subTitle: isLoaded ? `(${prettyFileSize(stateWorkerInfo.fileSize)})` : ``,
    drawerTitle: '抽屉标题',
    issueNum,
    mainView: isLoaded ? mainViewContent : (<Spin style={{ marginTop: "100px", display: "block" }} size="large" />),
    sideView: isLoaded ? sideViewContent : (<Spin style={{ marginTop: "100px", display: "block" }} size="large" />),
    utilView: <Doc {...stateDoc} />
  }
  if (!!stateProgress)
    layoutAttributes.progress = generalProgress(stateProgress);

  return (<div ref={viewRef}>
    <LayoutEditor {...layoutAttributes} />
  </div>)
}

export default ViewEditor;
