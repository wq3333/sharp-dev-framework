import { FPagination } from './FPagination.js';

export const FTable = {
    name: 'FTable',
    components: { FPagination },
    props: {
        data: { type: Array, default: () => [] },
        columns: { type: Array, default: () => [] },
        border: { type: Boolean, default: false },
        stripe: { type: Boolean, default: false },
        emptyText: { type: String, default: '暂无数据' },
        pagination: { type: Boolean, default: false },
        currentPage: { type: Number, default: 1 },
        pageSize: { type: Number, default: 20 },
        total: { type: Number, default: 0 }
    },
    emits: ['page-change'],
    template: `
        <div class="flex flex-col flex-1 overflow-hidden min-h-0">
            <div class="flex-1 overflow-auto min-h-0">
                <table class="w-full border-collapse text-sm">
                    <thead>
                        <tr>
                            <th v-for="col in columns" :key="col.prop" :style="col.width ? {width: col.width} : {}"
                                class="text-left px-4 py-3 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] whitespace-nowrap sticky top-0 z-[1]">
                                {{ col.label }}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="data.length > 0">
                            <tr v-for="(row, index) in data" :key="index" class="hover:bg-[var(--bg-hover)] cursor-pointer">
                                <td v-for="col in columns" :key="col.prop" class="px-4 py-3 text-[var(--text-primary)] border-b border-[var(--border-subtle)]">
                                    <slot v-if="$slots[col.prop]" :name="col.prop" :row="row" :index="index"></slot>
                                    <template v-else>{{ row[col.prop] }}</template>
                                </td>
                            </tr>
                        </template>
                        <tr v-else>
                            <td :colspan="columns.length" class="text-center text-[var(--text-tertiary)] p-10">
                                <div class="text-center py-12 px-5">
                                    <div class="text-[40px] mb-3 opacity-40">&#x1F4CB;</div>
                                    <div class="text-sm text-[var(--text-tertiary)]">{{ emptyText }}</div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="pagination" class="shrink-0">
                <FPagination
                    v-model="currentPage"
                    :page-size="pageSize"
                    :total="total"
                    @page-change="$emit('page-change', $event)"
                />
            </div>
        </div>
    `
};
