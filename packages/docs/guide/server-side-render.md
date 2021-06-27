# 服务端渲染

:::warning 注意
服务端渲染功能依赖Vue.js 2.6+的serverPrefetch钩子
:::

## 创建 Apollo 客户端
由于在服务端每次请求都会产生不同的上下文，而ApolloClient请求时会依赖上下文信息，故需要为每次渲染上下文生成一个新的ApolloClient。

例如：
```javascript
// 参考https://www.apollographql.com/docs/link/links/schema
import { SchemaLink } from 'apollo-link-schema';
import { createApolloClient } from 'vue-apollo-model/dist/clients/gql';
// schema为整体项目的GraphQLSchema
import schema from '../graphql/schema';
// 假设后端所使用的node http服务为koa
export const defaultApolloClient = createApolloClient(
    new SchemaLink({
        schema,
        context: koaContext,
    }),
    'node',
);
```
在示例中，我们假设API Proxy服务器与Server Render服务器在同一个应用内，故而此处使用`SchemaLink`，您也可以根据您的需要自行进行定制。

## 状态注入
由于在服务端渲染完成后，需要将当前应用状态注入到页面内，以供客户端完成hydration，故需要使用初始化App应用时所使用的store进行状态还原。

例如：
```javascript
// server-entry.js
export default (context: any) => {
    return new Promise((resolve, reject) => {
        const { uaInfo, graphqlClient } = context;
        const { app, router, store } = createApp({
            graphqlClient,
            uaInfo,
        });
        context.meta = app.$meta();
        router.push(context.url);
        router.onReady(async () => {
            context.rendered = () => {
                context.apolloState = store.exportStates();
            };
            resolve(app);
        });
    });
};
```
模板示例如下：
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    {{{ meta.inject().title.text() }}}
    {{{ meta.inject().meta.text() }}}
    <meta name="renderer" content="webkit">
    <meta name="referrer" content="always">
    {{{renderResourceHints()}}}
    {{{renderStyles()}}}
</head>
<body>
    <!--vue-ssr-outlet-->
    {{{ renderState({ contextKey: 'apolloState', windowKey: '__APOLLO_STATE__' }) }}}
    {{{ renderScripts() }}}
</body>
</html>

```

## 状态还原
在客户端创建ApolloClient实例的时候，可以根据SSR注入的状态信息，对缓存进行还原。

例如：
```javascript
import { HttpLink } from 'apollo-link-http';
import { createApolloClient } from 'vue-apollo-model/dist/clients/gql';

export const defaultApolloClient = createApolloClient(
    new HttpLink({
        // 接口相对应的绝对路径
        uri: 'http://localhost:5100/graphql',
    }),
    'node',
    'defaultClient',
);
```
通过注入第三个参数**restoreKey**来对服务端状态进行还原


