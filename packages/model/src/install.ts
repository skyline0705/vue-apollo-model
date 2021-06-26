import Vue from 'vue';
import {
    onBeforeUnmount,
    onServerPrefetch,
    getCurrentInstance,
} from '@vue/composition-api';
import { Constructor } from './types';
import { BaseModel } from './model';

export function useApolloModel<T extends BaseModel>(ctor: Constructor<T>) {
    const instance = getCurrentInstance();
    const root = instance?.root.proxy;
    // 为了适配小程序，$store去原型上找一下
    const store = root?.$options.apolloStore || root?.apolloStore;
    if (!store) {
        throw new Error('There is no vue-apollo-model store in your root vm!!');
    }
    // TODO registerModel的参数后面需要改一下……
    const storeModelInstance = store.registerModel<T>(ctor);
    if (!storeModelInstance.count) {
        const instance = new ctor(
            root,
            store,
        );
        instance.init<T>();
        storeModelInstance.instance = instance
    }
    storeModelInstance.count++;

    Vue.nextTick(() => {
        // TODO这里可能涉及多次订阅导致性能问题，后面把subscription相关逻辑干了也许就解了……
        // 先临时通过hasSubscribed来判断
        if (!root?.$isServer && storeModelInstance.instance && !storeModelInstance.instance.hasSubscribed) {
            storeModelInstance.instance.startSubscriptions();
        }
    });

    onBeforeUnmount(() => {
        storeModelInstance.count--;
        if (storeModelInstance.count === 0 && storeModelInstance.instance) {
            storeModelInstance.instance.destroy();
            storeModelInstance.instance = null;
        }
    });
    onServerPrefetch(() => {
        return storeModelInstance.instance?.prefetch();
    });

    return storeModelInstance.instance as T;
}
