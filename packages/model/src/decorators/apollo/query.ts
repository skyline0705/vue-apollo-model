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
import { computed, UnwrapRef, watch, nextTick } from '@vue/composition-api';

export function createApolloQuery<ModelType extends BaseModel, DataType>(
    option: ApolloQueryOptions<ModelType>,
    model: ModelType,
    vm: Vue,
    client: ApolloClient<any>,
) {
    const info = initDataType<DataType>();

    let hasPrefetched = false;

    const pollInterval = computed(() => {
        if (typeof option.pollInterval === 'function') {
            return option.pollInterval.call(model, vm.$route);
        }
        return option.pollInterval;
    });

    const skip = computed(() => {
        if (typeof option.skip === 'function') {
            return option.skip.call(model, vm.$route);
        }
        return option.skip;
    });

    const variables = computed(() => {
        if (option.variables && typeof option.variables === 'function') {
            return (option.variables as VariablesFn<ModelType>).call(model, vm.$route);
        }
        return option.variables;
    });


    const queryOptions = computed(() => {
        return {
            ...option,
            variables: variables.value,
            skip: skip.value,
            pollInterval: pollInterval.value,
        };
    });

    function prefetch() {
        const canPrefetch = typeof option.prefetch === 'function'
            ? option.prefetch.call(model, vm.$route)
            : option.prefetch;

        if (!canPrefetch || hasPrefetched) {
            return;
        }
        info.loading = true;
        return client.query<UnwrapRef<DataType>>({
            ...queryOptions.value,
            fetchPolicy: queryOptions.value.fetchPolicy === 'cache-and-network'
                ? 'cache-first'
                : queryOptions.value.fetchPolicy
        }).then(({ data }) => {
            info.loading = false;
            hasPrefetched = true;
            info.data = data;
            return data;
        }).catch(err => {
            info.loading = false;
            info.error = err;
        });
    }

    let observer: ObservableQuery<UnwrapRef<DataType>> | null = null;
    const observable: Stream<{loading: boolean, data: UnwrapRef<DataType>}> = xstream.create();

    function currentResult() {
        if (observer) {
            return observer.currentResult();
        }
        return {
            loading: true,
            data: {},
        };
    }

    function initObserver() {
        observer = client.watchQuery(queryOptions.value);
        // 需要初始化watchQuery以后，currentResult才能拿到结果
        const initialData = currentResult();
        if (!initialData.loading) {
            info.data = initialData.data as UnwrapRef<DataType>;
        }
        info.loading = true;
        observer.subscribe({
            next: ({data, loading}) => {
                info.error = null;
                if (data) {
                    info.data = data;
                }
                info.loading = loading;
                observable.shamefullySendNext({data, loading});
            },
            error: err => {
                info.loading = false;
                info.error = err;
                observable.shamefullySendError(err);
            },
            complete: () => {
                info.error = null;
                info.loading = false;
                observable.shamefullySendComplete();
            },
        });
    }

    const optionsComputed = computed(() => [
        variables.value,
        skip.value,
        pollInterval.value,
    ]);

    const optionsWatcher = watch(() => optionsComputed.value, (newV, oldV) => {
        // TODO短时间内大概率会触发两次判断，具体原因未知= =
        if (newV.some((v, index) => oldV[index] !== v)) {
            changeOptions();
        }
    });

    function changeOptions() {
        nextTick(() => {
            if (skip.value) {
                return;
            }
            if (!observer) {
                initObserver();
            } else {
                observer.setOptions({
                    ...queryOptions.value,
                }).then(result => {
                    // TODO太二了……缓存是不会走到Observable里的，所以需要手动处理
                    if (!result || !result.data) {
                        return;
                    }

                    info.data = result.data;
                    info.loading = result.loading;
                    observable.shamefullySendNext(result);
                });
            }
        });
    }

    function init() {
        if (!skip.value) {
            initObserver();
        }
    }

    function destroy() {
        optionsWatcher();
    }

    function fetchMore({ variables, updateQuery } : ApolloFetchMoreOptions<UnwrapRef<DataType>>) {
        if (!observer) {
            return;
        }
        info.loading = true;
        return observer.fetchMore({
            variables,
            updateQuery: (prev, { fetchMoreResult } ) => {
                if (!fetchMoreResult) {
                    return prev;
                }

                const data = updateQuery(prev, fetchMoreResult);
                return {
                    // TODO等后面特么的把apollo-client干掉，这里就不需要了
                    // @ts-ignore
                    __typename: prev.__typename,
                    // TODO等后面特么的把apollo-client干掉，这里就不需要了
                    // @ts-ignore
                    ...data,
                };
            },
        });
    }

    // refetch 只会手动调用
    // refetch 调用的时候不需要管！
    function refetch() {
        if (!observer) {
            return;
        }
        info.loading = true;
        return observer.refetch(variables.value);
    }

    return {
        info,
        prefetch,
        init,
        destroy,
        fetchMore,
        refetch,
    };
}
