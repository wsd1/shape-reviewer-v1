
export default class packPlan {
    //    MaterialCode-thickness-longxshort-colsxrows

    constructor(plan) {
        let segs = plan.split('-');
        if (segs.length < 4) {
            console.warn(`规划名称应类如：MaterialCode-thickness-longxshort-colsxrows`);
            return false;
        }
        let size, division;
        [this.materialCode, this.thickness, size, division] = segs;
        [this.unitWidth, this.unitHeight] = size.split('x').map(v => parseInt(v));
        [this.col, this.row] = division.split('x').map(v => parseInt(v));
        this.planWidth = this.unitWidth * this.col;
        this.planHeight = this.unitHeight * this.row;
    }

    //调整plan，确保其母板为横向摆放，该操作可能会交换其中 width height col row
    //一般用于输出图形
    landscape(){
        if(this.planWidth < this.planHeight){
            [this.unitWidth, this.unitHeight] = [this.unitHeight, this.unitWidth];
            [this.col, this.row] = [this.row, this.col];
            [this.planWidth, this.planHeight] = [this.planHeight, this.planWidth];
        }
    }

    //输出 false  或 {col: 2, row: 3, usage: 0.85}
    match(width, height) {
        if (width > this.planWidth || height > this.planHeight)
            return false;
        let col = parseInt(width / this.unitWidth) + (width % this.unitWidth > 0 ? 1 : 0);
        if (col > this.col) return false;
        let row = parseInt(height / this.unitHeight) + (height % this.unitHeight > 0 ? 1 : 0);
        if (row > this.row) return false;

        let usage = (width * height) / (col * row * this.unitWidth * this.unitHeight);
        return { col, row, usage }
    }

    matchWithRotate(width, height) {
        let res = this.match(width, height);
        //console.log(`1usage: ${res.usage}`)

        if (!res) {   //若放不下
            //翻转尝试
            res = this.match(height, width);
            //console.log(`2rotate usage: ${res.usage}`)

            if (!!res)
                return { isRotate: true, ...res }
            else
                return false;   //翻转也放不下
        }
        else {   //若放得下
            //翻转尝试
            let rres = this.match(height, width);
            //console.log(`3rotate usage: ${rres.usage}`)

            if (!!rres && rres.usage > res.usage){   //如果翻转也能放下，而且更优化
                return { isRotate: true, ...rres };
            }
            else
                return { isRotate: false, ...res };
        }
    }
}
