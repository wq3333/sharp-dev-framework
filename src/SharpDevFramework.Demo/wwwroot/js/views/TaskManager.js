import { api } from '../api.js';
import { enums, loadEnums, getEnumName, getTaskStatusClass } from '../enums.js';
import { onTaskUpdated } from '../signalr.js';
import { FButton, FSelect, FPagination } from '../components/index.js';

const { ref, onMounted, computed, watch } = Vue;

export const TaskManagerView = {
    components: { FButton, FSelect, FPagination },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">⚙️ 任务管理</h1>
            <div class="flex gap-2">
                <FSelect v-model="statusFilter" :options="taskStateOptions" value-key="value" label-key="displayName" placeholder="全部状态" style="width: 150px;" />
                <FButton size="sm" icon="🔄" @click="loadTasks">刷新</FButton>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <table class="glass-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>类型</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="task in tasks" :key="task.id">
                        <td>{{ task.id }}</td>
                        <td>{{ getEnumName('taskTypes', task.type) }}</td>
                        <td>
                            <span :class="['badge', taskStatusClass(task.status)]">{{ getEnumName('taskStates', task.status) }}</span>
                            <span v-if="task.errorMessage" style="margin-left: 8px; font-size: 12px; color: #94a3b8;" :title="task.errorMessage">(有错误)</span>
                        </td>
                        <td>{{ api.formatDate(task.createdAt) }}</td>
                        <td>
                            <div class="flex gap-2">
                                <FButton v-if="task.status === 3" size="sm" @click="retryTask(task.id)">重试</FButton>
                                <FButton type="danger" size="sm" @click="deleteTask(task)">删除</FButton>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="tasks.length === 0" class="empty-state">
                <div class="empty-icon">⚙️</div>
                <div class="empty-text">暂无任务</div>
            </div>
            <FPagination 
                v-if="pageCount > 1"
                v-model="currentPage"
                :total="totalCount"
                :page-size="pageSize"
                @page-change="goToPage"
            />
        </div>
    </div>
    `,
    setup() {
        const tasks = ref([]);
        const statusFilter = ref(null);
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);
        const pageCount = ref(0);

        const taskStateOptions = computed(() => enums.taskStates || []);

        const loadTasks = async () => {
            try {
                const result = await api.getTasks(statusFilter.value, currentPage.value, pageSize.value);
                tasks.value = result.data || [];
                totalCount.value = result.totalCount || 0;
                pageCount.value = result.pageCount || 0;
            } catch (e) {
                console.error('Failed to load tasks:', e);
            }
        };

        const goToPage = (page) => {
            if (page < 1 || page > pageCount.value) return;
            currentPage.value = page;
            loadTasks();
        };

        const handleTaskUpdated = () => {
            loadTasks();
        };

        const retryTask = async (id) => {
            try {
                await api.retryTask(id);
                await loadTasks();
            } catch (e) {
                console.error('Failed to retry task:', e);
            }
        };

        const deleteTask = async (task) => {
            if (confirm(`确定删除任务 #${task.id}？`)) {
                try {
                    await api.deleteTask(task.id);
                    await loadTasks();
                } catch (e) {
                    console.error('Failed to delete task:', e);
                }
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

        return { tasks, statusFilter, taskStateOptions, taskStatusClass: getTaskStatusClass, getEnumName, loadTasks, retryTask, deleteTask, api, currentPage, totalCount, pageCount, goToPage };
    }
};
