import { api } from '../api.js';
import { enums, getEnumName } from '../enums.js';
import { FButton, FInput, FSingleSelect, FCheckbox, FModal, FTable, FPagination } from '../components/index.js';

const { ref, onMounted, computed } = Vue;

export const UserManagerView = {
    components: { FButton, FInput, FSingleSelect, FCheckbox, FModal, FTable, FPagination },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">👥 用户管理</h1>
            <FButton type="success" icon="➕" @click="showCreateModal = true">新增用户</FButton>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <FTable :data="users" :columns="columns" empty-text="暂无用户">
                <template #role="{ row }">
                    <span :class="row.role === 'Admin' ? 'badge badge--purple' : 'badge badge--blue'">{{ getEnumName('userRoleTypes', row.role) }}</span>
                </template>
                <template #status="{ row }">
                    <span :class="row.isActive ? 'badge badge--success' : 'badge badge--danger'">{{ row.isActive ? '启用' : '禁用' }}</span>
                </template>
                <template #createdAt="{ row }">
                    {{ api.formatDate(row.createdAt) }}
                </template>
                <template #actions="{ row }">
                    <div class="flex gap-2">
                        <FButton size="sm" @click="editUser(row)">编辑</FButton>
                        <FButton type="danger" size="sm" @click="deleteUser(row)" v-if="row.id !== currentUserId">删除</FButton>
                    </div>
                </template>
            </FTable>
            <FPagination 
                v-model="currentPage"
                :page-size="pageSize"
                :total="totalCount"
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
                <FSingleSelect v-model="form.role" :options="roleOptions" value-key="value" label-key="displayName" placeholder="选择角色" />
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
        const isAdmin = computed(() => localStorage.getItem('role') === 'Admin');
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const pageCount = ref(0);

        const columns = [
            { prop: 'id', label: 'ID', width: '80px' },
            { prop: 'name', label: '用户名' },
            { prop: 'role', label: '角色' },
            { prop: 'status', label: '状态' },
            { prop: 'createdAt', label: '创建时间' },
            { prop: 'actions', label: '操作' }
        ];

        const showModal = computed({
            get: () => showCreateModal.value || showEditModal.value,
            set: (val) => { if (!val) closeModal(); }
        });

        const roleOptions = computed(() => enums.userRoleTypes || []);

        const loadUsers = async () => {
            const result = await api.users.list(currentPage.value, pageSize.value);
            users.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            pageCount.value = result.pageCount || 0;
        };

        const goToPage = ({ page, pageSize: newSize }) => {
            currentPage.value = page;
            pageSize.value = newSize;
            loadUsers();
        };

        const editUser = (user) => {
            editingUserId.value = user.id;
            form.value = { name: user.name, password: '', role: user.role, isActive: user.isActive };
            showEditModal.value = true;
        };

        const saveUser = async () => {
            if (showCreateModal.value) {
                await api.users.create(form.value.name, form.value.password, form.value.role);
            } else {
                await api.users.update(editingUserId.value, form.value.name, form.value.password || undefined, form.value.role, form.value.isActive);
            }
            closeModal();
            await loadUsers();
        };

        const deleteUser = async (user) => {
            if (confirm(`确定删除用户 "${user.name}"？`)) {
                await api.users.delete(user.id);
                await loadUsers();
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
                window.location.hash = '#/tasks';
                return;
            }
            await loadUsers();
        });

        return { users, columns, currentUserId, showCreateModal, showEditModal, showModal, form, roleOptions, editUser, saveUser, deleteUser, closeModal, getEnumName, api, currentPage, totalCount, pageCount, goToPage };
    }
};
