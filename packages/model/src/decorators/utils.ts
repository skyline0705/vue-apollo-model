import Vue from 'vue';

type ObservableData = {
    loading: boolean;
    data: any;
    error: any;
};

export function initDataType<T>(model: T) {
    const observableData: ObservableData = Vue.observable({
        data: undefined,
        loading: false,
        error: null
    });

    Object.defineProperty(model, 'data', {
        get() {
            return observableData.data
        },
        set(data) {
            observableData.data = data;
        },
        configurable: true,
        enumerable: false,
    });

    Object.defineProperty(model, 'loading', {
        get() {
            return observableData.loading
        },
        set(loading: boolean) {
            observableData.loading = loading;
        },
        configurable: true,
        enumerable: false,
    });

    Object.defineProperty(model, 'error', {
        get() {
            return observableData.error
        },
        set(error: any) {
            observableData.error = error;
        },
        configurable: true,
        enumerable: false,
    });
}