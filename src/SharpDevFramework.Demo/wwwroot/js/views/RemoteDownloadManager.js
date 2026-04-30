import { api } from '../api.js';
import { enums, loadEnums, getEnumName, getDownloadStatusClass } from '../enums.js';
import { onDownloadUpdated, onFileUploaded } from '../signalr.js';
import { FButton, FInput, FSelect, FModal, FPagination } from '../components/index.js';

const { ref, onMounted, computed } = Vue;

export const RemoteDownloadManagerView = {
    components: { FButton, FInput, FSelect, FModal, FPagination },
    template: `
    <div>
        <div class="page-header">
            <h1 class="page-title">⬇️ 远程下载</h1>
            <div class="flex gap-2">
                <FButton type="success" icon="➕" @click="showCreateModal = true">新建下载</FButton>
                <FButton size="sm" icon="🔄" @click="loadDownloads">刷新</FButton>
            </div>
        </div>

        <div class="glass-panel" style="padding: 0; overflow: hidden;">
            <table class="glass-table">
                <thead>
                    <tr>
                        <th>文件名</th>
                        <th>URL</th>
                        <th>类型</th>
                        <th>进度</th>
                        <th>速度</th>
                        <th>状态</th>
                        <th>创建时间</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="dl in downloads" :key="dl.id">
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ dl.name }}</td>
                        <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #94a3b8;">{{ dl.url }}</td>
                        <td>{{ dl.isMagnet ? '磁力链接' : 'HTTP' }}</td>
                        <td>
                            <div class="flex items-center gap-2">
                                <div class="progress-bar" style="flex: 1;">
                                    <div class="progress-bar__fill" :style="{ width: (dl.progress || 0) + '%' }"></div>
                                </div>
                                <span style="font-size: 12px; white-space: nowrap;">{{ (dl.progress || 0).toFixed(1) }}%</span>
                            </div>
                        </td>
                        <td style="white-space: nowrap;">{{ dl.speed || '-' }}</td>
                        <td><span :class="['badge', downloadStatusClass(dl.status)]">{{ getEnumName('downloadStates', dl.status) }}</span></td>
                        <td style="white-space: nowrap;">{{ api.formatDate(dl.createdAt) }}</td>
                        <td>
                            <div class="flex gap-2">
                                <FButton v-if="dl.isMagnet && dl.status === 1" size="sm" @click="pauseDownload(dl.id)">暂停</FButton>
                                <FButton v-if="dl.isMagnet && dl.status === 2" type="success" size="sm" @click="resumeDownload(dl.id)">开始</FButton>
                                <FButton v-if="dl.status === 4" size="sm" @click="retryDownload(dl.id)">重试</FButton>
                                <FButton type="danger" size="sm" @click="deleteDownload(dl)">删除</FButton>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="downloads.length === 0" class="empty-state">
                <div class="empty-icon">⬇️</div>
                <div class="empty-text">暂无下载任务</div>
            </div>
            <FPagination 
                v-if="totalPages > 1"
                v-model="currentPage"
                :total="totalCount"
                :page-size="pageSize"
                @page-change="goToPage"
            />
        </div>

        <FModal v-model="showCreateModal" title="⬇️ 新建下载">
            <div class="form-group">
                <label class="form-label">URL / 磁力链接</label>
                <FInput v-model="newDownload.url" placeholder="http:// 或 magnet:" />
            </div>
            <div class="form-group">
                <label class="form-label">目标文件夹</label>
                <FSelect v-model="newDownload.folderId" :options="flatFolders" value-key="id" label-key="name" placeholder="选择文件夹" />
            </div>
            <div class="form-group">
                <label class="form-label">扩展名过滤（可选，逗号分隔）</label>
                <FInput v-model="newDownload.extensionFilters" placeholder=".mp4,.mkv" />
            </div>
            <template #footer>
                <FButton @click="showCreateModal = false">取消</FButton>
                <FButton type="success" @click="createDownload">创建</FButton>
            </template>
        </FModal>
    </div>
    `,
    setup() {
        const downloads = ref([]);
        const folders = ref([]);
        const showCreateModal = ref(false);
        const newDownload = ref({ url: '', folderId: 1, extensionFilters: '' });
        const currentPage = ref(1);
        const pageSize = ref(20);
        const totalCount = ref(0);

        const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));
        const flatFolders = computed(() => {
            const result = [];
            const flatten = (items) => {
                items.forEach(f => {
                    result.push(f);
                    if (f.children) flatten(f.children);
                });
            };
            flatten(folders.value);
            return result;
        });

        const loadDownloads = async () => {
            try {
                const result = await api.getDownloads(null, currentPage.value, pageSize.value);
                downloads.value = result.data || [];
                totalCount.value = result.totalCount || 0;
            } catch (e) {
                console.error('Failed to load downloads:', e);
            }
        };

        const goToPage = (page) => {
            if (page < 1 || page > totalPages.value) return;
            currentPage.value = page;
            loadDownloads();
        };

        const handleDownloadUpdated = (notification) => {
            const index = downloads.value.findIndex(d => d.id === notification.id);
            if (index !== -1) {
                if (notification.progress !== undefined) {
                    downloads.value[index].progress = notification.progress;
                }
                if (notification.speed !== undefined) {
                    downloads.value[index].speed = notification.speed;
                }
                if (notification.message) {
                    downloads.value[index].errorMessage = notification.message;
                }
                if (notification.status) {
                    downloads.value[index].status = notification.status;
                }
            } else {
                loadDownloads();
            }
        };

        const createDownload = async () => {
            if (!newDownload.value.url) return;
            try {
                await api.createDownload(newDownload.value.url, newDownload.value.folderId, newDownload.value.extensionFilters, '');
                showCreateModal.value = false;
                newDownload.value = { url: '', folderId: 1, extensionFilters: '' };
                await loadDownloads();
            } catch (e) {
                console.error('Failed to create download:', e);
            }
        };

        const pauseDownload = async (id) => {
            try {
                await api.pauseDownload(id);
                await loadDownloads();
            } catch (e) {
                console.error('Failed to pause download:', e);
            }
        };

        const resumeDownload = async (id) => {
            try {
                await api.resumeDownload(id);
                await loadDownloads();
            } catch (e) {
                console.error('Failed to resume download:', e);
            }
        };

        const retryDownload = async (id) => {
            try {
                await api.retryDownload(id);
                await loadDownloads();
            } catch (e) {
                console.error('Failed to retry download:', e);
            }
        };

        const deleteDownload = async (download) => {
            if (confirm(`确定删除下载任务 "${download.name}"？`)) {
                try {
                    await api.deleteDownload(download.id);
                    await loadDownloads();
                } catch (e) {
                    console.error('Failed to delete download:', e);
                }
            }
        };

        onMounted(async () => {
            folders.value = await api.getFolders();
            await loadEnums();
            await loadDownloads();
            onDownloadUpdated(handleDownloadUpdated);
            onFileUploaded(loadDownloads);
        });

        return { 
            downloads, folders, showCreateModal, newDownload, flatFolders, 
            downloadStatusClass: getDownloadStatusClass, getEnumName, loadDownloads, 
            createDownload, pauseDownload, resumeDownload, retryDownload, deleteDownload, 
            api, currentPage, totalCount, totalPages, goToPage 
        };
    }
};
