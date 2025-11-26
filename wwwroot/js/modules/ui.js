import { formatBytes, getFileIcon } from './utils.js';
import { getDownloadUrl } from './api.js';


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

    breadcrumbs.textContent = data.currentPath ? `/${data.currentPath}` : '/ (Root)';


    btnUp.disabled = !data.currentPath || data.isSearch;

    tbody.innerHTML = '';

    if (!data.items || data.items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Folder is empty / No results</td></tr>';
        stats.textContent = '';
        return;
    }

    let totalSize = 0;
    let fileCount = 0;
    let folderCount = 0;

    data.items.forEach(item => {
        const row = createFileRow(item, eventHandler);
        tbody.appendChild(row);
    });


    function createFileRow(item, eventHandler) {
        const tr = document.createElement('tr');


        // 1. Name Column
        const tdName = document.createElement('td');
        const icon = document.createElement('span');
        icon.className = 'icon';
        icon.textContent = getFileIcon(item.name, item.isFolder);
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
        return tr;
    }

    stats.textContent = `Showing ${folderCount} folders and ${fileCount} files. Total size: ${formatBytes(totalSize)}`;
}


export function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #d9534f;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 2000;
    max-width: 400px;
  `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
}