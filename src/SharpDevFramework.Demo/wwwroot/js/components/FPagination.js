import { FSingleSelect } from './FSingleSelect.js';

const { ref, computed, watch } = Vue;

export const FPagination = {
    name: 'FPagination',
    components: { FSingleSelect },
    props: {
        modelValue: { type: Number, default: 1 },
        total: { type: Number, default: 0 },
        pageSize: { type: Number, default: 20 },
        pageCount: { type: Number, default: null },
        pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
        layout: { type: String, default: 'total, sizes, prev, pager, next, jumper' }
    },
    emits: ['update:modelValue', 'update:pageSize', 'page-change', 'size-change'],
    template: `
        <div class="flex flex-wrap items-center justify-center gap-2 px-4 py-3 border-t border-[var(--border-subtle)] md:justify-end">
            <div class="text-[13px] text-[var(--text-secondary)] hidden md:block" v-if="layout.includes('total')">
                共 {{ total }} 条，共 {{ pageCount }} 页
            </div>
            <div class="hidden md:flex items-center" v-if="layout.includes('sizes')">
                <FSingleSelect :model-value="pageSize" :options="pageSizeOptions" value-key="value" label-key="label"
                    placement="top" @change="handleSizeChange" class="cursor-pointer" />
            </div>
             <div class="hidden md:flex items-center gap-2 text-[13px] text-[var(--text-secondary)]" v-if="layout.includes('jumper')">
                <span>跳至</span>
                <input type="number" :value="jumperValue" @input="handleJumperInput" @blur="handleJumper" @keyup.enter="handleJumper"
                    class="w-[50px] px-2 py-1.5 border border-[var(--border-subtle)] rounded text-[13px] text-center bg-[var(--bg-surface)] text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)] focus:shadow-[0_0_0_2px_var(--accent-subtle)]"
                    min="1" :max="pageCount" />
                <span>页</span>
            </div>
            <div class="flex items-center gap-2">
                <button class="h-[34px] px-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded cursor-pointer text-[13px] transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="currentPage <= 1" @click="goTo(currentPage - 1)">上一页</button>
                <div class="hidden md:flex gap-1">
                    <button v-for="page in visiblePages" :key="page"
                        class="min-w-[34px] h-[34px] px-2 bg-transparent border border-transparent text-[var(--text-secondary)] rounded cursor-pointer text-[13px] transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                        :class="{ 'bg-[var(--accent)] text-[var(--text-inverse)] border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--text-inverse)]': page === currentPage, 'cursor-default': page === '...' }"
                        :disabled="page === '...'" @click="page !== '...' && goTo(page)">{{ page }}</button>
                </div>
                <div class="flex md:hidden items-center px-1 text-[13px] text-[var(--text-secondary)]">
                    {{ currentPage }} / {{ pageCount }}
                </div>
                <button class="h-[34px] px-3.5 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded cursor-pointer text-[13px] transition-all duration-150 ease-out hover:bg-[var(--bg-hover)] hover:border-[var(--border-strong)] disabled:opacity-40 disabled:cursor-not-allowed"
                    :disabled="currentPage >= pageCount" @click="goTo(currentPage + 1)">下一页</button>
            </div>
        </div>
    `,
    setup(props, { emit }) {
        const currentPage = ref(props.modelValue);
        const jumperValue = ref(props.modelValue);

        const pageSizeOptions = computed(() => props.pageSizes.map(size => ({ value: size, label: `${size}条/页` })));
        const totalPageCount = computed(() => Math.ceil(props.total / props.pageSize));
        const pageCount = computed(() => props.pageCount !== null ? props.pageCount : totalPageCount.value);

        const visiblePages = computed(() => {
            const pages = [];
            const current = currentPage.value;
            const total = pageCount.value;
            if (total <= 7) { for (let i = 1; i <= total; i++) pages.push(i); }
            else {
                pages.push(1);
                if (current > 3) pages.push('...');
                for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
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
            emit('page-change', { page, pageSize: props.pageSize });
        };

        const handleSizeChange = (newSize) => {
            jumperValue.value = 1; currentPage.value = 1;
            emit('update:pageSize', newSize); emit('update:modelValue', 1);
            emit('size-change', newSize); emit('page-change', { page: 1, pageSize: newSize });
        };

        const handleJumperInput = (e) => { jumperValue.value = Number(e.target.value); };
        const handleJumper = () => {
            let page = Math.round(jumperValue.value);
            if (isNaN(page)) page = 1;
            goTo(page);
        };

        watch(() => props.modelValue, (val) => {
            currentPage.value = val;
            jumperValue.value = val;
        });

        return { pageCount, visiblePages, currentPage, pageSizeOptions, jumperValue, goTo, handleSizeChange, handleJumperInput, handleJumper };
    }
};
