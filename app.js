class InventoryManager {
    constructor() {
        this.data = this.loadData();
        this.selectedItems = new Set();
        this.pendingAction = null;
    }

    // ---------- Data Management ----------
    loadData() {
        const savedData = localStorage.getItem('inventoryData');
        return savedData ? JSON.parse(savedData) : [];
    }

    saveData() {
        localStorage.setItem('inventoryData', JSON.stringify(this.data));
    }

    // Persistent next ID tracking
    getNextId() {
        let lastId = parseInt(localStorage.getItem('lastInventoryId')) || 0;
        const nextId = lastId + 1;
        localStorage.setItem('lastInventoryId', nextId);
        return nextId;
    }

    // ---------- Validation ----------
    isValidIP(ip) {
        return /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(ip);
    }

    isValidPort(port) {
        return /^\d+$/.test(port) && port > 0 && port <= 65535;
    }

    // ---------- Add to Inventory ----------
    addToInventory(platform, appName, clusterName, environment, dataCenter, bulkInput) {
        const lines = bulkInput.split('\n').map(line => line.trim()).filter(Boolean);
        const newEntries = [];

        for (let line of lines) {
            const parts = line.split(/\s+/);
            const [hostname, ip_address, service, port] = parts;

            if (!this.isValidIP(ip_address)) {
                this.showToast(`Invalid IP address: ${ip_address}`, 'error');
                return;
            }

            if (!this.isValidPort(port)) {
                this.showToast(`Invalid port number: ${port}`, 'error');
                return;
            }

            newEntries.push({
                id: this.getNextId(), // Unique persistent ID
                platform,
                app_name: appName,
                cluster_name: clusterName,
                environment,
                data_center: dataCenter,
                hostname,
                ip_address,
                service,
                port,
                created_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
        }

        this.data.push(...newEntries);
        this.saveData();
        this.populateFilterDropdowns();
        this.applyFilters();

        this.showToast(`${newEntries.length} record(s) added successfully`, 'success');
    }

    // ---------- Selection ----------
    toggleSelection(id, checked) {
        if (checked) {
            this.selectedItems.add(id);
        } else {
            this.selectedItems.delete(id);
        }
    }

    // ---------- Delete Selected ----------
    deleteSelected() {
        const countBefore = this.data.length;
        this.data = this.data.filter(item => !this.selectedItems.has(item.id));
        const deletedCount = countBefore - this.data.length;

        this.selectedItems.clear();
        this.saveData();
        this.populateFilterDropdowns();
        this.applyFilters();

        this.showToast(`Deleted ${deletedCount} record(s) successfully`, 'success');
    }

    // ---------- Export Data ----------
    exportData(data, fileName) {
        if (data.length === 0) {
            this.showToast('No data to export', 'error');
            return;
        }

        const csvContent = [
            Object.keys(data[0]).join(','),
            ...data.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.csv`;
        link.click();

        this.showToast(`Exported ${data.length} record(s)`, 'success');
    }

    // ---------- Confirm Action ----------
    executeConfirmedAction() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmModal'));
        modal.hide();

        switch (this.pendingAction) {
            case 'exportAll':
                this.exportData(this.data, 'inventory_all');
                break;
            case 'exportSelected':
                const selectedData = this.data.filter(item => this.selectedItems.has(item.id));
                this.exportData(selectedData, 'inventory_selected');
                break;
            case 'deleteSelected':
                this.deleteSelected();
                break;
        }
    }

    // ---------- UI Helpers ----------
    populateFilterDropdowns() {
        // Implement filter dropdown refresh logic if needed
    }

    applyFilters() {
        // Implement filtered view refresh logic if needed
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-bg-${type === 'error' ? 'danger' : 'success'} border-0 show position-fixed bottom-0 end-0 m-3`;
        toast.role = 'alert';
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}
