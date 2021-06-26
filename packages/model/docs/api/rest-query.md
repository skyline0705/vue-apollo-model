# restQuery

在Model上定义一个Rest Query

## 选项

### url
字符串或者返回字符串的一个函数。

例如：
```javascript
{
    url: '/live/26391'
}
```
或
```javascript
{
    url(variables: Variables, $route) {
        return `/live/${variables.id}`;
    }
}
```
如果使用的是url函数，则函数中第一个参数为当前query定义的variables，第二个函数为当前vue-router的$route，this指向为当前model。

### method
可选参数，http请求发送的类型，类型同[HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)，默认值为`GET`


### headers
可选参数，http请求发送时所携带的headers。

其中需要关注的部分为`content-type`，请求发送时会根据`content-type`的不同值来决定如何处理`variables`

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
重新获取查询，可选择使用新变量。
