import { LayoutComponent } from '../components/index.js';
import { clearAuth } from '../auth.js';

export const LayoutView = {
    components: { LayoutComponent },
    template: `
    <LayoutComponent @logout="handleLogout">
        <router-view />
    </LayoutComponent>
    `,
    setup() {
        const handleLogout = () => {
            clearAuth();
            window.location.hash = '#/login';
        };

        return { handleLogout };
    }
};
