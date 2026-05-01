import { api } from '../api.js';
import { enums, getEnumName, getTaskStatusClass } from '../enums.js';
import { onTaskUpdated } from '../signalr.js';
import { formatDate } from '../utils.js';
import { FButton, FMultiSelect, FTable, FModal } from '../components/index.js';

const { ref, onMounted, computed, watch } = Vue;

export const TaskManagerView = {
    components: { FButton, FMultiSelect, FTable, FModal },
    template: `
    <div class="h-full flex flex-col">
        <div class="flex items-center justify-between mb-4 gap-4">
            <div class="flex gap-2 flex-wrap">
                <FMultiSelect v-model="statusFilter" :options="taskStateOptions" value-key="value" label-key="displayName" placeholder="全部状态" style="width: 200px;" />
                <FMultiSelect v-model="typeFilter" :options="taskTypeOptions" value-key="value" label-key="displayName" placeholder="全部类型" style="width: 200px;" />
                <FButton size="sm" @click="loadTasks" :loading="loading">刷新</FButton>
            </div>
        </div>
        <div class="flex-1 min-h-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg flex flex-col overflow-hidden">
            <FTable :data="tasks" :columns="columns" empty-text="暂无任务" :pagination="true"
                :current-page="currentPage" :page-size="pageSize" :total="totalCount" @page-change="goToPage">
                <template #status="{ row }">
                    <span :class="'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + taskStatusClass(row.status)">{{ getEnumName('taskStates', row.status) }}</span>
                    <span v-if="row.errorMessage" class="ml-2 text-xs text-[var(--text-tertiary)]" :title="row.errorMessage">(有错误)</span>
                </template>
                <template #type="{ row }">
                    <div class="flex gap-1 flex-wrap">
                        <span v-for="t in getEnumName('taskTypes', row.type, true).split(', ').filter(x => x)" :key="t" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(79,70,229,0.1)] text-[var(--accent)]">{{ t }}</span>
                    </div>
                </template>
                <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
                <template #actions="{ row }">
                    <div class="flex gap-2">
                        <FButton size="sm" @click="viewDetail(row.id)">详情</FButton>
                        <FButton v-if="row.status === 3" size="sm" @click="retryTask(row.id)">重试</FButton>
                        <FButton type="danger" size="sm" @click="deleteTask(row)">删除</FButton>
                    </div>
                </template>
            </FTable>
        </div>
        <FModal v-model="detailModalVisible" title="任务详情" width="520px">
            <div v-if="currentTask" class="flex flex-col gap-3">
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">ID</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all">{{ currentTask.id }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">用户ID</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all">{{ currentTask.userId }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">类型</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all"><span v-for="t in getEnumName('taskTypes', currentTask.type, true).split(', ').filter(x => x)" :key="t" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(79,70,229,0.1)] text-[var(--accent)] mr-1">{{ t }}</span></span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">状态</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all"><span :class="'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ' + taskStatusClass(currentTask.status)">{{ getEnumName('taskStates', currentTask.status) }}</span></span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">数据</span><span class="flex-1 font-mono text-xs bg-[var(--bg-base)] px-3 py-2 rounded-md border border-[var(--border-subtle)] whitespace-pre-wrap break-all text-[var(--text-primary)]">{{ currentTask.data || '-' }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">错误信息</span><span class="flex-1 leading-relaxed break-all" :class="currentTask.errorMessage ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'">{{ currentTask.errorMessage || '-' }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">重试次数</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all">{{ currentTask.retryCount }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">创建时间</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all">{{ formatDate(currentTask.createdAt) }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">完成时间</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all">{{ currentTask.completedAt ? formatDate(currentTask.completedAt) : '-' }}</span></div>
                <div class="flex items-start gap-4 text-sm"><span class="w-20 shrink-0 text-[var(--text-secondary)] font-medium leading-relaxed">是否删除</span><span class="flex-1 text-[var(--text-primary)] leading-relaxed break-all">{{ currentTask.isDeleted ? '是' : '否' }}</span></div>
            </div>
            <template #footer><FButton @click="detailModalVisible = false">关闭</FButton></template>
        </FModal>
    </div>
    `,
    setup() {
        const tasks = ref([]);
        const statusFilter = ref([]);
        const typeFilter = ref([]);
        const loading = ref(false);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const pageCount = ref(0);
        const detailModalVisible = ref(false);
        const currentTask = ref(null);

        const columns = [
            { prop: 'id', label: 'ID', width: '80px' },
            { prop: 'type', label: '类型' },
            { prop: 'status', label: '状态' },
            { prop: 'createdAt', label: '创建时间' },
            { prop: 'actions', label: '操作' }
        ];

        const taskStateOptions = computed(() => enums.taskStates || []);
        const taskTypeOptions = computed(() => enums.taskTypes || []);

        const loadTasks = async () => {
            loading.value = true;
            const result = await api.tasks.list(statusFilter.value, typeFilter.value, currentPage.value, pageSize.value);
            tasks.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            pageCount.value = result.pageCount || 0;
            loading.value = false;
        };

        const goToPage = ({ page, pageSize: newSize }) => { currentPage.value = page; pageSize.value = newSize; loadTasks(); };
        const handleTaskUpdated = () => { loadTasks(); };
        const viewDetail = async (id) => { currentTask.value = await api.tasks.get(id); detailModalVisible.value = true; };
        const retryTask = async (id) => { await api.tasks.retry(id); await loadTasks(); };
        const deleteTask = async (task) => { if (confirm(`确定删除任务 #${task.id}？`)) { await api.tasks.delete(task.id); await loadTasks(); } };

        watch([statusFilter, typeFilter], () => { currentPage.value = 1; loadTasks(); });
        onMounted(async () => { await loadTasks(); onTaskUpdated(handleTaskUpdated); });

        return { tasks, columns, statusFilter, typeFilter, taskStateOptions, taskTypeOptions, taskStatusClass: getTaskStatusClass, getEnumName, loadTasks, retryTask, deleteTask, formatDate, currentPage, totalCount, pageCount, goToPage, loading, detailModalVisible, currentTask, viewDetail };
    }
};
