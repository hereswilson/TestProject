const API_BASE = '/api/FileSystem';
const cache = new Map();
const CACHE_DURATION = 30000


export async function fetchDirectory(path, forceRefresh = false) {
    const cacheKey = `dir:${path}`;

    if (!forceRefresh && cache.has(cacheKey)) {
        const cached = cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
    }

    const url = `${API_BASE}/browse?path=${encodeURIComponent(path || '')}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
}

export async function searchFiles(query) {
    const url = `${API_BASE}/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(await response.text());
    const items = await response.json();
    return { currentPath: "Search Results", items: items, parent: null, isSearch: true };
}

export async function uploadFile(path, file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path || '');

    const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) throw new Error(await response.text());
}

export async function deleteItem(path) {
    const response = await fetch(`${API_BASE}/delete?path=${encodeURIComponent(path)}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error(await response.text());
}

export function getDownloadUrl(path) {
    return `${API_BASE}/download?path=${encodeURIComponent(path)}`;
}

export async function createFolder(path, name) {
    const url = `${API_BASE}/mkdir?path=${encodeURIComponent(path || '')}&name=${encodeURIComponent(name)}`;

    const response = await fetch(url, { method: 'POST' });
    if (!response.ok) throw new Error(await response.text());
}

export function clearCache() {
    cache.clear();
}