import { api } from '../api.js';
import { formatDate } from '../utils.js';
import { FButton, FInput, FModal, FTable, FMultiSelect, toast } from '../components/index.js';
import { enums, getEnumName } from '../enums.js';

const { ref, computed, onMounted } = Vue;

export const DemoManagerView = {
    components: { FButton, FInput, FModal, FTable, FMultiSelect },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">📋 Demo管理</h1>
            <div class="flex gap-2 flex-wrap">
                <FInput v-model="nameFilter" placeholder="搜索名称" style="width: 150px;" />
                <FMultiSelect v-model="typeFilter" :options="demoTypeOptions" value-key="value" label-key="displayName" placeholder="全部类型" style="width: 200px;" />
                <FButton type="primary" icon="➕" @click="openCreateModal">新建</FButton>
                <FButton size="sm" icon="🔄" @click="loadDemos" :loading="loading">刷新</FButton>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <FTable 
                :data="demos" 
                :columns="columns" 
                empty-text="暂无数据"
                :pagination="true"
                :current-page="currentPage"
                :page-size="pageSize"
                :total="totalCount"
                @page-change="goToPage"
            >
                <template #type="{ row }">
                    <div class="flex gap-1 flex-wrap">
                        <span v-for="t in getEnumName('demoTypes', row.type, true).split(', ').filter(x => x)" :key="t" class="badge badge--info">{{ t }}</span>
                    </div>
                </template>
                <template #createdAt="{ row }">
                    {{ formatDate(row.createdAt) }}
                </template>
                <template #actions="{ row }">
                    <div class="flex gap-2">
                        <FButton size="sm" @click="openEditModal(row)">编辑</FButton>
                        <FButton type="danger" size="sm" @click="deleteDemo(row)" :loading="deletingId === row.id">删除</FButton>
                    </div>
                </template>
            </FTable>
        </div>

        <FModal v-model="modalVisible" :title="isEditing ? '编辑Demo' : '新建Demo'" width="500px">
            <div class="form-group">
                <label class="form-label">名称</label>
                <FInput v-model="formData.name" placeholder="请输入名称" />
            </div>
            <div class="form-group">
                <label class="form-label">类型</label>
                <FMultiSelect v-model="formData.typeList" :options="demoTypeOptions" value-key="value" label-key="displayName" placeholder="请选择类型" />
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
        const typeFilter = ref([]);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const loading = ref(false);
        const saving = ref(false);
        const deletingId = ref(null);

        const demoTypeOptions = computed(() => enums.demoTypes || []);

        const columns = [
            { prop: 'id', label: 'ID', width: '80px' },
            { prop: 'name', label: '名称' },
            { prop: 'type', label: '类型' },
            { prop: 'createdAt', label: '创建时间' },
            { prop: 'actions', label: '操作', width: '150px' }
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
            formData.value = { name: '', typeList: [] };
            modalVisible.value = true;
        };

        const openEditModal = (demo) => {
            isEditing.value = true;
            editingId.value = demo.id;
            formData.value = {
                name: demo.name,
                typeList: demo.type ? demo.type.split(',').map(t => parseInt(t)) : []
            };
            modalVisible.value = true;
        };

        const saveDemo = async () => {
            if (!formData.value.name) {
                toast.error('请输入名称');
                return;
            }
            saving.value = true;
            const typeStr = formData.value.typeList.join(',');
            if (isEditing.value) {
                await api.demos.update(editingId.value, formData.value.name, typeStr);
                toast.success('更新成功');
            } else {
                await api.demos.create(formData.value.name, typeStr);
                toast.success('创建成功');
            }
            loadDemos();
            hideModal();
        };

        const hideModal = () => {
            modalVisible.value = false;
            saving.value = false;
        }

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
            demos, columns, nameFilter, typeFilter, demoTypeOptions, currentPage, totalCount, pageSize,
            loading, saving, deletingId, modalVisible, isEditing, formData,
            loadDemos, goToPage,
            openCreateModal, openEditModal, saveDemo, deleteDemo, formatDate, getEnumName
        };
    }
};