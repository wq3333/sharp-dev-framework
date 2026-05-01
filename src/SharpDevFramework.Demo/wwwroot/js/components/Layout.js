import { FButton } from './index.js';
import { clearAuth } from '../auth.js';
import { stopSignalR } from '../signalr.js';
import { getEnumName } from '../enums.js';

const { computed } = Vue;

export const LayoutComponent = {
    name: 'LayoutComponent',
    components: { FButton },
    template: `
    <div class="layout-main">
        <div class="sidebar">
            <div class="sidebar-header">
                <h1 class="sidebar-title">🚀 Demo</h1>
            </div>
            
            <nav class="sidebar-nav">
                <router-link to="/tasks" class="nav-item" :class="{ 'nav-item--active': $route.path === '/tasks' }">
                    <span>⚙️</span>
                    <span>任务管理</span>
                </router-link>
                <router-link 
                    v-if="isAdmin"
                    to="/users" 
                    class="nav-item" 
                    :class="{ 'nav-item--active': $route.path === '/users' }"
                >
                    <span>👥</span>
                    <span>用户管理</span>
                </router-link>
                <router-link to="/demos" class="nav-item" :class="{ 'nav-item--active': $route.path === '/demos' }">
                    <span>📋</span>
                    <span>Demo管理</span>
                </router-link>
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-info">
                    <div>
                        <div class="user-name">{{ username }}</div>
                        <div class="user-role">{{ role }}</div>
                    </div>
                </div>
                <FButton type="danger" block icon="🚪" @click="handleLogout" style="width: 100%;">
                    退出登录
                </FButton>
            </div>
        </div>
        
        <div class="layout-content">
            <main class="page-content">
                <router-view v-slot="{ Component }">
                    <keep-alive>
                        <component :is="Component" />
                    </keep-alive>
                </router-view>
            </main>
        </div>
    </div>
    `,
    setup() {
        const username = computed(() => localStorage.getItem('username') || '');
        const isAdmin = computed(() => localStorage.getItem('role').split(',').filter(x => x === 'Admin').length > 0);
        const role = computed(() => getEnumName('userRoleTypes', localStorage.getItem('role'), true));

        const handleLogout = () => {
            stopSignalR();
            clearAuth();
            window.location.hash = '#/login';
        };

        return { username, role, isAdmin, handleLogout };
    }
};