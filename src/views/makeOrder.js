import React, { useState, useRef, useEffect } from 'react';
import { useHistory } from "react-router-dom";

import { List, Popconfirm, Space, Tooltip, Button, Badge, Spin } from 'antd';
import {
    MessageOutlined, LikeOutlined, StarOutlined,
    PlusOutlined, DeleteOutlined, ArrowRightOutlined,
    BugOutlined, FileOutlined
} from '@ant-design/icons';



import 'antd/dist/antd.less';
//import "./cloudList.css";


/* 
[
    {
      "name": "普通椴木板",
      "code": "basswoodSimple",
      "description": "普通椴木板\n\n----\n\n价格便宜量又足。公差0.2mm。切缝0.1mm。\n\n",
      "category": "木材-椴木",
      "images": [
        {
          "width": 480,
          "height": 480,
          "url": "/uploads/basswood_sheet1_11dac5aae5.jpeg"
        },
        {
          "width": 400,
          "height": 400,
          "url": "/uploads/1_4_x_4_x_24_basswood_sheet_product_IMG_0040_04_c2fa6f2eed.jpg"
        }
      ],
      "plans": [
        {
          "station": "华中站",
          "width": 300,
          "height": 200,
          "column": 4,
          "row": 6,
          "price": 20,
          "thickness": 4,
          "name": "普椴板4mm[300x200][4x6]",
        },
        {
          "station": "华中站",
          "width": 400,
          "height": 200,
          "column": 3,
          "row": 5,
          "price": 15,
          "thickness": 3,
          "name": "普椴板6mm[300x200][4x6]"
        }
      ]
    }
  ]


  //转换为


options:{
    "木材": {
        selected: true,
        options:{
            "椴木":{
                selected: true,
                options:{
                    "basswoodSimple":{
                        selected: true,
                        label: "普通椴木板",

                        "description": "普通椴木板,价格便宜量又足。公差0.2mm。切缝0.1mm。",
                        "images": [...],
                        options:{
                            "4mm":{
                                selected: true,
                                options:{
                                    "300x200-4x6":{
                                        selected: true,
                                        label: "普椴板4mm[300x200][4x6]"

                                        "station": "华中站",
                                        "price": 15,
                                        "thickness": 4,
                                        "width": 300,
                                        "height": 200,
                                        "column": 4,
                                        "row": 6,
                                    },
                                }
                                
                            },
                            "3mm":{
                                options:{
                                    "400x200-3x5":{
                                        label: "普椴板3mm[400x200][3x6]"

                                        "station": "华中站",
                                        "price": 20,
                                        "thickness": 3,
                                        "width": 300,
                                        "height": 200,
                                        "column": 4,
                                        "row": 6,
                                    }
                                }
                            }
                        }
                    }
                }
            } 
        }
    },
}


 */
function materialInfo2Options(info){

}



function makeOrder({ }) {

    const [materialInfo, setMaterialInfo] = useState({});

    useEffect(() => {
        setMaterialInfo([]);

        fetch(`${config.SOURCE.dataSource}/sheet-materials`).then((response) => response.json())
            .then((obj) => {

            })
    }, [docPath]);

    return null;
}


export default CloudList;
