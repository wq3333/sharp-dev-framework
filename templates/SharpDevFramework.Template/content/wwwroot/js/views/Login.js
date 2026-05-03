import { api } from '../api.js';
import { setAuth } from '../auth.js';
import { initSignalR } from '../signalr.js';
import { FButton, FInput, IconLogo } from '../components/index.js';

const { ref } = Vue;

export const LoginView = {
    components: { FButton, FInput, IconLogo },
    template: `
    <div class="login-page">
        <div class="login-bg">
            <div class="login-orb login-orb--1"></div>
            <div class="login-orb login-orb--2"></div>
            <div class="login-orb login-orb--3"></div>
            <div class="login-grid"></div>
        </div>
        <div class="login-card m-6">
            <div class="flex flex-col items-center mb-4">
                <IconLogo :size="40" />
            </div>
            <form @submit.prevent="handleLogin">
                <div class="mb-5">
                    <label class="block text-[13px] font-medium mb-1.5 text-gray-400">用户名</label>
                    <FInput v-model="username" placeholder="请输入用户名" />
                </div>
                <div class="mb-5">
                    <label class="block text-[13px] font-medium mb-1.5 text-gray-400">密码</label>
                    <FInput v-model="password" type="password" placeholder="请输入密码" />
                </div>
                <div v-if="error" class="text-[13px] text-red-400 mt-2">{{ error }}</div>
                <FButton type="primary" :loading="loading" block @click="handleLogin" class="mt-7">
                    {{ loading ? '登录中...' : '登 录' }}
                </FButton>
            </form>
        </div>
    </div>
    `,
    setup() {
        const username = ref('admin');
        const password = ref('');
        const loading = ref(false);
        const error = ref('');

        const handleLogin = async () => {
            loading.value = true;
            error.value = '';
            try {
                const data = await api.auth.login(username.value, password.value, (e) => {
                    error.value = e.message || '登录失败，请检查用户名和密码';
                });
                setAuth(data);
                initSignalR();
                window.clearPageCache();
                window.location.hash = '#/tasks';
            } finally {
                loading.value = false;
            }
        };

        return { username, password, loading, error, handleLogin };
    }
};
