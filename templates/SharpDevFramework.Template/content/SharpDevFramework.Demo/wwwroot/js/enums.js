let enumsCache = {};

function toCamelCase(str) {
    return str.replace(/^[A-Z]/, c => c.toLowerCase());
}

export async function loadEnums() {
    const { api } = await import('./api.js');
    const raws = await api.enums.list();
    const transformed = {};
    raws.forEach(raw => {
        transformed[toCamelCase(raw.categoryName)] = raw.items;
    });
    Object.assign(enumsCache, transformed);
}

export function getEnumName(type, value, isMulti = false) {
    const list = enumsCache[type];
    if (!list || !Array.isArray(list)) return String(value);
    
    if (isMulti) {
        if (!value) return '';
        const values = String(value).split(',').filter(v => v);
        return values.map(v => {
            const item = list.find(x => String(x.value) === v || x.value === Number(v));
            return item ? item.displayName : v;
        }).join(', ');
    }
    
    const item = list.find(x => x.value === value);
    return item ? item.displayName : String(value);
}

export function getTaskStatusClass(status) {
    const classes = { 0: 'badge--yellow', 1: 'badge--blue', 2: 'badge--green', 3: 'badge--red', 4: 'badge--gray' };
    return classes[status] || '';
}

export const enums = {
    get userRoleTypes() { return enumsCache.userRoleTypes || []; },
    get taskStates() { return enumsCache.taskStates || []; },
    get taskTypes() { return enumsCache.taskTypes || []; },
    get demoTypes() { return enumsCache.demoTypes || []; },
};
