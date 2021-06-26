import { Stream, Listener, Subscription } from 'xstream';
import { onServerPrefetch, onBeforeUnmount } from '@vue/composition-api';

export function useXStream<T>(stream: Stream<T>, listener: Partial<Listener<T>>) {
    const sub: Subscription = stream.subscribe(listener);
    onBeforeUnmount(() => {
        sub.unsubscribe();
    });
    onServerPrefetch(() => {
        sub.unsubscribe();
    });
}
