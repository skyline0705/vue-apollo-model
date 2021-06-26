function stringifyPrimitive(v: string | boolean | number) {
    switch (typeof v) {
        case 'string':
            return v;
        case 'boolean':
            return v ? 'true' : 'false';
        case 'number':
            return isFinite(v) ? v : '';
        default:
            return '';
    }
};
function encode(v: string | boolean | number) {
    return encodeURIComponent(stringifyPrimitive(v));
}
// 简单做下key的排序是为了做缓存key那里，临时性解决，后面可能做细粒度优化
export function shimStringify(obj: any) {
    if (obj === null) {
        obj = undefined;
    }
    if (typeof obj !== 'object') {
        throw new Error('Params stringify Error, only support object');
    }
    return Object.keys(obj).map(k => {
        const key = encode(k) + '=';
        if (Array.isArray(obj[k])) {
          return obj[k].map((v: any) => {
            return key + encode(v);
          }).join('&');
        }
        return key + encode(obj[k]);
    }).join('&');
}