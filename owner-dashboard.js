document.addEventListener('DOMContentLoaded', async function() {
  const supabase = window.supabase;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  let role = 'renter';
  try {
    const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
    role = profile?.role || user.user_metadata?.role || 'renter';
  } catch (e) {
    role = user.user_metadata?.role || 'renter';
  }
  if (role !== 'owner') {
    window.location.href = 'index.html';
    return;
  }
  const summaryEl = document.getElementById('summary');
  const ordersTableBody = document.querySelector('#orders-table tbody');
  const bookingsTableBody = document.querySelector('#bookings-table tbody');
  const { data: properties } = await supabase.from('properties').select('id, name').eq('owner_id', user.id);
  const propertyIds = (properties || []).map(p => p.id);
  let rooms = [];
  if (propertyIds.length > 0) {
    const { data: roomsData } = await supabase.from('rooms').select('id, property_id, room_type, price, is_available');
    rooms = (roomsData || []).filter(r => propertyIds.includes(r.property_id));
  }
  const { data: bookings } = await supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(10);
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(10);
  const totalProperties = properties ? properties.length : 0;
  const totalRooms = rooms ? rooms.length : 0;
  const availableRooms = rooms ? rooms.filter(r => r.is_available).length : 0;
  const activeBookings = bookings ? bookings.filter(b => b.status === 'active').length : 0;
  const pendingOrders = orders ? orders.filter(o => o.status === 'pending').length : 0;
  const cards = [
    { label: 'Properti', value: totalProperties, icon: 'fa-building' },
    { label: 'Kamar', value: totalRooms, icon: 'fa-door-open' },
    { label: 'Tersedia', value: availableRooms, icon: 'fa-check-circle' },
    { label: 'Booking Aktif', value: activeBookings, icon: 'fa-calendar-check' },
    { label: 'Order Pending', value: pendingOrders, icon: 'fa-receipt' }
  ];
  summaryEl.innerHTML = cards.map(c => `
    <div style="background:#1f1f1f;border:1px solid #333;padding:16px;border-radius:8px;display:flex;align-items:center;gap:12px;">
      <i class="fas ${c.icon}" style="color:#FFD448;font-size:22px;"></i>
      <div>
        <div style="font-size:22px;font-weight:700;">${c.value}</div>
        <div style="opacity:.8;">${c.label}</div>
      </div>
    </div>
  `).join('');
  ordersTableBody.innerHTML = (orders || []).map(o => `
    <tr>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${o.order_number || '-'}</td>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${o.room_type || '-'}</td>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${o.total_payment ? 'Rp ' + o.total_payment.toLocaleString('id-ID') : '-'}</td>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${o.status || '-'}</td>
    </tr>
  `).join('');
  bookingsTableBody.innerHTML = (bookings || []).map(b => `
    <tr>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${b.room_id || '-'}</td>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${b.duration_months ? b.duration_months + ' bln' : '-'}</td>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${b.total_price ? 'Rp ' + b.total_price.toLocaleString('id-ID') : '-'}</td>
      <td style="padding:10px;border-top:1px solid #2a2a2a;">${b.status || '-'}</td>
    </tr>
  `).join('');
  const btnSeed = document.getElementById('btn-seed');
  btnSeed.addEventListener('click', async function() {
    if (window.seedDashboardData) {
      await window.seedDashboardData();
      location.reload();
    }
  });
  const btnLogout = document.getElementById('btn-logout');
  btnLogout.addEventListener('click', async function() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });
});