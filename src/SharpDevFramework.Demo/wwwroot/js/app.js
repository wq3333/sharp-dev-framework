import { router } from './router.js';
import { loadEnums } from './enums.js';
import { initSignalR, stopSignalR } from './signalr.js';
import {
    FButton, FInput, FSelect, FCheckbox, FModal, FTable, FPagination,
    FDropdown, FDropdownItem, ToastContainer, ToastPlugin
} from './components/index.js';

const { createApp } = Vue;

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function isTokenValid() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    const decoded = parseJwt(token);
    if (!decoded || !decoded.Exp) return false;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.Exp > currentTime;
}

function clearAuth() {
    stopSignalR();
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
}

const app = createApp({
    template: '<router-view /><ToastContainer />'
});

app.use(router);
app.use(ToastPlugin);

app.component('FButton', FButton);
app.component('FInput', FInput);
app.component('FSelect', FSelect);
app.component('FCheckbox', FCheckbox);
app.component('FModal', FModal);
app.component('FTable', FTable);
app.component('FPagination', FPagination);
app.component('FDropdown', FDropdown);
app.component('FDropdownItem', FDropdownItem);

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
        next('/files');
    } else {
        if (!window._enumsLoaded && tokenValid) {
            try {
                await loadEnums();
                window._enumsLoaded = true;
            } catch (e) {
                console.error('Failed to load enums:', e);
            }
        }
        next();
    }
});

app.mount('#app');

initSignalR();
