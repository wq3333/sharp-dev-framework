import { api } from '../api.js';
import { onFileUploaded } from '../signalr.js';

const { ref, onMounted } = Vue;

export const FavoritesView = {
    template: `
    <div class="h-full flex flex-col">
        <div class="page-header">
            <h1 class="page-title">⭐ 我的收藏</h1>
        </div>

        <div class="glass-panel" style="padding: 20px; flex: 1; overflow-y: auto;">
            <div v-if="favoriteFolders.length > 0" style="margin-bottom: 32px;">
                <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #64748b;">📁 收藏的文件夹</h3>
                <div class="file-grid">
                    <div v-for="folder in favoriteFolders" :key="folder.id" 
                        class="file-card"
                        @dblclick="navigateToFolder(folder.id)"
                    >
                        <div class="file-thumbnail">📁</div>
                        <div class="file-name">{{ folder.name }}</div>
                        <span @click.stop="toggleFavoriteFolder(folder)" class="file-favorite">⭐</span>
                    </div>
                </div>
            </div>

            <div v-if="favoriteFiles.length > 0">
                <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 16px; color: #64748b;">📄 收藏的文件</h3>
                <div class="file-grid">
                    <div v-for="file in favoriteFiles" :key="file.id" 
                        class="file-card"
                        @dblclick="openFile(file)"
                        @mouseenter="hoverFileId = file.id"
                        @mouseleave="hoverFileId = null"
                    >
                        <div class="file-thumbnail">
                            <img v-if="file.hasThumbnail" 
                                :src="(hoverFileId === file.id && file.hasGifPreview ? api.getGifPreview(file.id) : api.getThumbnail(file.id))" 
                                style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
                                loading="lazy" 
                            />
                            <span v-else>{{ api.getFileIcon(file.name) }}</span>
                        </div>
                        <div class="file-name">{{ file.name }}</div>
                        <div class="file-size">{{ api.formatSize(file.size) }}</div>
                        <div v-if="file.isProcessing" style="position: absolute; top: 8px; left: 8px;">
                            <span class="badge badge--yellow" style="font-size: 10px;">处理中</span>
                        </div>
                        <span @click.stop="toggleFavoriteFile(file)" class="file-favorite">⭐</span>
                    </div>
                </div>
            </div>

            <div v-if="favoriteFolders.length === 0 && favoriteFiles.length === 0" class="empty-state">
                <div class="empty-icon">⭐</div>
                <div class="empty-text">暂无收藏内容</div>
                <div style="font-size: 13px; color: #cbd5e1; margin-top: 8px;">
                    去文件管理中点击星标添加收藏
                </div>
            </div>
        </div>
    </div>
    `,
    setup() {
        const favoriteFolders = ref([]);
        const favoriteFiles = ref([]);
        const hoverFileId = ref(null);

        const loadFavorites = async () => {
            try {
                const result = await api.getFavorites();
                favoriteFolders.value = result.folders || [];
                favoriteFiles.value = result.files || [];
            } catch (e) {
                console.error('Failed to load favorites:', e);
            }
        };

        const toggleFavoriteFile = async (file) => {
            try {
                await api.unfavoriteFile(file.id);
                await loadFavorites();
            } catch (e) {
                console.error('Failed to unfavorite:', e);
            }
        };

        const toggleFavoriteFolder = async (folder) => {
            try {
                await api.unfavoriteFolder(folder.id);
                await loadFavorites();
            } catch (e) {
                console.error('Failed to unfavorite:', e);
            }
        };

        const navigateToFolder = (folderId) => {
            window.location.hash = `#/files?folderId=${folderId}`;
        };

        const openFile = (file) => {
            window.open(api.downloadFile(file.id), '_blank');
        };

        onMounted(async () => {
            await loadFavorites();
        });

        return { favoriteFolders, favoriteFiles, hoverFileId, loadFavorites, toggleFavoriteFile, toggleFavoriteFolder, navigateToFolder, openFile, api };
    }
};
