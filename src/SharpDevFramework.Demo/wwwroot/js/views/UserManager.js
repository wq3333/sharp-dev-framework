import { api } from '../api.js';
import { enums, loadEnums, getEnumName } from '../enums.js';
import { FButton, FInput, FSelect, FCheckbox, FModal, FPagination } from '../components/index.js';

const { ref, onMounted, computed } = Vue;

export const UserManagerView = {
    components: { FButton, FInput, FSelect, FCheckbox, FModal, FPagination },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">👥 用户管理</h1>
            <FButton type="success" icon="➕" @click="showCreateModal = true">新增用户</FButton>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <table class="glass-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>用户名</th>
                        <th>角色</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in users" :key="user.id">
                        <td>{{ user.id }}</td>
                        <td>{{ user.name }}</td>
                        <td><span :class="user.role === 1 ? 'badge badge--purple' : 'badge badge--blue'">{{ getEnumName('userRoles', user.role) }}</span></td>
                        <td><span :class="user.isActive ? 'badge badge--green' : 'badge badge--red'">{{ user.isActive ? '启用' : '禁用' }}</span></td>
                        <td>{{ api.formatDate(user.createdAt) }}</td>
                        <td>
                            <div class="flex gap-2">
                                <FButton size="sm" @click="editUser(user)">编辑</FButton>
                                <FButton type="danger" size="sm" @click="deleteUser(user)" v-if="user.id !== currentUserId">删除</FButton>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="users.length === 0" class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-text">暂无用户</div>
            </div>
            <FPagination 
                v-if="totalPages > 1"
                v-model="currentPage"
                :total="totalCount"
                :page-size="pageSize"
                @page-change="goToPage"
            />
        </div>

        <FModal v-model="showModal" :title="showCreateModal ? '👤 新增用户' : '✏️ 编辑用户'">
            <div class="form-group">
                <label class="form-label">用户名</label>
                <FInput v-model="form.name" placeholder="请输入用户名" />
            </div>
            <div class="form-group">
                <label class="form-label">密码{{ showEditModal ? '（不修改留空）' : '' }}</label>
                <FInput v-model="form.password" type="password" placeholder="请输入密码" />
            </div>
            <div class="form-group">
                <label class="form-label">角色</label>
                <FSelect v-model="form.role" :options="roleOptions" value-key="value" label-key="name" placeholder="选择角色" />
            </div>
            <div v-if="showEditModal" class="form-group">
                <FCheckbox v-model="form.isActive" label="启用账户" />
            </div>
            <template #footer>
                <FButton @click="closeModal">取消</FButton>
                <FButton type="success" @click="saveUser">保存</FButton>
            </template>
        </FModal>
    </div>
    `,
    setup() {
        const users = ref([]);
        const showCreateModal = ref(false);
        const showEditModal = ref(false);
        const form = ref({ name: '', password: '', role: 0, isActive: true });
        const editingUserId = ref(null);
        const currentUserId = computed(() => parseInt(localStorage.getItem('userId') || '0'));
        const isAdmin = computed(() => localStorage.getItem('role') === '1');
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);

        const showModal = computed({
            get: () => showCreateModal.value || showEditModal.value,
            set: (val) => { if (!val) closeModal(); }
        });

        const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
        const roleOptions = computed(() => enums.userRoles || []);

        const loadUsers = async () => {
            try {
                const result = await api.getUsers(currentPage.value, pageSize.value);
                users.value = result.data || [];
                totalCount.value = result.totalCount || 0;
            } catch (e) {
                console.error('Failed to load users:', e);
            }
        };

        const goToPage = (page) => {
            if (page < 1 || page > totalPages.value) return;
            currentPage.value = page;
            loadUsers();
        };

        const editUser = (user) => {
            editingUserId.value = user.id;
            form.value = { name: user.name, password: '', role: user.role, isActive: user.isActive };
            showEditModal.value = true;
        };

        const saveUser = async () => {
            try {
                if (showCreateModal.value) {
                    await api.createUser(form.value.name, form.value.password, form.value.role);
                } else {
                    await api.updateUser(editingUserId.value, form.value.name, form.value.password || undefined, form.value.role, form.value.isActive);
                }
                closeModal();
                await loadUsers();
            } catch (e) {
                console.error('Failed to save user:', e);
            }
        };

        const deleteUser = async (user) => {
            if (confirm(`确定删除用户 "${user.name}"？`)) {
                try {
                    await api.deleteUser(user.id);
                    await loadUsers();
                } catch (e) {
                    console.error('Failed to delete user:', e);
                }
            }
        };

        const closeModal = () => {
            showCreateModal.value = false;
            showEditModal.value = false;
            editingUserId.value = null;
            form.value = { name: '', password: '', role: 0, isActive: true };
        };

        onMounted(async () => {
            if (!isAdmin.value) {
                window.location.hash = '#/files';
                return;
            }
            await loadEnums();
            await loadUsers();
        });

        return { users, currentUserId, showCreateModal, showEditModal, showModal, form, roleOptions, editUser, saveUser, deleteUser, closeModal, getEnumName, api, currentPage, totalCount, totalPages, goToPage };
    }
};
