import { LoginView } from './views/Login.js';
import { LayoutView } from './views/Layout.js';
import { TaskManagerView } from './views/TaskManager.js';
import { UserManagerView } from './views/UserManager.js';

const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    { path: '/login', component: LoginView },
    { 
        path: '/', 
        component: LayoutView,
        children: [
            { path: '', redirect: '/tasks' },
            { path: 'tasks', component: TaskManagerView },
            { path: 'users', component: UserManagerView },
        ]
    },
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
