import { reactive } from '@vue/composition-api';

export function initDataType<DataType>() {
    return reactive({
        data: undefined as DataType | undefined,
        loading: false,
        error: undefined as any
    });
}