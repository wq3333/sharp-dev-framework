import { LoginView } from './views/Login.js';
import { LayoutView } from './views/Layout.js';
import { FileManagerView } from './views/FileManager.js';
import { FavoritesView } from './views/Favorites.js';
import { TaskManagerView } from './views/TaskManager.js';
import { RemoteDownloadManagerView } from './views/RemoteDownloadManager.js';
import { UserManagerView } from './views/UserManager.js';

const { createRouter, createWebHashHistory } = VueRouter;

const routes = [
    { path: '/login', component: LoginView },
    { 
        path: '/', 
        component: LayoutView,
        children: [
            { path: '', redirect: '/files' },
            { path: 'files', component: FileManagerView },
            { path: 'favorites', component: FavoritesView },
            { path: 'tasks', component: TaskManagerView },
            { path: 'downloads', component: RemoteDownloadManagerView },
            { path: 'users', component: UserManagerView },
        ]
    },
];

export const router = createRouter({
    history: createWebHashHistory(),
    routes,
});
