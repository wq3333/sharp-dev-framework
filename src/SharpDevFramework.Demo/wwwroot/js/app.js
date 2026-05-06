import { router } from './router.js';
import { loadEnums } from './enums.js';
import { initSignalR, stopSignalR } from './signalr.js';
import { isTokenValid, clearAuth, setStopSignalR } from './auth.js';
import {
    FButton, FInput, FSingleSelect, FCheckbox, FModal, FTable, FPagination,
    FDropdown, FDropdownItem, FMultiSelect, ToastContainer, ToastPlugin
} from './components/index.js';

const { createApp, ref, provide, readonly } = Vue;

const ThemeSymbol = Symbol('theme');

function createThemeManager() {
    const theme = ref(localStorage.getItem('theme') || 'system');
    const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

    const effectiveTheme = () => {
        if (theme.value === 'system') {
            return systemDark.value ? 'dark' : 'light';
        }
        return theme.value;
    };

    const apply = () => {
        const t = effectiveTheme();
        document.documentElement.setAttribute('data-theme', t);
    };

    const set = (value) => {
        theme.value = value;
        if (value !== 'system') {
            localStorage.setItem('theme', value);
        } else {
            localStorage.removeItem('theme');
        }
        apply();
    };

    const toggle = () => {
        set(effectiveTheme() === 'dark' ? 'light' : 'dark');
    };

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        systemDark.value = e.matches;
        if (theme.value === 'system') apply();
    });

    apply();

    return { theme: readonly(theme), effectiveTheme, set, toggle };
}

const cacheKey = ref(0);

const clearPageCache = () => {
    cacheKey.value++;
};

window.clearPageCache = clearPageCache;

const app = createApp({
    template: '<router-view v-slot="{ Component }"><keep-alive :key="cacheKey"><component :is="Component" /></keep-alive></router-view><ToastContainer />',
    setup() {
        const themeManager = createThemeManager();
        provide(ThemeSymbol, themeManager);
        return { cacheKey };
    }
});

app.use(router);
app.use(ToastPlugin);

app.component('FButton', FButton);
app.component('FInput', FInput);
app.component('FSingleSelect', FSingleSelect);
app.component('FCheckbox', FCheckbox);
app.component('FModal', FModal);
app.component('FTable', FTable);
app.component('FPagination', FPagination);
app.component('FDropdown', FDropdown);
app.component('FDropdownItem', FDropdownItem);
app.component('FMultiSelect', FMultiSelect);

setStopSignalR(stopSignalR);

router.beforeEach(async (to, from, next) => {
    if (isTokenValid() && !window._enumsLoaded) {
        await loadEnums();
        initSignalR();
        window._enumsLoaded = true;
    }
    next();
});

app.mount('#app');
export { ThemeSymbol };
