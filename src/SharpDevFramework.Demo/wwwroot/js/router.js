import { LoginView } from './views/Login.js';
import { LayoutComponent as LayoutView } from './components/Layout.js';
import { TaskManagerView } from './views/TaskManager.js';
import { UserManagerView } from './views/UserManager.js';
import { DemoManagerView } from './views/DemoManager.js';

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
            { path: 'demos', component: DemoManagerView }
        ]
    },
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});