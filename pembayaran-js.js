// Tunggu hingga seluruh konten HTML dimuat
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Ambil booking_id dari URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking_id');

        if (!bookingId) {
            console.warn('Booking ID tidak ditemukan di URL');
            alert('Data booking tidak ditemukan. Silakan ulangi pemesanan.');
            window.location.href = 'index.html';
            return;
        }

        // Ambil data booking dari Supabase
        const { data: bookingData, error } = await window.supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

        if (error) {
            console.error('Error fetching booking:', error);
            alert('Gagal memuat data booking. Silakan coba lagi.');
            window.location.href = 'index.html';
            return;
        }

        if (!bookingData) {
            console.warn('Data booking tidak ditemukan');
            alert('Data booking tidak ditemukan. Silakan ulangi pemesanan.');
            window.location.href = 'index.html';
            return;
        }

        console.log('Data booking berhasil dimuat dari Supabase:', bookingData);

        // Update informasi kamar dan harga
        const roomTitle = document.querySelector('.room-title h1');
        if (roomTitle) {
            roomTitle.textContent = bookingData.room_name;
        }

        const priceValue = document.querySelector('.price-value');
        if (priceValue) {
            priceValue.textContent = bookingData.price_formatted;
        }

        const pricePeriod = document.querySelector('.price-period');
        if (pricePeriod) {
            pricePeriod.textContent = `untuk ${bookingData.duration_months} bulan`;
        }

    } catch (error) {
        console.error('Error saat memperbarui informasi kamar:', error);
        alert('Terjadi kesalahan. Silakan coba lagi.');
    }
});