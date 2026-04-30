const { ref, onMounted, onUnmounted } = Vue;

export const FDropdown = {
    name: 'FDropdown',
    props: {
        trigger: { type: String, default: 'click' },
        placement: { type: String, default: 'bottom-end' }
    },
    emits: ['visible-change'],
    template: `
        <div class="f-dropdown" ref="dropdownRef">
            <div class="f-dropdown__trigger" @click="toggle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
                <slot name="trigger" />
            </div>
            <Transition name="dropdown">
                <div v-if="visible" class="f-dropdown__menu" :class="menuClass">
                    <slot />
                </div>
            </Transition>
        </div>
    `,
    setup(props, { emit }) {
        const visible = ref(false);
        const dropdownRef = ref(null);
        let hoverTimer = null;

        const toggle = () => {
            visible.value = !visible.value;
            emit('visible-change', visible.value);
        };

        const show = () => {
            visible.value = true;
            emit('visible-change', true);
        };

        const hide = () => {
            visible.value = false;
            emit('visible-change', false);
        };

        const handleClickOutside = (e) => {
            if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
                hide();
            }
        };

        const handleMouseEnter = () => {
            if (props.trigger === 'hover') {
                clearTimeout(hoverTimer);
                show();
            }
        };

        const handleMouseLeave = () => {
            if (props.trigger === 'hover') {
                hoverTimer = setTimeout(() => {
                    hide();
                }, 200);
            }
        };

        const menuClass = {
            'f-dropdown__menu--top': props.placement === 'top',
            'f-dropdown__menu--bottom': props.placement === 'bottom-end' || props.placement === 'bottom',
            'f-dropdown__menu--left': props.placement === 'top-start' || props.placement === 'bottom-start'
        };

        onMounted(() => {
            document.addEventListener('click', handleClickOutside);
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
            clearTimeout(hoverTimer);
        });

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
        <div 
            class="f-dropdown__item"
            :class="{ 'f-dropdown__item--disabled': disabled, 'f-dropdown__item--divided': divided }"
            @click="handleClick"
        >
            <slot />
        </div>
    `,
    setup(props, { emit }) {
        const handleClick = (e) => {
            if (!props.disabled) {
                emit('click', e);
            }
        };
        return { handleClick };
    }
};
