import { api } from '../api.js';
import { onFileUploaded } from '../signalr.js';
import { FButton, FInput, FModal } from '../components/index.js';

const { ref, onMounted, computed } = Vue;

export const FileManagerView = {
    components: { FButton, FInput, FModal },
    template: `
    <div class="h-full flex flex-col">
        <div class="page-header">
            <div>
                <h1 class="page-title">📁 文件管理</h1>
                <nav class="breadcrumb" style="margin-top: 8px;">
                    <span class="breadcrumb__item" @click="navigateTo(1)">Root</span>
                    <template v-for="item in breadcrumb" :key="item.id">
                        <span class="breadcrumb__separator">/</span>
                        <span class="breadcrumb__item" @click="navigateTo(item.id)">{{ item.name }}</span>
                    </template>
                </nav>
            </div>
            <div class="flex gap-2">
                <FButton type="success" icon="📁" @click="showNewFolderModal = true">新建文件夹</FButton>
                <div class="upload-dropdown">
                    <FButton icon="⬆️" @click="showUploadMenu = !showUploadMenu">上传</FButton>
                    <div v-if="showUploadMenu" class="upload-dropdown-menu">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" v-model="uploadOverride" />
                            <span class="checkbox-label">覆盖同名文件</span>
                        </label>
                        <label class="checkbox-wrapper" style="margin-top: 8px;">
                            <input type="checkbox" v-model="createDirectories" />
                            <span class="checkbox-label">按路径创建文件夹</span>
                        </label>
                        <div class="dropdown-divider"></div>
                        <input type="file" class="hidden" @change="handleFileUpload" multiple ref="fileInput" />
                        <div @click="$refs.fileInput.click(); showUploadMenu = false" class="dropdown-item">
                            <span>📄</span>
                            <span>上传文件</span>
                        </div>
                        <input type="file" webkitdirectory directory multiple class="hidden" @change="handleFolderUpload" ref="folderInput" />
                        <div @click="$refs.folderInput.click(); showUploadMenu = false" class="dropdown-item">
                            <span>📁</span>
                            <span>上传文件夹</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="file-manager">
            <div class="glass-panel folder-tree">
                <div v-for="folder in flatFolders" :key="folder.id" 
                    class="folder-item" 
                    :class="{ 'folder-item--active': currentFolder?.id === folder.id }"
                    @click="selectFolder(folder)"
                >
                    <span class="folder-icon">📁</span>
                    <span class="folder-name">{{ folder.name }}</span>
                    <span @click.stop="toggleFavoriteFolder(folder)" class="cursor-pointer">
                        {{ isFolderFavorite(folder.id) ? '⭐' : '☆' }}
                    </span>
                </div>
            </div>

            <div class="glass-panel file-grid-area">
                <div v-if="filteredChildFolders.length > 0" style="margin-bottom: 24px;">
                    <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #64748b;">子文件夹</h3>
                    <div class="file-grid">
                        <div v-for="folder in filteredChildFolders" :key="folder.id" 
                            class="file-card"
                            @dblclick="selectFolder(folder)"
                        >
                            <div class="file-thumbnail">📁</div>
                            <div class="file-name">{{ folder.name }}</div>
                            <span @click.stop="toggleFavoriteFolder(folder)" class="file-favorite">
                                {{ isFolderFavorite(folder.id) ? '⭐' : '☆' }}
                            </span>
                        </div>
                    </div>
                </div>

                <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #64748b;">文件</h3>
                <div v-if="files.length > 0" class="file-grid">
                    <div v-for="file in files" :key="file.id" 
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
                        <span @click.stop="toggleFavoriteFile(file)" class="file-favorite">
                            {{ isFileFavorite(file.id) ? '⭐' : '☆' }}
                        </span>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <div class="empty-icon">📄</div>
                    <div class="empty-text">暂无文件</div>
                </div>
            </div>
        </div>

        <FModal v-model="showNewFolderModal" title="📁 新建文件夹">
            <FInput v-model="newFolderName" placeholder="请输入文件夹名称" @enter="createFolder" />
            <template #footer>
                <FButton @click="showNewFolderModal = false">取消</FButton>
                <FButton type="success" @click="createFolder">创建</FButton>
            </template>
        </FModal>
    </div>
    `,
    setup() {
        const folders = ref([]);
        const files = ref([]);
        const favorites = ref({ files: [], folders: [] });
        const currentFolder = ref(null);
        const showNewFolderModal = ref(false);
        const showUploadMenu = ref(false);
        const newFolderName = ref('');
        const uploadOverride = ref(false);
        const createDirectories = ref(false);
        const hoverFileId = ref(null);

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

        const breadcrumb = computed(() => {
            if (!currentFolder.value || currentFolder.value.id === 1) return [];
            const path = [];
            let current = currentFolder.value;
            while (current && current.parentId !== 0) {
                path.unshift(current);
                current = flatFolders.value.find(f => f.id === current.parentId);
            }
            return path;
        });

        const filteredChildFolders = computed(() => {
            const parentId = currentFolder.value?.id || 1;
            const parent = flatFolders.value.find(f => f.id === parentId);
            return parent?.children || [];
        });

        const isFileFavorite = (fileId) => {
            return favorites.value.files?.some(f => f.id === fileId) || false;
        };

        const isFolderFavorite = (folderId) => {
            return favorites.value.folders?.some(f => f.id === folderId) || false;
        };

        const loadFavorites = async () => {
            try {
                favorites.value = await api.getFavorites();
            } catch (e) {
                console.error('Failed to load favorites:', e);
            }
        };

        const toggleFavoriteFile = async (file) => {
            try {
                if (isFileFavorite(file.id)) {
                    await api.unfavoriteFile(file.id);
                } else {
                    await api.favoriteFile(file.id);
                }
                await loadFavorites();
            } catch (e) {
                console.error('Failed to toggle favorite:', e);
            }
        };

        const toggleFavoriteFolder = async (folder) => {
            try {
                if (isFolderFavorite(folder.id)) {
                    await api.unfavoriteFolder(folder.id);
                } else {
                    await api.favoriteFolder(folder.id);
                }
                await loadFavorites();
            } catch (e) {
                console.error('Failed to toggle favorite:', e);
            }
        };

        const selectFolder = async (folder) => {
            currentFolder.value = folder;
            files.value = await api.getFiles(folder?.id || 1);
        };

        const navigateTo = (folderId) => {
            const folder = flatFolders.value.find(f => f.id === folderId);
            selectFolder(folder);
        };

        const createFolder = async () => {
            if (!newFolderName.value) return;
            const parentId = currentFolder.value?.id || 1;
            await api.createFolder(newFolderName.value, parentId);
            folders.value = await api.getFolders();
            showNewFolderModal.value = false;
            newFolderName.value = '';
        };

        const handleFileUpload = async (e) => {
            const uploadFiles = Array.from(e.target.files);
            const folderId = currentFolder.value?.id || 1;
            if (uploadFiles.length === 0) return;

            if (uploadFiles.length === 1) {
                await api.uploadFile(folderId, uploadFiles[0], null, uploadOverride.value);
            } else {
                await api.uploadMultipleFiles(folderId, uploadFiles, null, uploadOverride.value, createDirectories.value);
            }
            files.value = await api.getFiles(folderId);
            e.target.value = '';
        };

        const handleFolderUpload = async (e) => {
            const uploadFiles = Array.from(e.target.files);
            const folderId = currentFolder.value?.id || 1;
            if (uploadFiles.length === 0) return;

            await api.uploadMultipleFiles(folderId, uploadFiles, null, uploadOverride.value, createDirectories.value);
            files.value = await api.getFiles(folderId);
            e.target.value = '';
        };

        const openFile = (file) => {
            window.open(api.downloadFile(file.id), '_blank');
        };

        const handleFileUploaded = (notification) => {
            if (notification.folderId === currentFolder.value?.id) {
                selectFolder(currentFolder.value);
            }
        };

        onMounted(async () => {
            folders.value = await api.getFolders();
            await loadFavorites();
            await selectFolder(flatFolders.value[0]);
            onFileUploaded(handleFileUploaded);
        });

        return { 
            folders, files, favorites, currentFolder, flatFolders, breadcrumb, filteredChildFolders,
            showNewFolderModal, showUploadMenu, newFolderName, uploadOverride, createDirectories, hoverFileId,
            selectFolder, navigateTo, createFolder, handleFileUpload, handleFolderUpload, openFile,
            toggleFavoriteFile, toggleFavoriteFolder, isFileFavorite, isFolderFavorite, api
        };
    }
};
