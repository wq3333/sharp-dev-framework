import { FButton, FDropdown, FDropdownItem } from './index.js';
import { clearAuth } from '../auth.js';
import { stopSignalR } from '../signalr.js';
import { getEnumName } from '../enums.js';
import { ThemeSymbol } from '../app.js';

const { computed, inject } = Vue;

export const LayoutComponent = {
    name: 'LayoutComponent',
    components: { FButton, FDropdown, FDropdownItem },
    template: `
    <div class="flex h-screen">
        <div class="w-60 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
            <div class="flex items-center gap-2.5 px-4 py-4 border-b border-[var(--border-subtle)]">
                <div class="w-8 h-8 rounded-md bg-[var(--accent)] text-[var(--text-inverse)] flex items-center justify-center text-xs font-bold tracking-wider shrink-0">SD</div>
                <div class="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">SharpDev</div>
            </div>
            <nav class="flex-1 px-2.5 py-3 overflow-y-auto">
                <router-link to="/tasks" class="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out mb-0.5 no-underline hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    :class="{ 'bg-[var(--bg-active)] text-[var(--accent)] font-medium': $route.path === '/tasks' }">
                    <span class="w-5 inline-flex items-center justify-center text-sm shrink-0">&#x2699;</span>
                    <span>任务管理</span>
                </router-link>
                <router-link v-if="isAdmin" to="/users"
                    class="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out mb-0.5 no-underline hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    :class="{ 'bg-[var(--bg-active)] text-[var(--accent)] font-medium': $route.path === '/users' }">
                    <span class="w-5 inline-flex items-center justify-center text-sm shrink-0">&#x1F464;</span>
                    <span>用户管理</span>
                </router-link>
                <router-link to="/demos" class="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm text-[var(--text-secondary)] cursor-pointer transition-all duration-150 ease-out mb-0.5 no-underline hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    :class="{ 'bg-[var(--bg-active)] text-[var(--accent)] font-medium': $route.path === '/demos' }">
                    <span class="w-5 inline-flex items-center justify-center text-sm shrink-0">&#x1F4CB;</span>
                    <span>Demo管理</span>
                </router-link>
            </nav>
        </div>
        <div class="flex-1 overflow-hidden flex flex-col min-w-0">
            <header class="h-14 flex items-center justify-between px-6 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0">
                <h1 class="text-lg font-semibold text-[var(--text-primary)] tracking-tight leading-snug">
                    <template v-if="$route.path.startsWith('/tasks')">任务管理</template>
                    <template v-else-if="$route.path.startsWith('/users')">用户管理</template>
                    <template v-else-if="$route.path.startsWith('/demos')">Demo管理</template>
                </h1>
                <div class="flex items-center gap-4">
                    <button class="inline-flex items-center justify-center w-8 h-8 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] cursor-pointer text-sm transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]" @click="toggleTheme" title="切换主题">
                        {{ isDark ? '&#x25D0;' : '&#x25D1;' }}
                    </button>
                    <FDropdown placement="bottom-end">
                        <template #trigger>
                            <button class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm font-medium cursor-pointer transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)]">{{ username }}</button>
                        </template>
                        <div class="px-3 py-2 text-xs text-[var(--text-tertiary)]">角色：{{ role }}</div>
                        <FDropdownItem divided @click="handleLogout">退出登录</FDropdownItem>
                    </FDropdown>
                </div>
            </header>
            <main class="flex-1 p-6 overflow-y-auto">
                <router-view v-slot="{ Component }">
                    <keep-alive><component :is="Component" /></keep-alive>
                </router-view>
            </main>
        </div>
    </div>
    `,
    setup() {
        const username = computed(() => localStorage.getItem('username') || '');
        const isAdmin = computed(() => localStorage.getItem('role').split(',').filter(x => x === 'Admin').length > 0);
        const role = computed(() => getEnumName('userRoleTypes', localStorage.getItem('role'), true));
        const theme = inject(ThemeSymbol, null);
        const isDark = computed(() => theme ? theme.effectiveTheme() === 'dark' : false);
        const toggleTheme = () => { if (theme) theme.toggle(); };
        const handleLogout = () => { stopSignalR(); clearAuth(); window.location.hash = '#/login'; };
        return { username, role, isAdmin, handleLogout, isDark, toggleTheme };
    }
};
