import * as API from './modules/api.js';
import * as UI from './modules/ui.js';
import * as State from './modules/state.js';
import { normalizePath } from './modules/utils.js';

async function init() {
    window.addEventListener('hashchange', handleRouting);

    // Bind Toolbar Buttons
    document.getElementById('btnRefresh').onclick = refresh;
    document.getElementById('btnUp').onclick = navigateUp;
    document.getElementById('btnUpload').onclick = handleUpload;
    document.getElementById('btnNewFolder').onclick = handleCreateFolder;

    // Bind Search
    const searchInput = document.getElementById('searchInput');
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => handleSearch(e.target.value), 400);
    });

    handleRouting();
}

// --- Routing & Navigation ---

async function handleRouting() {
    const hash = window.location.hash;
    let path = '';

    if (hash.startsWith('#path=')) {
        path = decodeURIComponent(hash.substring(6));
    }

    State.setCurrentPath(normalizePath(path));

    if (document.getElementById('searchInput').value && !path.startsWith('Search Results')) {
        document.getElementById('searchInput').value = '';
    }

    await loadDirectory(State.state.currentPath, false);
}

function navigateTo(path) {
    window.location.hash = `path=${encodeURIComponent(normalizePath(path))}`;
}

function navigateUp() {
    const current = State.state.currentPath;
    if (!current) return;

    const parts = current.endsWith('/') ? current.slice(0, -1).split('/') : current.split('/');
    parts.pop();
    const parent = parts.join('/');
    navigateTo(parent);
}

// --- Data Operations ---

// main.js
async function loadDirectory(path, forceRefresh = false) {
    State.setLoading(true);
    try {
        const data = await API.fetchDirectory(path, forceRefresh);
        UI.render(data, handleUIEvent);
    } catch (error) {
        console.error(error);
        UI.showError("Error loading directory: " + error.message);
    } finally {
        State.setLoading(false);
    }
}

async function handleSearch(query) {
    if (!query) {
        refresh(); 
        return;
    }
    try {
        const data = await API.searchFiles(query);
        UI.render(data, handleUIEvent);
    } catch (error) {
        console.error(error);
    }
}

async function handleUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput.files.length === 0) {
        UI.showError('Please select a file first.');
        return;
    }

    try {
        await API.uploadFile(State.state.currentPath, fileInput.files[0]);
        fileInput.value = '';
        refresh();
    } catch (error) {
        UI.showError('Upload failed: ' + error.message);
    }
}

async function handleCreateFolder() {
    const name = prompt("Enter folder name:");
    if (!name) return;

    try {
        await API.createFolder(State.state.currentPath, name);
        refresh();
    } catch (error) {
        UI.showError("Could not create folder: " + error.message);
    }
}

// --- Event Dispatcher ---

function handleUIEvent(eventType, payload) {
    switch (eventType) {
        case UI.UIEvents.NAVIGATE:
            navigateTo(payload);
            break;
        case UI.UIEvents.DELETE:
            API.deleteItem(payload).then(refresh).catch(err => UI.showError(err.message));
            break;
        case UI.UIEvents.DOWNLOAD:
            window.location.href = API.getDownloadUrl(payload);
            break;
    }
}

function refresh() {
    API.clearCache();
    loadDirectory(State.state.currentPath, true);
}

init();