/**
 * @file rest query
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Dec 3, 2019
 */

import Vue from 'vue';
import { RestMutationOptions, MutationVariablesFn, RestClient } from '../../types';
import { BaseModel } from '../../model';
import { initDataType } from '../utils';
import { UnwrapRef } from '@vue/composition-api';

export function createRestMutation<ModelType extends BaseModel, DataType>(
    option: RestMutationOptions<ModelType>,
    model: ModelType,
    vm: Vue,
    client: RestClient<UnwrapRef<DataType>>,
){
    const info = initDataType<DataType>();
    function variables<T>(params: T) {
        if (option.variables && typeof option.variables === 'function') {
            return (option.variables as MutationVariablesFn<ModelType>).call(
                model,
                params,
                vm.$route,
            );
        }
        return params;
    }

    function url<T>(params: T) {
        if (option.url && typeof option.url === 'function') {
            return option.url.call(
                model,
                vm.$route,
                params,
            );
        }
        return option.url;
    }

    function mutate<T>(params: T) {
        info.loading = true;
        info.error = null;
        return client({
            url: url(variables(params)),
            headers: option.headers,
            credentials: option.credentials,
            method: option.method,
            data: variables(params),
        }).then(data => {
            info.error = null;
            if (data) {
                info.data = data;
            }
            info.loading = false;
        }).catch(e => {
            info.error = e;
            info.loading = false;
        });
    }

    return {
        info,
        mutate,
    };
}
