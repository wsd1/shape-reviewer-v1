import React from 'react'

import packPlan from "../lib/packPlan"
import { verticesBbox } from "../lib/util"
import "./planChart.css";


export default function PlanChart({ plan: planStr, board }) {

    let plan = new packPlan(planStr);
    plan.landscape();   //确保其横躺
    let bboxVerts = [];  //用来统计图形元素的范围，便于输出viewbox参数

    let bkgroundColor = "#d9d9d9", brdColor = "#ffffb8";
    const gap = 4, origin = { x: 0, y: 0 };


    //先画基板 和 尺寸标注
    const label = { height: 30, width: 20 };
    let boardUnits = [];
    for (let c = 0; c < plan.col; c++)
        for (let r = 0; r < plan.row; r++)
            //if (c < colUsed && r < rowUsed) continue; else
            boardUnits.push(<rect key={`${c}-${r}`}
                x={origin.x + c * plan.unitWidth + gap / 2} y={origin.y + r * plan.unitHeight + gap / 2}
                width={plan.unitWidth - gap} height={plan.unitHeight - gap} rx="4"
                fill={bkgroundColor} />)

    let verticalLabelPos = {
        x: origin.x - label.width / 2,
        y: origin.y + plan.planHeight / 2
    };
    let HorizenLabelPos = {
        x: origin.x + plan.planWidth / 2,
        y: origin.y + plan.planHeight + label.height
    };
    let baseBoardEle = <g style={{ fontSize: label.height }}>{boardUnits}
        <text transform={`translate(${verticalLabelPos.x}, ${verticalLabelPos.y}) rotate(-90)`} textAnchor="middle" >
            {plan.planHeight / 10}cm</text>
        <text transform={`translate(${HorizenLabelPos.x}, ${HorizenLabelPos.y})`} textAnchor="middle" >
            {plan.planWidth / 10}cm</text>
    </g>

    //将基板和标注范围输入统计
    bboxVerts.push([origin.x, origin.y]);
    bboxVerts.push([origin.x + plan.planWidth, origin.y + + plan.planHeight]);
    bboxVerts.push([verticalLabelPos.x - label.width, verticalLabelPos.y]);    //数字有宽度，所以向外扩30mm
    bboxVerts.push([HorizenLabelPos.x, HorizenLabelPos.y + label.height]);


    //目标板 和 占用规划部分
    let boardEle = null;//, boardUsedBkEle = null;
    if (!!board) {
        //尝试放入 规划 中
        let matchRes = plan.matchWithRotate(board.width, board.height);
        if (!!matchRes) {
            //console.log(matchRes);
            let { col: colUsed, row: rowUsed, usage, isRotate } = matchRes;

            let [brdWidth, brdHeight] = isRotate ? [board.height, board.width] : [board.width, board.height];
            let [usedPartWidth, usedPartHeight] = [colUsed * plan.unitWidth, rowUsed * plan.unitHeight];
            let [cx, cy] = [origin.x + usedPartWidth / 2, origin.y + usedPartHeight / 2];
            boardEle = <g opacity={0.6} >
                <rect x={cx - brdWidth / 2} y={cy - brdHeight / 2}
                    width={brdWidth} height={brdHeight} rx="8" fill={brdColor} />
                <text x={cx} y={cy}
                    textAnchor="middle" style={{ fontSize: 40 }}>
                    {parseInt(usage * 100)}%
                </text>
            </g>

            /*
                boardUsedBkEle = <rect
                    x={cx - usedPartWidth / 2} y={cy - usedPartHeight / 2}
                    width={plan.unitWidth * colUsed} height={plan.unitHeight * rowUsed}
                    rx="8" fill={bkgroundColor} />
            */
        }

    }

    //手机图例（尺寸对比用的） 
    let iphoneScreenColor = "#bfbfbf", iphoneColor = "#8c8c8c";
    let iphone = { width: 78, height: 158 }, iphoneScreen = { width: 74, height: 125 };
    let iphoneCenter = { x: origin.x - 100, y: origin.y + plan.planHeight - iphone.height / 2 }; //和基板下部分对齐
    let iphoneBase = { x: iphoneCenter.x - iphone.width / 2, y: iphoneCenter.y - iphone.height / 2 };
    let iphone7plus = <g>
        <rect name="phoneBase" x={iphoneBase.x} y={iphoneBase.y} width={iphone.width} height={iphone.height} rx="10" fill={iphoneColor} />
        <rect name="phoneSpeaker" x={iphoneCenter.x - 5} y={iphoneCenter.y - 70} width={10} height={1} fill="#f0f0f0" />
        <rect name="phoneScreen" x={iphoneCenter.x - (iphoneScreen.width / 2)} y={iphoneCenter.y - (iphoneScreen.height / 2)} width={iphoneScreen.width} height={iphoneScreen.height} fill={iphoneScreenColor} />
        <circle name="phoneButton" cx={iphoneCenter.x} cy={iphoneCenter.y + 70} r="5" stroke="#f0f0f0" stoke-width="1" fill={iphoneColor} />
    </g>

    //将图例的范围输入统计
    bboxVerts.push([iphoneBase.x, iphoneBase.y]);
    bboxVerts.push([iphoneBase.x + iphone.width, iphoneBase.y + iphone.height]);


    //console.log(bboxVerts);
    let [min, max] = verticesBbox(bboxVerts);

    //外边框
    let borderColor = "#d9d9d9";
    let borderOffset = 100;
    let borderEle = <rect name="border" x={min[0] - borderOffset / 2} y={min[1] - borderOffset / 2}
        width={max[0] - min[0] + borderOffset} height={max[1] - min[1] + borderOffset}
        strokeWidth={10}
        rx="0" stroke={borderColor} fill="none" />

    min = [min[0] - borderOffset, min[1] - borderOffset];
    max = [max[0] + borderOffset, max[1] + borderOffset];

    let viewStr = `${min[0]} ${min[1]} ${max[0] - min[0]} ${max[1] - min[1]}`
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox={viewStr}>
        {baseBoardEle}
        {/*boardUsedBkEle*/}
        {boardEle}
        {iphone7plus}
        {borderEle}
    </svg>;




}
