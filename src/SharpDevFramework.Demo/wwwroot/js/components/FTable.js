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
        <div class="f-table-wrapper">
            <table class="f-table glass-table" :class="{ 'f-table--border': border, 'f-table--stripe': stripe }">
                <thead>
                    <tr>
                        <th v-for="col in columns" :key="col.prop" :style="col.width ? {width: col.width} : {}">
                            {{ col.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="data.length > 0">
                        <tr v-for="(row, index) in data" :key="index">
                            <td v-for="col in columns" :key="col.prop">
                                <slot v-if="$slots[col.prop]" :name="col.prop" :row="row" :index="index"></slot>
                                <template v-else>{{ row[col.prop] }}</template>
                            </td>
                        </tr>
                    </template>
                    <tr v-else>
                        <td :colspan="columns.length" class="f-table__empty">
                            <div class="empty-state" style="padding: 40px 20px;">
                                <div class="empty-icon">📋</div>
                                <div class="empty-text">{{ emptyText }}</div>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <FPagination 
                v-if="pagination"
                v-model="currentPage"
                :page-size="pageSize"
                :total="total"
                @page-change="$emit('page-change', $event)"
            />
        </div>
    `
};