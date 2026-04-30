import { api } from '../api.js';
import { enums, loadEnums, getEnumName, getTaskStatusClass } from '../enums.js';
import { onTaskUpdated } from '../signalr.js';
import { FButton, FMultiSelect, FTable, FPagination } from '../components/index.js';

const { ref, onMounted, computed, watch } = Vue;

export const TaskManagerView = {
    components: { FButton, FMultiSelect, FTable, FPagination },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">⚙️ 任务管理</h1>
            <div class="flex gap-2 flex-wrap">
                <FMultiSelect v-model="statusFilter" :options="taskStateOptions" value-key="value" label-key="displayName" placeholder="全部状态" style="width: 200px;" />
                <FButton size="sm" icon="🔄" @click="loadTasks" :loading="loading">刷新</FButton>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <FTable :data="tasks" :columns="columns" empty-text="暂无任务">
                <template #status="{ row }">
                    <span :class="['badge', taskStatusClass(row.status)]">{{ getEnumName('taskStates', row.status) }}</span>
                    <span v-if="row.errorMessage" style="margin-left: 8px; font-size: 12px; color: #94a3b8;" :title="row.errorMessage">(有错误)</span>
                </template>
                <template #type="{ row }">
                    {{ getEnumName('taskTypes', row.type) }}
                </template>
                <template #createdAt="{ row }">
                    {{ api.formatDate(row.createdAt) }}
                </template>
                <template #actions="{ row }">
                    <div class="flex gap-2">
                        <FButton v-if="row.status === 3" size="sm" @click="retryTask(row.id)">重试</FButton>
                        <FButton type="danger" size="sm" @click="deleteTask(row)">删除</FButton>
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
    </div>
    `,
    setup() {
        const tasks = ref([]);
        const statusFilter = ref([]);
        const loading = ref(false);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const pageCount = ref(0);

        const columns = [
            { prop: 'id', label: 'ID', width: '80px' },
            { prop: 'type', label: '类型' },
            { prop: 'status', label: '状态' },
            { prop: 'createdAt', label: '创建时间' },
            { prop: 'actions', label: '操作' }
        ];

        const taskStateOptions = computed(() => enums.taskStates || []);

        const loadTasks = async () => {
            loading.value = true;
            const result = await api.tasks.list(statusFilter.value, currentPage.value, pageSize.value);
            tasks.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            pageCount.value = result.pageCount || 0;
            loading.value = false;
        };

        const goToPage = ({ page, pageSize: newSize }) => {
            currentPage.value = page;
            pageSize.value = newSize;
            loadTasks();
        };

        const handleTaskUpdated = () => {
            loadTasks();
        };

        const retryTask = async (id) => {
            await api.tasks.retry(id);
            await loadTasks();
        };

        const deleteTask = async (task) => {
            if (confirm(`确定删除任务 #${task.id}？`)) {
                await api.tasks.delete(task.id);
                await loadTasks();
            }
        };

        watch(statusFilter, () => {
            currentPage.value = 1;
            loadTasks();
        });

        onMounted(async () => {
            await loadTasks();
            onTaskUpdated(handleTaskUpdated);
        });

        return { tasks, columns, statusFilter, taskStateOptions, taskStatusClass: getTaskStatusClass, getEnumName, loadTasks, retryTask, deleteTask, api, currentPage, totalCount, pageCount, goToPage, loading };
    }
};
