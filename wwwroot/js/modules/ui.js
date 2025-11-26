import { formatBytes } from './utils.js';
import { getDownloadUrl } from './api.js';

// Events we want main.js to handle
export const UIEvents = {
    NAVIGATE: 'navigate',
    DELETE: 'delete',
    DOWNLOAD: 'download'
};

export function render(data, eventHandler) {
    const tbody = document.getElementById('fileListBody');
    const breadcrumbs = document.getElementById('breadcrumbs');
    const stats = document.getElementById('statsBar');
    const btnUp = document.getElementById('btnUp');

    // Secure breadcrumbs text
    breadcrumbs.textContent = data.currentPath ? `/${data.currentPath}` : '/ (Root)';

    // Disable "Up" if at root or in search mode
    btnUp.disabled = !data.currentPath || data.isSearch;

    tbody.innerHTML = ''; // Clear existing

    if (!data.items || data.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Folder is empty / No results</td></tr>';
        stats.textContent = '';
        return;
    }

    let totalSize = 0;
    let fileCount = 0;
    let folderCount = 0;

    data.items.forEach(item => {
        const tr = document.createElement('tr');

        // Security Fix: Use textContent/createTextNode instead of innerHTML for user data

        // 1. Name Column
        const tdName = document.createElement('td');
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = item.isFolder ? '📁' : '📄';
        tdName.appendChild(icon);
        tdName.appendChild(document.createTextNode(' ' + item.name));
        tr.appendChild(tdName);

        // 2. Type Column
        const tdType = document.createElement('td');
        tdType.textContent = item.isFolder ? 'Folder' : 'File';
        tr.appendChild(tdType);

        // 3. Size Column
        const tdSize = document.createElement('td');
        if (item.isFolder) {
            tdSize.textContent = item.count != null ? `${item.count} items` : '-';
            folderCount++;
        } else {
            tdSize.textContent = formatBytes(item.size);
            totalSize += item.size || 0;
            fileCount++;
        }
        tr.appendChild(tdSize);

        // 4. Date Column
        const tdDate = document.createElement('td');
        tdDate.textContent = new Date(item.lastModified).toLocaleString();
        tr.appendChild(tdDate);

        // 5. Actions Column
        const tdActions = document.createElement('td');

        // Delete Button
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn btn-danger';
        btnDelete.textContent = 'Delete';
        btnDelete.style.marginRight = '5px';
        btnDelete.onclick = (e) => {
            e.stopPropagation();
            if (confirm(`Delete ${item.name}?`)) eventHandler(UIEvents.DELETE, item.path);
        };
        tdActions.appendChild(btnDelete);

        // Download Button (Files only)
        if (!item.isFolder) {
            const btnDownload = document.createElement('button');
            btnDownload.className = 'btn';
            btnDownload.textContent = '⬇';
            btnDownload.onclick = (e) => {
                e.stopPropagation();
                eventHandler(UIEvents.DOWNLOAD, item.path);
            };
            tdActions.appendChild(btnDownload);
        }

        tr.appendChild(tdActions);

        // Row Click Navigation
        tr.onclick = () => {
            if (item.isFolder) {
                eventHandler(UIEvents.NAVIGATE, item.path);
            } else {
                eventHandler(UIEvents.DOWNLOAD, item.path);
            }
        };

        tbody.appendChild(tr);
    });

    stats.textContent = `Showing ${folderCount} folders and ${fileCount} files. Total size: ${formatBytes(totalSize)}`;
}