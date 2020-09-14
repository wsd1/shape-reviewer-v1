


export function verticesBbox(points, bbox = [[Infinity, Infinity], [-Infinity, -Infinity]]) {
    let [min, max] = bbox;
    let [minx, miny] = min, [maxx, maxy] = max;
    points.forEach(point => {
        let [x, y] = point;
        if (x > maxx) maxx = x;
        if (x < minx) minx = x;
        if (y > maxy) maxy = y;
        if (y < miny) miny = y;
    });
    return [[minx, miny], [maxx, maxy]];
}

export function bboxPretty(bbox, whRatio) {
    let shrinkRatio = 1.2;
    let [min, max] = bbox;
    let hOff = (max[0] - min[0]) / 2, vOff = (max[1] - min[1]) / 2;
    let currWhRatio = hOff / vOff;

    let cx = (max[0] + min[0]) / 2, cy = (max[1] + min[1]) / 2;

    if (whRatio) {
        if (currWhRatio > whRatio) //如果当前区域 更扁
            vOff = hOff / whRatio;  //调整竖向尺寸 使其更大点
        else if (currWhRatio < whRatio)
            hOff = vOff * whRatio;  //调整横向尺寸 使其更大点
    }

    hOff *= shrinkRatio;
    vOff *= shrinkRatio;

    return [[cx - hOff, cy - vOff], [cx + hOff, cy + vOff]];
}

export function mirrorVertical(points) {
    return points.map(point => [point[0], -point[1]]);
}


export function prettyFileSize(len) {
    function prettyFloat(f) {
        return f.toFixed(1);
    }
    if (len > 1000000) {
        return `${prettyFloat(len / 1024 / 1024)}MB`;
    }
    else if (len > 10) {
        return `${prettyFloat(len / 1024)}KB`;
    }
    else if (len > 0)
        return `${prettyFloat(len)}Bytes`;
    else
        return `0`
}



export function prettyDimession(len) {
    function prettyFloat(f) {
        return f.toFixed(1);
    }
    if (len > 1000) {
        return `${prettyFloat(len / 1000)}M`;
    }
    else if (len > 10) {
        return `${prettyFloat(len / 10)}CM`;
    }
    else if (len > 0.1)
        return `${prettyFloat(len)}MM`;
    else if (len > 0)
        return `${prettyFloat(len * 1000)}uM`;
    else
        return `0`
}


