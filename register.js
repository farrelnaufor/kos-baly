document.addEventListener('DOMContentLoaded', function() {
    // Referensi ke form register
    const registerForm = document.getElementById('register-form');
    
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
    
    // Event listener untuk form register
    if (registerForm) {
        registerForm.addEventListener('submit', async function(event) {
            // Mencegah form melakukan reload halaman
            event.preventDefault();
            
            // Ambil nilai dari input
            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            
            // Validasi input
            if (!name || !email || !password || !confirmPassword) {
                showNotification('Semua field harus diisi', true);
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Password dan konfirmasi password tidak cocok', true);
                return;
            }
            
            try {
                // Tampilkan loading state
                const submitButton = registerForm.querySelector('.btn-submit');
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Mendaftar...';
                submitButton.disabled = true;
                
                // Daftarkan pengguna dengan Supabase
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name
                        }
                    }
                });
                
                // Kembalikan button ke state awal
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
                
                if (error) {
                    showNotification(`Pendaftaran gagal: ${error.message}`, true);
                    console.error('Error registering:', error);
                    return;
                }
                
                // Simpan data tambahan pengguna ke tabel profiles
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        { 
                            id: data.user.id,
                            full_name: name,
                            email: email
                        }
                    ]);
                
                if (profileError) {
                    console.error('Error saving profile:', profileError);
                    // Tetap lanjutkan karena user sudah terdaftar
                }
                
                // Tampilkan pesan sukses
                showNotification('Pendaftaran berhasil! Anda akan diarahkan ke halaman login.');
                
                // Arahkan ke halaman login setelah 2 detik
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (err) {
                showNotification(`Terjadi kesalahan: ${err.message}`, true);
                console.error('Unexpected error:', err);
            }
        });
    }
});