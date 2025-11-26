export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0 || bytes == null) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function normalizePath(path) {
    return path || '';
}


export function getFileIcon(fileName, isFolder) {
    if (isFolder) return '📁';

    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconMap = {
        pdf: '📄',
        doc: '📝',
        docx: '📝',
        xls: '📊',
        xlsx: '📊',
        jpg: '🖼️',
        jpeg: '🖼️',
        png: '🖼️',
        gif: '🖼️',
        mp4: '🎬',
        mp3: '🎵',
        zip: '📦',
        txt: '📃',
    };

    return iconMap[ext] || '📄';
}