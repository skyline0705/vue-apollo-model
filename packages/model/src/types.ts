/**
 * @file 类型声明
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 29, 2018
 */

import { Route } from 'vue-router';
import Vue from 'vue';
import { Stream } from 'xstream';
import { ApolloClient, WatchQueryOptions } from 'apollo-client';

import Store from './store';
import { BaseModel } from './model';
import { DocumentNode } from 'graphql';

import { RequestParams } from './clients/rest';
export type Constructor<T> = new (...args: any[]) => T;

export type ContentType = 'application/json'
    | 'multipart/form-data'
    | 'application/x-www-form-urlencoded';

export type Credentials = 'include' | 'same-origin' | 'omit';

export type Headers = {
    'content-type'?: ContentType;
} & Record<string, any>

export type Method = 'get'
    | 'GET'
    | 'post'
    | 'POST'
    | 'delete'
    | 'DELETE'
    | 'put'
    | 'PUT'
    | 'patch'
    | 'PATCH'
    | 'options'
    | 'OPTIONS'
    | 'head'
    | 'HEAD'
    | 'trace'
    | 'TRACE'
    | 'connect'
    | 'CONNECT';

export interface StoreModelInstance<T> {
    constructor: Constructor<T>;
    instance: T | null;
    count: number;
}

declare module 'vue/types/vue' {
    interface Vue {
        apolloStore?: Store;
    }
}

declare module 'vue/types/options' {
    interface ComponentOptions<V extends Vue> {
        apolloStore?: Store;
    }
}

interface ModelInfo<T> {
    constructor: Constructor<T>;
    instance: T;
    count: number;
}

export type ModelMap<T extends typeof BaseModel> = Record<string, ModelInfo<T>>

// TODO貌似这个类型定义是不对的，后面看看any是否可被替换
export type StreamsObj = Record<string, Stream<any>>;

export type VariablesFn<T> = (this: T, route: Route) => Record<string, any>
export type MutationVariablesFn<T> = (this: T, params: any, route: Route) => Record<string, any>
export type BooleanFn<T> = (this: T, route: Route) => boolean;
export type NumberFn<T> = (this: T, route: Route) => number;
export type UrlFn<T> = (this: T, route: Route, variables: Record<string, any> | undefined) => string;
export type ApolloQueryOptions<T extends BaseModel> = {
    query: DocumentNode;
    client?: string;
    fetchPolicy?: WatchQueryOptions['fetchPolicy'];
    variables?: VariablesFn<T> | Record<string, any>;
    prefetch?: BooleanFn<T> | boolean;
    skip?: BooleanFn<T> | boolean;
    pollInterval?: NumberFn<T> | number;
}

export type ApolloFetchMoreOptions<DataType> = {
    variables?: Record<string, any>;
    updateQuery(prev: DataType, next: DataType): DataType;
}

export type RestFetchMoreOptions<DataType> = {
    variables?: Record<string, any>;
    updateQuery(prev?: DataType, next?: DataType): DataType;
}

export type RestQueryOptions<T extends BaseModel> = {
    url: UrlFn<T> | string;
    method?: Method;
    credentials?: Credentials;
    headers?: Headers;
    variables?: VariablesFn<T> | Record<string, any>;
    skip?: BooleanFn<T> | boolean;
    client?: string;
    pollInterval?: NumberFn<T> | number;
}

export type ApolloMutationOptions<T extends BaseModel> = {
    client?: string;
    mutation: DocumentNode;
    variables: MutationVariablesFn<T> | Record<string, any>,
}

export type RestMutationOptions<T extends BaseModel> = {
    client?: string;
    url: UrlFn<T> | string;
    method?: Method;
    credentials?: Credentials;
    headers?: Headers
    variables?: MutationVariablesFn<T> | Record<string, any>,
}

export type QueryResult<T = any> = {
    refetch(): Promise<void>;
    data?: T;
    loading: boolean;
    fetchMore(options: ApolloFetchMoreOptions<T>): Promise<void>;
    error: any;
}

export type MutationResult<T, P> = {
    loading: boolean;
    data?: P;
    mutate(args0: T, args1?: any): Promise<void>;
    error: any;
}

export type RestClient<T> = (params: RequestParams) => Promise<T>;

export type RestClients = {
    defaultClient: RestClient<any>;
    clients?: Record<string, RestClient<any>>;
}

export type GraphqlClients = {
    defaultClient: ApolloClient<any>;
    clients?: Record<string, ApolloClient<any>>;
}
export type VueApolloModelMetadata<T extends BaseModel> = {
    type: 'apolloQuery';
    detail: ApolloQueryOptions<T>;
} | {
    type: 'apolloMutation';
    detail: ApolloMutationOptions<T>;
} | {
    type: 'restQuery';
    detail: RestQueryOptions<T>;
} | {
    type: 'restMutation';
    detail: RestMutationOptions<T>;
};