/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Dec 3, 2019
 */

import Vue from 'vue';
import { RestQueryOptions, VariablesFn, RestClient, RestFetchMoreOptions } from '../../types';
import { BaseModel } from '../../model';
import xstream, { Subscription } from 'xstream';
import { initDataType } from '../utils';
import { computed, watch, nextTick, UnwrapRef } from '@vue/composition-api';

export function createRestQuery<ModelType extends BaseModel, DataType>(
    option: RestQueryOptions<ModelType>,
    model: ModelType,
    vm: Vue,
    client: RestClient<UnwrapRef<DataType>>,
) {
    const info = initDataType<DataType>();
    const skip = computed(() => {
        if (typeof option.skip === 'function') {
            return option.skip.call(model, vm.$route);
        }
        return !!option.skip;
    });

    const pollInterval = computed(() => {
        if (typeof option.pollInterval === 'function') {
            return option.pollInterval.call(model, vm.$route);
        }
        return option.pollInterval || 0;
    });

    const variables = computed(() => {
        if (typeof option.variables === 'function') {
            return (option.variables as VariablesFn<ModelType>).call(model, vm.$route);
        }
        return option.variables;
    });

    const url = computed(() => {
        if (typeof option.url === 'function') {
            return option.url.call(model, vm.$route, variables);
        }
        return option.url;
    });

    const variablesComputed = computed(() => [variables.value, skip.value, url.value]);

    let pollIntervalSub: Subscription | null = null;

    function changeVariables() {
        nextTick(() => {
            if (skip.value) {
                return;
            }
            if (pollIntervalSub) {
                // 参数改变等待下次interval触发
                return;
            }
            refetch();
        });
    }

    const variablesWatcher = watch(() => variablesComputed.value, (newV, oldV) => {
        // TODO短时间内大概率会触发两次判断，具体原因未知= =
        if (newV.some((v, index) => oldV[index] !== v)) {
            changeVariables();
        }
    });

    function refetch() {
        info.loading = true;
        // TODO差缓存数据做SSR还原
        return new Promise(resolve => {
            client({
                url: url.value,
                headers: option.headers,
                credentials: option.credentials,
                method: option.method,
                data: variables.value,
            }).then(data => {
                info.error = null;
                if (data) {
                    info.data = data;
                }
                info.loading = false;
                resolve(undefined);
            }).catch(e => {
                info.error = e;
                info.loading = false;
                resolve(undefined);
            });
        });
    }

    function changePollInterval() {
        nextTick(() => {
            if (pollIntervalSub) {
                pollIntervalSub.unsubscribe();
                pollIntervalSub = null;
            }
            if (!pollInterval) {
                return;
            }
            pollIntervalSub = xstream
                .periodic(pollInterval.value)
                .subscribe({
                    next: () => refetch(),
                });
        });
    }

    const intervalWatcher = watch(() => pollInterval.value, (newV, oldV) => {
        // TODO短时间内大概率会触发两次判断，具体原因未知= =
        if (newV !== oldV) {
            changePollInterval();
        }
    });

    function init() {
        if (!skip.value) {
            refetch();
            changePollInterval();
        }
    }

    function destroy() {
        intervalWatcher();
        variablesWatcher();
        pollIntervalSub?.unsubscribe();
        pollIntervalSub = null;
    }

    function fetchMore({ variables, updateQuery } : RestFetchMoreOptions<UnwrapRef<DataType>>) {
        return new Promise(resolve => {
            info.loading = true;
            client({
                url: url.value,
                headers: option.headers,
                method: option.method,
                data: variables,
            }).then(data => {
                info.error = null;
                info.data = data ? updateQuery(data, data) : data;
                info.loading = false;
                resolve(undefined);
            }).catch(e => {
                info.error = e;
                info.loading = false;
                resolve(undefined);
            });
        });
    }

    function prefetch() {
        // TODO
    }

    return {
        info,
        init,
        refetch,
        fetchMore,
        destroy,
        prefetch,
    };
}
