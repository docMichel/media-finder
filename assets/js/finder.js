class MediaFinder {
    constructor() {
        this.currentView = 'grid';
        this.currentDisk = null;
        this.currentFolder = null;
        this.breadcrumb = [];
        this.selectedItems = new Set();
        
        this.init();
    }
    
    init() {
        this.loadDisks();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // View buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                if (view) this.switchView(view);
            });
        });
        
        // Expand all button
        document.querySelector('.expand-all-btn')?.addEventListener('click', () => {
            this.expandAll();
        });
        
        // Search
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.search(e.target.value);
                }, 300);
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
    }
    
    async loadDisks() {
        try {
            const response = await fetch('api/data.php?action=disks');
            const result = await response.json();
            
            if (result.success) {
                this.renderDisks(result.data);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur chargement disques:', error);
            this.showError('Impossible de charger les disques');
        }
    }
    
    renderDisks(disks) {
        const container = document.querySelector('.sidebar-section');
        if (!container) return;
        
        const html = `
            <div class="sidebar-title">Disques</div>
            ${disks.map(disk => `
                <div class="disk-item" data-disk-id="${disk.id}">
                    <div class="disk-icon">${this.getDiskIcon(disk.type)}</div>
                    <div class="disk-info">
                        <div class="disk-name">${this.escapeHtml(disk.nom)}</div>
                        <div class="disk-size">${this.formatSize(disk.taille_totale)} • ${disk.nb_fichiers} fichiers</div>
                    </div>
                </div>
            `).join('')}
        `;
        
        container.innerHTML = html;
        
        // Event listeners pour les disques
        container.querySelectorAll('.disk-item').forEach(item => {
            item.addEventListener('click', () => {
                const diskId = item.dataset.diskId;
                const disk = disks.find(d => d.id == diskId);
                this.selectDisk(disk);
            });
        });
    }
    
    selectDisk(disk) {
        // Mise à jour UI
        document.querySelectorAll('.disk-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-disk-id="${disk.id}"]`)?.classList.add('active');
        
        this.currentDisk = disk;
        this.currentFolder = null;
        this.breadcrumb = [{ type: 'disk', name: disk.nom, id: disk.id }];
        
        this.updateBreadcrumb();
        this.loadFolders(disk.id);
    }
    
    async loadFolders(diskId, parentId = null) {
        try {
            this.showLoading();
            
            const url = `api/data.php?action=folders&disk_id=${diskId}${parentId ? `&parent_id=${parentId}` : ''}`;
            const response = await fetch(url);
            const result = await response.json();
            
            if (result.success) {
                this.renderContent(result.data, 'folder');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur chargement dossiers:', error);
            this.showError('Impossible de charger les dossiers');
        }
    }
    
    async loadFiles(folderId) {
        try {
            this.showLoading();
            
            const response = await fetch(`api/data.php?action=files&folder_id=${folderId}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderContent(result.data, 'file');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Erreur chargement fichiers:', error);
            this.showError('Impossible de charger les fichiers');
        }
    }
    
    renderContent(items, type) {
        const container = document.querySelector('.content-area');
        if (!container) return;
        
        if (items.length === 0) {
            this.showEmptyState();
            return;
        }
        
        if (this.currentView === 'grid') {
            this.renderGridView(items, type);
        } else if (this.currentView === 'list') {
            this.renderListView(items, type);
        } else if (this.currentView === 'tree') {
            this.renderTreeView(items, type);
        }
    }
    
    renderGridView(items, type) {
        const container = document.querySelector('.content-area');
        const html = `
            <div class="grid-view">
                ${items.map(item => `
                    <div class="grid-item" data-id="${item.id}" data-type="${type}">
                        <div class="item-icon">${this.getItemIcon(item, type)}</div>
                        <div class="item-name">${this.escapeHtml(this.getItemName(item, type))}</div>
                        <div class="item-info">${this.getItemInfo(item, type)}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        this.attachItemListeners();
    }
    
    renderListView(items, type) {
        const container = document.querySelector('.content-area');
        const headers = type === 'folder' 
            ? ['Nom', 'Éléments', 'Taille']
            : ['Nom', 'Taille', 'Type', 'Modifié'];
            
        const html = `
            <div class="list-view">
                <div class="list-header">
                    ${headers.map(header => `<div class="list-cell">${header}</div>`).join('')}
                </div>
                ${items.map(item => `
                    <div class="list-item" data-id="${item.id}" data-type="${type}">
                        <div class="list-cell">
                            <div class="list-name">
                                <div class="item-icon">${this.getItemIcon(item, type)}</div>
                                ${this.escapeHtml(this.getItemName(item, type))}
                            </div>
                        </div>
                        ${this.getListCells(item, type).map(cell => `<div class="list-cell">${cell}</div>`).join('')}
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        this.attachItemListeners();
    }
    
    renderTreeView(items, type) {
        // Pour la vue arbre, on charge récursivement
        this.loadTreeView();
    }
    
    async loadTreeView() {
        if (!this.currentDisk) return;
        
        try {
            const response = await fetch(`api/data.php?action=tree&disk_id=${this.currentDisk.id}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderTreeStructure(result.data);
            }
        } catch (error) {
            console.error('Erreur chargement arbre:', error);
        }
    }
    
    renderTreeStructure(folders) {
        const container = document.querySelector('.content-area');
        const tree = this.buildTree(folders);
        const html = `<div class="tree-view">${this.renderTreeNode(tree, 0)}</div>`;
        container.innerHTML = html;
        this.attachTreeListeners();
    }
    
    buildTree(folders) {
        const tree = {};
        const map = {};
        
        // Créer une map de tous les dossiers
        folders.forEach(folder => {
            map[folder.id] = { ...folder, children: [] };
        });
        
        // Construire l'arbre
        folders.forEach(folder => {
            if (folder.parent_id === null) {
                tree[folder.id] = map[folder.id];
            } else if (map[folder.parent_id]) {
                map[folder.parent_id].children.push(map[folder.id]);
            }
        });
        
        return Object.values(tree);
    }
    
    renderTreeNode(nodes, depth) {
        return nodes.map(node => {
            const hasChildren = node.children && node.children.length > 0;
            const indent = '&nbsp;'.repeat(depth * 4);
            
            return `
                <div class="tree-item" data-id="${node.id}" data-type="folder">
                    ${indent}
                    <span class="tree-toggle" data-folder-id="${node.id}">
                        ${hasChildren ? '▶' : '&nbsp;'}
                    </span>
                    <span class="tree-icon">📁</span>
                    <span class="tree-name">${this.escapeHtml(node.nom_dossier)}</span>
                </div>
                ${hasChildren ? `<div class="tree-children collapsed" data-parent="${node.id}">
                    ${this.renderTreeNode(node.children, depth + 1)}
                </div>` : ''}
            `;
        }).join('');
    }
    
    attachItemListeners() {
        document.querySelectorAll('.grid-item, .list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.selectItem(item, e.ctrlKey || e.metaKey);
            });
            
            item.addEventListener('dblclick', () => {
                this.openItem(item);
            });
        });
    }
    
    attachTreeListeners() {
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTreeNode(toggle);
            });
        });
        
        document.querySelectorAll('.tree-item').forEach(item => {
            item.addEventListener('click', () => {
                this.selectTreeItem(item);
            });
            
            item.addEventListener('dblclick', () => {
                this.openTreeItem(item);
            });
        });
    }
    
    selectItem(item, multiSelect = false) {
        if (!multiSelect) {
            this.selectedItems.clear();
            document.querySelectorAll('.grid-item, .list-item').forEach(i => {
                i.classList.remove('selected');
            });
        }
        
        item.classList.toggle('selected');
        
        if (item.classList.contains('selected')) {
            this.selectedItems.add({
                id: item.dataset.id,
                type: item.dataset.type
            });
        } else {
            this.selectedItems.delete({
                id: item.dataset.id,
                type: item.dataset.type
            });
        }
    }
    
    openItem(item) {
        const id = item.dataset.id;
        const type = item.dataset.type;
        
        if (type === 'folder') {
            this.openFolder(id);
        } else {
            this.openFile(id);
        }
    }
    
    openFolder(folderId) {
        // Trouver le dossier dans les données actuelles
        const folderName = document.querySelector(`[data-id="${folderId}"] .item-name`)?.textContent || 'Dossier';
        
        this.currentFolder = { id: folderId, name: folderName };
        this.breadcrumb.push({ type: 'folder', name: folderName, id: folderId });
        
        this.updateBreadcrumb();
        this.loadFiles(folderId);
    }
    
    openFile(fileId) {
        console.log('Ouverture fichier:', fileId);
        // TODO: Implémenter la prévisualisation/ouverture de fichier
    }
    
    toggleTreeNode(toggle) {
        const folderId = toggle.dataset.folderId;
        const children = document.querySelector(`[data-parent="${folderId}"]`);
        
        if (children) {
            children.classList.toggle('collapsed');
            toggle.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
        }
    }
    
    selectTreeItem(item) {
        document.querySelectorAll('.tree-item').forEach(i => {
            i.classList.remove('selected');
        });
        item.classList.add('selected');
    }
    
    openTreeItem(item) {
        const id = item.dataset.id;
        this.openFolder(id);
    }
    
    switchView(view) {
        this.currentView = view;
        
        // Mise à jour des boutons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
        
        // Recharger le contenu
        if (this.currentFolder) {
            this.loadFiles(this.currentFolder.id);
        } else if (this.currentDisk) {
            this.loadFolders(this.currentDisk.id);
        }
    }
    
    async expandAll() {
        if (this.currentView !== 'tree') {
            alert('La fonction "Tout déplier" n\'est disponible qu\'en vue arbre');
            return;
        }
        
        // Déplier tous les nœuds
        document.querySelectorAll('.tree-children').forEach(children => {
            children.classList.remove('collapsed');
        });
        
        document.querySelectorAll('.tree-toggle').forEach(toggle => {
            if (toggle.textContent === '▶') {
                toggle.textContent = '▼';
            }
        });
    }
    
    updateBreadcrumb() {
        const container = document.querySelector('.breadcrumb');
        if (!container) return;
        
        const html = this.breadcrumb.map((item, index) => {
            const isLast = index === this.breadcrumb.length - 1;
            return `
                <span class="breadcrumb-item" data-index="${index}">
                    ${this.escapeHtml(item.name)}
                </span>
                ${!isLast ? '<span class="breadcrumb-separator">❯</span>' : ''}
            `;
        }).join('');
        
        container.innerHTML = html;
        
        // Event listeners pour la navigation
        container.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                this.navigateToBreadcrumb(index);
            });
        });
    }
    
    navigateToBreadcrumb(index) {
        this.breadcrumb = this.breadcrumb.slice(0, index + 1);
        this.updateBreadcrumb();
        
        const target = this.breadcrumb[index];
        if (target.type === 'disk') {
            this.loadFolders(target.id);
        } else {
            this.loadFiles(target.id);
        }
    }
    
    async search(query) {
        if (!query || query.length < 2) return;
        
        try {
            const diskParam = this.currentDisk ? `&disk_id=${this.currentDisk.id}` : '';
            const response = await fetch(`api/data.php?action=search&q=${encodeURIComponent(query)}${diskParam}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderSearchResults(result.data, query);
            }
        } catch (error) {
            console.error('Erreur recherche:', error);
        }
    }
    
    renderSearchResults(results, query) {
        const container = document.querySelector('.content-area');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <p>Aucun résultat pour "${this.escapeHtml(query)}"</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div style="margin-bottom: 16px;">
                <strong>${results.length} résultat${results.length > 1 ? 's' : ''} pour "${this.escapeHtml(query)}"</strong>
            </div>
            <div class="list-view">
                <div class="list-header">
                    <div class="list-cell">Nom</div>
                    <div class="list-cell">Emplacement</div>
                    <div class="list-cell">Taille</div>
                    <div class="list-cell">Type</div>
                </div>
                ${results.map(item => `
                    <div class="list-item" data-id="${item.id}" data-type="file">
                        <div class="list-cell">
                            <div class="list-name">
                                <div class="item-icon">${this.getFileIcon(item.type_media)}</div>
                                ${this.escapeHtml(item.nom_fichier)}
                            </div>
                        </div>
                        <div class="list-cell">${this.escapeHtml(item.dossier_chemin || '')}</div>
                        <div class="list-cell">${this.formatSize(item.taille)}</div>
                        <div class="list-cell">${item.type_media}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        container.innerHTML = html;
        this.attachItemListeners();
    }
    
    showLoading() {
        const container = document.querySelector('.content-area');
        if (container) {
            container.innerHTML = '<div class="loading"><div class="spinner"></div>Chargement...</div>';
        }
    }
    
    showError(message) {
        const container = document.querySelector('.content-area');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>${this.escapeHtml(message)}</p>
                </div>
            `;
        }
    }
    
    showEmptyState() {
        const container = document.querySelector('.content-area');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📂</div>
                    <p>Ce dossier est vide</p>
                </div>
            `;
        }
    }
    
    handleKeyboard(e) {
        // Raccourcis clavier
        if (e.metaKey || e.ctrlKey) {
            switch (e.key) {
                case 'f':
                    e.preventDefault();
                    document.querySelector('.search-input')?.focus();
                    break;
                case 'a':
                    e.preventDefault();
                    this.selectAll();
                    break;
            }
        }
        
        if (e.key === 'Escape') {
            this.clearSelection();
        }
    }
    
    selectAll() {
        document.querySelectorAll('.grid-item, .list-item').forEach(item => {
            item.classList.add('selected');
            this.selectedItems.add({
                id: item.dataset.id,
                type: item.dataset.type
            });
        });
    }
    
    clearSelection() {
        this.selectedItems.clear();
        document.querySelectorAll('.grid-item, .list-item, .tree-item').forEach(item => {
            item.classList.remove('selected');
        });
    }
    
    // Utilitaires
    getDiskIcon(type) {
        const icons = {
            'USB': '🔌',
            'INTERNAL': '💽',
            'NETWORK': '🌐',
            'EXTERNAL': '💾',
            'SMB': '🌐'
        };
        return icons[type] || '💾';
    }
    
    getFileIcon(type) {
        const icons = {
            'VIDEO': '🎬',
            'AUDIO': '🎵',
            'PHOTO': '🖼️',
            'DOCUMENT': '📄',
            'ARCHIVE': '📦'
        };
        return icons[type] || '📄';
    }
    
    getItemIcon(item, type) {
        if (type === 'folder') {
            return '📁';
        } else {
            return this.getFileIcon(item.type_media);
        }
    }
    
    getItemName(item, type) {
        return type === 'folder' ? item.nom_dossier : item.nom_fichier;
    }
    
    getItemInfo(item, type) {
        if (type === 'folder') {
            const files = item.nb_fichiers_directs || 0;
            const folders = item.nb_sous_dossiers || 0;
            let info = [];
            if (files > 0) info.push(`${files} fichier${files > 1 ? 's' : ''}`);
            if (folders > 0) info.push(`${folders} dossier${folders > 1 ? 's' : ''}`);
            return info.join(', ') || 'Vide';
        } else {
            return this.formatSize(item.taille);
        }
    }
    
    getListCells(item, type) {
        if (type === 'folder') {
            const files = item.nb_fichiers_directs || 0;
            const folders = item.nb_sous_dossiers || 0;
            return [
                `${files + folders} éléments`,
                this.formatSize(item.taille_totale || 0)
            ];
        } else {
            return [
                this.formatSize(item.taille),
                item.type_media,
                item.date_modification ? new Date(item.date_modification).toLocaleDateString() : '-'
            ];
        }
    }
    
    formatSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    window.finder = new MediaFinder();
});
