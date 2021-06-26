import { BaseModel } from './model';
import {
    VueApolloModelMetadata,
    ApolloQueryOptions,
    ApolloMutationOptions,
    RestQueryOptions,
    RestMutationOptions,
} from './types';
type OptionsDefine<T extends BaseModel> = VueApolloModelMetadata<T>['detail'];

type DecoratorType<T extends BaseModel> = VueApolloModelMetadata<T>['type'];

function createDecorator<T extends BaseModel>(type: DecoratorType<T>, detail: OptionsDefine<T>) {
    return function decorator(constructor: any, key: string) {
        const descriptor = {
            type,
            detail,
        }
        const decoratorKeys = Reflect.getMetadata('decoratorKeys', constructor, 'decoratorKeys') || [];
        decoratorKeys.push(key);
        Reflect.defineMetadata('decoratorKeys', decoratorKeys, constructor, 'decoratorKeys');
        Reflect.defineMetadata('vueApolloModel', descriptor, constructor, key);
    }
}

export function apolloQuery<T extends BaseModel>(detail: ApolloQueryOptions<T>) {
    return createDecorator<T>('apolloQuery', detail);
}
export function apolloMutation<T extends BaseModel>(detail: ApolloMutationOptions<T>) {
    return createDecorator<T>('apolloMutation', detail);
}

export function restQuery<T extends BaseModel>(detail: RestQueryOptions<T>) {
    return createDecorator<T>('restQuery', detail);
}

export function restMutation<T extends BaseModel>(detail: RestMutationOptions<T>) {
    return createDecorator<T>('restMutation', detail);
}
