// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {};
        this.incidents = [];
        this.users = [];
        this.currentIncidentPage = 1;
        this.currentUserPage = 1;
        this.itemsPerPage = 10;
        this.API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3000' 
            : window.location.origin;
        
        this.init();
    }

    // Helper method to get the auth token
    getAuthToken() {
        return localStorage.getItem('safecity_token') || localStorage.getItem('token');
    }

    // Helper method to get auth headers
    getAuthHeaders() {
        const token = this.getAuthToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    async init() {
        try {
            // Check authentication
            await this.checkAuth();
            
            // Load initial data
            await this.loadDashboardData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update navigation
            this.updateNavigation();
            
        } catch (error) {
            console.error('Failed to initialize admin dashboard:', error);
            this.showAlert('Failed to load dashboard', 'danger');
        }
    }

    async checkAuth() {
        const token = this.getAuthToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/auth/me`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Token verification failed');
            }

            const data = await response.json();
            this.currentUser = data.user;

            // Check if user has admin privileges
            if (!this.currentUser.role || !['admin', 'moderator'].includes(this.currentUser.role)) {
                // Redirect immediately without showing alert
                window.location.href = 'dashboard.html';
                return;
            }

            this.displayUserInfo();

        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }

    displayUserInfo() {
        const userInfoElement = document.getElementById('admin-user-info');
        if (userInfoElement && this.currentUser) {
            userInfoElement.innerHTML = `
                <div style="margin-top: 1rem; padding: 1rem; background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                    <strong>Welcome, ${this.currentUser.firstName} ${this.currentUser.lastName}</strong>
                    <span style="margin-left: 1rem; color: #667eea; font-weight: bold; text-transform: uppercase;">${this.currentUser.role}</span>
                </div>
            `;
        }
    }

    async loadDashboardData() {
        try {
            // Load all data in parallel
            await Promise.all([
                this.loadStats(),
                this.loadPendingIncidents(),
                this.loadUsers(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showAlert('Failed to load some dashboard data', 'warning');
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.API_BASE}/api/admin/stats`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load stats');
            }

            this.stats = await response.json();
            console.log('📊 Stats loaded:', this.stats);
            this.renderStats();

        } catch (error) {
            console.error('Error loading stats:', error);
            this.showAlert('Failed to load statistics', 'warning');
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsCards');
        if (!statsContainer) {
            console.warn('⚠️ Stats container not found');
            return;
        }
        console.log('📊 Rendering stats:', this.stats);

        const statsHtml = `
            <div class="stat-card">
                <h3>Total Incidents</h3>
                <div class="stat-number">${this.stats.totalIncidents || 0}</div>
                <div class="stat-label">All time reports</div>
            </div>
            <div class="stat-card">
                <h3>Pending Review</h3>
                <div class="stat-number">${this.stats.pendingIncidents || 0}</div>
                <div class="stat-label">Awaiting moderation</div>
            </div>
            <div class="stat-card">
                <h3>Active Users</h3>
                <div class="stat-number">${this.stats.totalUsers || 0}</div>
                <div class="stat-label">Registered members</div>
            </div>
            <div class="stat-card">
                <h3>This Month</h3>
                <div class="stat-number">${this.stats.monthlyIncidents || 0}</div>
                <div class="stat-label">New reports</div>
            </div>
        `;
        
        statsContainer.innerHTML = statsHtml;
    }

    async loadPendingIncidents(page = 1) {
        try {
            const response = await fetch(`${this.API_BASE}/api/admin/incidents/pending?page=${page}&limit=${this.itemsPerPage}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load pending incidents');
            }

            const data = await response.json();
            this.incidents = data.incidents || [];
            this.currentIncidentPage = page;
            
            this.renderPendingIncidents();
            this.updatePendingCount();
            this.renderIncidentPagination(data.totalPages || 1);

        } catch (error) {
            console.error('Error loading pending incidents:', error);
            this.showAlert('Failed to load pending incidents', 'warning');
        }
    }

    renderPendingIncidents() {
        const tbody = document.getElementById('pendingIncidentsBody');
        if (!tbody) return;

        if (this.incidents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No pending incidents</td></tr>';
            return;
        }

        const incidentsHtml = this.incidents.map(incident => `
            <tr>
                <td style="max-width: 200px;">
                    <strong>${this.escapeHtml(incident.title)}</strong>
                    <div style="font-size: 0.9em; color: #666; margin-top: 0.3rem;">
                        ${this.escapeHtml(incident.description?.substring(0, 100) || '')}${incident.description?.length > 100 ? '...' : ''}
                    </div>
                </td>
                <td>
                    <span class="status-badge status-pending">${this.escapeHtml(incident.category)}</span>
                </td>
                <td>
                    ${this.escapeHtml(incident.reportedBy?.firstName || 'Unknown')} ${this.escapeHtml(incident.reportedBy?.lastName || '')}
                    <div style="font-size: 0.8em; color: #666;">${this.escapeHtml(incident.reportedBy?.email || '')}</div>
                </td>
                <td>
                    ${new Date(incident.createdAt).toLocaleDateString()}
                    <div style="font-size: 0.8em; color: #666;">${new Date(incident.createdAt).toLocaleTimeString()}</div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-approve" data-action="approve" data-incident-id="${incident._id}">
                            ✓ Approve
                        </button>
                        <button class="btn-small btn-reject" data-action="reject" data-incident-id="${incident._id}">
                            ✗ Reject
                        </button>
                        <button class="btn-small btn-flag" data-action="flag" data-incident-id="${incident._id}">
                            ⚠ Flag
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = incidentsHtml;
    }

    updatePendingCount() {
        const countElement = document.getElementById('pendingCount');
        if (countElement) {
            countElement.textContent = this.stats.pendingIncidents || this.incidents.length;
        }
    }

    renderIncidentPagination(totalPages) {
        const pagination = document.getElementById('incidentPagination');
        if (!pagination || totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        const paginationHtml = Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
            <button class="${page === this.currentIncidentPage ? 'active' : ''}" 
                    data-action="paginate-incidents" data-page="${page}">
                ${page}
            </button>
        `).join('');

        pagination.innerHTML = paginationHtml;
    }

    async loadUsers(page = 1, search = '') {
        try {
            const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
            const response = await fetch(`${this.API_BASE}/api/admin/users?page=${page}&limit=${this.itemsPerPage}${searchParam}`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load users');
            }

            const data = await response.json();
            this.users = data.users || [];
            this.currentUserPage = page;
            
            this.renderUsers();
            this.updateUserCount();
            this.renderUserPagination(data.totalPages || 1);

        } catch (error) {
            console.error('Error loading users:', error);
            this.showAlert('Failed to load users', 'warning');
        }
    }

    renderUsers() {
        const tbody = document.getElementById('usersBody');
        if (!tbody) return;

        if (this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #666;">No users found</td></tr>';
            return;
        }

        const usersHtml = this.users.map(user => `
            <tr>
                <td>
                    <strong>${this.escapeHtml(user.firstName)} ${this.escapeHtml(user.lastName)}</strong>
                </td>
                <td>${this.escapeHtml(user.email)}</td>
                <td>
                    <span class="status-badge ${user.role === 'admin' ? 'status-flagged' : user.role === 'moderator' ? 'status-pending' : 'status-approved'}">
                        ${this.escapeHtml(user.role || 'user')}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.status === 'banned' ? 'status-rejected' : 'status-approved'}">
                        ${this.escapeHtml(user.status || 'active')}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        ${user.status !== 'banned' ? `
                            <button class="btn-small btn-ban" data-action="ban" data-user-id="${user._id}">
                                🚫 Ban
                            </button>
                        ` : `
                            <button class="btn-small btn-unban" data-action="unban" data-user-id="${user._id}">
                                ✓ Unban
                            </button>
                        `}
                        ${user.role === 'user' ? `
                            <button class="btn-small btn-approve" data-action="promote" data-user-id="${user._id}">
                                ⬆ Promote
                            </button>
                        ` : user.role === 'moderator' && this.currentUser.role === 'admin' ? `
                            <button class="btn-small btn-reject" data-action="demote" data-user-id="${user._id}">
                                ⬇ Demote
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = usersHtml;
    }

    updateUserCount() {
        const countElement = document.getElementById('userCount');
        if (countElement) {
            countElement.textContent = this.stats.totalUsers || this.users.length;
        }
    }

    renderUserPagination(totalPages) {
        const pagination = document.getElementById('userPagination');
        if (!pagination || totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        const paginationHtml = Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
            <button class="${page === this.currentUserPage ? 'active' : ''}" 
                    data-action="paginate-users" data-page="${page}">
                ${page}
            </button>
        `).join('');

        pagination.innerHTML = paginationHtml;
    }

    async loadRecentActivity() {
        try {
            const response = await fetch(`${this.API_BASE}/api/admin/incidents/recent`, {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to load recent activity');
            }

            const data = await response.json();
            this.renderRecentActivity(data.incidents || []);

        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.showAlert('Failed to load recent activity', 'warning');
        }
    }

    renderRecentActivity(incidents) {
        const tbody = document.getElementById('recentActivityBody');
        if (!tbody) return;

        if (incidents.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #666;">No recent activity</td></tr>';
            return;
        }

        const activityHtml = incidents.slice(0, 10).map(incident => `
            <tr>
                <td>
                    ${new Date(incident.createdAt).toLocaleDateString()}
                    <div style="font-size: 0.8em; color: #666;">${new Date(incident.createdAt).toLocaleTimeString()}</div>
                </td>
                <td>📋 Report</td>
                <td style="max-width: 200px;">
                    <strong>${this.escapeHtml(incident.title)}</strong>
                </td>
                <td>
                    <span class="status-badge status-pending">${this.escapeHtml(incident.category)}</span>
                </td>
                <td>
                    ${this.escapeHtml(incident.reportedBy?.firstName || 'Unknown')} ${this.escapeHtml(incident.reportedBy?.lastName || '')}
                </td>
                <td>
                    <span class="status-badge ${this.getStatusClass(incident.status)}">
                        ${this.escapeHtml(incident.status || 'pending')}
                    </span>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = activityHtml;
    }

    getStatusClass(status) {
        switch (status) {
            case 'approved': return 'status-approved';
            case 'rejected': return 'status-rejected';
            case 'flagged': return 'status-flagged';
            default: return 'status-pending';
        }
    }

    setupEventListeners() {
        // User search
        const userSearch = document.getElementById('userSearch');
        if (userSearch) {
            let searchTimeout;
            userSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.loadUsers(1, e.target.value);
                }, 500);
            });
        }

        // Event delegation for dynamically generated buttons
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (!action) return;

            e.preventDefault();
            
            switch (action) {
                case 'approve':
                    this.approveIncident(e.target.getAttribute('data-incident-id'));
                    break;
                case 'reject':
                    this.rejectIncident(e.target.getAttribute('data-incident-id'));
                    break;
                case 'flag':
                    this.flagIncident(e.target.getAttribute('data-incident-id'));
                    break;
                case 'ban':
                    this.banUser(e.target.getAttribute('data-user-id'));
                    break;
                case 'unban':
                    this.unbanUser(e.target.getAttribute('data-user-id'));
                    break;
                case 'promote':
                    this.makeUserModerator(e.target.getAttribute('data-user-id'));
                    break;
                case 'demote':
                    this.demoteUser(e.target.getAttribute('data-user-id'));
                    break;
                case 'paginate-incidents':
                    this.loadPendingIncidents(parseInt(e.target.getAttribute('data-page')));
                    break;
                case 'paginate-users':
                    this.loadUsers(parseInt(e.target.getAttribute('data-page')), document.getElementById('userSearch')?.value || '');
                    break;
                case 'refresh':
                    this.refreshData();
                    break;
                case 'close-modal':
                    this.closeModal(e.target.getAttribute('data-modal'));
                    break;
            }
        });

        // Form submissions
        this.setupFormListeners();
    }

    setupFormListeners() {
        // Approve form
        const approveForm = document.getElementById('approveForm');
        if (approveForm) {
            approveForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const incidentId = document.getElementById('approveIncidentId').value;
                const notes = document.getElementById('approveNotes').value;
                await this.submitApproval(incidentId, notes);
            });
        }

        // Reject form
        const rejectForm = document.getElementById('rejectForm');
        if (rejectForm) {
            rejectForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const incidentId = document.getElementById('rejectIncidentId').value;
                const reason = document.getElementById('rejectReason').value;
                await this.submitRejection(incidentId, reason);
            });
        }

        // Ban form
        const banForm = document.getElementById('banForm');
        if (banForm) {
            banForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const userId = document.getElementById('banUserId').value;
                const reason = document.getElementById('banReason').value;
                const duration = document.getElementById('banDuration').value;
                await this.submitBan(userId, reason, duration);
            });
        }
    }

    // Incident Actions
    approveIncident(incidentId) {
        document.getElementById('approveIncidentId').value = incidentId;
        document.getElementById('approveNotes').value = '';
        this.showModal('approveModal');
    }

    rejectIncident(incidentId) {
        document.getElementById('rejectIncidentId').value = incidentId;
        document.getElementById('rejectReason').value = '';
        this.showModal('rejectModal');
    }

    async flagIncident(incidentId) {
        if (!confirm('Are you sure you want to flag this incident? This will mark it for further review.')) {
            return;
        }

        try {
            console.log('Flagging incident:', incidentId);
            
            const response = await fetch(`${this.API_BASE}/api/admin/incidents/${incidentId}/flag`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ reason: 'Flagged for review' })
            });

            console.log('Flag response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Flag error:', errorData);
                throw new Error(errorData.error || 'Failed to flag incident');
            }

            const result = await response.json();
            console.log('Flag success:', result);

            this.showAlert('Incident flagged successfully', 'success');
            await this.loadPendingIncidents(this.currentIncidentPage);
            await this.loadStats();

        } catch (error) {
            console.error('Error flagging incident:', error);
            this.showAlert('Failed to flag incident: ' + error.message, 'danger');
        }
    }

    async submitApproval(incidentId, notes) {
        try {
            console.log('Approving incident:', incidentId, 'with notes:', notes);
            
            const response = await fetch(`${this.API_BASE}/api/admin/incidents/${incidentId}/approve`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ notes })
            });

            console.log('Approve response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Approve error:', errorData);
                throw new Error(errorData.error || 'Failed to approve incident');
            }

            const result = await response.json();
            console.log('Approve success:', result);
            
            this.showAlert('Incident approved successfully', 'success');
            this.closeModal('approveModal');
            await this.loadPendingIncidents(this.currentIncidentPage);
            await this.loadStats();

        } catch (error) {
            console.error('Error approving incident:', error);
            this.showAlert('Failed to approve incident: ' + error.message, 'danger');
        }
    }

    async submitRejection(incidentId, reason) {
        try {
            const response = await fetch(`${this.API_BASE}/api/admin/incidents/${incidentId}/reject`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ reason })
            });

            if (!response.ok) {
                throw new Error('Failed to reject incident');
            }

            this.showAlert('Incident rejected successfully', 'success');
            this.closeModal('rejectModal');
            await this.loadPendingIncidents(this.currentIncidentPage);
            await this.loadStats();

        } catch (error) {
            console.error('Error rejecting incident:', error);
            this.showAlert('Failed to reject incident', 'danger');
        }
    }

    // User Actions
    banUser(userId) {
        document.getElementById('banUserId').value = userId;
        document.getElementById('banReason').value = '';
        document.getElementById('banDuration').value = '';
        this.showModal('banModal');
    }

    async unbanUser(userId) {
        if (!confirm('Are you sure you want to unban this user?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/unban`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to unban user');
            }

            this.showAlert('User unbanned successfully', 'success');
            await this.loadUsers(this.currentUserPage);

        } catch (error) {
            console.error('Error unbanning user:', error);
            this.showAlert('Failed to unban user', 'danger');
        }
    }

    async submitBan(userId, reason, duration) {
        try {
            const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/ban`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ 
                    reason, 
                    duration: duration ? parseInt(duration) : null 
                })
            });

            if (!response.ok) {
                throw new Error('Failed to ban user');
            }

            this.showAlert('User banned successfully', 'success');
            this.closeModal('banModal');
            await this.loadUsers(this.currentUserPage);

        } catch (error) {
            console.error('Error banning user:', error);
            this.showAlert('Failed to ban user', 'danger');
        }
    }

    async makeUserModerator(userId) {
        if (!confirm('Are you sure you want to promote this user to moderator?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ role: 'moderator' })
            });

            if (!response.ok) {
                throw new Error('Failed to promote user');
            }

            this.showAlert('User promoted to moderator', 'success');
            await this.loadUsers(this.currentUserPage);

        } catch (error) {
            console.error('Error promoting user:', error);
            this.showAlert('Failed to promote user', 'danger');
        }
    }

    async demoteUser(userId) {
        if (!confirm('Are you sure you want to demote this moderator to regular user?')) {
            return;
        }

        try {
            const response = await fetch(`${this.API_BASE}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ role: 'user' })
            });

            if (!response.ok) {
                throw new Error('Failed to demote user');
            }

            this.showAlert('User demoted to regular user', 'success');
            await this.loadUsers(this.currentUserPage);

        } catch (error) {
            console.error('Error demoting user:', error);
            this.showAlert('Failed to demote user', 'danger');
        }
    }

    // Utility Methods
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at top of admin container
        const container = document.querySelector('.admin-container');
        if (container) {
            container.insertBefore(alert, container.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, 5000);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateNavigation() {
        const navMenu = document.getElementById('navMenu');
        if (navMenu && this.currentUser) {
            const isAdmin = ['admin', 'moderator'].includes(this.currentUser.role);
            navMenu.innerHTML = `
                <li><a href="dashboard.html">🏠 Dashboard</a></li>
                <li><a href="index.html">📍 Report Incident</a></li>
                <li><a href="safety.html">🛡️ Analyze Safety</a></li>
                ${isAdmin ? '<li><a href="admin.html" class="active">🔧 Admin</a></li>' : ''}
                <li><a href="profile.html">👤 Profile</a></li>
                <li><a href="#" onclick="logout()">🚪 Logout</a></li>
            `;
        }
    }

    // Refresh data
    async refreshData() {
        const refreshButton = document.querySelector('button[data-action="refresh"]');
        if (refreshButton) {
            const originalText = refreshButton.innerHTML;
            refreshButton.innerHTML = '<span class="loading"></span> Refreshing...';
            refreshButton.disabled = true;
        }

        try {
            await this.loadDashboardData();
            this.showAlert('Dashboard data refreshed', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            this.showAlert('Failed to refresh data', 'danger');
        } finally {
            if (refreshButton) {
                refreshButton.innerHTML = '🔄 Refresh';
                refreshButton.disabled = false;
            }
        }
    }
}

// Global functions for modal and navigation
function closeModal(modalId) {
    if (window.adminDashboard) {
        window.adminDashboard.closeModal(modalId);
    }
}

function refreshData() {
    if (window.adminDashboard) {
        window.adminDashboard.refreshData();
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
});