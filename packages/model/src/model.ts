import Vue from 'vue';
import xstream, { Subscription } from 'xstream';

import Store from './store';
import {
    ApolloQuery,
    ApolloMutation,
    RestQuery,
    RestMutation,
} from './decorators/index';
import {
    StreamsObj,
    GraphqlClients,
    RestClients,
    VueApolloModelMetadata,
} from './types';
import { Constructor } from './types';
import 'reflect-metadata';
import { Route } from 'vue-router';

const skipProperty = [
    'subscriptions',
    'subs',
    'init',
    'startSubscriptions',
    'prefetch',
    'destroy',
    'constructor',
];

function isSkipProperty(key: string) {
    return key.startsWith('$')
        || key.startsWith('$$')
        || key.endsWith('$')
        || skipProperty.includes(key);
}

function getClient<T extends GraphqlClients>(clients: T, clientName?: string): GraphqlClients['defaultClient'];
function getClient<T extends RestClients>(clients: T, clientName?: string): RestClients['defaultClient'];
function getClient(clients: any, clientName?: string) {
    return clientName && clients.clients && clientName in clients.clients
        ? clients.clients[clientName]
        : clients.defaultClient;
}

function registerProperty(obj: any, key: string, value: any) {
    Object.defineProperty(obj, key, {
        value,
        writable: false,
        configurable: false,
        enumerable: true,
    });
}

export class BaseModel {
    protected readonly $vm!: Vue;
    protected readonly $route!: Route;
    private readonly $store: Store;
    private subs: Subscription[] = [];
    private $$userProperties: Array<{
        key: string;
        type: 'getter' | 'function' | 'other';
        get?: Function;
        set?: Function;
    }> = [];
    private $$apolloQueries: Array<ApolloQuery<any, any> | RestQuery<any, any>> = [];
    // TODO临时放出来
    $clients!: GraphqlClients;
    hasSubscribed = false;

    private $streamsFromApollo: StreamsObj = {};
    private $streamsFromSubscriptions: StreamsObj = {};
    $streamsFromState: StreamsObj = {};

    get $streams() {
        return {
            ...this.$streamsFromApollo,
            ...this.$streamsFromSubscriptions,
            ...this.$streamsFromState,
        };
    }

    constructor(
        vm: Vue,
        store: Store,
    ) {
        this.$store = store;
        Object.defineProperty(this, '$vm', {
            get() {
                return vm;
            },
            enumerable: false,
        });
        // 保证每次获取都是响应式
        Object.defineProperty(this, '$route', {
            get() {
                return vm.$route;
            },
        });
    }

    private $$autoBind() {
        for (const item of this.$$userProperties) {
            if (item.type === 'function') {
                Object.defineProperty(this, item.key, {
                    value: (this[item.key as keyof this] as unknown as Function).bind(this)
                });
            }
        }
    }

    init<ModelType extends BaseModel>() {
        this.$$collectProperties();
        this.$$initState();
        this.$$initApolloDesc<ModelType>();
        this.$$initSubscriptions();
        this.$$autoBind();
        // TODO因为apollo的缓存有点迷，临时性还是先把$clients放出来了，但是不推荐使用……
        Object.defineProperty(this, '$clients', {
            get() {
                return this.$store.graphqlClients;
            },
            configurable: true,
        });
    }

    private $$addProperty(target: any) {
        (Object.getOwnPropertyNames(target)).forEach(key => {
            if (isSkipProperty(key)) {
                return;
            }
            const desc = Object.getOwnPropertyDescriptor(target, key)!;
            if (desc.get) {
                this.$$userProperties.push({
                    key,
                    type: 'getter',
                    get: desc.get,
                    set: desc.set,
                });
            } else if (typeof desc.value === 'function') {
                this.$$userProperties.push({
                    key,
                    type: 'function',
                });
            } else {
                this.$$userProperties.push({
                    key,
                    type: 'other',
                });
            }
        });
    }

    private $$collectProperties() {
        // 处理自身属性
        this.$$addProperty(this);
        Object.getOwnPropertyNames(this)
        // 处理原型链
        let proto = Object.getPrototypeOf(this);
        while (proto && proto !== Object.prototype) {
            this.$$addProperty(proto);
            proto = Object.getPrototypeOf(proto);
        }
    }

    private $$initState() {
        for (const item of this.$$userProperties) {
            if (item.type === 'other') {
                makeObservable(this, item.key as keyof this);
            } else if (item.type === 'getter') {
                const { get = () => {}, set } = item;
                // // 使用computed作为缓存，避免getter触发多次
                // const computedValue = computed({
                //     get: () => {
                //         return get.call(this);
                //     },
                //     set: (val: any) => {
                //         if (set) {
                //             set.call(this, val);
                //         }
                //     },
                // });

                // const descriptors: PropertyDescriptor = {
                //     get() {
                //         return computedValue.value;
                //     },
                // };

                // if (set) {
                //     descriptors.set = (val) => {
                //         computedValue.value = val;
                //     };
                // }

                // 上面那东西有点坑，先临时改一下
                const descriptors: PropertyDescriptor = {
                    get() {
                        return get.call(this);
                    },
                };

                if (set) {
                    descriptors.set = (val: any) => {
                        set.call(this, val);
                    };
                }

                Object.defineProperty(this, item.key, descriptors);
            }
        }
    }

    getModelInstanceFromStore<T extends BaseModel>(Ctor: Constructor<T>) {
        const storeModelInstance = this.$store.getModelInstance(Ctor);
        return storeModelInstance?.instance;
    }

    private initFromMetaData<T extends BaseModel>(
        key: string,
        options: VueApolloModelMetadata<T>,
    ) {
        if (options.type.startsWith('apollo') && !this.$store.gqlClients) {
            throw new Error('Before use an apolloQuery / apolloMutation, you must init "gqlClients" first');
        }
        if (options.type.startsWith('rest') && !this.$store.restClients) {
            throw new Error('Before use an restQuery / restMutation, you must init "gqlClients" first');
        }
        if (options.type.endsWith('Mutation')) {
            let mutation: ApolloMutation<T, any> | RestMutation<T, any>;
            if (options.type === 'apolloMutation') {
                mutation = new ApolloMutation<T, any>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    getClient(this.$store.gqlClients!, options.detail.client),
                );
            } else if (options.type === 'restMutation') {
                mutation = new RestMutation<T, any>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    getClient(this.$store.restClients!, options.detail.client),
                )
            }
            const value = {
                get data() {
                    return mutation.data;
                },
                get loading() {
                    return mutation.loading;
                },
                get mutate() {
                    return mutation.mutate.bind(mutation);
                },
                get error() {
                    return mutation.error;
                },
            };
            registerProperty(this, key, value);
        } else {
            let query!: ApolloQuery<T, any> | RestQuery<T, any>;
            if (options.type === 'apolloQuery') {
                query = new ApolloQuery<T, any>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    getClient(this.$store.gqlClients!, options.detail.client),
                );
            } else if (options.type === 'restQuery') {
                query = new RestQuery<T, any>(
                    options.detail,
                    this as unknown as T,
                    this.$vm,
                    getClient(this.$store.restClients!, options.detail.client),
                )
            }
            const value = {
                get data() {
                    return query.data;
                },
                get loading() {
                    return query.loading;
                },
                get refetch() {
                    return query.refetch.bind(query);
                },
                get fetchMore() {
                    return query.fetchMore.bind(query);
                },
                get error() {
                    return query.error;
                },
            };
            this.$$apolloQueries.push(query);
            // TODO后面再改
            this.$streamsFromApollo[key + '$'] = query.observable;
            registerProperty(this, key, value);
        }
    }

    private $$initApolloDesc<ModelType extends BaseModel>() {
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', this, 'decoratorKeys') || [];
        if (!decoratorKeys.length) {
            return;
        }
        for (const key of decoratorKeys) {
            const info: VueApolloModelMetadata<ModelType> = Reflect.getMetadata('vueApolloModel', this, key);
            if (!info) {
                continue;
            }
            this.initFromMetaData(key, info);
        }

        // 延迟初始化，保证query间依赖
        if (this.$$apolloQueries.length && !this.$vm.$isServer) {
            this.$$apolloQueries.forEach(query => query.init());
        }
    }

    private $$initSubscriptions() {
        // TODO subscriptions的形式后面还需要改变
        // @ts-ignore
        if (!this.subscriptions) {
            return;
        }
        // TODO 这里需要判断一下uniq
        // TODO subscriptions的形式后面还需要改变
        // @ts-ignore
        const $streams = typeof this.subscriptions === 'function' ? this.subscriptions() : this.subscriptions;

        Object.assign(this.$streamsFromSubscriptions, $streams);
        Object.freeze(this.$streamsFromSubscriptions);

        Object.keys(this.$streamsFromSubscriptions).forEach(key => {
            const rKey = key.lastIndexOf('$') === key.length - 1 ? key.slice(0, -1) : key;
            // TODO后面看一下怎么把这部分subscriptions的东西干掉吧= =
            const obj = Vue.observable({
                data: null as any,
            });
            if (!(rKey in this)) { 
                Object.defineProperty(this, rKey, {
                    get() {
                        return obj.data
                    },
                    set(data: any) {
                        obj.data = data;
                    },
                });
            }
            const sub = this.$streamsFromSubscriptions[key].subscribe({
                next: val => {
                    // TODO subscriptions的形式后面还需要改变
                    obj.data = val
                },
            });
            this.subs.push(sub);
        });
    }

    startSubscriptions() {
        // TODO: 后面再看怎么样订阅是合理的，目前为了保证顺序……先上面搞副作用去了
        Object.keys(this.$streamsFromApollo).forEach(key => {
            const sub = this.$streamsFromApollo[key].subscribe({});
            this.subs.push(sub);
        });
        this.hasSubscribed = true;
    }

    prefetch() {
        const prefetchList = this.$$apolloQueries.map(query => query.prefetch());
        return Promise.all(prefetchList);
    }

    destroy() {
        this.subs.forEach(sub => sub.unsubscribe());
        this.$$apolloQueries.forEach(query => query.destroy());
    }
}

function makeObservable<T extends BaseModel>(model: T, key: keyof T) {
    let observerListener: any;
    const initialValue = model[key];

    model.$streamsFromState[key + '$'] = xstream.create({
        start(listener) {
            observerListener = listener;
            observerListener.next(initialValue);
        },
        stop() {
            observerListener = null;
        },
    });

    // TODO后面看一下要怎么改动常规属性……
    const obj = Vue.observable({
        data: initialValue,
    });

    Object.defineProperty(model, key as string, {
        get() {
            return obj.data;
        },
        set(data: T[keyof T]) {
            obj.data = data;
            Promise.resolve().then(() => {
                if (observerListener) {
                    observerListener.next(model[key]);
                }
            });
        },
    })
}
