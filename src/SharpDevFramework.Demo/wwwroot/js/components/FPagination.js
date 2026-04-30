const { ref, computed, watch } = Vue;

export const FPagination = {
    name: 'FPagination',
    props: {
        modelValue: { type: Number, default: 1 },
        total: { type: Number, default: 0 },
        pageSize: { type: Number, default: 20 },
        pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
        layout: { type: String, default: 'total, prev, pager, next' }
    },
    emits: ['update:modelValue', 'page-change', 'size-change'],
    template: `
        <div class="f-pagination">
            <div class="f-pagination__info" v-if="layout.includes('total')">
                共 {{ total }} 条
            </div>
            <div class="f-pagination__sizes" v-if="layout.includes('sizes')">
                <select :value="pageSize" @change="$emit('size-change', Number($event.target.value))" class="f-pagination__size-select">
                    <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}条/页</option>
                </select>
            </div>
            <div class="f-pagination__controls">
                <button 
                    class="f-pagination__btn" 
                    :disabled="modelValue <= 1"
                    @click="goTo(modelValue - 1)"
                >
                    上一页
                </button>
                <div class="f-pagination__pagers">
                    <button 
                        v-for="page in visiblePages" 
                        :key="page"
                        class="f-pagination__pager"
                        :class="{ 'f-pagination__pager--active': page === modelValue, 'f-pagination__pager--more': page === '...' }"
                        :disabled="page === '...'"
                        @click="page !== '...' && goTo(page)"
                    >
                        {{ page }}
                    </button>
                </div>
                <button 
                    class="f-pagination__btn" 
                    :disabled="modelValue >= pageCount"
                    @click="goTo(modelValue + 1)"
                >
                    下一页
                </button>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const pageCount = computed(() => Math.ceil(props.total / props.pageSize));

        const visiblePages = computed(() => {
            const pages = [];
            const current = props.modelValue;
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
            if (page < 1 || page > pageCount.value || page === props.modelValue) return;
            emit('update:modelValue', page);
            emit('page-change', page);
        };

        return { pageCount, visiblePages, goTo };
    }
};
