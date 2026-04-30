const { ref, computed, watch } = Vue;

export const FPagination = {
    name: 'FPagination',
    props: {
        modelValue: { type: Number, default: 1 },
        total: { type: Number, default: 0 },
        pageSize: { type: Number, default: 20 },
        pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
        layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' }
    },
    emits: ['update:modelValue', 'update:pageSize', 'page-change', 'size-change'],
    template: `
        <div class="f-pagination">
            <div class="f-pagination__info" v-if="layout.includes('total')">
                共 {{ total }} 条，共 {{ pageCount }} 页
            </div>
            <div class="f-pagination__sizes" v-if="layout.includes('sizes')">
                <select :value="currentPageSize" @change="handleSizeChange" class="f-pagination__size-select">
                    <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}条/页</option>
                </select>
            </div>
            <div class="f-pagination__controls">
                <button 
                    class="f-pagination__btn" 
                    :disabled="currentPage <= 1"
                    @click="goTo(currentPage - 1)"
                >
                    上一页
                </button>
                <div class="f-pagination__pagers">
                    <button 
                        v-for="page in visiblePages" 
                        :key="page"
                        class="f-pagination__pager"
                        :class="{ 'f-pagination__pager--active': page === currentPage, 'f-pagination__pager--more': page === '...' }"
                        :disabled="page === '...'"
                        @click="page !== '...' && goTo(page)"
                    >
                        {{ page }}
                    </button>
                </div>
                <button 
                    class="f-pagination__btn" 
                    :disabled="currentPage >= pageCount"
                    @click="goTo(currentPage + 1)"
                >
                    下一页
                </button>
            </div>
            <div class="f-pagination__jumper" v-if="layout.includes('jumper')">
                <span>跳至</span>
                <input 
                    type="number" 
                    :value="jumperValue" 
                    @input="handleJumperInput"
                    @keyup.enter="handleJumper"
                    class="f-pagination__jumper-input"
                    min="1"
                    :max="pageCount"
                />
                <span>页</span>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const currentPage = ref(props.modelValue);
        const currentPageSize = ref(props.pageSize);
        const jumperValue = ref(props.modelValue);

        const pageCount = computed(() => Math.ceil(props.total / currentPageSize.value));

        const visiblePages = computed(() => {
            const pages = [];
            const current = currentPage.value;
            const total = pageCount.value;

            if (total <= 7) {
                for (let i = 1; i <= total; i++) pages.push(i);
            } else {
                pages.push(1);
                if (current > 3) pages.push('...');
                for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
                    pages.push(i);
                }
                if (current < total - 2) pages.push('...');
                pages.push(total);
            }
            return pages;
        });

        const goTo = (page) => {
            if (page < 1 || page > pageCount.value || page === currentPage.value) return;
            jumperValue.value = page;
            currentPage.value = page;
            emit('update:modelValue', page);
            emit('page-change', { page, pageSize: currentPageSize.value });
        };

        const handleSizeChange = (e) => {
            const newSize = Number(e.target.value);
            currentPageSize.value = newSize;
            jumperValue.value = 1;
            currentPage.value = 1;
            emit('update:pageSize', newSize);
            emit('update:modelValue', 1);
            emit('size-change', newSize);
            emit('page-change', { page: 1, pageSize: newSize });
        };

        const handleJumperInput = (e) => {
            jumperValue.value = Number(e.target.value);
        };

        const handleJumper = () => {
            let page = Math.round(jumperValue.value);
            if (isNaN(page)) page = 1;
            goTo(page);
        };

        watch(() => props.modelValue, (val) => {
            currentPage.value = val;
            jumperValue.value = val;
        });

        watch(() => props.pageSize, (val) => {
            currentPageSize.value = val;
        });

        return { pageCount, visiblePages, currentPage, currentPageSize, jumperValue, goTo, handleSizeChange, handleJumperInput, handleJumper };
    }
};
