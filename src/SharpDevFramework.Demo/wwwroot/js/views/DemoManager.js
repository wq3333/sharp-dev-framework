import { api } from '../api.js';
import { formatDate } from '../utils.js';
import { FButton, FInput, FModal, FTable, FMultiSelect, toast, IconRefresh, IconPlus } from '../components/index.js';
import { enums, getEnumName } from '../enums.js';

const { ref, computed, onMounted, watch } = Vue;

export const DemoManagerView = {
    components: { FButton, FInput, FModal, FTable, FMultiSelect, IconRefresh, IconPlus },
    template: `
    <div class="h-full flex flex-col">
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-4 gap-2">
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 lg:grid-cols-6 gap-2">
                <FInput v-model="nameFilter" placeholder="搜索名称" />
                <FMultiSelect v-model="typeFilter" :options="demoTypeOptions" value-key="value" label-key="displayName" placeholder="全部类型" />
            </div>
            <div class="grid grid-cols-2 gap-2">
                <FButton type="primary" @click="openCreateModal"><template #icon><IconPlus :size="12" /></template>新建</FButton>
                <FButton @click="loadDemos" :loading="loading"><template #icon><IconRefresh :size="12" /></template>刷新</FButton>
            </div>
        </div>
        <div class="flex-1 min-h-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded flex flex-col overflow-hidden">
            <FTable :data="demos" :columns="columns" empty-text="暂无数据" :loading="loading" :pagination="true"
                :current-page="currentPage" :page-size="pageSize" :total="totalCount" :page-count="pageCount" @page-change="goToPage">
                <template #type="{ row }">
                    <div class="flex gap-1 flex-wrap">
                        <span v-for="t in getEnumName('demoTypes', row.type, true).split(', ').filter(x => x)" :key="t" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(79,70,229,0.1)] text-[var(--accent)]">{{ t }}</span>
                    </div>
                </template>
                <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
                <template #actions="{ row }">
                    <div class="flex gap-2 justify-end">
                        <FButton size="sm" @click="openEditModal(row)">编辑</FButton>
                        <FButton type="danger" size="sm" @click="deleteDemo(row)" :loading="deletingId === row.id">删除</FButton>
                    </div>
                </template>
            </FTable>
        </div>
        <FModal v-model="modalVisible" :title="isEditing ? '编辑Demo' : '新建Demo'" width="500px">
            <div class="mb-4"><label class="block text-[13px] font-medium mb-1.5 text-[var(--text-secondary)]">名称</label><FInput v-model="formData.name" placeholder="请输入名称" /></div>
            <div class="mb-4"><label class="block text-[13px] font-medium mb-1.5 text-[var(--text-secondary)]">类型</label><FMultiSelect v-model="formData.typeList" :options="demoTypeOptions" value-key="value" label-key="displayName" placeholder="请选择类型" /></div>
            <template #footer>
                <div class="flex gap-2 justify-end">
                    <FButton @click="modalVisible = false">取消</FButton>
                    <FButton type="success" @click="saveDemo" :loading="saving">保存</FButton>
                </div>
            </template>
        </FModal>
    </div>
    `,
    setup() {
        const demos = ref([]);
        const nameFilter = ref('');
        const typeFilter = ref([]);
        const currentPage = ref(1);
        const pageSize = ref(10);
        const totalCount = ref(0);
        const pageCount = ref(0);
        const loading = ref(false);
        const saving = ref(false);
        const deletingId = ref(null);

        const demoTypeOptions = computed(() => enums.demoTypes || []);
        const columns = [
            { prop: 'id', label: 'ID', width: '80px' },
            { prop: 'name', label: '名称' },
            { prop: 'type', label: '类型' },
            { prop: 'createdAt', label: '创建时间' },
            { prop: 'actions', label: '操作', width: '150px', align: 'end' }
        ];

        const modalVisible = ref(false);
        const isEditing = ref(false);
        const editingId = ref(null);
        const formData = ref({ name: '', typeList: [] });

        const loadDemos = async () => {
            loading.value = true;
            const result = await api.demos.page(nameFilter.value, typeFilter.value, currentPage.value, pageSize.value);
            demos.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            pageCount.value = result.pageCount || 0;
            loading.value = false;
        };

        const goToPage = ({ page, pageSize: newSize }) => { currentPage.value = page; pageSize.value = newSize; loadDemos(); };

        const openCreateModal = () => { isEditing.value = false; editingId.value = null; formData.value = { name: '', typeList: [] }; modalVisible.value = true; };
        const openEditModal = (demo) => { isEditing.value = true; editingId.value = demo.id; formData.value = { name: demo.name, typeList: demo.type ? demo.type.split(',').map(t => parseInt(t)) : [] }; modalVisible.value = true; };

        const saveDemo = async () => {
            if (!formData.value.name) { toast.error('请输入名称'); return; }
            saving.value = true;
            const typeStr = formData.value.typeList.join(',');
            if (isEditing.value) { await api.demos.update(editingId.value, formData.value.name, typeStr); toast.success('更新成功'); }
            else { await api.demos.create(formData.value.name, typeStr); toast.success('创建成功'); }
            loadDemos();
            hideModal();
        };

        const hideModal = () => { modalVisible.value = false; saving.value = false; };

        const deleteDemo = async (demo) => {
            if (confirm(`确定删除 ${demo.name}？`)) {
                deletingId.value = demo.id;
                await api.demos.delete(demo.id);
                toast.success('删除成功');
                loadDemos();
                deletingId.value = null;
            }
        };

        onMounted(() => { loadDemos(); });
        return { demos, columns, nameFilter, typeFilter, demoTypeOptions, currentPage, totalCount, pageCount, pageSize, loading, saving, deletingId, modalVisible, isEditing, formData, loadDemos, goToPage, openCreateModal, openEditModal, saveDemo, deleteDemo, formatDate, getEnumName };
    }
};
