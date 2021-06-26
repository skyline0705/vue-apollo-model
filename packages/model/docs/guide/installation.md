# 安装

### 1. 依赖安装
```shell
npm i --save vue-apollo-model xstream reflect-metadata
```
或
```shell
yarn add vue-apollo-model xstream reflect-metadata
```
> 如果需要使用graphql相关功能，请记得安装以下依赖
> ```shell
> npm i --save graphql apollo-client apollo-link-http apollo-cache-inmemory graphql-tag apollo-link-schema
> ```
> 或
> ```shell
> yarn add graphql apollo-client apollo-link-http apollo-cache-inmemory apollo-link-schema graphql-tag
> ```
> ::: tip 注意
> 后续版本中，会逐步移除对apollo-client的依赖，变更由框架本身提供通用client的方式。
> :::

在你的应用中创建一个ApolloClient实例

```javascript
import { HttpLink } from 'apollo-link-http';
import { createApolloClient } from 'vue-apollo-model/dist/clients/gql';

export const defaultApolloClient = createApolloClient(
    new HttpLink({
        // 接口相对应的绝对路径
        uri: 'http://localhost:5100/graphql',
    }),
    'browser',
);
```

::: tip 注意
服务端渲染需要使用不同的env类型：'node'，详情请参考[服务端渲染](./server-side-render.md)
:::

在你的应用中创建一个RestClient实例

```javascript
import { createRestClient } from 'vue-apollo-model/dist/clients/rest';
export const defaultRestClient = createRestClient({
    // 在这里对JSON Data进行统一转换
    responseTransformer(data) {
        if (data.result !== 1) {
            return Promise.reject(data);
        }
        return data;
    },
    // 在这里触发response的副作用
    async responsePreHandler(response) {
    },
    // 设定header相关信息
    headers: {
        'content-type': 'application/json',
    },
    // 临时功能，接口超时设置
    _timeout: 10 * 1000,
});
```

### 2. 定义全局Store
```javascript
import { Store } from 'vue-apollo-model';
import { defaultApolloClient, defaultRestClient } from './clients';
export default function createApp() {
    const app = new Vue({
        render: (h) => h(mainApp),
        apolloStore: new Store({
            gql: {
                defaultClient: defaultApolloClient,
                // 用于不同类型的请求
                clients: {
                    aClient: defaultApolloClient,
                },
            },
            rest: {
                defaultClient: defaultRestClient,
                // 用于不同类型的请求
                clients: {
                    aClient: defaultRestClient,
                },
            }
        }),
        router,
    });
    return {
        app,
        router,
    };
}

```

现在，您已经完成成所有的准备工作，可以开始使用VueApolloModel了
