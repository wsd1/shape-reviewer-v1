import React, { useState, useMemo, useCallback, useRef } from 'react'
import { useHistory } from "react-router-dom";

import { message, Spin, Button, Select, Space, Divider, Badge, Popconfirm, Row, Col, Tag, Slider, Switch } from 'antd';
import {
  EyeInvisibleOutlined, EyeOutlined, MenuOutlined, SplitCellsOutlined,
  LayoutOutlined, GroupOutlined, BorderOutlined
} from '@ant-design/icons';


import {
  fitSelection,
  INITIAL_VALUE,
  TOOL_AUTO, TOOL_SELECT, TOOL_CUT, TOOL_TAG, ACTION_SELECT
} from 'react-svg-pan-zoom';

import useShapeWorker from '../hooks/useShapeWorker'
import config from '../config'
import _define from '../define'
import {
  bboxPretty,
  //verticesBbox,
  //mirrorVertical,
  prettyFileSize,
  getPathFromPublic,
  debounce,
} from '../lib/util'


import useSize from '../hooks/useSize'

import SvgPanZoom from '../components/svgPanZoom'
import Doc from '../components/doc'
import SelectedList from '../components/selectedList'
import FormConfig from '../components/formConfig'


import 'antd/dist/antd.less';
import './editor.css'

import LayoutEditor from '../layouts/layoutEditor'


const toolsHelpPath = getPathFromPublic("editorTools.md");
const issueHelpPath = getPathFromPublic("editorIssues.md");

const tagDefault = { centerX: 0, centerY: 0, rotation: 0, width: 25, height: 5 }


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
const workerPath = getPathFromPublic("shape.worker.js");
const createWorker = () => new Worker(workerPath); //,{ type: 'module' }

const createSvgURL = graphsThumbnail => URL.createObjectURL(new Blob([graphsThumbnail], { type: 'image/svg+xml' }));

const glbTools = {};

function ViewEditor() {

  const history = useHistory();

  //auto size
  const viewRef = useRef();
  const viewSize = useSize(viewRef);


  //svgPanZoom的 value和tool
  const [editorTool, setEditorTool] = useState({ toolValue: TOOL_AUTO, isSaved: true, canUndo: false, canRedo: false }); //
  const [editorValue, setEditorValue] = useState(INITIAL_VALUE);

  const setPanZoomTool = useCallback(
    (value) => {
      setEditorTool(old => {
        return Object.assign({}, old, { toolValue: value })
      })
    },
    [setEditorTool],
  )



  const [stateProgress, setStateProgress] = useState(null);
  const [stateWorkerInfo, setStateWorkerInfo] = useState(null);
  const [stateGraphs, setStateGraphs] = useState(null);
  const [stateConfig, setStateConfig] = useState(null);

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

    config: {
      setState: setStateConfig,
      process: (handle, { config }) => {
        if (!config) return;
        handle.setState(config);
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

    //如果内部传递过来 panZoomParams 那么就更新到编辑器上
    editor: {
      //setState: setEditorValue,
      process: (handle, { editor }) => {
        if (!editor) return;
        let { svgPanZoomValue, isSaved, canUndo, canRedo } = editor;

        //console.log(svgPanZoomValue);

        if (!!svgPanZoomValue)
          setEditorValue(svgPanZoomValue);

        //按钮状态
        setEditorTool(old => {
          return Object.assign({}, old, { isSaved, canUndo, canRedo })
        })

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
  }), [setStateWorkerInfo, setStateProgress, setStateGraphs, setEditorValue, setEditorTool, setStateConfig]);

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

  const { setRefVisibility, setPolylineFocus, setPolylineBlink } = useMemo(() => {
    //通过 ref设定隐藏的方式 ，已放弃 后面采用 react的通用方式
    const setRefVisibility = (id, on = true) => {
      if (graphRefs.current[id])
        graphRefs.current[id].style.visibility = on ? "visible" : "hidden";
    };

    const setPolylineFocus = (id, on = true) => {
      let domEle = graphRefs.current[id];
      if (!domEle) return;
      if (on)
        domEle.classList.add("svgPath-focus");
      else
        domEle.classList.remove("svgPath-focus");
    };

    const setPolylineBlink = (id, wait = 1000) => {
      //console.log(`DELME:${id}`);
      let domEle = graphRefs.current[id];
      if (!domEle) return;

      domEle.classList.add("svgPath-focus");
      setTimeout(() => {
        domEle.classList.remove("svgPath-focus");
      }, wait);
    };

    return { setRefVisibility, setPolylineFocus, setPolylineBlink };
  }, [graphRefs]);
  Object.assign(glbTools, { setRefVisibility, setPolylineFocus, setPolylineBlink })

  const { setLayerHidden, setLayerTarget, setPolylineHidden, setPolylinesHidden } = useMemo(() => {
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

    //线条设定 隐藏 isHidden 参数没有 就翻转
    const setPolylineHidden = (layerId, polylineId, isHidden) => {
      setStateGraphs(stateGraphsOld => {//{thumbnail, bbox, styles, layers}
        let { polylineSet } = stateGraphsOld.layers[layerId];
        //设定 值
        if ("boolean" === typeof (isHidden)) {
          if (!!isHidden === !!polylineSet[polylineId].hidden)
            return stateGraphsOld;
          else {
            if (isHidden)
              polylineSet[polylineId].hidden = true;
            else
              delete polylineSet[polylineId].hidden;

            return Object.assign({}, stateGraphsOld);
          }
        }
        //设定 翻转
        else {
          if (!!polylineSet[polylineId].hidden)
            delete polylineSet[polylineId].hidden;
          else
            polylineSet[polylineId].hidden = true;

          return Object.assign({}, stateGraphsOld);
        }
      })
    }

    //isHidden 参数没有 就翻转
    const setPolylinesHidden = (lst, isHidden) => {
      setStateGraphs(stateGraphsOld => {//{thumbnail, bbox, styles, layers}
        let needUpdate = false;
        let { layers } = stateGraphsOld;

        for (let { layerId, polylineId } of lst) {
          let { polylineSet } = layers[layerId];
          //有 isHidden 参数
          if ("boolean" === typeof (isHidden)) {
            if (!!isHidden === !!polylineSet[polylineId].hidden)
              continue;
            else {
              if (isHidden)
                polylineSet[polylineId].hidden = true;
              else
                delete polylineSet[polylineId].hidden;

              needUpdate = true;
            }
          }
          //设定 翻转
          else {
            if (!!polylineSet[polylineId].hidden)
              delete polylineSet[polylineId].hidden;
            else
              polylineSet[polylineId].hidden = true;

            needUpdate = true;
          }

        }

        if (needUpdate)
          return Object.assign({}, stateGraphsOld);
        else
          return stateGraphsOld;

      })
    }



    return { setLayerHidden, setLayerTarget, setPolylineHidden, setPolylinesHidden };
  }, [setStateGraphs]);
  Object.assign(glbTools, { setLayerHidden, setLayerTarget, setPolylineHidden, setPolylinesHidden })

  const { setLayerToTarget, onBboxSelect } = useMemo(() => {
    const setLayerToTarget = () => {
      let { layers } = stateGraphs;
      //下面构造 params， {layerId: {layerTarget}, ...} 

      let params = {};
      for (let layerId in layers) {
        if (!!layers[layerId].layerTarget)
          params[layerId] = { layerTarget: layers[layerId].layerTarget };
      }

      if (Object.keys(params).length > 0)
        workerCommand({ method: _define.WORKER_METHOD.SET_LAYER, params })

    };
    const onBboxSelect = (start, end) => {
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
    };
    return { setLayerToTarget, onBboxSelect };
  }, [stateGraphs, workerCommand])
  Object.assign(glbTools, { setLayerToTarget, onBboxSelect })

  glbTools.workerCommand = (method, params) => workerCommand({ method, params });
  //glbTools.onScaleChange = setScaleLevel;

  glbTools.onSave = (tool, value) => {
    //glbTools.workerCommand(_define.WORKER_METHOD.SAVE, { svgPanZoomValue: value });
    workerCommand({ method: _define.WORKER_METHOD.SAVE, params: { svgPanZoomValue: value } })
  };
  glbTools.onUndo = () => {
    //glbTools.workerCommand(_define.WORKER_METHOD.UNDO, {});
    workerCommand({ method: _define.WORKER_METHOD.UNDO, params: {} })
  };
  glbTools.onRedo = () => {
    //glbTools.workerCommand(_define.WORKER_METHOD.REDO, {});
    workerCommand({ method: _define.WORKER_METHOD.REDO, params: {} })
  };

  const { deletePolyline, deletePolylines, deleteSelected, exportPolylines, isAnySelected, onBorderSet } = useMemo(() => {

    //[{layerId, polylineId}]
    let deletePolylines = (lst) => {
      // params， {layerId: [polylineId1, ...], ...} 
      workerCommand({ method: _define.WORKER_METHOD.DELETE, params: lst })
    };

    let deletePolyline = (layerId, polylineId) => {
      // params， {layerId: [polylineId1, ...], ...} 
      deletePolylines([{ layerId, polylineId }]);
    };

    let deleteSelected = () => {
      let { layers } = stateGraphs;

      //下面构造 params， [{layerId, polylineId1}, ...]
      let lst = [];
      for (let layerId in layers) {
        let { polylineSet } = layers[layerId];
        for (let polylineId in polylineSet) {
          if (polylineSet[polylineId].selected) //从每一层 找出 selected 的线条
            lst.push({ layerId, polylineId });
        }
      }
      if (lst.length > 0)
        deletePolylines(lst);
    }

    //[{layerId, polylineId}]
    let exportPolylines = (lst) => {
      if (!lst || lst.length === 0) return;

      let { bbox: graphBbox, layers: graphLayers } = stateGraphs; //{thumbnail, bbox, styles, layers}
      let viewBoxStr = prettyViewboxStr(graphBbox);

      let pathes = lst.map(({ layerId, polylineId }) => {
        let { polylineSet: currentLayerPolylineSet } = graphLayers[layerId];
        let { path } = currentLayerPolylineSet[polylineId];
        return `<path d="${path}" />`
      })

      let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr}"><g fill="none" stroke="black" stroke-width="0.2">${pathes.join('')}</g></svg>`

      const contentType = 'image/svg+xml;charset=utf-8';
      var blob = new Blob([out], { type: contentType }),
        e = document.createEvent('MouseEvents'),
        a = document.createElement('a')
      a.download = 'exported.svg';
      a.href = window.URL.createObjectURL(blob)
      a.dataset.downloadurl = [contentType, a.download, a.href].join(':')
      e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      a.dispatchEvent(e)

    };

    let isAnySelected = () => {
      if (!stateGraphs || !stateGraphs.layers)
        return false;

      let { layers } = stateGraphs;
      for (let layerId in layers) {
        let { polylineSet } = layers[layerId];
        for (let polylineId in polylineSet) {
          if (polylineSet[polylineId].selected) //从每一层 找出 selected 的线条
            return true;
        }
      }
      return false;
    }

    let onBorderSet = () => {
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
    }

    return { deletePolyline, deletePolylines, deleteSelected, exportPolylines, isAnySelected, onBorderSet };
  }, [stateGraphs, workerCommand])
  Object.assign(glbTools, { deletePolylines, deletePolyline, deleteSelected, exportPolylines, onBorderSet })

  const { tagSetRotation_debounce, tagRemove } = useMemo(() => {

    let tagSetRotation = (rotation) => {
      if (!stateWorkerInfo) return;

      let params = Object.assign({}, stateWorkerInfo.tag || tagDefault, { rotation });
      workerCommand({ method: _define.WORKER_METHOD.SET_TAG, params });   //{ centerX, centerY, width, height, rotation }
    }

    let tagSetRotation_debounce = debounce(tagSetRotation, 200);

    let tagRemove = () => {
      workerCommand({ method: _define.WORKER_METHOD.SET_TAG, params: null });   //{ centerX, centerY, width, height, rotation }
    }


    return { tagSetRotation, tagSetRotation_debounce, tagRemove };
  }, [stateWorkerInfo, workerCommand])




  glbTools.onHelp = () => openDoc(toolsHelpPath);
  const { polylineSelect, polylinesSelect, onSvgClick, polylinePatch } = useMemo(() => {


    const polylineSelect = (layerId, polylineId, val) => {
      setStateGraphs(stateGraphsOld => {
        let { layers } = stateGraphsOld; //{thumbnail, bbox, styles, layers}
        if (!layers[layerId] || !layers[layerId].polylineSet[polylineId]) {
          console.warn(`REMOVEME: 不可能，当前的stateGraphs肯定能找到 layerId:${layerId} polylineId:${polylineId}`);
          return stateGraphsOld;
        }

        let { polylineSet } = layers[layerId];

        //翻转
        if ('undefined' === typeof val) {
          if (polylineSet[polylineId].selected)
            delete polylineSet[polylineId].selected;
          else
            polylineSet[polylineId].selected = true;

        }
        else if (val)
          polylineSet[polylineId].selected = true;
        else
          delete polylineSet[polylineId].selected;


        return Object.assign({}, stateGraphsOld);
      })
    };

    //lst :[{layerId, polylineId}, ...]
    const polylinesSelect = (lst, val) => {
      setStateGraphs(stateGraphsOld => {
        let needUpdate = false;
        let { layers } = stateGraphsOld; //{thumbnail, bbox, styles, layers}

        for (let { layerId, polylineId } of lst) {
          if (!layers[layerId] || !layers[layerId].polylineSet[polylineId]) {
            console.warn(`REMOVEME: in polylinesSelect(), 不可能，当前的stateGraphs找不到 layerId:${layerId} polylineId:${polylineId}`);
            continue;
          }

          let { polylineSet } = layers[layerId];

          //翻转
          if ('undefined' === typeof val) {
            if (polylineSet[polylineId].selected)
              delete polylineSet[polylineId].selected;
            else
              polylineSet[polylineId].selected = true;

          }
          else if (val)
            polylineSet[polylineId].selected = true;
          else
            delete polylineSet[polylineId].selected;

          needUpdate = true;
        }

        if (needUpdate)
          return Object.assign({}, stateGraphsOld);
        else
          return stateGraphsOld;
      })
    };

    const tagSetPosition = (x, y) => {
      if (!stateWorkerInfo) return;
      let params = Object.assign({}, stateWorkerInfo.tag || tagDefault, { centerX: x, centerY: y });
      workerCommand({ method: _define.WORKER_METHOD.SET_TAG, params });   //{ centerX, centerY, width, height, rotation }
    }


    // viewerMouseEvent 定义如下：
    //{SVGViewer: svgDomNode, originalEvent, value, x, y, scaleFactor, translationX, translationY}
    const onSvgClick = (viewerMouseEvent, tool) => {

      let { originalEvent: event, x: svgX, y: svgY, value: panZoomValue } = viewerMouseEvent;
      //event.preventDefault();

      //y方向翻转 放在比较早的位置
      if (!stateConfig) return; //必须依赖其中的 YFlip 参数
      if(stateConfig.global.EDITOR.YFlip) svgY *= -1;




      //select 工具会在 拖拽选择之后 释放一个click事件，这里通过最近的value中记录判断之前是否拖拽
      //console.dir(panZoomValue);
      if (TOOL_SELECT === tool &&
        panZoomValue.startX !== panZoomValue.endX &&
        panZoomValue.startY !== panZoomValue.endY &&
        panZoomValue.lastAction === ACTION_SELECT)
        return;
      else if (TOOL_TAG === tool) {
        //console.log(`Click with ${tool} on polyline:${polylineId}@${layerId}, position:[${svgX},${svgY}]`);
        tagSetPosition(svgX, svgY);
        return;
      }

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


      if ('' === polylineId) {  //空点
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

      else {  //点击到线条
        //console.log(`onclick layerId: ${layerId} polylineId: ${polylineId}`);
        if (TOOL_SELECT === tool || TOOL_AUTO === tool) {
          //切换线条的选择状态
          polylineSelect(layerId, polylineId);

        }
        else if (TOOL_CUT === tool) {
          //console.log(`Click with ${tool} on polyline:${polylineId}@${layerId}, position:[${svgX},${svgY}]`);

          let params = {
            layerId,
            polylineId,
            point: [svgX, svgY],
          };

          //if (stateGraphs.layers[layerId].polylineSet[polylineId].isClosed)
          workerCommand({ method: _define.WORKER_METHOD.BREAK, params })
          //else
          //  workerCommand({ method: _define.WORKER_METHOD.PATCH, params })  //打补丁逻辑

        }

      }

    };

    const polylinePatch = (layerId, polylineId) => {
      workerCommand({
        method: _define.WORKER_METHOD.PATCH, params: {
          layerId,
          polylineId,
        }
      })
    }
    return { polylineSelect, polylinesSelect, onSvgClick, polylinePatch }
  }, [setStateGraphs, stateWorkerInfo, stateConfig, workerCommand]) //, stateGraphs 
  Object.assign(glbTools, { polylineSelect, polylinesSelect, onSvgClick, polylinePatch })




  //未分配层结构 (隐藏 目标层等)输出，主要用途是 给旁边用来 做层面选取
  //uiLayersInfo 结构为 [{ layerId, hidden, layerTarget, isWellknown, layerOptions }] isWellknown:表示该层设定已经是知名层
  let { uiLayersInfo, layerHasIssue, borderHasIssue } = useMemo(() => {
    //定义缺省值
    let uiLayersInfo = [],
      layerHasIssue = false,
      borderHasIssue = false;
    if (!stateGraphs) return {
      uiLayersInfo,
      layerHasIssue,
      borderHasIssue
    };

    let { layers: graphLayers } = stateGraphs; //{thumbnail, bbox, styles, layers}

    //组织 uiLayersInfo
    for (let layerId in graphLayers) {

      let isWellknown = !!_define.LAYER_COLOR_WELLKNOWN[layerId]; //检查是否知名层
      //如果已经是 知名层，那就不用提取了
      if (!isWellknown) layerHasIssue = true;

      let { hidden, layerTarget } = graphLayers[layerId];
      let layerOptions = Object.keys(_define.LAYER_COLOR_WELLKNOWN); //通过 配置范畴中的 layerBaseColor 字段找到所有支持的层

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
  let { /*thumbnailUrl*/ viewBoxStr, mainDefs, mainSvgGroups, borderPath, tagPath } = useMemo(() => {

    let configStyle = !!stateConfig ? stateConfig.current.STYLE : null;

    if (!stateGraphs) return {
      thumbnailUrl: config.UI.thumbnailUrlDefault,
      viewBoxStr: config.UI.viewboxStrDefault,
      mainDefs: null,
      mainSvgGroups: null,
      borderPath: null,
      tagPath: null
    };
    let { thumbnail, bbox: graphBbox, layers: graphLayers, border: graphBorderPathData, tag: graphTagPathData } = stateGraphs;

    //下面输出 四小龙
    let thumbnailUrl = !!thumbnail ? createSvgURL(thumbnail) : config.UI.thumbnailUrlDefault;

    let viewBoxStr = !!graphBbox ? prettyViewboxStr(graphBbox) : config.UI.viewboxStrDefault;

    let mainDefs = !!configStyle ? (<defs>
      <pattern id="patternBorder" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
        <path d="M0 0h2v2h-2z M2 2h2v2h-2z" fill="#fff200" />
        <path d="M2 0h2v2h-2z M0 2h2v2h-2z" fill="#2d2d2d" />
      </pattern>
      <pattern id="patternInner" x="0" y="0" width="1" height="5" patternUnits="userSpaceOnUse">
        <path d="M0 0h0.5v5h-0.5z" fill="#fff200" />
        <path d="M0.5 0h0.5v5h-0.5z" fill="#2d2d2d" />
      </pattern>
      <pattern id="patternGrid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 0h10v10h-10z" {...configStyle.background}></path>
        <path d="M10 0V10H-10" {...configStyle.backgroundGrid}></path>
      </pattern>
      <marker id="markerVertex" orient="auto" refX="0.2" refY="0.2" markerUnits="strokeWidth" markerWidth="0.4" markerHeight="0.4" >
        <circle cx="0.2" cy="0.2" r="0.2" {...configStyle.vertex} />
      </marker>
      <marker id="markerVertexEnd" orient="auto" refX="0.1" refY="0.1" markerUnits="strokeWidth" markerWidth="0.2" markerHeight="0.2" >
        <circle cx="0.1" cy="0.1" r="0.1" {...configStyle.vertexEnd} />
      </marker>
      <marker id="markerArrowOnStart" orient="auto" refY="0" refX="0" markerUnits="strokeWidth">
        <path d="M 2,0 l 4,-2, 0,4 z" strokeWidth="3" stroke="#f00"></path>
      </marker>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>) : null;

    let mainSvgGroups = null;
    //开始处理层面图形元素
    if (!!graphLayers && !!configStyle) {
      mainSvgGroups = [];
      //let graphLayers = stateGraphs.layers;

      //根据 缩放等级调整 线条宽度
      //styleStrokeWidthModify(configStyle, scaleLevel);

      //处理每一个层面
      for (let layerId in graphLayers) {
        let { hidden: currentLayerHidden, layerTarget: currentLayerTarget, polylineSet: currentLayerPolylineSet } = graphLayers[layerId];

        if (currentLayerHidden)//忽略隐藏的层面
          continue;

        //将每根线条都放置到 <path> 或 <g> 标签中
        let pathGroup = [];
        for (let plylnId in currentLayerPolylineSet) {
          let { path, gapPath, selected, hidden: currentPolylineHidden } = currentLayerPolylineSet[plylnId];
          if (currentPolylineHidden) continue;
          let wrapperBaseAttributes = {
            key: plylnId, id: plylnId,
            //onMouseEnter: (e) => handleMouseOver(e, true),
            //onMouseLeave: (e) => handleMouseOver(e, false),
            //onContextMenu: handleRightClickWrapper,
            //onClick: handleClickWrapper,
            ref: graphRefsFnGen(plylnId),
            className: "svgPath"
          }

          let gapAttributes = configStyle.polylineGaps;
          //检查是否是选择的线条，若是除了应用 相应样式，同时加粗
          let selectedWrapperAttributes = selected ? { ...configStyle.polylineWrapperSelected, strokeWidth: 2 * configStyle.polylineWrapper['strokeWidth'] } : {};
          //if (selected) console.log(`selected: layerId: ${layerId} polylineId: ${plylnId}`);
          let selectedPolylineAttributes = selected ? { ...configStyle.polylinePathSelected } : {};


          pathGroup.push(
            /*  长时间不用 即可以删除
            !!gapPath && gapPath.length > 0 ?
              <g {...wrapperBaseAttributes}  {...selectedWrapperAttributes}> <path {...selectedPolylineAttributes} d={path} /><path {...gapAttributes} d={gapPath} /></g> :
              <path {...wrapperBaseAttributes}  {...selectedWrapperAttributes} {...selectedPolylineAttributes} d={path} />
            */
            <g {...wrapperBaseAttributes}  {...selectedWrapperAttributes}> <path {...selectedPolylineAttributes} d={path} /><path {...gapAttributes} d={gapPath} /></g>

          );
        }


        //层样式 先设定配置基础
        let layerStyle = Object.assign({}, configStyle.polylineWrapper);//浅复制就够了 注意

        // 【暂时屏蔽】  红绿蓝 颜色实在不是很显眼
        //若知名层 设定 颜色 
        //if (!!configStyle.layerBaseColor[layerId])
        //  layerStyle.stroke = configStyle.layerBaseColor[layerId];

        //若设定target 设定 虚线
        if (!!currentLayerTarget) {
          layerStyle.strokeDasharray = "5,1";
          //若是知名层 也设定颜色
          if (!!configStyle.layerBaseColor[currentLayerTarget]) {
            layerStyle.stroke = configStyle.layerBaseColor[currentLayerTarget];
          }
        }

        //transform='scale(1,-1)'
        mainSvgGroups.push(<g {...layerStyle} key={layerId} id={layerId} ref={graphRefsFnGen(layerId)}>{pathGroup}</g>);
      }
      //复原 线条宽度
      //styleStrokeWidthRestore(configStyle);
    }

    let borderPath = graphBorderPathData ?
      <path d={graphBorderPathData} fill={!!configStyle ? configStyle.borderArea.fill : "none"} />
      : null;
    let tagPath = graphTagPathData ?
      <path d={graphTagPathData} fill={"#fff200"} opacity={0.8}/>
      : null;


    return { thumbnailUrl, viewBoxStr, mainDefs, mainSvgGroups, borderPath, tagPath }
  },
    [stateGraphs, stateConfig]); //依赖 worker的graph , config.current.STYLE


  const { setFitBox } = useMemo(() => {

    const setFitBox = (min, max) => {
      //console.table([min, max]);
      [min, max] = bboxPretty([min, max], 2 / 1); //提供长宽比很重要
      //[min, max] = verticesBbox(mirrorVertical([min, max]));  //所有坐标都是竖向镜像的，所以...
      setEditorValue(oldValue => {
        let { viewerWidth, viewerHeight } = oldValue; //外框
        let [sx, sy] = min, [bx, by] = max;
        let cx = (sx + bx) / 2, cy = (sy + by) / 2;
        let w = bx - sx, h = by - sy;
        if (w > viewerWidth) w = viewerWidth;    //框选区域 不能大过 外框（bboxPretty内 会调整box）
        if (h > viewerHeight) h = viewerHeight;

        if (w < 50) w = 50;  //限制在4mm， 防止 过放大
        if (h < 25) h = 25;

        let newValue = fitSelection(oldValue, cx - w / 2, cy - h / 2, w, h);
        //updateScale(newValue);
        return newValue;
      })
      //console.log(`<path d="M${min[0]} ${min[1]}h${max[0]-min[0]}v${max[1]-min[1]}h${min[0]-max[0]}z"/>`)
      //let center = [(max[0] + min[0])/2, (max[1] + min[1])/2];
      //setEditorValue(oldValue => (setPointOnViewerCenter(oldValue, ...center, 1)))
    }

    return { setFitBox };

  }, [setEditorValue]);

  //视野定位 依赖 setEditorValue
  Object.assign(glbTools, { setFitBox })


  let svgPanZoomAttributes = {
    viewSize,
    glbTools,
    editorTool: editorTool,
    editorValue: editorValue,
    onChangeEditorTool: setPanZoomTool,
    onChangeEditorValue: setEditorValue,
    isAnySelected: isAnySelected(),
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
        {tagPath}
      </svg>
    </SvgPanZoom>
  </>);




  //  <img className="side-thumbnail-img" width={250} alt="thumbnail" src={thumbnailUrl} />
  let tagIsActive = (!!stateWorkerInfo) && (!!stateWorkerInfo.tag);
  //  <Badge status={layerHasIssue?"error":"success"} />
  let layerBorderViewContent = (<Space direction="vertical">

    <Space direction="vertical" >

      <h2>层：</h2>

      {uiLayersInfo.map(({ layerId, hidden, layerTarget, layerOptions, isWellknown }) => (
        <Space key={layerId} size={'large'}>

          {<><Badge status={isWellknown ? "success" : "error"}><MenuOutlined /></Badge></>}
          <Select defaultValue={layerTarget || layerId} value={layerTarget || layerId} allowClear style={{ width: 160 }} onChange={(val) => {
            //console.log(`${layerId} => ${val}`);
            glbTools.setLayerTarget(layerId, val)
          }}>
            {layerOptions.map(layerOpt => (<Select.Option key={layerOpt} value={layerOpt}>{layerId2Name(layerOpt)}</Select.Option>))}
          </Select>
          <Button shape="circle" icon={hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => { glbTools.setLayerHidden(layerId) }} />
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
            <Popconfirm title="本操作不可撤销！！" okText="继续合并" cancelText="取消" onConfirm={glbTools.setLayerToTarget}>
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

    <>
      <h2>编码标签：</h2>

      <Row>
        <Col span={6} style={{ marginTop: 6 }}>{tagIsActive?"标签使能":"标签移除"}</Col>

        <Col span={4} style={{ marginTop: 6 }}>
          <Switch size="small" checked={tagIsActive} disabled={!tagIsActive} onChange={(enable) => {
            if (!enable) tagRemove();
          }} />
        </Col>
        {tagIsActive ? <>
          <Col span={4} style={{ marginTop: 7 }} >角度</Col>
          <Col span={10} >

            <Slider max={180} min={0} defaultValue={0} step={30} marks={{0: '0°', 90: '90°', 180: '180°'}}
              value={stateWorkerInfo.tag.rotation}
              disabled={!tagIsActive} onChange={rotation => {tagSetRotation_debounce(rotation)}} />
          </Col>
        </> :
          <Col span={14} style={{ marginTop: 7}} > (用标签工具在图纸上标定)
          </Col>
        }
      </Row>

    </>


  </Space>
  );

  let polylineViewContent = <SelectedList glbTools={glbTools} stateGraphs={stateGraphs} stateConfig={stateConfig} />;


  //配置界面
  const setConfig = (current, global) => {
    //console.log("setConfig!!!", current, global); 
    workerCommand({ method: _define.WORKER_METHOD.CONFIG, params: { current, global } })
  }
  let configGlobalView = stateConfig ? <FormConfig
    description={"tips: 全局设置应用于所有的图纸上"}
    schema={stateConfig.globalSchema}
    uiSchema={stateConfig.globalUISchema}
    value={stateConfig.global}
    defaultValue={stateConfig.globalDefault}
    saveValue={(glb) => {
      setConfig(null, glb);
      //setStateConfig(cfg => Object.assign({}, cfg, { global: glb }));
    }} /> : null;
  let configCurrentView = stateConfig ? <FormConfig
    description={"tips: 图纸设置仅应用于当前图纸，随图纸保存"}
    schema={stateConfig.currentSchema}
    uiSchema={stateConfig.currentUISchema}
    value={stateConfig.current}
    defaultValue={stateConfig.currentDefault}
    saveValue={(cur) => {
      setConfig(cur, null);
      //setStateConfig(cfg => Object.assign({}, cfg, { current: cur }))
    }} /> : null;

  const waitContent = <Spin style={{ marginTop: "100px", display: "block" }} size="large" />;

  let isLoaded = !!stateGraphs;

  let layoutAttributes = {
    goBack: () => { //退出当前界面
      history.goBack();
      /*
      if (!editorTool.isSaved) {
        Modal.confirm({
          centered: true,
          icon: <ExclamationCircleOutlined />, maskClosable: true,
          title: '尚未保存，确定退出吗?', 
          okText: '不保存', okType: 'danger', onOk: () => { history.goBack(); },
          CancelText: '取消', onCancel: () => { }
        })
        //glbTools.onSave(null, null);
      }
      else {
        history.goBack();
      }
      */
    },
    title: (isLoaded && `${stateWorkerInfo.fileName}`) || ``,
    subTitle: (isLoaded && `(${prettyFileSize(stateWorkerInfo.fileSize)})`) || ``,
    tags: isLoaded && (!editorTool.isSaved) && <Tag color="red">未保存</Tag>,
    issueNum,
    mainView: isLoaded ? mainViewContent : waitContent,
    layerBorderView: isLoaded ? layerBorderViewContent : waitContent,
    polylineView: isLoaded ? polylineViewContent : waitContent,
    configGlobalView,
    configCurrentView,
    utilView: <Doc {...stateDoc} />,
  }
  if (!!stateProgress)
    layoutAttributes.progress = generalProgress(stateProgress);

  return (<div ref={viewRef}>
    <LayoutEditor {...layoutAttributes} />
  </div>)
}

/*
function IconTag({ style }) {
  return (
      <svg {...style} viewBox={'0 0 24 24'} fill="currentColor">
        <path
          d="M2,6H4V18H2V6M5,6H6V18H5V6M7,6H10V18H7V6M11,6H12V18H11V6M14,6H16V18H14V6M17,6H20V18H17V6M21,6H22V18H21V6Z" />
      </svg>
  );
}
*/


export default ViewEditor;
