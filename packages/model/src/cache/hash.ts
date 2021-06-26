export function hash(params: Record<string, any>): string {
    if (Array.isArray(params)) {
        return `array-${params.map(hash).join('-')}`;
    }
    if (params === null) {
        return 'null-null';
    }
    if (typeof params === 'object') {
        return `object-${Object.keys(params).sort().map(key => `${key}-${hash(params[key])}`).join('-')}`
    }
    return `${typeof params}-${params}`;
}