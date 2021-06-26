/**
 * @file apollo query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 30, 2018
 */

import Vue from 'vue';
import { ObservableQuery, ApolloClient } from 'apollo-client';
import { ApolloQueryOptions, VariablesFn, ApolloFetchMoreOptions } from '../../types';
import { BaseModel } from '../../model';
import xstream, { Stream } from 'xstream';
import { initDataType } from '../utils';
export class ApolloQuery<ModelType extends BaseModel, DataType> {
    observer!: ObservableQuery<DataType>;
    observable: Stream<{loading: boolean, data: DataType}> = xstream.create();

    private option: ApolloQueryOptions<ModelType>;
    private client: ApolloClient<any>;
    private listeners: Array<() => void> = [];
    private model: ModelType;
    private vm: Vue;
    private hasPrefetched = false;

    loading: boolean = false;
    data?: DataType;
    error: any;

    constructor(
        option: ApolloQueryOptions<ModelType>,
        model: ModelType,
        vm: Vue,
        client: ApolloClient<any>,
    ) {
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;

        initDataType(this);
    }

    // TODO后面应该要把fetchMore，refetch什么的都干掉才行……否则这块就是乱的= =
    // 这里干的事情其实跟ObservableQuery干的事情有非常大的重合度……
    private currentResult() {
        if (this.observer) {
            return this.observer.currentResult();
        }
        return {
            loading: true,
            data: {},
        };
    }

    prefetch() {
        const canPrefetch = typeof this.option.prefetch === 'function'
            ? this.option.prefetch.call(this.model, this.vm.$route)
            : this.option.prefetch;

        if (!canPrefetch || this.hasPrefetched) {
            return;
        }
        this.loading = true;
        return this.client.query<DataType>({
            ...this.queryOptions,
            fetchPolicy: this.queryOptions.fetchPolicy === 'cache-and-network'
                ? 'cache-first'
                : this.queryOptions.fetchPolicy
        }).then(({ data }) => {
            this.loading = false;
            this.hasPrefetched = true;
            this.data = data;
            return data;
        }).catch(err => {
            this.loading = false;
            this.error = err;
        });
    }

    private initObserver() {
        this.observer = this.client.watchQuery(this.queryOptions);
        // 需要初始化watchQuery以后，currentResult才能拿到结果
        const initialData = this.currentResult();
        if (!initialData.loading) {
            this.data = initialData.data as DataType;
        }
        this.loading = true;
        this.observer.subscribe({
            next: ({data, loading}) => {
                this.error = null;
                if (data) {
                    this.data = data;
                }
                this.loading = loading;
                this.observable.shamefullySendNext({data, loading});
            },
            error: err => {
                this.loading = false;
                this.error = err;
                this.observable.shamefullySendError(err);
            },
            complete: () => {
                this.error = null;
                this.loading = false;
                this.observable.shamefullySendComplete();
            },
        });
    }

    init() {
        if (!this.skip) {
            this.initObserver();
        }

        const watcher = this.vm.$watch(() => [
            this.variables,
            this.skip,
            this.pollInterval,
        ], (newV, oldV) => {
            // TODO短时间内大概率会触发两次判断，具体原因未知= =
            if (newV.some((v, index) => JSON.stringify(oldV[index]) !== JSON.stringify(v))) {
                this.changeOptions();
            }
        });
        this.listeners.push(watcher);
    }

    private get pollInterval() {
        if (typeof this.option.pollInterval === 'function') {
            return this.option.pollInterval.call(this.model, this.vm.$route);
        }
        return this.option.pollInterval;
    }

    private get skip() {
        if (typeof this.option.skip === 'function') {
            return this.option.skip.call(this.model, this.vm.$route);
        }
        return this.option.skip;
    }
    private get variables() {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as VariablesFn<ModelType>).call(this.model, this.vm.$route);
        }
        return this.option.variables;
    }
    private get queryOptions() {
        return {
            ...this.option,
            variables: this.variables,
            skip: this.skip,
            pollInterval: this.pollInterval,
        };
    }

    private changeOptions = () => {
        this.vm.$nextTick(() => {
            if (this.skip) {
                return;
            }
            if (!this.observer) {
                this.initObserver();
            } else {
                this.observer.setOptions({
                    ...this.queryOptions,
                }).then(result => {
                    // TODO太二了……缓存是不会走到Observable里的，所以需要手动处理
                    if (!result || !result.data) {
                        return;
                    }

                    this.data = result.data as DataType;
                    this.loading = result.loading;
                    this.observable.shamefullySendNext(result as {
                        loading: boolean;
                        data: DataType;
                    });
                });
            }
        });
    }

    destroy() {
        this.listeners.forEach(unwatch => unwatch());
        this.listeners = [];
    }

    fetchMore({ variables, updateQuery } : ApolloFetchMoreOptions<DataType>) {
        if (!this.observer) {
            return;
        }
        this.loading = true;
        return this.observer.fetchMore({
            variables,
            updateQuery: (prev, { fetchMoreResult } ) => {
                if (!fetchMoreResult) {
                    return prev;
                }
                return {
                    // TODO等后面特么的把apollo-client干掉，这里就不需要了
                    // @ts-ignore
                    __typename: prev.__typename,
                    ...updateQuery(prev, fetchMoreResult),
                };
            },
        });
    }

    // refetch 只会手动调用
    // refetch 调用的时候不需要管！
    refetch() {
        if (!this.observer) {
            return;
        }
        this.loading = true;
        return this.observer.refetch(this.variables);
    }
}
