import { ApolloMutationOptions, MutationVariablesFn } from '../../types';
import { BaseModel } from '../../model';
import Vue from 'vue';
import { ApolloClient } from 'apollo-client';
import { initDataType } from '../utils';
import { UnwrapRef } from '@vue/composition-api';

export function createApolloMutation<Model extends BaseModel, DataType>(
    option: ApolloMutationOptions<Model>,
    model: Model,
    vm: Vue,
    client: ApolloClient<any>
) {
    const info = initDataType<DataType>();
    function variables(params: DataType) {
        if (option.variables && typeof option.variables === 'function') {
            return (option.variables as MutationVariablesFn<Model>).call(
                model,
                params,
                vm.$route,
            );
        }
        return params;
    }

    return {
        info,
        mutate(params: any) {
            info.loading = true;
            info.error = null;
            return client.mutate<UnwrapRef<DataType>>({
                mutation: option.mutation,
                variables: variables(params),
            }).then(({ data }) => {
                if (data) {
                    info.data = data;
                }
            }).catch(e => {
                info.error = e
            }).finally(() => {
                info.loading = false
            });
        }
    };
}
