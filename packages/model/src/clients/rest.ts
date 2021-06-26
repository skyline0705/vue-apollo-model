import { Method, ContentType, Credentials, Headers } from '../types';

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
function shimStringify(obj: any) {
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

export interface RequestParams {
    url: string;
    method?: Method;
    credentials?: Credentials;
    mode?: 'no-cors' | 'cors' | 'same-origin';
    data?: Record<string, any>;
    headers?: Headers;
    query?: Record<string, any>
}
export interface RestOptions {
    uri?: string;
    headers?: Headers;
    requestTransformer?: (params: RequestParams) => any;
    responseTransformer?: (data: any) => any;
    responsePreHandler?: (data: Response) => any;
    // TODO临时加的timeout，后面需要重构的，所以先对付用着
    _timeout?: number;
}

const requestTransformerMap: Record<ContentType, (data: any) => string | FormData> = {
    'application/json': data => JSON.stringify(data),
    'multipart/form-data': data => {
        const formData = new FormData();
        for (const name in data) {
            formData.append(name, data[name]);
        }
        return formData;
    },
    'application/x-www-form-urlencoded': data => shimStringify(data)
}

export function createRestClient({
    uri = '',
    headers,
    responseTransformer,
    requestTransformer,
    responsePreHandler,
    _timeout
}: RestOptions = {}) {
    const defaultHeaders: Headers = {
        'content-type': 'application/json',
        ...headers,
    };
    return function request(params: RequestParams) {
        params = requestTransformer
            ? requestTransformer(params)
            : params;

        const data = params.data;
        const method = params.method?.toUpperCase() || defaultHeaders.method.toUpperCase() || 'GET';
        const credentials = params.credentials || 'include';
        const url = method === 'GET' && data
            ? `${uri}${params.url}?${shimStringify(data)}`
            : `${uri}${params.url}`;
        const headers: Record<string, any> = {
            ...defaultHeaders,
            ...params.headers,
        };
        const defaultRequestTransformer = requestTransformerMap[headers['content-type'] as Headers['content-type'] || 'application/json'];
        let body: string | FormData | undefined;
        if (method === 'GET') {
            body === undefined;
        } else {
            body = defaultRequestTransformer(data);
        }
        if (body instanceof FormData) {
            // form-data的话header交由浏览器自己计算
            delete headers['content-type'];
        } else if (headers['content-type'] === 'application/x-www-form-urlencoded') {
            headers['content-type'] = headers['content-type'] + ';charset=UTF-8';
        }
        // preload fetch情况下不允许携带content-type参数
        if (headers['forbid-content-type']) {
            delete headers['forbid-content-type'];
            delete headers['content-type'];
        }
        // TODO写的太脏了……
        const timeoutPromise = new Promise((resolve, reject) => {
            setTimeout(() => reject('timeout'), typeof _timeout !== 'undefined' && _timeout >= 0 ? _timeout : 60 * 1000);
        });

        const fetchPromise = fetch(url, {
            method,
            credentials,
            mode: params.mode || 'cors',
            headers,
            body,
        });

        return Promise
            .race([timeoutPromise, fetchPromise])
            .then((res) => {
                if (responsePreHandler) {
                    // 有可能是response有可能是timeout或者其它error，用这里搞一下……
                    const clone = (res as Response).status
                        ? (res as Response).clone()
                        : res;
                    responsePreHandler(clone as Response);
                }
                return res as Response;
            })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(responseTransformer);
    }
}
