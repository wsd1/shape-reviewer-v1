import React, { useState } from 'react'
import { Select, Space, Input, Button, Tooltip } from 'antd';
import { provins, citys, areas } from '../lib/address';
import "./addressEdit.css";

const { Option } = Select;
const { TextArea } = Input;



export default function AddressEdit({ addr, setAddr, saveAddr, updateAddr }) {
    const [stateEditing, setIsEditing] = useState(false);

    return stateEditing ?
        AddressInput({
            addr, setAddr,
            editComplete: () => { saveAddr(); setIsEditing(false); },
            editGiveup: () => { updateAddr(); setIsEditing(false); }
        }) :
        AddressText({ addr, editStart: () => setIsEditing(true) });
}

function AddressText({ addr, editStart }) {
    let { prov, city, area, detail, phone, consignee } = addr;
    let deliveryText = <span>{'地址未设定'}</span>;
    let isValidAddr = (!!prov && !!city && !!area && !!detail && !!phone && !!consignee);
    if (isValidAddr) {
        deliveryText = prov.endsWith('市') ?
            <><span>{`${prov} ${area}`}</span><br /><span>{detail}</span><br /><span>{`${consignee} ${phone}`}</span></> :
            <><span>{`${prov} ${city} ${area}`}</span><br /><span>{detail}</span><br /><span>{`${consignee} ${phone}`}</span></>;
    }
    //<Button onClick={editStart} type="primary" style={{ float: "right" }}>编辑</Button>
    return <Tooltip placement="bottom" title={"点击编辑"}>
        <div className="address-container" style={isValidAddr?null:{ borderColor: "rgba(250, 28, 28, 0.68)" }}
            onClick={editStart}>{deliveryText}
        </div>
    </Tooltip>


}


function AddressInput({ addr, setAddr, editComplete, editGiveup }) {
    const setProv = prov => {
        //console.log('setPorv:', prov);
        let { prov: orginProv, city: city2set, area: area2set } = addr;
        if (prov !== orginProv) {
            if (!!prov) {
                city2set = citys[prov][0];
                area2set = areas[city2set][0];
            }
            else {
                city2set = area2set = null;
            }
            setAddr({ ...addr, prov, city: city2set, area: area2set });
        }
    };

    const setCity = city => {
        let { city: orginCity, area: area2set } = addr;
        if (city !== orginCity) {
            if (!!city) {
                area2set = areas[city][0];
            }
            else {
                area2set = null;
            }
            setAddr({ ...addr, city, area: area2set });
        }
    };

    const setArea = area => {
        //console.log('setArea:', area);
        let { area: orginArea } = addr;
        if (area !== orginArea) {
            setAddr({ ...addr, area });
        }
    };

    const handleDetail = event => {
        let detail = event.target.value;
        let { detail: orignDetail } = addr;
        if (orignDetail !== detail) {
            setAddr({ ...addr, detail });
        }
    };
    const handleConsignee = event => {
        let consignee = event.target.value;
        let { consignee: orignConsignee } = addr;
        if (orignConsignee !== consignee) {
            setAddr({ ...addr, consignee });
        }
    };
    const handlePhone = event => {
        let phone = event.target.value;
        let { phone: orignPhone } = addr;
        if (orignPhone !== phone) {
            setAddr({ ...addr, phone });
        }
    };



    return (
        <Space direction="vertical" >
            <div>
                <h3>省 市 区</h3>
                <RegionInput {...{ ...addr, setProv, setCity, setArea }} />
            </div>
            <div>
                <h3>具体地址</h3>
                <TextArea value={addr.detail} rows={2} placeholder="街道 小区 楼栋 房间号"
                    onChange={handleDetail} />
            </div>
            <Space>
                <div>
                    <h3> 收件人 </h3>
                    <Input value={addr.consignee} placeholder="姓名"
                        onChange={handleConsignee} />
                </div>
                <div>
                    <h3> 联系电话 </h3>
                    <Input value={addr.phone} placeholder="手机号 或 座机"
                        onChange={handlePhone} />
                </div>
            </Space>

            <Space>
                <Button type="primary" size="large" block onClick={editComplete}>保存设定</Button>
                <Button size="large" block onClick={editGiveup}>放弃修改</Button>
            </Space>
        </Space>
    )
}

function RegionInput({ prov, city, area, setProv, setCity, setArea }) {

    return (
        <Space>
            <Select value={prov} style={{ width: 100 }}
                onChange={setProv}>
                {provins.map(p => <Option value={p} key={p}>{p}</Option>)}
            </Select>
            <Select value={city} style={{ width: 100 }} disabled={!prov}
                onChange={setCity}>
                {!!prov && citys[prov].map(p => <Option value={p} key={p}>{p}</Option>)}
            </Select>
            <Select value={area} style={{ width: 120 }} disabled={!city}
                onChange={setArea}>
                {!!city && areas[city].map(p => <Option value={p} key={p}>{p}</Option>)}
            </Select>
        </Space>
    )
}
