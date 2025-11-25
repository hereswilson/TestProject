/**
 * Simple Vanilla JS SPA for File Browsing
 * Refactored for testability
 */
const app = {
    // State
    state: {
        currentPath: '',
        isLoading: false
    },

    // Config
    apiBase: '/api/FileSystem',

    // Pure Logic (Testable)
    logic: {
        getParentPath: (path) => {
            if (!path) return '';
            // Handle edge case if path ends with slash
            const cleanPath = path.endsWith('/') ? path.slice(0, -1) : path;
            const parts = cleanPath.split('/');
            parts.pop(); // Remove last segment
            return parts.join('/');
        },

        formatBytes: (bytes, decimals = 2) => {
            if (bytes === 0 || bytes == null) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        // Ensure path is never null/undefined for API calls
        normalizePath: (path) => {
            return path || '';
        }
    },

    // Initialization
    init: () => {
        window.addEventListener('hashchange', app.handleRouting);
        app.handleRouting();
    },

    // Routing Logic
    handleRouting: () => {
        const hash = window.location.hash;
        let path = '';

        if (hash.startsWith('#path=')) {
            path = decodeURIComponent(hash.substring(6));
        }

        app.loadDirectory(path);
    },

    navigateTo: (path) => {
        window.location.hash = `path=${encodeURIComponent(app.logic.normalizePath(path))}`;
    },

    navigateUp: () => {
        const current = app.state.currentPath;
        if (!current) return; // Already at root
        const parent = app.logic.getParentPath(current);
        app.navigateTo(parent);
    },

    // Core Data Fetching
    loadDirectory: async (path) => {
        app.setLoading(true);
        app.state.currentPath = app.logic.normalizePath(path);

        try {
            const url = `${app.apiBase}/browse?path=${encodeURIComponent(app.state.currentPath)}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(await response.text());

            const data = await response.json();
            app.render(data);
        } catch (error) {
            // Only alert if we are in a browser environment (not running headless tests)
            if (typeof document !== 'undefined') {
                console.error(error);
            }
        } finally {
            app.setLoading(false);
        }
    },

    // UI Rendering
    render: (data) => {
        const tbody = document.getElementById('fileListBody');
        const breadcrumbs = document.getElementById('breadcrumbs');
        const stats = document.getElementById('statsBar');
        const btnUp = document.getElementById('btnUp');

        if (!tbody) return; // Guard for non-UI environments

        tbody.innerHTML = '';

        breadcrumbs.textContent = data.currentPath ? `/${data.currentPath}` : '/ (Root)';
        btnUp.disabled = !data.currentPath;

        if (!data.items || data.items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Folder is empty</td></tr>';
        } else {
            let totalSize = 0;
            let fileCount = 0;
            let folderCount = 0;

            data.items.forEach(item => {
                const tr = document.createElement('tr');

                const icon = item.isFolder ? '📁' : '📄';
                const iconClass = item.isFolder ? 'folder' : 'file';

                let sizeDisplay = '-';
                if (item.isFolder) {
                    sizeDisplay = `${item.count} items`;
                    folderCount++;
                } else {
                    sizeDisplay = app.logic.formatBytes(item.size);
                    totalSize += item.size;
                    fileCount++;
                }

                tr.onclick = (e) => {
                    if (e.target.tagName === 'BUTTON') return;
                    if (item.isFolder) {
                        app.navigateTo(item.path);
                    } else {
                        app.downloadFile(item.path);
                    }
                };

                tr.innerHTML = `
                    <td><span class="icon ${iconClass}">${icon}</span> ${item.name}</td>
                    <td>${item.isFolder ? 'Folder' : 'File'}</td>
                    <td>${sizeDisplay}</td>
                    <td>${new Date(item.lastModified).toLocaleString()}</td>
                    <td>
                        <button class="btn btn-danger" onclick="app.deleteItem('${item.path.replace(/'/g, "\\'")}')">Delete</button>
                        ${!item.isFolder ? `<button class="btn" onclick="app.downloadFile('${item.path.replace(/'/g, "\\'")}')">⬇</button>` : ''}
                    </td>
                `;
                tbody.appendChild(tr);
            });

            stats.textContent = `Showing ${folderCount} folders and ${fileCount} files. Total size: ${app.logic.formatBytes(totalSize)}`;
        }
    },

    // Actions
    uploadFile: async () => {
        const fileInput = document.getElementById('fileInput');
        if (fileInput.files.length === 0) {
            alert('Please select a file first.');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('path', app.state.currentPath);

        try {
            const response = await fetch(`${app.apiBase}/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                fileInput.value = '';
                app.refresh();
            } else {
                throw new Error(await response.text());
            }
        } catch (error) {
            alert('Upload failed: ' + error.message);
        }
    },

    downloadFile: (path) => {
        window.location.href = `${app.apiBase}/download?path=${encodeURIComponent(path)}`;
    },

    deleteItem: async (path) => {
        if (!confirm(`Are you sure you want to delete: ${path}?`)) return;

        try {
            const response = await fetch(`${app.apiBase}/delete?path=${encodeURIComponent(path)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                app.refresh();
            } else {
                throw new Error(await response.text());
            }
        } catch (error) {
            alert('Delete failed: ' + error.message);
        }
    },

    refresh: () => {
        app.loadDirectory(app.state.currentPath);
    },

    setLoading: (isLoading) => {
        app.state.isLoading = isLoading;
        const tbody = document.getElementById('fileListBody');
        if (tbody) {
            tbody.style.opacity = isLoading ? '0.5' : '1';
        }
    }
};

// Check if running in browser and NOT in test mode
if (typeof window !== 'undefined' && !window.__TEST_MODE__) {
    window.onload = app.init;
}