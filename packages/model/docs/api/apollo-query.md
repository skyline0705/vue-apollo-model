# apolloQuery

在Model上定义一个GraphQL Query

## 选项

### client
client string，当前query所使用的client，具体参考[multi clients配置](../guide/store.md#multi-client)

### query
GraphQL文档，定义一个graphql query查询

例如
```javascript
{
    query: gql`
        query userInfo($id: String) {
            userInfo(id: $id) {
                name
                description
                sex
            }
        }
    `
}
```

### variables
对象或返回对象的响应式函数，执行query查询时所携带的参数。

例如：
```javascript
{
    variables: {
        id: 1
    }
}
```
或
```javascript
{
    variables($route) {
        return {
            id: this.id || $route.params.id
        };
    }
}
```
如果使用的是variables函数，则函数中第一个函数为当前vue-router的$route，this指向为当前model。

### prefetch
布尔值，是否启用服务端预取，默认值为false。

例如：
```javascript
{
    prefetch: false
}
```

### pollInterval
数字或者返回数字的响应式函数，query的查询间隔，默认值为0，即不使用轮询
例如：
```javascript
{
    pollInterval: 200
}
```
或
```javascript
{
    pollInterval($route) {
        return !this.id && !$route.params.id
            ? 0
            : 100
    }
}
```
如果使用的是pollInterval函数，则函数中第一个函数为当前vue-router的$route，this指向为当前model。

### skip
布尔值或者返回布尔值的响应式函数，是否忽略当前查询，默认值为false。
例如：
```javascript
{
    skip: true
}
```
或
```javascript
{
    skip($route) {
        return !this.id && !$route.params.id
    }
}
```
如果使用的是skip函数，则函数中第一个函数为当前vue-router的$route，this指向为当前model。

### fetchPolicy
query缓存模式，具体请参考[ApolloClient watchQuery](https://www.apollographql.com/docs/react/api/apollo-client#ApolloClient.watchQuery)

## 属性
### data
返回当前query的查询结果，其结果为响应式数据

### loading
布尔值，当前query是否处于请求状态

### error
如果当前query查询发生错误，返回当前query的查询错误信息，其结果为响应式数据；否则为null

## 方法

### refetch
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::
重新获取查询，可选择使用新变量。具体可参考[ApolloClient refetch](https://www.apollographql.com/docs/react/api/apollo-client/#ApolloClient.reFetchObservableQueries)

### fetchMore
:::tip
`beta`功能，后续可能会有改动，进行一定程度封装
:::
为分页加载更多数据，具体可参考[ApolloClient fetchMore](https://www.apollographql.com/docs/react/api/apollo-client#ObservableQuery.fetchMore)