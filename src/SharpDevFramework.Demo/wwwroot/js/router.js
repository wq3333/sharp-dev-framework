import { LoginView } from './views/Login.js';
import { TaskManagerView } from './views/TaskManager.js';
import { UserManagerView } from './views/UserManager.js';
import { DemoManagerView } from './views/DemoManager.js';
import { OperationLogManagerView } from './views/OperationLogManager.js';

const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    { path: '', redirect: '/demos' },
    { path: '/login', component: LoginView, meta: { useLayout: false } },
    { path: '/tasks', component: TaskManagerView },
    { path: '/users', component: UserManagerView },
    { path: '/logs', component: OperationLogManagerView },
    { path: '/demos', component: DemoManagerView }
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});