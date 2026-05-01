const { ref, onMounted, onUnmounted } = Vue;

export const FDropdown = {
    name: 'FDropdown',
    props: {
        trigger: { type: String, default: 'click' },
        placement: { type: String, default: 'bottom-end' }
    },
    emits: ['visible-change'],
    template: `
        <div class="relative inline-block" ref="dropdownRef">
            <div class="cursor-pointer" @click="toggle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
                <slot name="trigger" />
            </div>
            <Transition name="dropdown">
                <div v-if="visible" class="absolute bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg p-1 z-[1000] shadow-[0_4px_24px_rgba(0,0,0,0.08)] min-w-[180px]"
                    :class="menuClass">
                    <slot />
                </div>
            </Transition>
        </div>
    `,
    setup(props, { emit }) {
        const visible = ref(false);
        const dropdownRef = ref(null);
        let hoverTimer = null;

        const toggle = () => { visible.value = !visible.value; emit('visible-change', visible.value); };
        const show = () => { visible.value = true; emit('visible-change', true); };
        const hide = () => { visible.value = false; emit('visible-change', false); };

        const handleClickOutside = (e) => {
            if (dropdownRef.value && !dropdownRef.value.contains(e.target)) hide();
        };

        const handleMouseEnter = () => {
            if (props.trigger === 'hover') { clearTimeout(hoverTimer); show(); }
        };

        const handleMouseLeave = () => {
            if (props.trigger === 'hover') { hoverTimer = setTimeout(() => hide(), 200); }
        };

        const menuClass = {
            'bottom-full mb-1 right-0': props.placement === 'top',
            'top-full mt-1 right-0': props.placement === 'bottom-end' || props.placement === 'bottom',
            'top-full mt-1 left-0': props.placement === 'top-start' || props.placement === 'bottom-start'
        };

        onMounted(() => document.addEventListener('click', handleClickOutside));
        onUnmounted(() => { document.removeEventListener('click', handleClickOutside); clearTimeout(hoverTimer); });

        return { visible, dropdownRef, toggle, show, hide, menuClass, handleMouseEnter, handleMouseLeave };
    }
};

export const FDropdownItem = {
    name: 'FDropdownItem',
    props: {
        disabled: { type: Boolean, default: false },
        divided: { type: Boolean, default: false }
    },
    emits: ['click'],
    template: `
        <div class="flex items-center gap-2 px-2.5 py-2 rounded-md text-sm text-[var(--text-primary)] cursor-pointer transition-colors duration-150 ease-out hover:bg-[var(--bg-hover)]"
            :class="{ 'opacity-40 cursor-not-allowed': disabled, 'border-t border-[var(--border-subtle)] mt-1 pt-2': divided }"
            @click="handleClick">
            <slot />
        </div>
    `,
    setup(props, { emit }) {
        const handleClick = (e) => { if (!props.disabled) emit('click', e); };
        return { handleClick };
    }
};
