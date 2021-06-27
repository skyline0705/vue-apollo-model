# apolloMutation

在Model上定义一个GraphQL Mutation，0.6.12版本之后引入。

## 选项

### client
client string，当前mutation所使用的client，具体参考[multi clients配置](../guide/store.md#multi-client)

### mutation
GraphQL文档，定义一个graphql mutation查询

例如
```javascript
{
    mutation: gql`
        mutation commit($data: String) {
            commit(data: $data) {
                result
            }
        }
    `,
}
```

### variables
对象或返回对象的响应式函数，执行mutation变更时所携带的参数。

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
    variables({ data }: CommitParams, $route) {
        return {
            data,
            id: this.id || $route.params.id
        };
    }
}
```
如果使用的是variables函数，则函数中第一个参数为手动调用`mutate`方法是所传入的参数，第二个函数为当前vue-router的$route，this指向为当前model。

## 属性
### data
返回当前mutation执行后的结果，其结果为响应式数据

### loading
布尔值，当前mutation是否处于请求状态
### error
如果当前mutation查询发生错误，返回当前mutation的查询错误信息，其结果为响应式数据；否则为null
## 方法

### mutate
发起mutation请求，因调用`mutate`时，可能需要View（vue component）中的UI State作为请求参数的补充，顾此部分所传入的参数，将提供给上方所描述的[variables](#variables)拼装时使用