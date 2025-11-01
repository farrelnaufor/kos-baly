document.addEventListener('DOMContentLoaded', async function() {
    const supabase = window.supabase;

    let currentUser = null;
    let currentProperty = null;
    let allRooms = [];
    let allBookings = [];
    let allOrders = [];
    let rentalChart = null;
    let roomStatusChart = null;

    async function checkAuth() {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            window.location.href = 'login.html';
            return null;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'owner') {
            alert('Akses ditolak. Halaman ini hanya untuk owner.');
            window.location.href = 'index.html';
            return null;
        }

        currentUser = profile;
        document.getElementById('owner-name').textContent = profile.full_name || profile.email;

        await ensureProperty();
        await loadDashboardData();

        return user;
    }

    async function ensureProperty() {
        const { data: properties } = await supabase
            .from('properties')
            .select('*')
            .eq('owner_id', currentUser.id)
            .limit(1);

        if (properties && properties.length > 0) {
            currentProperty = properties[0];
        } else {
            const { data: newProperty } = await supabase
                .from('properties')
                .insert([{
                    owner_id: currentUser.id,
                    name: 'Kost BaLy',
                    address: 'Yogyakarta',
                    city: 'Yogyakarta',
                    description: 'Kost nyaman di Yogyakarta',
                    is_active: true
                }])
                .select()
                .single();

            currentProperty = newProperty;
        }
    }

    async function loadDashboardData() {
        await loadRooms();
        await loadBookings();
        await loadOrders();
        updateStats();
        renderCharts();
        checkExpiringRentals();
    }

    async function loadRooms() {
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('property_id', currentProperty.id)
            .order('room_number', { ascending: true });

        if (error) {
            console.error('Error loading rooms:', error);
            return;
        }

        allRooms = data || [];
        renderRooms();
    }

    async function loadBookings() {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                room:rooms(room_number, room_type),
                renter:profiles(full_name, email, phone)
            `)
            .in('room_id', allRooms.map(r => r.id));

        if (error) {
            console.error('Error loading bookings:', error);
            return;
        }

        allBookings = data || [];
        renderRenters();
    }

    async function loadOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading orders:', error);
            return;
        }

        allOrders = data || [];
        renderOrders();
    }

    function updateStats() {
        const totalRooms = allRooms.length;
        const occupiedRooms = allBookings.filter(b => b.status === 'active').length;
        const availableRooms = totalRooms - occupiedRooms;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyIncome = allBookings
            .filter(b => {
                const bookingDate = new Date(b.created_at);
                return bookingDate.getMonth() === currentMonth &&
                       bookingDate.getFullYear() === currentYear &&
                       b.payment_status === 'paid';
            })
            .reduce((sum, b) => sum + b.total_price, 0);

        document.getElementById('total-rooms').textContent = totalRooms;
        document.getElementById('occupied-rooms').textContent = occupiedRooms;
        document.getElementById('available-rooms').textContent = availableRooms;
        document.getElementById('monthly-income').textContent = formatCurrency(monthlyIncome);
    }

    function renderCharts() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        const currentMonth = new Date().getMonth();
        const last6Months = [];

        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            last6Months.push(months[monthIndex]);
        }

        const rentalData = last6Months.map((month, index) => {
            const monthIndex = (currentMonth - (5 - index) + 12) % 12;
            return allBookings.filter(b => {
                const bookingDate = new Date(b.created_at);
                return bookingDate.getMonth() === monthIndex;
            }).length;
        });

        const ctxRental = document.getElementById('rentalChart').getContext('2d');
        if (rentalChart) {
            rentalChart.destroy();
        }
        rentalChart = new Chart(ctxRental, {
            type: 'line',
            data: {
                labels: last6Months,
                datasets: [{
                    label: 'Jumlah Penyewaan',
                    data: rentalData,
                    borderColor: '#FFD448',
                    backgroundColor: 'rgba(255, 212, 72, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#e0e0e0',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#e0e0e0'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });

        const totalRooms = allRooms.length;
        const occupiedRooms = allBookings.filter(b => b.status === 'active').length;
        const availableRooms = totalRooms - occupiedRooms;

        const ctxRoomStatus = document.getElementById('roomStatusChart').getContext('2d');
        if (roomStatusChart) {
            roomStatusChart.destroy();
        }
        roomStatusChart = new Chart(ctxRoomStatus, {
            type: 'doughnut',
            data: {
                labels: ['Tersewa', 'Tersedia'],
                datasets: [{
                    data: [occupiedRooms, availableRooms],
                    backgroundColor: ['#4CAF50', '#FFD448'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#e0e0e0',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    function renderRenters() {
        const tbody = document.getElementById('renters-table-body');

        if (allBookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada data penyewa</td></tr>';
            return;
        }

        tbody.innerHTML = allBookings.map(booking => {
            const renterName = booking.renter?.full_name || 'N/A';
            const roomNumber = booking.room?.room_number || 'N/A';
            const checkIn = formatDate(booking.check_in);
            const checkOut = formatDate(booking.check_out);
            const paymentStatus = booking.payment_status;
            const bookingStatus = booking.status;

            return `
                <tr>
                    <td>${renterName}</td>
                    <td>${roomNumber}</td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td><span class="status-badge ${paymentStatus}">${getPaymentStatusText(paymentStatus)}</span></td>
                    <td><span class="status-badge ${bookingStatus}">${getBookingStatusText(bookingStatus)}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${bookingStatus === 'active' ? `
                                <button class="btn-action btn-extend" onclick="extendBooking('${booking.id}')">
                                    <i class="fas fa-calendar-plus"></i> Perpanjang
                                </button>
                                <button class="btn-action btn-complete" onclick="completeBooking('${booking.id}')">
                                    <i class="fas fa-check"></i> Selesai
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function renderRooms() {
        const grid = document.getElementById('rooms-grid');

        if (allRooms.length === 0) {
            grid.innerHTML = '<p class="text-center">Belum ada kamar. Klik tombol "Tambah Kamar" untuk menambahkan kamar baru.</p>';
            return;
        }

        grid.innerHTML = allRooms.map(room => {
            const isOccupied = allBookings.some(b => b.room_id === room.id && b.status === 'active');
            const statusClass = isOccupied ? 'occupied' : 'available';
            const statusText = isOccupied ? 'Tersewa' : 'Tersedia';

            return `
                <div class="room-card">
                    <div class="room-card-header">
                        <div class="room-number">Kamar ${room.room_number}</div>
                        <div class="room-status ${statusClass}">${statusText}</div>
                    </div>
                    <div class="room-info">
                        <div class="room-type">${room.room_type}</div>
                        <div class="room-price">${formatCurrency(room.price)}/bulan</div>
                    </div>
                    <div class="room-facilities">
                        ${room.facilities || 'Tidak ada deskripsi fasilitas'}
                    </div>
                    <div class="room-actions">
                        <button class="btn-edit" onclick="editRoom('${room.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" onclick="deleteRoom('${room.id}')">
                            <i class="fas fa-trash"></i> Hapus
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderOrders() {
        const tbody = document.getElementById('orders-table-body');

        if (allOrders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada pesanan</td></tr>';
            return;
        }

        tbody.innerHTML = allOrders.map(order => {
            return `
                <tr>
                    <td>${order.order_number}</td>
                    <td>${order.name}</td>
                    <td>${order.room_type}</td>
                    <td>${order.duration} Bulan</td>
                    <td>${formatCurrency(order.total_payment)}</td>
                    <td><span class="status-badge ${order.status}">${getOrderStatusText(order.status)}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${order.status === 'pending' ? `
                                <button class="btn-action btn-confirm" onclick="confirmOrder('${order.id}')">
                                    <i class="fas fa-check"></i> Konfirmasi
                                </button>
                                <button class="btn-action btn-cancel" onclick="cancelOrder('${order.id}')">
                                    <i class="fas fa-times"></i> Batalkan
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function checkExpiringRentals() {
        const today = new Date();
        const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));

        const expiringBookings = allBookings.filter(booking => {
            const checkOut = new Date(booking.check_out);
            return booking.status === 'active' && checkOut <= thirtyDaysFromNow && checkOut >= today;
        });

        const notificationsList = document.getElementById('notifications-list');
        const notifBadge = document.getElementById('notif-badge');

        notifBadge.textContent = expiringBookings.length;

        if (expiringBookings.length === 0) {
            notificationsList.innerHTML = '<p class="text-center">Tidak ada notifikasi</p>';
            return;
        }

        notificationsList.innerHTML = expiringBookings.map(booking => {
            const checkOut = new Date(booking.check_out);
            const daysLeft = Math.ceil((checkOut - today) / (1000 * 60 * 60 * 24));
            const urgencyClass = daysLeft <= 7 ? 'urgent' : 'warning';

            return `
                <div class="notification-item ${urgencyClass}">
                    <div class="notification-content">
                        <h4>Sewa Akan Berakhir</h4>
                        <p>Kamar ${booking.room?.room_number} - ${booking.renter?.full_name} - ${daysLeft} hari lagi</p>
                    </div>
                    <div class="notification-date">${formatDate(booking.check_out)}</div>
                </div>
            `;
        }).join('');
    }

    function formatCurrency(value) {
        return `Rp ${value.toLocaleString('id-ID')}`;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function getPaymentStatusText(status) {
        const statusMap = {
            'paid': 'Lunas',
            'pending': 'Pending',
            'expired': 'Kadaluarsa'
        };
        return statusMap[status] || status;
    }

    function getBookingStatusText(status) {
        const statusMap = {
            'active': 'Aktif',
            'completed': 'Selesai',
            'cancelled': 'Dibatalkan'
        };
        return statusMap[status] || status;
    }

    function getOrderStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'confirmed': 'Terkonfirmasi',
            'cancelled': 'Dibatalkan'
        };
        return statusMap[status] || status;
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));

            const sectionId = this.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).classList.add('active');

            const sectionTitles = {
                'overview': 'Overview',
                'renters': 'Daftar Penyewa',
                'rooms': 'Kelola Kamar',
                'orders': 'Pesanan',
                'notifications': 'Notifikasi'
            };

            document.getElementById('page-title').textContent = sectionTitles[this.getAttribute('data-section')];
        });
    });

    document.getElementById('owner-logout').addEventListener('click', async function() {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    const roomModal = document.getElementById('room-modal');
    const confirmModal = document.getElementById('confirm-modal');

    document.getElementById('add-room-btn').addEventListener('click', function() {
        document.getElementById('modal-title').textContent = 'Tambah Kamar';
        document.getElementById('room-form').reset();
        document.getElementById('room-id').value = '';
        roomModal.classList.add('active');
    });

    document.getElementById('close-room-modal').addEventListener('click', function() {
        roomModal.classList.remove('active');
    });

    document.getElementById('cancel-room-form').addEventListener('click', function() {
        roomModal.classList.remove('active');
    });

    document.getElementById('close-confirm-modal').addEventListener('click', function() {
        confirmModal.classList.remove('active');
    });

    document.getElementById('cancel-confirm').addEventListener('click', function() {
        confirmModal.classList.remove('active');
    });

    document.getElementById('room-form').addEventListener('submit', async function(e) {
        e.preventDefault();

        const roomId = document.getElementById('room-id').value;
        const roomData = {
            property_id: currentProperty.id,
            room_number: document.getElementById('room-number').value,
            room_type: document.getElementById('room-type').value,
            price: parseInt(document.getElementById('room-price').value),
            facilities: document.getElementById('room-facilities').value,
            is_available: document.getElementById('room-available').checked
        };

        if (roomId) {
            const { error } = await supabase
                .from('rooms')
                .update(roomData)
                .eq('id', roomId);

            if (error) {
                alert('Gagal mengupdate kamar: ' + error.message);
                return;
            }

            alert('Kamar berhasil diupdate!');
        } else {
            const { error } = await supabase
                .from('rooms')
                .insert([roomData]);

            if (error) {
                alert('Gagal menambah kamar: ' + error.message);
                return;
            }

            alert('Kamar berhasil ditambahkan!');
        }

        roomModal.classList.remove('active');
        await loadDashboardData();
    });

    window.editRoom = async function(roomId) {
        const room = allRooms.find(r => r.id === roomId);
        if (!room) return;

        document.getElementById('modal-title').textContent = 'Edit Kamar';
        document.getElementById('room-id').value = room.id;
        document.getElementById('room-number').value = room.room_number;
        document.getElementById('room-type').value = room.room_type;
        document.getElementById('room-price').value = room.price;
        document.getElementById('room-facilities').value = room.facilities;
        document.getElementById('room-available').checked = room.is_available;

        roomModal.classList.add('active');
    };

    window.deleteRoom = function(roomId) {
        document.getElementById('confirm-message').textContent = 'Apakah Anda yakin ingin menghapus kamar ini?';
        confirmModal.classList.add('active');

        document.getElementById('confirm-action').onclick = async function() {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);

            if (error) {
                alert('Gagal menghapus kamar: ' + error.message);
                return;
            }

            alert('Kamar berhasil dihapus!');
            confirmModal.classList.remove('active');
            await loadDashboardData();
        };
    };

    window.extendBooking = async function(bookingId) {
        const booking = allBookings.find(b => b.id === bookingId);
        if (!booking) return;

        const months = prompt('Perpanjang sewa berapa bulan?', '1');
        if (!months) return;

        const newCheckOut = new Date(booking.check_out);
        newCheckOut.setMonth(newCheckOut.getMonth() + parseInt(months));

        const { error } = await supabase
            .from('bookings')
            .update({
                check_out: newCheckOut.toISOString().split('T')[0],
                duration_months: booking.duration_months + parseInt(months)
            })
            .eq('id', bookingId);

        if (error) {
            alert('Gagal memperpanjang sewa: ' + error.message);
            return;
        }

        alert('Sewa berhasil diperpanjang!');
        await loadDashboardData();
    };

    window.completeBooking = async function(bookingId) {
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', bookingId);

        if (error) {
            alert('Gagal menyelesaikan booking: ' + error.message);
            return;
        }

        alert('Booking berhasil diselesaikan!');
        await loadDashboardData();
    };

    window.confirmOrder = async function(orderId) {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', orderId);

        if (error) {
            alert('Gagal mengkonfirmasi pesanan: ' + error.message);
            return;
        }

        alert('Pesanan berhasil dikonfirmasi!');
        await loadOrders();
    };

    window.cancelOrder = async function(orderId) {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'cancelled' })
            .eq('id', orderId);

        if (error) {
            alert('Gagal membatalkan pesanan: ' + error.message);
            return;
        }

        alert('Pesanan berhasil dibatalkan!');
        await loadOrders();
    };

    document.getElementById('search-renters').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#renters-table-body tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    document.getElementById('filter-payment-status').addEventListener('change', function(e) {
        filterRenters();
    });

    document.getElementById('filter-booking-status').addEventListener('change', function(e) {
        filterRenters();
    });

    function filterRenters() {
        const paymentStatus = document.getElementById('filter-payment-status').value;
        const bookingStatus = document.getElementById('filter-booking-status').value;

        let filtered = allBookings;

        if (paymentStatus) {
            filtered = filtered.filter(b => b.payment_status === paymentStatus);
        }

        if (bookingStatus) {
            filtered = filtered.filter(b => b.status === bookingStatus);
        }

        const tbody = document.getElementById('renters-table-body');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data yang sesuai filter</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(booking => {
            const renterName = booking.renter?.full_name || 'N/A';
            const roomNumber = booking.room?.room_number || 'N/A';
            const checkIn = formatDate(booking.check_in);
            const checkOut = formatDate(booking.check_out);
            const paymentStatus = booking.payment_status;
            const bookingStatus = booking.status;

            return `
                <tr>
                    <td>${renterName}</td>
                    <td>${roomNumber}</td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td><span class="status-badge ${paymentStatus}">${getPaymentStatusText(paymentStatus)}</span></td>
                    <td><span class="status-badge ${bookingStatus}">${getBookingStatusText(bookingStatus)}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${bookingStatus === 'active' ? `
                                <button class="btn-action btn-extend" onclick="extendBooking('${booking.id}')">
                                    <i class="fas fa-calendar-plus"></i> Perpanjang
                                </button>
                                <button class="btn-action btn-complete" onclick="completeBooking('${booking.id}')">
                                    <i class="fas fa-check"></i> Selesai
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    document.getElementById('search-orders').addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#orders-table-body tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });

    document.getElementById('filter-order-status').addEventListener('change', function(e) {
        const status = e.target.value;

        let filtered = allOrders;

        if (status) {
            filtered = filtered.filter(o => o.status === status);
        }

        const tbody = document.getElementById('orders-table-body');

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data yang sesuai filter</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(order => {
            return `
                <tr>
                    <td>${order.order_number}</td>
                    <td>${order.name}</td>
                    <td>${order.room_type}</td>
                    <td>${order.duration} Bulan</td>
                    <td>${formatCurrency(order.total_payment)}</td>
                    <td><span class="status-badge ${order.status}">${getOrderStatusText(order.status)}</span></td>
                    <td>
                        <div class="action-buttons">
                            ${order.status === 'pending' ? `
                                <button class="btn-action btn-confirm" onclick="confirmOrder('${order.id}')">
                                    <i class="fas fa-check"></i> Konfirmasi
                                </button>
                                <button class="btn-action btn-cancel" onclick="cancelOrder('${order.id}')">
                                    <i class="fas fa-times"></i> Batalkan
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    });

    document.getElementById('export-renters').addEventListener('click', function() {
        exportToCSV(allBookings, 'daftar-penyewa.csv', [
            { key: 'renter.full_name', label: 'Nama Penyewa' },
            { key: 'room.room_number', label: 'No. Kamar' },
            { key: 'check_in', label: 'Tanggal Mulai' },
            { key: 'check_out', label: 'Tanggal Selesai' },
            { key: 'payment_status', label: 'Status Pembayaran' },
            { key: 'status', label: 'Status Sewa' },
            { key: 'total_price', label: 'Total Harga' }
        ]);
    });

    document.getElementById('export-orders').addEventListener('click', function() {
        exportToCSV(allOrders, 'daftar-pesanan.csv', [
            { key: 'order_number', label: 'No. Pesanan' },
            { key: 'name', label: 'Nama' },
            { key: 'room_type', label: 'Tipe Kamar' },
            { key: 'duration', label: 'Durasi (Bulan)' },
            { key: 'total_payment', label: 'Total' },
            { key: 'status', label: 'Status' },
            { key: 'phone', label: 'Telepon' },
            { key: 'email', label: 'Email' }
        ]);
    });

    function exportToCSV(data, filename, columns) {
        if (data.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }

        const headers = columns.map(col => col.label).join(',');

        const rows = data.map(item => {
            return columns.map(col => {
                const keys = col.key.split('.');
                let value = item;
                for (const key of keys) {
                    value = value?.[key];
                }
                return `"${value || ''}"`;
            }).join(',');
        });

        const csv = [headers, ...rows].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    checkAuth();
});
