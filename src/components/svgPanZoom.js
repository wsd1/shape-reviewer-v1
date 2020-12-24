import React from 'react'
//import PropTypes from 'prop-types'

import {
    ReactSVGPanZoom,
} from 'react-svg-pan-zoom';




let viewRatio = 2.0 / 1.0;
let paddingLeft = 56, paddingRight = 20;    //左边避开 工具栏

function SvgPanZoom({ viewSize, glbTools, children, editorTool, editorValue, onChangeEditorTool, onChangeEditorValue, isAnySelected }) {

    let prettyWidth = viewSize.width - (paddingLeft + paddingRight);
    let prettyHeight = viewSize.width / viewRatio;

    const {isSaved, canUndo, canRedo, toolValue} = editorTool;
    //console.log(editorValue);

    //if(prettyHeight > 720) prettyHeight = 720;
    if (prettyHeight < 600) prettyHeight = 600;

    //console.log(prettyHeight);

    return viewSize.width > 0 ? (
        <ReactSVGPanZoom
            //ref={viewRef}
            style={{
                //transform: "scaleY(-1)"
                paddingLeft,
                paddingRight,
            }}
            detectAutoPan={false}
            disableDoubleClickZoomWithToolAuto={true}
            //scaleFactorMax={200}
            //scaleFactorMin={1}
            SVGBackground={'url(#patternGrid)'} //#222222
            width={prettyWidth}
            height={prettyHeight}
            tool={toolValue}
            onChangeTool={onChangeEditorTool}
            value={editorValue}
            onChangeValue={v => {
                onChangeEditorValue(v);
                //updateScale(v); 
            }}
            preventPanOutside={false}
            miniatureProps={{ position: 'none' }}
            onSelect={glbTools.onBboxSelect}
            toolbarProps={{
                position: "left",
                onSave: glbTools.onSave,
                onUndo: glbTools.onUndo,
                onRedo: glbTools.onRedo,
                onDelete: glbTools.deleteSelected,
                onBorderSet: glbTools.onBorderSet,
                onHelp: glbTools.onHelp,
                SVGAlignX: 'center',
                SVGAlignY: 'center',
                isSaved, canUndo, canRedo, 
                canDelete: isAnySelected
            }}
            onClick={glbTools.onSvgClick}
        //onClick={viewerMouseEvent=>{console.dir(viewerMouseEvent.originalEvent.target);}}
        //onClick={event => console.log('click', event.x, event.y, event.originalEvent)}
        >
            {children}
        </ReactSVGPanZoom>
    ) : (<></>)
}

SvgPanZoom.propTypes = {
    //setFitBox: PropTypes.func.isRequired
}

export default SvgPanZoom;

