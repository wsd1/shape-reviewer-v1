


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
    let shrinkRatio = 1.5;
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

export function getPathFromPublic(path) {
    return `${process.env.PUBLIC_URL}/${path}`;
}

// humanRelativeISODate("2020-11-13T01:38:08.469Z")
export function humanRelativeISODate(isoDate) {
    //    var date = new Date((isoDate || "").replace(/-/g, "/").replace(/[TZ]/g, " ")),
    var date = new Date(isoDate),
        diff = ((new Date()).getTime() - date.getTime()) / 1000,
        day_diff = Math.floor(diff / 86400);

    if (isNaN(day_diff) || day_diff < 0) return;

    /*
    return day_diff == 0 && (diff < 60 && "just now" || diff < 120 && "1 minute ago" || diff < 3600 && Math.floor(diff / 60) + " minutes ago" || diff < 7200 && "1 hour ago" || diff < 86400 && Math.floor(diff / 3600) + " hours ago")
        || day_diff == 1 && "Yesterday"
        || day_diff < 7 && day_diff + " days ago"
        || day_diff < 31 && Math.ceil(day_diff / 7) + " weeks ago"
        || day_diff < 60 && "a month ago"
        || day_diff < 365 && Math.ceil(day_diff / 30) + " months ago"
        || day_diff < 730 && "a year ago"
        || Math.ceil(day_diff / 365) + " years ago";
    */


    return (day_diff === 0 && ((diff < 60 && "刚才") || (diff < 120 && "一分钟前") || (diff < 3600 && Math.floor(diff / 60) + "分钟前") || (diff < 7200 && "一小时前") || (diff < 86400 && Math.floor(diff / 3600) + "小时前")))
        || (day_diff === 1 && "昨天")
        || (day_diff < 7 && day_diff + "天前")
        || (day_diff < 31 && Math.ceil(day_diff / 7) + "星期前")
        || (day_diff < 60 && "一个月前")
        || (day_diff < 365 && Math.ceil(day_diff / 30) + "月前")
        || (day_diff < 730 && "一年前")
        || (Math.ceil(day_diff / 365) + "年前");

}

export function humanISODate(isoDate) {
    return (new Date(isoDate)).toLocaleString();
}

//汉字约等于字母的1.5倍宽度，估计一个字符串的宽度，返回纯字母宽度个数
export function stringWidth(str) {
    let l = 0.0;
    for (let i = 0; i < str.length; i++)
        if (str.charCodeAt(i) > 255)
            l += 1.5;
        else
            l += 1.0;
    return parseInt(l);
}

export function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { fn.apply(this, args); }, delay);
    };
};
