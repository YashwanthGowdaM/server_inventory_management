// Inventory Management System JavaScript

class InventoryManager {
    constructor() {
        this.data = [];
        this.filteredData = [];
        this.selectedItems = new Set();
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
        this.populateFilterDropdowns();
        this.renderTable();
    }

    // Data Management
    loadData() {
        const stored = localStorage.getItem('inventoryData');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            // Initialize with sample data
            this.data = [
                {
                    id: 1,
                    platform: "GemFire",
                    app_name: "abc",
                    cluster_name: "gemfire-abc-prod-dal",
                    environment: "prod",
                    data_center: "dal",
                    hostname: "server01",
                    ip_address: "192.168.1.100",
                    service: "gemfire",
                    port: "10334",
                    created_date: "2025-10-04 13:30:00"
                },
                {
                    id: 2,
                    platform: "Kafka",
                    app_name: "messaging",
                    cluster_name: "kafka-messaging-prod-phx",
                    environment: "prod",
                    data_center: "phx",
                    hostname: "kafka-node01",
                    ip_address: "192.168.1.101",
                    service: "kafka",
                    port: "9092",
                    created_date: "2025-10-04 13:35:00"
                }
            ];
            this.saveData();
        }
        this.filteredData = [...this.data];
    }

    saveData() {
        localStorage.setItem('inventoryData', JSON.stringify(this.data));
    }

    // Event Binding
    bindEvents() {
        // Form submission
        document.getElementById('addToInvBtn').addEventListener('click', () => this.addToInventory());
        
        // Export buttons
        document.getElementById('exportAllBtn').addEventListener('click', () => this.confirmAction('exportAll'));
        document.getElementById('exportSelectedBtn').addEventListener('click', () => this.confirmAction('exportSelected'));
        
        // Delete button
        document.getElementById('deleteSelectedBtn').addEventListener('click', () => this.confirmAction('deleteSelected'));
        
        // Search and filter
        document.getElementById('searchBtn').addEventListener('click', () => this.applyFilters());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearFilters());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.applyFilters();
        });
        
        // Filter dropdowns (only the filter ones, not the form ones)
        ['filterPlatform', 'filterAppName', 'filterEnvironment', 'filterDataCenter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.applyFilters());
        });
        
        // Selection buttons
        document.getElementById('selectAllBtn').addEventListener('click', () => this.selectAll());
        document.getElementById('deselectAllBtn').addEventListener('click', () => this.deselectAll());
        document.getElementById('masterCheckbox').addEventListener('change', (e) => {
            if (e.target.checked) this.selectAll();
            else this.deselectAll();
        });
        
        // Modal confirmation
        document.getElementById('confirmModalOk').addEventListener('click', () => this.executeConfirmedAction());
    }

    // Form Validation and Data Addition
    addToInventory() {
        const form = document.getElementById('clusterForm');
        const hostnameData = document.getElementById('hostnameData').value.trim();
        
        // Get form values
        const platform = document.getElementById('platform').value;
        const appName = document.getElementById('appName').value.trim();
        const clusterName = document.getElementById('clusterName').value.trim();
        const environment = document.getElementById('environment').value;
        const dataCenter = document.getElementById('dataCenter').value;
        
        // Validate required fields
        if (!platform || !appName || !clusterName || !environment || !dataCenter || !hostnameData) {
            this.showToast('Please fill all required fields', 'error');
            return;
        }
        
        // Parse hostname data
        const lines = hostnameData.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            this.showToast('Please enter hostname data', 'error');
            return;
        }
        
        const newEntries = [];
        
        for (let line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length !== 4) {
                this.showToast(`Invalid format in line: "${line}". Expected: hostname ip_address service port`, 'error');
                return;
            }
            
            const [hostname, ip_address, service, port] = parts;
            
            // Validate IP address format
            if (!this.isValidIP(ip_address)) {
                this.showToast(`Invalid IP address: ${ip_address}`, 'error');
                return;
            }
            
            // Validate port number
            if (!this.isValidPort(port)) {
                this.showToast(`Invalid port number: ${port}`, 'error');
                return;
            }
            
            newEntries.push({
                id: this.getNextId(),
                platform: platform,
                app_name: appName,
                cluster_name: clusterName,
                environment: environment,
                data_center: dataCenter,
                hostname,
                ip_address,
                service,
                port,
                created_date: new Date().toISOString().slice(0, 19).replace('T', ' ')
            });
        }
        
        // Add entries to data
        this.data.push(...newEntries);
        this.saveData();
        this.populateFilterDropdowns();
        this.applyFilters();
        
        // Clear form
        form.reset();
        document.getElementById('hostnameData').value = '';
        
        this.showToast(`Successfully added ${newEntries.length} entries`, 'success');
    }

    // Validation helpers
    isValidIP(ip) {
        const parts = ip.split('.');
        return parts.length === 4 && parts.every(part => {
            const num = parseInt(part);
            return !isNaN(num) && num >= 0 && num <= 255;
        });
    }

    isValidPort(port) {
        const num = parseInt(port);
        return !isNaN(num) && num >= 1 && num <= 65535;
    }

    getNextId() {
        return this.data.length > 0 ? Math.max(...this.data.map(item => item.id)) + 1 : 1;
    }

    // Search and Filter - Only populate filter dropdowns, not form dropdowns
    populateFilterDropdowns() {
        const platforms = [...new Set(this.data.map(item => item.platform))].sort();
        const appNames = [...new Set(this.data.map(item => item.app_name))].sort();
        const environments = [...new Set(this.data.map(item => item.environment))].sort();
        const dataCenters = [...new Set(this.data.map(item => item.data_center))].sort();
        
        // Only populate the filter dropdowns (those with 'filter' prefix)
        this.populateDropdown('filterPlatform', platforms);
        this.populateDropdown('filterAppName', appNames);
        this.populateDropdown('filterEnvironment', environments);
        this.populateDropdown('filterDataCenter', dataCenters);
    }

    populateDropdown(id, values) {
        const select = document.getElementById(id);
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
        const platformFilter = document.getElementById('filterPlatform').value;
        const appNameFilter = document.getElementById('filterAppName').value;
        const environmentFilter = document.getElementById('filterEnvironment').value;
        const dataCenterFilter = document.getElementById('filterDataCenter').value;
        
        this.filteredData = this.data.filter(item => {
            // Text search
            const matchesSearch = !searchTerm || 
                item.hostname.toLowerCase().includes(searchTerm) ||
                item.ip_address.toLowerCase().includes(searchTerm) ||
                item.cluster_name.toLowerCase().includes(searchTerm);
            
            // Filter dropdowns
            const matchesPlatform = !platformFilter || item.platform === platformFilter;
            const matchesAppName = !appNameFilter || item.app_name === appNameFilter;
            const matchesEnvironment = !environmentFilter || item.environment === environmentFilter;
            const matchesDataCenter = !dataCenterFilter || item.data_center === dataCenterFilter;
            
            return matchesSearch && matchesPlatform && matchesAppName && matchesEnvironment && matchesDataCenter;
        });
        
        this.renderTable();
    }

    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterPlatform').value = '';
        document.getElementById('filterAppName').value = '';
        document.getElementById('filterEnvironment').value = '';
        document.getElementById('filterDataCenter').value = '';
        
        this.filteredData = [...this.data];
        this.renderTable();
    }

    // Table Rendering
    renderTable() {
        const tbody = document.getElementById('inventoryTableBody');
        
        if (this.filteredData.length === 0) {
            tbody.innerHTML = '<tr id="emptyState"><td colspan="11" class="text-center py-5 text-muted"><i class="bi bi-inbox display-4 d-block mb-2"></i>No inventory data found</td></tr>';
        } else {
            tbody.innerHTML = this.filteredData.map(item => this.createTableRow(item)).join('');
            this.bindRowEvents();
        }
        
        this.updateSelectionUI();
    }

    createTableRow(item) {
        const isSelected = this.selectedItems.has(item.id);
        const envClass = `env-${item.environment}`;
        
        return `
            <tr data-id="${item.id}" ${isSelected ? 'class="selected"' : ''}>
                <td>
                    <input type="checkbox" class="form-check-input row-checkbox" data-id="${item.id}" ${isSelected ? 'checked' : ''}>
                </td>
                <td>${item.platform}</td>
                <td>${item.app_name}</td>
                <td><span class="badge ${envClass}">${item.cluster_name}</span></td>
                <td><span class="badge ${envClass}">${item.environment}</span></td>
                <td>${item.data_center}</td>
                <td><strong>${item.hostname}</strong></td>
                <td><code>${item.ip_address}</code></td>
                <td>${item.service}</td>
                <td>${item.port}</td>
                <td>${this.formatDate(item.created_date)}</td>
            </tr>
        `;
    }

    bindRowEvents() {
        document.querySelectorAll('.row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const row = e.target.closest('tr');
                
                if (e.target.checked) {
                    this.selectedItems.add(id);
                    row.classList.add('selected');
                } else {
                    this.selectedItems.delete(id);
                    row.classList.remove('selected');
                }
                
                this.updateSelectionUI();
            });
        });
    }

    // Selection Management
    selectAll() {
        this.selectedItems.clear();
        this.filteredData.forEach(item => this.selectedItems.add(item.id));
        this.updateSelectionUI();
        this.renderTable();
    }

    deselectAll() {
        this.selectedItems.clear();
        this.updateSelectionUI();
        this.renderTable();
    }

    updateSelectionUI() {
        const masterCheckbox = document.getElementById('masterCheckbox');
        const selectedCount = this.selectedItems.size;
        const totalVisible = this.filteredData.length;
        
        if (selectedCount === 0) {
            masterCheckbox.indeterminate = false;
            masterCheckbox.checked = false;
        } else if (selectedCount === totalVisible) {
            masterCheckbox.indeterminate = false;
            masterCheckbox.checked = true;
        } else {
            masterCheckbox.indeterminate = true;
            masterCheckbox.checked = false;
        }
        
        // Update button states
        const hasSelection = selectedCount > 0;
        document.getElementById('exportSelectedBtn').disabled = !hasSelection;
        document.getElementById('deleteSelectedBtn').disabled = !hasSelection;
    }

    // Confirmation System
    confirmAction(action) {
        this.pendingAction = action;
        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        const title = document.getElementById('confirmModalTitle');
        const body = document.getElementById('confirmModalBody');
        const okBtn = document.getElementById('confirmModalOk');
        
        switch (action) {
            case 'exportAll':
                title.textContent = 'Export All Data';
                body.textContent = `Export all ${this.data.length} inventory records to CSV?`;
                okBtn.className = 'btn btn-secondary';
                okBtn.textContent = 'Export';
                break;
            case 'exportSelected':
                title.textContent = 'Export Selected Data';
                body.textContent = `Export ${this.selectedItems.size} selected records to CSV?`;
                okBtn.className = 'btn btn-warning';
                okBtn.textContent = 'Export';
                break;
            case 'deleteSelected':
                title.textContent = 'Delete Selected Data';
                body.textContent = `Are you sure you want to delete ${this.selectedItems.size} selected records? This action cannot be undone.`;
                okBtn.className = 'btn btn-danger';
                okBtn.textContent = 'Delete';
                break;
        }
        
        modal.show();
    }

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

    // Export Functionality
    exportData(data, filename) {
        if (data.length === 0) {
            this.showToast('No data to export', 'warning');
            return;
        }
        
        const headers = [
            'Platform', 'App Name', 'Cluster Name', 'Environment', 'Data Center',
            'Hostname', 'IP Address', 'Service', 'Port', 'Created Date'
        ];
        
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                this.escapeCsv(item.platform),
                this.escapeCsv(item.app_name),
                this.escapeCsv(item.cluster_name),
                this.escapeCsv(item.environment),
                this.escapeCsv(item.data_center),
                this.escapeCsv(item.hostname),
                this.escapeCsv(item.ip_address),
                this.escapeCsv(item.service),
                this.escapeCsv(item.port),
                this.escapeCsv(item.created_date)
            ].join(','))
        ].join('\n');
        
        this.downloadFile(csvContent, `${filename}_${this.getTimestamp()}.csv`, 'text/csv');
        this.showToast(`Exported ${data.length} records successfully`, 'success');
    }

    escapeCsv(value) {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Delete Functionality
    deleteSelected() {
        const countBefore = this.data.length;
        this.data = this.data.filter(item => !this.selectedItems.has(item.id));
        const deletedCount = countBefore - this.data.length;
        
        this.selectedItems.clear();
        this.saveData();
        this.populateFilterDropdowns();
        this.applyFilters();
        
        this.showToast(`Deleted ${deletedCount} records successfully`, 'success');
    }

    // Utility Functions
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    getTimestamp() {
        const now = new Date();
        return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastTitle = document.getElementById('toast-title');
        const toastBody = document.getElementById('toast-body');
        
        // Set toast content
        toastBody.textContent = message;
        
        // Set toast type and title
        toast.className = 'toast';
        switch (type) {
            case 'success':
                toast.classList.add('border-success');
                toastTitle.textContent = 'Success';
                toastTitle.className = 'me-auto text-success';
                break;
            case 'error':
                toast.classList.add('border-danger');
                toastTitle.textContent = 'Error';
                toastTitle.className = 'me-auto text-danger';
                break;
            case 'warning':
                toast.classList.add('border-warning');
                toastTitle.textContent = 'Warning';
                toastTitle.className = 'me-auto text-warning';
                break;
            default:
                toast.classList.add('border-info');
                toastTitle.textContent = 'Info';
                toastTitle.className = 'me-auto text-info';
                break;
        }
        
        // Show toast
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.inventoryManager = new InventoryManager();
});
