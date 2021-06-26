/**
 * @file vue model
 *
 * @author 天翔Skyline(skyline0705@gmail.com)
 * Oct 24, 2018
 */
import { useApolloModel } from './install';
import Store from './store';
export { BaseModel } from './model';
export { useXStream } from './utils/stream';
export {
    apolloQuery,
    apolloMutation,
    restQuery,
    restMutation,
} from './decorators';

export {
    Store,
    useApolloModel,
};

export * from './types';