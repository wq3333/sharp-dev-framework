import { api } from '../api.js';
import { FButton, FInput, FSingleSelect, FModal, FTable, FPagination, FMultiSelect, toast } from '../components/index.js';

const { ref, onMounted, computed } = Vue;

const demoStatusOptions = [
    { value: 'Active', displayName: '激活' },
    { value: 'Inactive', displayName: '禁用' },
    { value: 'Pending', displayName: '待处理' }
];

export const DemoManagerView = {
    components: { FButton, FInput, FSingleSelect, FModal, FTable, FPagination, FMultiSelect },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">📋 Demo管理</h1>
            <div class="flex gap-2 flex-wrap">
                <FInput v-model="nameFilter" placeholder="搜索名称" style="width: 150px;" />
                <FMultiSelect v-model="statusFilter" :options="demoStatusOptions" value-key="value" label-key="displayName" placeholder="全部状态" style="width: 200px;" />
                <FButton type="primary" icon="➕" @click="openCreateModal">新建</FButton>
                <FButton size="sm" icon="🔄" @click="loadDemos" :loading="loading">刷新</FButton>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <FTable :data="demos" :columns="columns" empty-text="暂无数据">
                <template #description="{ row }">
                    {{ row.description || '-' }}
                </template>
                <template #status="{ row }">
                    <span :class="['badge', getStatusClass(row.status)]">{{ getStatusName(row.status) }}</span>
                </template>
                <template #category="{ row }">
                    {{ row.category || '-' }}
                </template>
                <template #createdAt="{ row }">
                    {{ api.formatDate(row.createdAt) }}
                </template>
                <template #actions="{ row }">
                    <div class="flex gap-2">
                        <FButton size="sm" @click="openEditModal(row)">编辑</FButton>
                        <FButton type="danger" size="sm" @click="deleteDemo(row)" :loading="deletingId === row.id">删除</FButton>
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

        <FModal v-model="modalVisible" :title="isEditing ? '编辑Demo' : '新建Demo'" width="500px">
            <div class="form-group">
                <label class="form-label">名称</label>
                <FInput v-model="formData.name" placeholder="请输入名称" />
            </div>
            <div class="form-group">
                <label class="form-label">描述</label>
                <FInput v-model="formData.description" placeholder="请输入描述" />
            </div>
            <div class="form-group">
                <label class="form-label">状态</label>
                <FSingleSelect v-model="formData.status" :options="demoStatusOptions" value-key="value" label-key="displayName" />
            </div>
            <div class="form-group">
                <label class="form-label">分类</label>
                <FInput v-model="formData.category" placeholder="请输入分类" />
            </div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <FButton @click="modalVisible = false">取消</FButton>
                    <FButton type="primary" @click="saveDemo" :loading="saving">保存</FButton>
                </div>
            </template>
        </FModal>
    </div>
    `,
    setup() {
        const demos = ref([]);
        const nameFilter = ref('');
        const statusFilter = ref([]);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const loading = ref(false);
        const saving = ref(false);
        const deletingId = ref(null);

        const columns = [
            { prop: 'id', label: 'ID', width: '80px' },
            { prop: 'name', label: '名称' },
            { prop: 'description', label: '描述' },
            { prop: 'status', label: '状态' },
            { prop: 'category', label: '分类' },
            { prop: 'createdAt', label: '创建时间' },
            { prop: 'actions', label: '操作' }
        ];

        const modalVisible = ref(false);
        const isEditing = ref(false);
        const editingId = ref(null);
        const formData = ref({ name: '', description: '', status: 'Active', category: '' });

        const getStatusName = (status) => {
            const opt = demoStatusOptions.find(o => o.value === status);
            return opt ? opt.displayName : status;
        };

        const getStatusClass = (status) => {
            switch (status) {
                case 'Active': return 'badge--success';
                case 'Inactive': return 'badge--danger';
                case 'Pending': return 'badge--warning';
                default: return 'badge--info';
            }
        };

        const loadDemos = async () => {
            loading.value = true;
            const result = await api.demos.list(nameFilter.value, statusFilter.value, currentPage.value, pageSize.value);
            demos.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            loading.value = false;
        };

        const goToPage = ({ page, pageSize: newSize }) => {
            currentPage.value = page;
            pageSize.value = newSize;
            loadDemos();
        };

        const openCreateModal = () => {
            isEditing.value = false;
            editingId.value = null;
            formData.value = { name: '', description: '', status: 'Active', category: '' };
            modalVisible.value = true;
        };

        const openEditModal = (demo) => {
            isEditing.value = true;
            editingId.value = demo.id;
            formData.value = { 
                name: demo.name, 
                description: demo.description || '', 
                status: demo.status, 
                category: demo.category || '' 
            };
            modalVisible.value = true;
        };

        const saveDemo = async () => {
            if (!formData.value.name) {
                toast.error('请输入名称');
                return;
            }
            saving.value = true;
            if (isEditing.value) {
                await api.demos.update(editingId.value, formData.value.name, formData.value.description, formData.value.status, formData.value.category);
                toast.success('更新成功');
            } else {
                await api.demos.create(formData.value.name, formData.value.description, formData.value.status, formData.value.category);
                toast.success('创建成功');
            }
            modalVisible.value = false;
            loadDemos();
            saving.value = false;
        };

        const deleteDemo = async (demo) => {
            if (confirm(`确定删除 ${demo.name}？`)) {
                deletingId.value = demo.id;
                await api.demos.delete(demo.id);
                toast.success('删除成功');
                loadDemos();
                deletingId.value = null;
            }
        };

        onMounted(() => {
            loadDemos();
        });

        return { 
            demos, columns, nameFilter, statusFilter, demoStatusOptions, currentPage, totalCount, pageSize, 
            loading, saving, deletingId, modalVisible, isEditing, formData,
            getStatusName, getStatusClass, loadDemos, goToPage, 
            openCreateModal, openEditModal, saveDemo, deleteDemo, api 
        };
    }
};