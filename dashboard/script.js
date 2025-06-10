// Socket.io bağlantısı
const socket = io();

// Sayfa yüklendikten sonra çalışacak kodlar
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    document.getElementById('sidebarCollapse').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('content').classList.toggle('active');
    });

    // Sayfa geçişleri
    document.querySelectorAll('#sidebar a[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            
            // Aktif sayfayı değiştir
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });
            document.getElementById(pageId).classList.add('active');
            
            // Sidebar aktif linkini değiştir
            document.querySelectorAll('#sidebar li').forEach(item => {
                item.classList.remove('active');
            });
            link.parentElement.classList.add('active');
        });
    });

    // Duyuru tipi değiştiğinde kanal seçimini göster/gizle
    document.getElementById('announcementType').addEventListener('change', (e) => {
        const channelSelect = document.getElementById('channelSelect');
        channelSelect.style.display = e.target.value === 'channel' ? 'block' : 'none';
    });

    // Grafikleri oluştur
    createVoiceStatsChart();
    createTicketStatsChart();

    // Socket.io event listeners
    socket.on('stats_update', updateStats);
    socket.on('voice_update', updateVoiceStats);
    socket.on('ticket_update', updateTicketTable);
    socket.on('announcement_update', updateAnnouncementTable);
});

// Ses istatistikleri grafiği
function createVoiceStatsChart() {
    const ctx = document.getElementById('voiceStatsChart').getContext('2d');
    const voiceStatsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 24}, (_, i) => `${i}:00`),
            datasets: [{
                label: 'Sesli Kanallardaki Üye Sayısı',
                data: Array(24).fill(0),
                borderColor: '#7289da',
                backgroundColor: 'rgba(114, 137, 218, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

// Ticket istatistikleri grafiği
function createTicketStatsChart() {
    const ctx = document.getElementById('ticketStatsChart').getContext('2d');
    const ticketStatsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Açık', 'Kapalı', 'Beklemede'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#43b581',
                    '#f04747',
                    '#faa61a'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff'
                    }
                }
            }
        }
    });
}

// İstatistikleri güncelle
function updateStats(data) {
    document.getElementById('totalMembers').textContent = data.totalMembers;
    document.getElementById('voiceMembers').textContent = data.voiceMembers;
    document.getElementById('openTickets').textContent = data.openTickets;
    document.getElementById('botUptime').textContent = formatUptime(data.uptime);
}

// Ses istatistikleri tablosunu güncelle
function updateVoiceStats(data) {
    const tbody = document.getElementById('voiceStatsTable');
    tbody.innerHTML = '';

    data.forEach(stat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <img src="${stat.avatar}" alt="${stat.username}" class="rounded-circle" width="32" height="32">
                ${stat.username}
            </td>
            <td>${formatDuration(stat.duration)}</td>
            <td>${stat.channel}</td>
            <td>${new Date(stat.lastActive).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Ticket tablosunu güncelle
function updateTicketTable(tickets) {
    const tbody = document.getElementById('ticketTable');
    tbody.innerHTML = '';

    tickets.forEach(ticket => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${ticket.id}</td>
            <td>${ticket.username}</td>
            <td>${ticket.subject}</td>
            <td>
                <span class="badge bg-${getStatusColor(ticket.status)}">
                    ${ticket.status}
                </span>
            </td>
            <td>${new Date(ticket.createdAt).toLocaleString()}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewTicket(${ticket.id})">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="closeTicket(${ticket.id})">
                    <i class="fas fa-times"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Duyuru tablosunu güncelle
function updateAnnouncementTable(announcements) {
    const tbody = document.getElementById('announcementTable');
    tbody.innerHTML = '';

    announcements.forEach(announcement => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(announcement.date).toLocaleString()}</td>
            <td>${announcement.type}</td>
            <td>${announcement.sender}</td>
            <td>${announcement.message}</td>
            <td>
                <span class="badge bg-${announcement.success ? 'success' : 'danger'}">
                    ${announcement.success ? 'Başarılı' : 'Başarısız'}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Yardımcı fonksiyonlar
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}g ${hours}s ${minutes}d`;
}

function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}s ${mins}d`;
}

function getStatusColor(status) {
    const colors = {
        'open': 'success',
        'closed': 'danger',
        'pending': 'warning'
    };
    return colors[status] || 'secondary';
}

// Form gönderme işlemleri
document.getElementById('announcementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const type = document.getElementById('announcementType').value;
    const message = document.getElementById('announcementMessage').value;
    const channel = type === 'channel' ? document.getElementById('announceChannel').value : null;

    socket.emit('send_announcement', {
        type,
        message,
        channel
    });
});

document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settings = {
        prefix: document.getElementById('botPrefix').value,
        logChannel: document.getElementById('logChannel').value,
        ticketCategory: document.getElementById('ticketCategory').value
    };

    socket.emit('update_settings', settings);
}); 