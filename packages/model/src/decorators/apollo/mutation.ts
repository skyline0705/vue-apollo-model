import { ApolloMutationOptions, MutationVariablesFn } from '../../types';
import { BaseModel } from '../../model';
import Vue from 'vue';
import { ApolloClient } from 'apollo-client';
import { initDataType } from '../utils';

export class ApolloMutation<P extends BaseModel, T> {
    private option: ApolloMutationOptions<P>;
    private model: P;
    private vm: Vue;
    private client: ApolloClient<any>
    data?: T;
    loading = false;
    error: any;

    constructor(
        option: ApolloMutationOptions<P>,
        model: P,
        vm: Vue,
        client: ApolloClient<any>,
    ) {
        this.option = option;
        this.client = client;
        this.model = model;
        this.vm = vm;
        initDataType(this);
    }
    private variables<T>(params: T) {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as MutationVariablesFn<P>).call(
                this.model,
                params,
                this.vm.$route,
            );
        }
        return params;
    }
    mutate(params: any) {
        this.loading = true;
        this.error = null;
        return this.client.mutate<T>({
            mutation: this.option.mutation,
            variables: this.variables(params),
        }).then(({ data }) => {
            if (data) {
                this.data = data;
            }
        }).catch(e => {
            this.error = e
        }).finally(() => this.loading = false);
    }
}
