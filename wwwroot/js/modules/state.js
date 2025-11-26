export const state = {
    currentPath: '',
    isLoading: false
};

export function setCurrentPath(path) {
    state.currentPath = path;
}