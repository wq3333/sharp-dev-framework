import { api } from '../api.js';
import { setAuth } from '../auth.js';
import { initSignalR } from '../signalr.js';
import { FButton, FInput } from '../components/index.js';

const { ref } = Vue;

export const LoginView = {
    components: { FButton, FInput },
    template: `
    <div class="login-page">
        <div class="glass-panel login-card">
            <h1 class="login-title">SharpDevFramework</h1>
            <p class="login-subtitle">登录以继续访问管理后台</p>
            <form @submit.prevent="handleLogin">
                <div class="form-group">
                    <label class="form-label">用户名</label>
                    <FInput v-model="username" placeholder="请输入用户名" />
                </div>
                <div class="form-group">
                    <label class="form-label">密码</label>
                    <FInput v-model="password" type="password" placeholder="请输入密码" />
                </div>
                <div v-if="error" class="form-error">{{ error }}</div>
                <FButton type="primary" :loading="loading" block @click="handleLogin" style="margin-top: 24px;">
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
                window.location.hash = '#/tasks';
            } finally {
                loading.value = false;
            }
        };

        return { username, password, loading, error, handleLogin };
    }
};
