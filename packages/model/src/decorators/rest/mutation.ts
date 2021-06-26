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

export class RestMutation<ModelType extends BaseModel, DataType> {
    private option: RestMutationOptions<ModelType>;
    private client: RestClient<DataType>;
    private model: ModelType;
    private vm: Vue;

    loading: boolean = false;
    data?: DataType;
    error: any;

    constructor(
        option: RestMutationOptions<ModelType>,
        model: ModelType,
        vm: Vue,
        request: RestClient<DataType>,
    ) {
        this.option = option;
        this.model = model;
        this.client = request;
        this.vm = vm;
        initDataType(this);
    }

    private variables<T>(params: T) {
        if (this.option.variables && typeof this.option.variables === 'function') {
            return (this.option.variables as MutationVariablesFn<ModelType>).call(
                this.model,
                params,
                this.vm.$route,
            );
        }
        return params;
    }
    private url<T>(params: T) {
        if (this.option.url && typeof this.option.url === 'function') {
            return this.option.url.call(
                this.model,
                this.vm.$route,
                params,
            );
        }
        return this.option.url;
    }
    mutate<T>(params: T) {
        this.loading = true;
        this.error = null;
        return this.client({
            url: this.url(this.variables(params)),
            headers: this.option.headers,
            credentials: this.option.credentials,
            method: this.option.method,
            data: this.variables(params),
        }).then(data => {
            this.error = null;
            if (data) {
                this.data = data;
            }
            this.loading = false;
        }).catch(e => {
            this.error = e;
            this.loading = false;
        });
    }
}
