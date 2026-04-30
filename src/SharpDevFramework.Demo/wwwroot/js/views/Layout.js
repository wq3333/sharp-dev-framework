import { enums, loadEnums, getEnumName } from '../enums.js';
import { stopSignalR } from '../signalr.js';
import { FButton } from '../components/index.js';

const { ref, computed, onMounted } = Vue;

export const LayoutView = {
    components: { FButton },
    template: `
    <div class="layout-main">
        <div class="sidebar">
            <div class="sidebar-header">
                <h1 class="sidebar-title">🚀 File Server</h1>
            </div>
            
            <nav class="sidebar-nav">
                <router-link to="/files" class="nav-item" :class="{ 'nav-item--active': $route.path === '/files' }">
                    <span>📁</span>
                    <span>文件管理</span>
                </router-link>
                <router-link to="/favorites" class="nav-item" :class="{ 'nav-item--active': $route.path === '/favorites' }">
                    <span>⭐</span>
                    <span>我的收藏</span>
                </router-link>
                <router-link to="/tasks" class="nav-item" :class="{ 'nav-item--active': $route.path === '/tasks' }">
                    <span>⚙️</span>
                    <span>任务管理</span>
                </router-link>
                <router-link to="/downloads" class="nav-item" :class="{ 'nav-item--active': $route.path === '/downloads' }">
                    <span>⬇️</span>
                    <span>远程下载</span>
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
            </nav>
            
            <div class="sidebar-footer">
                <div class="user-info">
                    <div>
                        <div class="user-name">{{ username }}</div>
                        <div v-if="isAdmin" class="user-role">{{ adminLabel }}</div>
                    </div>
                </div>
                <FButton type="danger" block icon="🚪" @click="handleLogout" style="width: 100%;">
                    退出登录
                </FButton>
            </div>
        </div>
        
        <div class="layout-content">
            <main class="page-content">
                <router-view />
            </main>
        </div>
    </div>
    `,
    setup() {
        const username = computed(() => localStorage.getItem('name') || '');
        const isAdmin = computed(() => localStorage.getItem('role') === '1');
        const adminLabel = computed(() => getEnumName('userRoles', 1));

        const handleLogout = async () => {
            stopSignalR();
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            localStorage.removeItem('name');
            localStorage.removeItem('role');
            window.location.hash = '#/login';
        };

        onMounted(async () => {
            await loadEnums();
        });

        return { username, isAdmin, adminLabel, handleLogout };
    }
};
