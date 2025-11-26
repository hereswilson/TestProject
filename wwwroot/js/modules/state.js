export const state = {
    currentPath: '',
    isLoading: false
};

export function setLoading(loading) {
    state.isLoading = loading;
    document.body.style.cursor = loading ? 'wait' : 'default';

    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = loading ? 'flex' : 'none';
    }
}

export function setCurrentPath(path) {
    state.currentPath = path;
}