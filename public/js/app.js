(() => {
    const USER_KEY = 'wayfarer.user';
    const BOOKING_KEY = 'wayfarer.booking';
    const isLocalDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
    const apiBase = isLocalDevelopmentHost && window.location.port !== '5000'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : '';

    window.WAYFARER_API_BASE = apiBase;

    function readUser() {
        try {
            const user = JSON.parse(sessionStorage.getItem(USER_KEY));
            return user && typeof user.username === 'string' && typeof user.mobile === 'string' ? user : null;
        } catch {
            return null;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // This checks for clean URLs (/login) as well as traditional extensions (.html)
        const isLoginPage = window.location.pathname.includes('login');

        const user = readUser();
        if (!user && !isLoginPage) {
            window.location.replace('login.html');
            return;
        }
        if (user && isLoginPage) {
            window.location.replace('index.html');
            return;
        }

        const welcomeName = document.getElementById('welcomeName');
        if (welcomeName && user) {
            welcomeName.textContent = user.username;
        }
        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                sessionStorage.removeItem(USER_KEY);
                sessionStorage.removeItem(BOOKING_KEY);
                window.location.replace('login.html');
            });
        }
    });
})();
