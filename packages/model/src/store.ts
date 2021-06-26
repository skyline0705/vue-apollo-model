import { StoreModelInstance, GraphqlClients, RestClients } from './types';
import { Constructor } from './types';
import { BaseModel } from './model';

type StoreConstructorOptions = {
    gql?: GraphqlClients;
    rest?: RestClients;
}

export default class Store {
    private modelMap = new Map();
    gqlClients?: GraphqlClients;
    restClients?: RestClients;

    constructor(options: StoreConstructorOptions) {
        this.gqlClients = options.gql;
        this.restClients = options.rest;
    }

    getModelInstance<T extends BaseModel>(constructor: Constructor<T>) {
        return this.modelMap.get(constructor) as StoreModelInstance<T> | undefined;
    }

    registerModel<T extends BaseModel>(constructor: Constructor<T>) {
        if (this.modelMap.has(constructor)) {
            return this.modelMap.get(constructor)! as StoreModelInstance<T>;
        }
        const storeModelInstance: StoreModelInstance<T> = {
            constructor,
            instance: null,
            count: 0,
        };
        this.modelMap.set(constructor, storeModelInstance);
        return storeModelInstance as StoreModelInstance<T>;
    }

    exportStates() {
        const clientsExtracts: any = {};
        if (!this.gqlClients) {
            return {}
        }
        for (const key in this.gqlClients.clients) {
            clientsExtracts[key] = this.gqlClients.clients[key].cache.extract();
        }
        return {
            defaultClient: this.gqlClients.defaultClient.cache.extract(),
            clients: {
                ...clientsExtracts
            },
        };
    }
}