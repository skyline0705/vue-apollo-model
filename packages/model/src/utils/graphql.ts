import { FieldNode }  from 'graphql';

export function transformQuery(item: FieldNode) {
    const result: Record<string, any> = {};
    const key = item.name.value;

    if (!item.selectionSet) {
        result[key] = null;
        return result;
    }

    result[key] = {};
    item.selectionSet.selections.forEach(item => {
        if ('name' in item) {
            result[key][item.name.value] = null;
        }
    });
    return result;
}
