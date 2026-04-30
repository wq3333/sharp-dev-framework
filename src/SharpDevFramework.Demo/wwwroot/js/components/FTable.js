const { ref, computed } = Vue;

export const FTable = {
    name: 'FTable',
    props: {
        columns: { type: Array, required: true },
        data: { type: Array, default: () => [] },
        stripe: { type: Boolean, default: false },
        border: { type: Boolean, default: false },
        hover: { type: Boolean, default: true },
        emptyText: { type: String, default: '暂无数据' }
    },
    emits: ['row-click'],
    template: `
        <div class="f-table-wrapper">
            <table class="f-table" :class="{ 'f-table--stripe': stripe, 'f-table--border': border, 'f-table--hover': hover }">
                <thead>
                    <tr>
                        <th 
                            v-for="col in columns" 
                            :key="col.key"
                            :style="{ width: col.width || 'auto', textAlign: col.align || 'left' }"
                        >
                            {{ col.label }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-if="data.length === 0">
                        <td :colspan="columns.length" class="f-table__empty">
                            {{ emptyText }}
                        </td>
                    </tr>
                    <tr 
                        v-for="(row, index) in data" 
                        :key="row.id || index"
                        @click="$emit('row-click', row, index)"
                    >
                        <td v-for="col in columns" :key="col.key" :style="{ textAlign: col.align || 'left' }">
                            <slot :name="col.key" :row="row" :value="row[col.key]" :index="index">
                                {{ col.formatter ? col.formatter(row[col.key], row) : row[col.key] }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
};
