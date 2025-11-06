document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomType = urlParams.get('room') || urlParams.get('room_type') || urlParams.get('room_name');
    const roomPriceRaw = urlParams.get('price') || urlParams.get('priceValue') || urlParams.get('total');
    
    // Pastikan Supabase client tersedia
    const supabase = window.supabase;
    
    // Owner WhatsApp number - change this to the actual owner's number
    const ownerWhatsAppNumber = "6282265084996"; // Format: country code without + followed by number
    
    // Fungsi untuk menyimpan order ke Supabase
    async function saveOrderToSupabase(orderData) {
        try {
            // Pastikan supabase client tersedia
            if (!supabase) {
                console.error('Supabase client tidak tersedia');
                return { success: false, error: 'Supabase client tidak tersedia' };
            }

            // Pastikan data sesuai dengan struktur tabel yang ada
            // Jika ada field yang tidak sesuai, hapus dari objek orderData
            // atau sesuaikan dengan nama field di tabel

            // Insert order data ke tabel 'orders'
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select();

            if (error) {
                console.error('Error menyimpan order ke Supabase:', error);
                return { success: false, error: error.message };
            }

            console.log('Order Berhasil Dibuat!', data);
            return { success: true, data };
        } catch (err) {
            console.error('Exception saat menyimpan order:', err);
            return { success: false, error: err.message };
        }
    }

    // Fungsi untuk update status ketersediaan kamar
    async function updateRoomAvailability(roomType, available) {
        try {
            if (!supabase) return { success: false, error: 'Supabase client tidak tersedia' };

            const { data, error } = await supabase
                .from('rooms')
                .update({ is_available: available })
                .eq('room_type', roomType)
                .select()
                .limit(1);

            if (error) {
                console.error('Error updating room availability:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Exception updating room availability:', err);
            return { success: false, error: err.message };
        }
    }
    
    // Function untuk menampilkan notifikasi
    function showNotification(message, isSuccess = true) {
        // Cek apakah elemen notifikasi sudah ada
        let notification = document.getElementById('notification');
        
        // Jika belum ada, buat elemen baru
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
        }
        
        // Set class berdasarkan status
        notification.className = isSuccess ? 'notification success' : 'notification error';
        notification.textContent = message;
        
        // Tampilkan notifikasi
        notification.style.display = 'block';
        
        // Hilangkan notifikasi setelah 3 detik
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
    
    // Helpers
    function safeNumber(v) {
        if (!v) return 0;
        const n = Number(String(v).replace(/[^\d\-]/g, ''));
        return Number.isFinite(n) ? n : 0;
    }
    
    function formatCurrencyNumber(n) {
        return 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
    }
    
    function formatDateSafe(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d)) return '-';
        return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    // Generate a random order number
    function generateOrderNumber() {
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `ORD-${timestamp}${random}`;
    }
    
    // Set order number
    const orderNumber = generateOrderNumber();
    const orderNumberElement = document.getElementById('order-number');
    if (orderNumberElement) orderNumberElement.textContent = orderNumber;
    
    // Populate summary fields safely
    const elRoomType = document.getElementById('summary-room-type');
    const elRoomPrice = document.getElementById('summary-room-price');
    const elCheckIn = document.getElementById('summary-check-in');
    const elCheckOut = document.getElementById('summary-check-out');
    const elDuration = document.getElementById('summary-duration');
    const elTotal = document.getElementById('summary-total');
    
    if (elRoomType) elRoomType.textContent = roomType ? decodeURIComponent(roomType) : '-';
    if (elRoomPrice) {
        const priceNum = safeNumber(roomPriceRaw);
        elRoomPrice.textContent = priceNum ? formatCurrencyNumber(priceNum) : (roomPriceRaw ? decodeURIComponent(roomPriceRaw) : '-');
    }
    
    // Check-in/out/duration/total from URL params (if provided)
    const checkInParam = urlParams.get('check_in') || urlParams.get('checkin');
    const checkOutParam = urlParams.get('check_out') || urlParams.get('checkout');
    const durationParam = urlParams.get('duration') || urlParams.get('months');
    
    if (elCheckIn) elCheckIn.textContent = formatDateSafe(checkInParam);
    if (elCheckOut) elCheckOut.textContent = formatDateSafe(checkOutParam);
    if (elDuration) elDuration.textContent = durationParam ? `${durationParam} Bulan` : '-';
    
    // Calculate total: prefer explicit price param as total; else pricePerMonth * duration
    let totalCalculated = 0;
    const totalParam = urlParams.get('total') || urlParams.get('total_price');
    if (totalParam) {
        totalCalculated = safeNumber(totalParam);
    } else {
        const priceNum = safeNumber(roomPriceRaw);
        const dur = Number(durationParam) || 0;
        if (priceNum && dur) totalCalculated = priceNum; // price passed already is total in index (script.js sends totalPrice)
        // if price raw is per month and duration exists you might compute: total = priceNum * dur
        // but script.js sends totalPrice already; keep safe behavior:
        if (!totalCalculated && priceNum && dur) totalCalculated = priceNum * dur;
    }
    if (elTotal) elTotal.textContent = totalCalculated ? formatCurrencyNumber(totalCalculated) : '-';
    
    // Handle form submission
    const paymentForm = document.getElementById('payment-form');
    const paymentFormSection = document.getElementById('payment-form-section');
    const qrPaymentSection = document.getElementById('qr-payment-section');
    const paymentCompletedBtn = document.getElementById('payment-completed-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const qrCodeImage = document.getElementById('qr-code-image');
    
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const paymentMethod = document.getElementById('payment-method').value;
            
            // Prepare order details
            const orderDetails = {
                order_number: orderNumber,
                room_type: roomType ? decodeURIComponent(roomType) : '-',
                total_payment: totalCalculated,
                name: name,
                phone: phone,
                email: email,
                payment_method: paymentMethod,
                duration: durationParam ? Number(durationParam) : 1,
                check_in: checkInParam || new Date().toISOString(),
                check_out: checkOutParam || null,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            // Save order to Supabase
            const saveResult = await saveOrderToSupabase(orderDetails);
            
            // Tampilkan notifikasi berdasarkan hasil penyimpanan
            if (!saveResult.success) {
                console.error('Gagal menyimpan order:', saveResult.error);
                showNotification('Gagal menyimpan order: ' + saveResult.error, false);
                // Tetap lanjutkan proses meskipun gagal menyimpan
            } else {
                showNotification('Order berhasil dibuat!', true);
            }
            
            // Hide form and show QR code
            if (paymentFormSection) paymentFormSection.style.display = 'none';
            if (qrPaymentSection) qrPaymentSection.style.display = 'block';
            
            // Generate dynamic QR code with order details
            const qrData = `ORDER:${orderNumber}|ROOM:${roomType}|TOTAL:${totalCalculated}|NAME:${name}|PHONE:${phone}`;
            if (qrCodeImage) {
                qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
                
                // Enable the payment completed button once QR code is loaded
                qrCodeImage.onload = function() {
                    if (paymentCompletedBtn) {
                        paymentCompletedBtn.disabled = false;
                    }
                };
            }
            
            // Save order details for WhatsApp message
            window.orderDetails = {
                orderNumber: orderNumber,
                roomType: roomType ? decodeURIComponent(roomType) : '-',
                totalPayment: totalCalculated ? formatCurrencyNumber(totalCalculated) : '-',
                name: name,
                phone: phone,
                email: email,
                duration: durationParam ? `${durationParam} Bulan` : '-',
                checkIn: formatDateSafe(checkInParam),
                checkOut: formatDateSafe(checkOutParam)
            };
        });
    }
    
    // Handle payment completed button click
    if (paymentCompletedBtn) {
        paymentCompletedBtn.addEventListener('click', function() {
            // Show loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
            
            // Prepare WhatsApp message with order details
            const orderDetails = window.orderDetails || {};
            const message = `Halo, saya sudah melakukan pembayaran untuk pesanan berikut:
            
*Nomor Pesanan:* ${orderDetails.orderNumber || '-'}
*Tipe Kamar:* ${orderDetails.roomType || '-'}
*Total Pembayaran:* ${orderDetails.totalPayment || '-'}
*Durasi:* ${orderDetails.duration || '-'}
*Tanggal Mulai:* ${orderDetails.checkIn || '-'}
*Tanggal Selesai:* ${orderDetails.checkOut || '-'}
*Nama:* ${orderDetails.name || '-'}
*Telepon:* ${orderDetails.phone || '-'}

Saya sudah melakukan pembayaran. Mohon cek dan konfirmasi pesanan saya.
(Saya akan mengirimkan screenshot bukti pembayaran)`;
            
            // Simulate loading for 1 second then redirect to WhatsApp
            setTimeout(function() {
                const whatsappUrl = `https://wa.me/${ownerWhatsAppNumber}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                
                // Hide loading indicator after redirect
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            }, 1000);
        });
    }
    
    // --- Existing code for room selection if present ---
    const roomSelect = document.getElementById('room-selector');
    
    // Buat mapping harga default (bisa ditimpa lewat query params price_type::<key> atau price_<key>)
    const defaultPriceMap = {
        type1: safeNumber(urlParams.get('price_type1')) || safeNumber(urlParams.get('price_type')) || 800000,
        type2: safeNumber(urlParams.get('price_type2')) || safeNumber(urlParams.get('price2')) || 700000
    };
    
    function getPriceForKey(key) {
        if (!key) return safeNumber(roomPriceRaw) || 0;
        // normalisasi key
        const k = String(key).toLowerCase();
        if (defaultPriceMap[k] !== undefined) return defaultPriceMap[k];
        // coba ambil dari query param price_<key>
        const q = safeNumber(urlParams.get(`price_${k}`)) || safeNumber(urlParams.get(`price-${k}`));
        if (q) return q;
        return safeNumber(roomPriceRaw) || 0;
    }
    
    function updatePriceDisplayForSelection(selectedKey) {
        const dur = Number(durationParam) || 0;
        const perMonth = getPriceForKey(selectedKey);
        // tampilkan harga per bulan jika duration ada atau tampilkan total jika total param ada
        if (elRoomPrice) elRoomPrice.textContent = perMonth ? formatCurrencyNumber(perMonth) : '-';
        // recalc total: jika duration ada hitung perMonth * dur; jika totalParam explicitly diberikan tetap gunakan totalParam
        let newTotal = 0;
        if (totalParam) {
            newTotal = safeNumber(totalParam);
        } else if (perMonth && dur) {
            // asumsi perMonth adalah harga per bulan
            newTotal = perMonth * dur;
        } else {
            newTotal = perMonth;
        }
        if (elTotal) elTotal.textContent = newTotal ? formatCurrencyNumber(newTotal) : '-';
    }
    
    // jika ada select, isi value awal dan pasang listener
    if (roomSelect) {
        // existing code for room selection
    }
});