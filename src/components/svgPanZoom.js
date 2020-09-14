import React from 'react'
//import PropTypes from 'prop-types'

import {
    ReactSVGPanZoom,
} from 'react-svg-pan-zoom';




let viewRatio = 2.0 / 1.0;


function SvgPanZoom({ viewSize, glbTools, children, editorTool, editorValue, onChangeEditorTool, onChangeEditorValue }) {

    let prettyWidth = viewSize.width;
    let prettyHeight = viewSize.width / viewRatio;
    
    if(prettyHeight > 720) prettyHeight = 720;
    if(prettyHeight < 600) prettyHeight = 600;

    //console.log(prettyHeight);

    return viewSize.width > 0 ? (
        <ReactSVGPanZoom
            //ref={viewRef}
            style={{
                //transform: "scaleY(-1)"
            }}
            detectAutoPan={false}
            disableDoubleClickZoomWithToolAuto={true}
            scaleFactorMax={200}
            scaleFactorMin={1}
            SVGBackground={'url(#patternGrid)'} //#222222
            width={prettyWidth}
            height={prettyHeight}
            tool={editorTool}
            onChangeTool={onChangeEditorTool}
            value={editorValue}
            onChangeValue={v => {
                onChangeEditorValue(v);
                //updateScale(v); 
            }}
            preventPanOutside={false}
            miniatureProps={{ position: 'none' }}
            onSelect={glbTools.onSelect}
            toolbarProps={{
                position: "left",
                onSave: glbTools.onSave,
                onUndo: glbTools.onUndo,
                onRedo: glbTools.onRedo,
                onDelete: glbTools.onDelete,
                onBorderSet: glbTools.onBorderSet,
                onHelp: glbTools.onHelp,
                SVGAlignX: 'center',
                SVGAlignY: 'center'
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

