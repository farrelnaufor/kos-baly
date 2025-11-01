document.addEventListener('DOMContentLoaded', function() {
    // Cek apakah pengguna sudah login
    checkAuthStatus();
    
    const loginForm = document.getElementById('login-form');
    
    // Referensi ke elemen notifikasi
    let notificationElement = document.querySelector('.notification');
    
    // Buat elemen notifikasi jika belum ada
    if (!notificationElement) {
        notificationElement = document.createElement('div');
        notificationElement.className = 'notification';
        document.querySelector('.form-container').appendChild(notificationElement);
    }
    
    // Fungsi untuk menampilkan notifikasi
    function showNotification(message, isError = false) {
        notificationElement.textContent = message;
        notificationElement.className = `notification ${isError ? 'error' : 'success'}`;
        notificationElement.style.display = 'block';
        
        // Sembunyikan notifikasi setelah 5 detik
        setTimeout(() => {
            notificationElement.style.display = 'none';
        }, 5000);
    }
    
    // Fungsi untuk memeriksa status autentikasi
    async function checkAuthStatus() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                // Pengguna sudah login, arahkan ke halaman utama
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            // Mencegah form melakukan reload halaman
            event.preventDefault();

            // Ambil nilai dari input
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Validasi input
            if (!email || !password) {
                showNotification('Email dan password harus diisi.', true);
                return;
            }
            
            try {
                // Tampilkan loading state
                const submitButton = loginForm.querySelector('.btn-submit');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Masuk...';
                submitButton.disabled = true;
                
                // Tampilkan informasi login untuk debugging
                console.log('Mencoba login dengan email:', email);
                
                // Validasi format email
                if (!email.includes('@') || !email.includes('.')) {
                    showNotification('Format email tidak valid', true);
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                    return;
                }
                
                // Validasi panjang password
                if (password.length < 6) {
                    showNotification('Password minimal 6 karakter', true);
                    submitButton.textContent = originalButtonText;
                    submitButton.disabled = false;
                    return;
                }
                
                // Login dengan Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                // Kembalikan button ke state awal
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
                // Log hasil login
                console.log('Hasil login:', data ? 'Berhasil' : 'Gagal', error ? error : '');
                
                if (error) {
                    // Pesan error yang lebih user-friendly
                    if (error.message.includes('Invalid login credentials')) {
                        showNotification('Email atau password salah. Pastikan Anda sudah terdaftar.', true);
                    } else {
                        showNotification(`Login gagal: ${error.message}`, true);
                    }
                    console.error('Error logging in:', error);
                    return;
                }
                
                // Jika login berhasil
                if (data && data.user) {
                    // Simpan informasi user ke localStorage
                    localStorage.setItem('userSession', JSON.stringify({
                        id: data.user.id,
                        email: data.user.email,
                        name: data.user.user_metadata?.full_name || 'Pengguna'
                    }));
                    
                    // Tampilkan pesan sukses
                    showNotification('Login berhasil! Anda akan diarahkan ke halaman utama.');
                    
                    // Arahkan pengguna kembali ke index.html setelah login berhasil
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                } else {
                    showNotification('Terjadi kesalahan saat login. Data pengguna tidak ditemukan.', true);
                }
            } catch (err) {
                showNotification(`Terjadi kesalahan: ${err.message}`, true);
                console.error('Unexpected error:', err);
            }
        });
    }
});