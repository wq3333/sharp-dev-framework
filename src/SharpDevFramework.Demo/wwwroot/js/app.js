import { router } from './router.js';
import { loadEnums } from './enums.js';
import { initSignalR, stopSignalR } from './signalr.js';
import { isTokenValid, clearAuth, setStopSignalR } from './auth.js';
import {
    FButton, FInput, FSingleSelect, FCheckbox, FModal, FTable, FPagination,
    FDropdown, FDropdownItem, FMultiSelect, ToastContainer, ToastPlugin
} from './components/index.js';

const { createApp } = Vue;

const app = createApp({
    template: '<router-view /><ToastContainer />'
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
    const hasToken = localStorage.getItem('token');
    const tokenValid = isTokenValid();
    
    if (hasToken && !tokenValid) {
        clearAuth();
        next('/login');
        return;
    }
    
    if (to.path !== '/login' && !tokenValid) {
        next('/login');
    } else if (to.path === '/login' && tokenValid) {
        next('/tasks');
    } else {
        if (!window._enumsLoaded && tokenValid) {
            await loadEnums();
            window._enumsLoaded = true;
        }
        next();
    }
});

app.mount('#app');

initSignalR();
