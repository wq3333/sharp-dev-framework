let enumsCache = {};

function toCamelCase(str) {
    return str.replace(/^[A-Z]/, c => c.toLowerCase());
}

export async function loadEnums() {
    const { api } = await import('./api.js');
    try {
        const raws = await api.getEnums();
        const transformed = {};
        raws.forEach(raw => {
            transformed[toCamelCase(raw.categoryName)] = raw.items;
        });
        Object.assign(enumsCache, transformed);
    } catch (e) {
        console.error('Failed to load enums:', e);
    }
}

export function getEnumName(type, value) {
    const list = enumsCache[type];
    if (!list || !Array.isArray(list)) return String(value);
    const item = list.find(x => x.value === value);
    return item ? item.displayName : String(value);
}

export function getTaskStatusClass(status) {
    const classes = { 0: 'badge--yellow', 1: 'badge--blue', 2: 'badge--green', 3: 'badge--red' };
    return classes[status] || '';
}

export const enums = {
    get userRoleTypes() { return enumsCache.userRoleTypes || []; },
    get taskStates() { return enumsCache.taskStates || []; },
    get taskTypes() { return enumsCache.taskTypes || []; },
};
