// TODO这些后面应该集成到apollo-model中而非每次都这么写
import { ApolloLink } from 'apollo-link';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { DefaultOptions, ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';


export function createLink(
    uri = '/graphql',
    env: 'node' | 'browser' = 'browser',
    headers?: Record<string, string>,
    fetch?: (input: RequestInfo, init?: RequestInit | undefined) => Promise<Response>,
) {
    return new HttpLink({
        // enable send cookie
        credentials: env === 'browser' ? 'same-origin' : 'include',
        uri,
        headers,
        fetch,
    });
}

export function createApolloClient(
    link: ApolloLink,
    env: 'node' | 'browser' = 'browser',
    restoreKey = 'defaultClient',
    defaultOptions: DefaultOptions = {},
) {
    const cache = new InMemoryCache();
    // TODO这个后面再补type吧
    // eslint-disable-next-line
    // @ts-ignore
    if (env === 'browser' && window.__APOLLO_STATE__?.[restoreKey]) {
        // TODO这个后面再补type吧
        // eslint-disable-next-line
        // @ts-ignore
        cache.restore(window.__APOLLO_STATE__[restoreKey]);
    }

    return new ApolloClient({
        link,
        cache,
        connectToDevTools: process.env.NODE_ENV === 'development',
        ssrMode: typeof window === undefined,
        ...defaultOptions,
    });
}
