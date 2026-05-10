import { FButton, FDropdown, FDropdownItem } from './index.js';
import { IconMenu, IconClose, IconTasks, IconUsers, IconDemos, IconLogs, IconSun, IconMoon, IconLogo, IconUser, IconRole, IconLogout, IconRefresh, IconSettings, IconChevronDown } from './icon.js';
import { clearAuth } from '../auth.js';
import { stopSignalR } from '../signalr.js';
import { getEnumName } from '../enums.js';
import { ThemeSymbol } from '../app.js';
import { router } from '../router.js';

const { computed, inject, ref, onMounted, onBeforeUnmount } = Vue;

export const LayoutComponent = {
    name: 'LayoutComponent',
    components: { FButton, FDropdown, FDropdownItem, IconMenu, IconClose, IconTasks, IconUsers, IconDemos, IconLogs, IconSun, IconMoon, IconLogo, IconUser, IconRole, IconLogout, IconRefresh, IconSettings, IconChevronDown },
    template: `
    <router-view v-if="$route.meta.useLayout===false"/>
    <div v-else class="flex h-full overflow-hidden">
        <div v-if="mobileOpen && isMobile" class="fixed inset-0 bg-black/40 z-40 transition-opacity duration-200" :class="mobileOpen ? 'opacity-100' : 'opacity-0'" @click="mobileOpen = false"></div>
        <aside class="sidebar bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col shrink-0 z-50"
            :class="{
                'sidebar--open': sidebarOpen && !isMobile,
                'sidebar--closed': !sidebarOpen && !isMobile,
                'sidebar--mobile-open': mobileOpen && isMobile,
                'sidebar--mobile': isMobile
            }">
            <div class="h-[60px] flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] shrink-0 overflow-hidden">
                <div class="flex items-center gap-2.5 min-w-0">
                    <IconLogo />
                    <div class="font-bold text-[var(--text-primary)] tracking-tight whitespace-nowrap">SharpDev</div>
                </div>
                <button class="inline-flex items-center justify-center w-7 h-7 rounded text-[var(--text-tertiary)] cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)] shrink-0"
                    @click="closeSidebar" title="关闭侧边栏">
                    <IconClose />
                </button>
            </div>
            <nav class="flex-1 px-2.5 py-3 overflow-y-auto overflow-x-hidden">
                <router-link to="/demos" class="sidebar-nav-item"
                    :class="{ 'sidebar-nav-item--active': $route.path === '/demos' }"
                    @click="onNavClick">
                    <span class="sidebar-nav-icon sidebar-nav-icon--demos"><IconDemos /></span>
                    <span class="whitespace-nowrap">Demo管理</span>
                </router-link>
                <div class="sidebar-nav-group">
                    <div class="sidebar-nav-item sidebar-nav-item--clickable"
                        :class="{ 'sidebar-nav-item--active': isSystemMenuActive }"
                        @click="systemMenuOpen = !systemMenuOpen">
                        <span class="sidebar-nav-icon sidebar-nav-icon--settings"><IconSettings /></span>
                        <span class="flex-1 whitespace-nowrap">系统管理</span>
                        <IconChevronDown class="sidebar-nav-chevron transition-transform duration-200" :class="{ 'rotate-180': systemMenuOpen }" />
                    </div>
                    <div v-show="systemMenuOpen" class="sidebar-nav-submenu">
                        <router-link to="/tasks" class="sidebar-nav-item sidebar-nav-item--sub"
                            :class="{ 'sidebar-nav-item--active': $route.path === '/tasks' }"
                            @click="onNavClick">
                            <span class="sidebar-nav-icon sidebar-nav-icon--tasks"><IconTasks /></span>
                            <span class="whitespace-nowrap">任务管理</span>
                        </router-link>
                        <router-link to="/users" class="sidebar-nav-item sidebar-nav-item--sub"
                            :class="{ 'sidebar-nav-item--active': $route.path === '/users' }"
                            @click="onNavClick">
                            <span class="sidebar-nav-icon sidebar-nav-icon--users"><IconUsers /></span>
                            <span class="whitespace-nowrap">用户管理</span>
                        </router-link>
                        <router-link v-if="isAdmin" to="/logs" class="sidebar-nav-item sidebar-nav-item--sub"
                            :class="{ 'sidebar-nav-item--active': $route.path === '/logs' }"
                            @click="onNavClick">
                            <span class="sidebar-nav-icon sidebar-nav-icon--logs"><IconLogs /></span>
                            <span class="whitespace-nowrap">操作日志</span>
                        </router-link>
                    </div>
                </div>
            </nav>
        </aside>
        <div class="flex-1 overflow-hidden flex flex-col min-w-0">
            <header class="h-[60px] flex items-center justify-between px-4 sm:px-6 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0">
                <div class="flex items-center gap-3">
                    <button v-if="isMobile ? !mobileOpen : !sidebarOpen" class="inline-flex items-center justify-center w-9 h-9 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                        @click="openSidebar" title="打开菜单">
                        <IconMenu />
                    </button>
                    <IconLogo v-if="isMobile ? !mobileOpen : !sidebarOpen" :size="28" />
                    <h1 class="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-snug">
                        <template v-if="$route.path.startsWith('/tasks')">任务管理</template>
                        <template v-else-if="$route.path.startsWith('/users')">用户管理</template>
                        <template v-else-if="$route.path.startsWith('/demos')">Demo管理</template>
                        <template v-else-if="$route.path.startsWith('/logs')">操作日志</template>
                    </h1>
                    <button @click="refreshPage" class="inline-flex items-center justify-center w-7 h-7 rounded text-[var(--text-tertiary)] cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-secondary)]" title="刷新">
                        <IconRefresh :size="16"/>
                    </button>
                </div>
                <div class="flex items-center gap-2 sm:gap-4">
                    <button class="inline-flex items-center justify-center w-8 h-8 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-pointer text-sm transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]" @click="toggleTheme" title="切换主题">
                        <IconSun v-if="isDark" /><IconMoon v-else />
                    </button>
                    <FDropdown placement="bottom-end">
                        <template #trigger>
                            <button class="user-info-btn rounded">
                                <IconUser />
                                <span>{{ username }}</span>
                            </button>
                        </template>
                        <div class="px-3 py-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                            <IconRole />
                            {{ role }}
                        </div>
                        <FDropdownItem class="text-red-400 flex items-center gap-2" divided @click="handleLogout">
                            <IconLogout />
                            退出登录
                        </FDropdownItem>
                    </FDropdown>
                </div>
            </header>
            <main class="flex-1 p-4 sm:p-6 overflow-y-auto">
                <router-view v-slot="{ Component }">
                    <keep-alive><component :is="Component" ref="currentViewRef"/></keep-alive>
                </router-view>
            </main>
        </div>
    </div>
    `,
    setup() {
        const sidebarOpen = ref(true);
        const mobileOpen = ref(false);
        const isMobile = ref(window.innerWidth < 1024);
        const systemMenuOpen = ref(true);
        const currentViewRef = ref(null);

        const isSystemMenuActive = computed(() => {
            const path = router?.currentRoute?.value?.path || '';
            return path === '/tasks' || path === '/users' || path === '/logs';
        });

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
        const isAdmin = computed(() => localStorage.getItem('role')?.split(',').filter(x => x === 'Admin').length > 0) || false;
        const role = computed(() => getEnumName('userRoleTypes', localStorage.getItem('role'), true));
        const theme = inject(ThemeSymbol, null);
        const isDark = computed(() => theme ? theme.effectiveTheme() === 'dark' : false);
        const toggleTheme = () => { if (theme) theme.toggle(); };
        const handleLogout = () => {
            clearAuth();
            window.location.hash = '#/login';
        };

        const refreshPage = async () => {
            if (!currentViewRef) return;
            const instance = currentViewRef.value;
            if (instance && typeof instance.refresh === 'function') {
                instance.refresh();
            }
        };

        return { sidebarOpen, mobileOpen, isMobile, systemMenuOpen, isSystemMenuActive, currentViewRef, closeSidebar, openSidebar, onNavClick, username, role, isAdmin, handleLogout, isDark, toggleTheme, refreshPage };
    }
};
