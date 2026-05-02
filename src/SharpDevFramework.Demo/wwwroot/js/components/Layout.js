import { FButton, FDropdown, FDropdownItem } from './index.js';
import { clearAuth } from '../auth.js';
import { stopSignalR } from '../signalr.js';
import { getEnumName } from '../enums.js';
import { ThemeSymbol } from '../app.js';

const { computed, inject, ref, onMounted, onBeforeUnmount, watch } = Vue;

const IconMenu = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`
};

const IconClose = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
};

const IconTasks = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`
};

const IconUsers = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`
};

const IconDemos = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`
};

const IconSun = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
};

const IconMoon = {
    template: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
};

export const LayoutComponent = {
    name: 'LayoutComponent',
    components: { FButton, FDropdown, FDropdownItem, IconMenu, IconClose, IconTasks, IconUsers, IconDemos, IconSun, IconMoon },
    template: `
    <div class="flex h-screen overflow-hidden">
        <div v-if="mobileOpen && isMobile" class="fixed inset-0 bg-black/40 z-40" @click="mobileOpen = false"></div>
        <aside v-if="sidebarOpen || isMobile" class="sidebar bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 z-50 w-65"
            :class="{
                'sidebar--mobile-open': mobileOpen && isMobile,
                'sidebar--mobile': isMobile
            }">
            <div class="h-[60px] flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] shrink-0 overflow-hidden">
                <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-8 h-8 rounded-md bg-[var(--accent)] text-[var(--text-inverse)] flex items-center justify-center text-xs font-bold tracking-wider shrink-0">SD</div>
                    <div class="font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap">SharpDev</div>
                </div>
                <button class="inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] shrink-0"
                    @click="closeSidebar" title="关闭侧边栏">
                    <IconClose />
                </button>
            </div>
            <nav class="flex-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden">
                <router-link to="/tasks" class="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[15px] text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out mb-1 no-underline hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    :class="{ 'bg-[var(--bg-active)] text-[var(--accent)] font-medium': $route.path === '/tasks' }"
                    @click="onNavClick">
                    <span class="w-5 h-5 inline-flex items-center justify-center shrink-0"><IconTasks /></span>
                    <span class="whitespace-nowrap">任务管理</span>
                </router-link>
                <router-link v-if="isAdmin" to="/users"
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[15px] text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out mb-1 no-underline hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    :class="{ 'bg-[var(--bg-active)] text-[var(--accent)] font-medium': $route.path === '/users' }"
                    @click="onNavClick">
                    <span class="w-5 h-5 inline-flex items-center justify-center shrink-0"><IconUsers /></span>
                    <span class="whitespace-nowrap">用户管理</span>
                </router-link>
                <router-link to="/demos" class="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[15px] text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out mb-1 no-underline hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    :class="{ 'bg-[var(--bg-active)] text-[var(--accent)] font-medium': $route.path === '/demos' }"
                    @click="onNavClick">
                    <span class="w-5 h-5 inline-flex items-center justify-center shrink-0"><IconDemos /></span>
                    <span class="whitespace-nowrap">Demo管理</span>
                </router-link>
            </nav>
        </aside>
        <div class="flex-1 overflow-hidden flex flex-col min-w-0">
            <header class="h-[60px] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0">
                <div class="flex items-center gap-3">
                    <button v-if="isMobile ? !mobileOpen : !sidebarOpen" class="inline-flex items-center justify-center w-9 h-9 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                        @click="openSidebar" title="打开菜单">
                        <IconMenu />
                    </button>
                    <h1 class="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-snug">
                        <template v-if="$route.path.startsWith('/tasks')">任务管理</template>
                        <template v-else-if="$route.path.startsWith('/users')">用户管理</template>
                        <template v-else-if="$route.path.startsWith('/demos')">Demo管理</template>
                    </h1>
                </div>
                <div class="flex items-center gap-2 sm:gap-4">
                    <button class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-pointer text-sm transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]" @click="toggleTheme" title="切换主题">
                        <IconSun v-if="isDark" /><IconMoon v-else />
                    </button>
                    <FDropdown placement="bottom-end">
                        <template #trigger>
                            <button class="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-medium cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)]">{{ username }}</button>
                        </template>
                        <div class="px-3 py-2 text-xs text-[var(--text-tertiary)]">角色：{{ role }}</div>
                        <FDropdownItem divided @click="handleLogout">退出登录</FDropdownItem>
                    </FDropdown>
                </div>
            </header>
            <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
                <router-view v-slot="{ Component }">
                    <keep-alive><component :is="Component" /></keep-alive>
                </router-view>
            </main>
        </div>
    </div>
    `,
    setup() {
        const sidebarOpen = ref(true);
        const mobileOpen = ref(false);
        const isMobile = ref(window.innerWidth < 1024);

        const updateIsMobile = () => {
            isMobile.value = window.innerWidth < 1024;
            if (isMobile.value) {
                sidebarOpen.value = true;
                mobileOpen.value = false;
            } else {
                mobileOpen.value = false;
            }
        };

        onMounted(() => window.addEventListener('resize', updateIsMobile));
        onBeforeUnmount(() => window.removeEventListener('resize', updateIsMobile));

        const closeSidebar = () => {
            if (isMobile.value) {
                mobileOpen.value = false;
            } else {
                sidebarOpen.value = false;
            }
        };

        const openSidebar = () => {
            if (isMobile.value) {
                mobileOpen.value = true;
            } else {
                sidebarOpen.value = true;
            }
        };

        const onNavClick = () => {
            if (isMobile.value) mobileOpen.value = false;
        };

        const username = computed(() => localStorage.getItem('username') || '');
        const isAdmin = computed(() => localStorage.getItem('role').split(',').filter(x => x === 'Admin').length > 0);
        const role = computed(() => getEnumName('userRoleTypes', localStorage.getItem('role'), true));
        const theme = inject(ThemeSymbol, null);
        const isDark = computed(() => theme ? theme.effectiveTheme() === 'dark' : false);
        const toggleTheme = () => { if (theme) theme.toggle(); };
        const handleLogout = () => { stopSignalR(); clearAuth(); window.location.hash = '#/login'; };

        return { sidebarOpen, mobileOpen, isMobile, closeSidebar, openSidebar, onNavClick, username, role, isAdmin, handleLogout, isDark, toggleTheme };
    }
};
