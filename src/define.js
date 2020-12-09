

const _define = {
    USER_KEY: "user",

    STORE_KEY: "shape-reviewer-v1",

    CACHE_PREFIX: 'save:',
    KEY_TEMP_FILE: 'tempFile',
    KEY_CONFIG: 'config',

    WORKER_METHOD: {
        PARSE_DXF: 'PARSE_DXF',
        SELECT: 'SELECT',
        DELETE: 'DELETE',
        BREAK: 'BREAK',
        PATCH: 'PATCH',
        SAVE: 'SAVE',
        LOAD: 'LOAD',
        UNDO: 'UNDO',
        REDO: 'REDO',
        SET_LAYER: 'SET_LAYER',
        SET_BORDER: 'SET_BORDER',
        STATISTIC: 'STATISTIC',
    },

    LAYER_COLOR_WELLKNOWN: {
        layer_cut: 'red',
        layer_carve: 'blue',
        layer_fill: 'gray'
    },
    

    GRAPH_TYPE: {
        LAYERS: 'layers',
        BORDER: 'border',
        ORIGN: 'origin',
        THUMBNAIL: 'thumbnail',
    },

};

export default _define
