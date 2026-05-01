import { api } from '../api.js';
import { enums, getEnumName } from '../enums.js';
import { FButton, FInput, FMultiSelect, FCheckbox, FModal, FTable } from '../components/index.js';
import { formatDate } from '../utils.js';

const { ref, onMounted, computed } = Vue;

export const UserManagerView = {
    components: { FButton, FInput, FMultiSelect, FCheckbox, FModal, FTable },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">👥 用户管理</h1>
            <div class="flex gap-2 flex-wrap">
                <FInput v-model="nameFilter" placeholder="搜索名称" style="width: 150px;" />
                <FMultiSelect v-model="roleFilter" :options="roleOptions" value-key="value" label-key="displayName" placeholder="全部角色" style="width: 200px;" />
                <FButton icon="🔄" @click="loadUsers" :loading="loading">刷新</FButton>
                <FButton type="success" icon="➕" @click="showCreateModal = true">新增用户</FButton>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <FTable 
                :data="users" 
                :columns="columns" 
                empty-text="暂无用户"
                :pagination="true"
                :current-page="currentPage"
                :page-size="pageSize"
                :total="totalCount"
                @page-change="goToPage"
            >
                <template #role="{ row }">
                    <div class="flex gap-1 flex-wrap">
                        <span v-for="r in getEnumName('userRoleTypes', row.role, true).split(', ').filter(x => x)" :key="r" :class="r.includes('Admin') ? 'badge badge--purple' : 'badge badge--blue'">{{ r }}</span>
                    </div>
                </template>
                <template #status="{ row }">
                    <span :class="row.isActive ? 'badge badge--success' : 'badge badge--danger'">{{ row.isActive ? '启用' : '禁用' }}</span>
                </template>
                <template #createdAt="{ row }">
                    {{ formatDate(row.createdAt) }}
                </template>
                <template #actions="{ row }">
                    <div class="flex gap-2">
                        <FButton size="sm" @click="editUser(row)">编辑</FButton>
                        <FButton type="danger" size="sm" @click="deleteUser(row)" v-if="row.id !== currentUserId">删除</FButton>
                    </div>
                </template>
            </FTable>
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
                <FMultiSelect v-model="form.roleList" :options="roleOptions" value-key="value" label-key="displayName" placeholder="选择角色" />
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
        const form = ref({ name: '', password: '', roleList: [], isActive: true });
        const editingUserId = ref(null);
        const currentUserId = computed(() => parseInt(localStorage.getItem('userId') || '0'));
        const isAdmin = computed(() => localStorage.getItem('role').split(',').filter(x => x === 'Admin').length > 0);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const pageCount = ref(0);
        const roleFilter = ref([]);
        const nameFilter = ref('');
        const loading = ref(false);

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
            loading.value = true;
            const result = await api.users.list(nameFilter.value, roleFilter.value, currentPage.value, pageSize.value);
            users.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            pageCount.value = result.pageCount || 0;
            loading.value = false;
        };

        const goToPage = ({ page, pageSize: newSize }) => {
            currentPage.value = page;
            pageSize.value = newSize;
            loadUsers();
        };

        const editUser = (user) => {
            editingUserId.value = user.id;
            form.value = {
                name: user.name,
                password: '',
                roleList: user.role ? user.role.split(',') : [],
                isActive: user.isActive
            };
            showEditModal.value = true;
        };

        const saveUser = async () => {
            const roleStr = form.value.roleList.join(',');
            if (showCreateModal.value) {
                await api.users.create(form.value.name, form.value.password, roleStr);
            } else {
                await api.users.update(editingUserId.value, form.value.name, form.value.password || undefined, roleStr, form.value.isActive);
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
            form.value = { name: '', password: '', roleList: [], isActive: true };
        };

        onMounted(async () => {
            if (!isAdmin.value) {
                window.location.hash = '#/tasks';
                return;
            }
            await loadUsers();
        });

        return { users, columns, currentUserId, nameFilter, roleFilter, showCreateModal, showEditModal, showModal, form, roleOptions, editUser, saveUser, deleteUser, closeModal, getEnumName, currentPage, totalCount, pageCount, goToPage, formatDate, loading, loadUsers };
    }
};
