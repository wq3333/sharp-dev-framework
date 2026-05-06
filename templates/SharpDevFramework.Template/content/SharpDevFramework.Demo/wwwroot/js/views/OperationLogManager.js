import { api } from '../api.js';
import { FButton, FInput, FTable, IconRefresh, FModal, FMultiSelect, FSingleSelect } from '../components/index.js';
import { formatDate, formatDuration } from '../utils.js';

const { ref, onMounted, watch, computed } = Vue;

export const OperationLogManagerView = {
    components: { FButton, FInput, FTable, IconRefresh, FModal, FMultiSelect, FSingleSelect },
    template: `
    <div class="h-full flex flex-col">
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between mb-4 gap-2">
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                <FInput v-model="usernameFilter" placeholder="搜索用户名" />
                <FMultiSelect v-model="operationTypeFilter" :options="operationTypeOptions" value-key="value" label-key="label" placeholder="全部操作类型" />
                <FSingleSelect v-model="isSuccessFilter" :options="isSuccessOptions" value-key="value" label-key="label" placeholder="全部状态" />
                <input type="date" v-model="startDateFilter" class="px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]" />
                <input type="date" v-model="endDateFilter" class="px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-sm text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]" />
            </div>
            <div class="grid grid-cols-1 gap-2 md:flex">
                <FButton @click="loadLogs" :loading="loading"><template #icon><IconRefresh :size="12" /></template>刷新</FButton>
            </div>
        </div>
        <div class="flex-1 min-h-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded flex flex-col overflow-hidden">
            <FTable :data="logs" :columns="columns" empty-text="暂无操作记录" :loading="loading" :pagination="true"
                :current-page="currentPage" :page-size="pageSize" :total="totalCount" :page-count="pageCount" @page-change="goToPage">
                <template #operationType="{ row }">
                    <span :class="getOperationTypeClass(row.operationType)">
                        {{ getOperationTypeLabel(row.operationType) }}
                    </span>
                </template>
                <template #isSuccess="{ row }">
                    <span :class="row.isSuccess ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(22,163,74,0.1)] text-[var(--success)]' : 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(220,38,38,0.1)] text-[var(--danger)]'">
                        {{ row.isSuccess ? '成功' : '失败' }}
                    </span>
                </template>
                <template #durationMs="{ row }">
                    {{ formatDuration(row.durationMs) }}
                </template>
                <template #createdAt="{ row }">{{ formatDate(row.createdAt) }}</template>
                <template #actions="{ row }">
                    <FButton size="sm" @click="showDetail(row)">详情</FButton>
                </template>
            </FTable>
        </div>
        <FModal v-model="detailVisible" title="操作日志详情" width="700px">
            <div v-if="currentDetail" class="space-y-3">
                <div class="grid grid-cols-2 gap-3">
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">日志ID</label><div class="text-sm">{{ currentDetail.id }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">用户ID</label><div class="text-sm">{{ currentDetail.userId }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">用户名</label><div class="text-sm">{{ currentDetail.userName || '-' }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">操作类型</label><div class="text-sm">{{ getOperationTypeLabel(currentDetail.operationType) }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">Controller</label><div class="text-sm">{{ currentDetail.controllerName || '-' }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">Action</label><div class="text-sm">{{ currentDetail.actionName || '-' }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">HTTP方法</label><div class="text-sm">{{ currentDetail.httpMethod || '-' }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">IP地址</label><div class="text-sm">{{ currentDetail.ipAddress || '-' }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">执行耗时</label><div class="text-sm">{{ formatDuration(currentDetail.durationMs) }}</div></div>
                    <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">是否成功</label><div class="text-sm">{{ currentDetail.isSuccess ? '是' : '否' }}</div></div>
                    <div class="col-span-2"><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">路由路径</label><div class="text-sm break-all">{{ currentDetail.routePath || '-' }}</div></div>
                </div>
                <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">UserAgent</label><div class="text-sm break-all text-[var(--text-secondary)]">{{ currentDetail.userAgent || '-' }}</div></div>
                <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">请求参数</label><pre class="text-xs bg-[var(--bg-hover)] p-2 rounded overflow-auto max-h-[100px]">{{ currentDetail.requestData || '-' }}</pre></div>
                <div><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">响应数据</label><pre class="text-xs bg-[var(--bg-hover)] p-2 rounded overflow-auto max-h-[100px]">{{ currentDetail.responseData || '-' }}</pre></div>
                <div v-if="!currentDetail.isSuccess"><label class="block text-[12px] text-[var(--text-tertiary)] mb-1">错误信息</label><div class="text-sm text-[var(--danger)]">{{ currentDetail.errorMessage || '-' }}</div></div>
            </div>
            <template #footer><FButton @click="detailVisible = false">关闭</FButton></template>
        </FModal>
    </div>
    `,
    setup() {
        const logs = ref([]);
        const usernameFilter = ref('');
        const operationTypeFilter = ref([]);
        const isSuccessFilter = ref(null);
        const startDateFilter = ref('');
        const endDateFilter = ref('');

        const initDateFilters = () => {
            const today = new Date();
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            endDateFilter.value = today.toISOString().split('T')[0];
            startDateFilter.value = weekAgo.toISOString().split('T')[0];
        };
        const currentPage = ref(1);
        const pageSize = ref(10);
        const totalCount = ref(0);
        const pageCount = ref(0);
        const loading = ref(false);
        const detailVisible = ref(false);
        const currentDetail = ref(null);

        const operationTypeOptions = computed(() => [
            { value: 'Create', label: '新增' },
            { value: 'Update', label: '更新' },
            { value: 'Delete', label: '删除' },
            { value: 'Query', label: '查询' }
        ]);

        const isSuccessOptions = [
            { value: null, label: '全部' },
            { value: true, label: '成功' },
            { value: false, label: '失败' }
        ];

        const columns = [
            { prop: 'id', label: 'ID', width: '60px' },
            { prop: 'userName', label: '用户名', width: '100px' },
            { prop: 'operationType', label: '操作类型', width: '90px' },
            { prop: 'controllerName', label: '控制器', width: '120px' },
            { prop: 'routePath', label: '路由路径', width: '150px' },
            { prop: 'ipAddress', label: 'IP地址', width: '110px' },
            { prop: 'durationMs', label: '耗时', width: '70px' },
            { prop: 'isSuccess', label: '状态', width: '70px' },
            { prop: 'createdAt', label: '时间', width: '150px' },
            { prop: 'actions', label: '操作', width: '80px', align: 'end' }
        ];

        const getStartTimestamp = () => {
            if (!startDateFilter.value) return null;
            return new Date(startDateFilter.value).getTime();
        };

        const getEndTimestamp = () => {
            if (!endDateFilter.value) return null;
            const date = new Date(endDateFilter.value);
            date.setHours(23, 59, 59, 999);
            return date.getTime();
        };

        const loadLogs = async () => {
            loading.value = true;
            const result = await api.logs.page(
                usernameFilter.value,
                operationTypeFilter.value,
                isSuccessFilter.value === '' ? null : isSuccessFilter.value,
                getStartTimestamp(),
                getEndTimestamp(),
                currentPage.value,
                pageSize.value
            );
            logs.value = result.data || [];
            totalCount.value = result.totalCount || 0;
            pageCount.value = result.pageCount || 0;
            loading.value = false;
        };

        const goToPage = ({ page, pageSize: newSize }) => {
            currentPage.value = page;
            pageSize.value = newSize;
            loadLogs();
        };

        const showDetail = async (row) => {
            loading.value = true;
            currentDetail.value = await api.logs.get(row.id, () => { loading.value = false; });
            detailVisible.value = true;
            loading.value = false;
        };

        const getOperationTypeLabel = (type) => {
            const labels = { 'Create': '新增', 'Update': '更新', 'Delete': '删除', 'Query': '查询' };
            return labels[type] || type;
        };

        const getOperationTypeClass = (type) => {
            const classes = {
                'Create': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(16,185,129,0.1)] text-[#10b981]',
                'Update': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(59,130,246,0.1)] text-[#3b82f6]',
                'Delete': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(239,68,68,0.1)] text-[#ef4444]',
                'Query': 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[rgba(107,114,128,0.1)] text-[#6b7280]'
            };
            return classes[type] || '';
        };

        onMounted(() => {
            initDateFilters();
            loadLogs();
        });
        return { logs, columns, usernameFilter, operationTypeFilter, isSuccessFilter, isSuccessOptions, startDateFilter, endDateFilter, operationTypeOptions, currentPage, pageSize, totalCount, pageCount, loading, loadLogs, goToPage, formatDate, formatDuration, showDetail, detailVisible, currentDetail, getOperationTypeLabel, getOperationTypeClass };
    }
};
