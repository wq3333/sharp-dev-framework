import { api } from '../api.js';
import { enums, getEnumName } from '../enums.js';
import { FButton, FInput, FMultiSelect, FCheckbox, FModal, FTable, IconRefresh, IconPlus } from '../components/index.js';
import { formatDate } from '../utils.js';

const { ref, onMounted, computed } = Vue;

export const UserManagerView = {
    components: { FButton, FInput, FMultiSelect, FCheckbox, FModal, FTable, IconRefresh, IconPlus },
    template: `
    <div class="h-full flex flex-col">
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-4 gap-2">
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-cols-6 gap-2">
                <FInput v-model="nameFilter" placeholder="搜索名称" />
                <FMultiSelect v-model="roleFilter" :options="roleOptions" value-key="value" label-key="displayName" placeholder="全部角色" />
            </div>
            <div class="grid grid-cols-2 gap-2 md:flex">
                <FButton @click="loadUsers" :loading="loading"><template #icon><IconRefresh :size="12" /></template>刷新</FButton>
                <FButton type="success" @click="showCreateModal = true"><template #icon><IconPlus :size="12" /></template>新增</FButton>
            </div>
        </div>
        <div class="flex-1 min-h-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded flex flex-col overflow-hidden">
            <FTable :data="users" :columns="columns" empty-text="暂无用户" :loading="loading" :pagination="true"
                :current-page="currentPage" :page-size="pageSize" :total="totalCount" :page-count="pageCount" @page-change="goToPage">
                <template #role="{ row }">
                    <div class="flex gap-1 flex-wrap">
                        <span v-for="r in getEnumName('userRoleTypes', row.role, true).split(', ').filter(x => x)" :key="r"
                            :class="r.includes('Admin') ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(168,85,247,0.1)] text-[#a855f7]' : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(79,70,229,0.1)] text-[var(--accent)]'">{{ r }}</span>
                    </div>
                </template>
                <template #status="{ row }">
                    <span :class="row.isActive ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(22,163,74,0.1)] text-[var(--success)]' : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(220,38,38,0.1)] text-[var(--danger)]'">{{ row.isActive ? '启用' : '禁用' }}</span>
                </template>
                <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
                <template #actions="{ row }">
                    <div class="flex gap-2 justify-end">
                        <FButton size="sm" @click="editUser(row)">编辑</FButton>
                        <FButton type="danger" size="sm" @click="deleteUser(row)" v-if="row.id !== currentUserId">删除</FButton>
                    </div>
                </template>
            </FTable>
        </div>
        <FModal v-model="showModal" :title="showCreateModal ? '新增用户' : '编辑用户'">
            <div class="mb-4"><label class="block text-[13px] font-medium mb-1.5 text-[var(--text-secondary)]">用户名</label><FInput v-model="form.name" placeholder="请输入用户名" /></div>
            <div class="mb-4"><label class="block text-[13px] font-medium mb-1.5 text-[var(--text-secondary)]">密码{{ showEditModal ? '（不修改留空）' : '' }}</label><FInput v-model="form.password" type="password" placeholder="请输入密码" /></div>
            <div class="mb-4"><label class="block text-[13px] font-medium mb-1.5 text-[var(--text-secondary)]">角色</label><FMultiSelect v-model="form.roleList" :options="roleOptions" value-key="value" label-key="displayName" placeholder="选择角色" /></div>
            <div v-if="showEditModal" class="mb-4"><FCheckbox v-model="form.isActive" label="启用账户" /></div>
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
        const currentPage = ref(1);
        const pageSize = ref(10);
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
            { prop: 'actions', label: '操作', align: 'end' }
        ];

        const showModal = computed({ get: () => showCreateModal.value || showEditModal.value, set: (val) => { if (!val) closeModal(); } });
        const roleOptions = computed(() => enums.userRoleTypes || []);

        const loadUsers = async () => {
            loading.value = true;
            const result = await api.users.page(nameFilter.value, roleFilter.value, currentPage.value, pageSize.value, () => loading.value = false);
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
            if (showCreateModal.value) await api.users.create(form.value.name, form.value.password, roleStr);
            else await api.users.update(editingUserId.value, form.value.name, form.value.password || undefined, roleStr, form.value.isActive);
            closeModal();
            await loadUsers();
        };

        const deleteUser = async (user) => {
            if (confirm(`确定删除用户 "${user.name}"?`)) {
                await api.users.delete(user.id);
                await loadUsers();
            }
        };

        const closeModal = () => {
            showCreateModal.value = false;
            showEditModal.value = false;
            editingUserId.value = null;
            form.value = {
                name: '',
                password: '',
                roleList: [],
                isActive: true
            };
        };

        onMounted(async () => {
            await loadUsers();
        });

        const refresh = () => {
            loadUsers();
        };

        return { refresh, users, columns, currentUserId, nameFilter, roleFilter, showCreateModal, showEditModal, showModal, form, roleOptions, editUser, saveUser, deleteUser, closeModal, getEnumName, currentPage, pageSize, totalCount, pageCount, goToPage, formatDate, loading, loadUsers };
    }
};
