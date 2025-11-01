// review.js - Handles review form submission with authentication
document.addEventListener('DOMContentLoaded', function() {
    const authContainer = document.getElementById('auth-container');
    const loginTemplate = document.getElementById('login-required-template');
    const reviewFormTemplate = document.getElementById('review-form-template');
    
    // Check if user is logged in
    async function checkAuth() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error || !user) {
                // User not logged in, show login required message
                authContainer.innerHTML = loginTemplate.innerHTML;
                return null;
            }
            
            // User is logged in, show review form
            authContainer.innerHTML = reviewFormTemplate.innerHTML;
            
            // Get user profile data
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single();
                
            // Set user name in the form
            const userNameElement = document.getElementById('logged-user-name');
            if (userNameElement) {
                userNameElement.textContent = profile && profile.full_name ? profile.full_name : user.email;
            }
            
            // Setup review form submission
            setupReviewForm(user);
            
            return user;
        } catch (err) {
            console.error('Error checking authentication:', err);
            authContainer.innerHTML = loginTemplate.innerHTML;
            return null;
        }
    }
    
    // Setup review form submission with user data
    function setupReviewForm(user) {
        const reviewForm = document.getElementById('reviewForm');
        
        if (reviewForm) {
            reviewForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                try {
                    const ratingElement = document.querySelector('input[name="rating"]:checked');
                    
                    if (!ratingElement) {
                        alert('Silakan pilih rating terlebih dahulu');
                        return;
                    }
                    
                    const rating = ratingElement.value;
                    const review = document.getElementById('review').value;
                    
                    console.log('Mengirim ulasan:', { rating, review });
                    
                    // Pastikan supabase sudah diinisialisasi
                    if (!window.supabase) {
                        console.error('Supabase client belum diinisialisasi');
                        alert('Terjadi kesalahan koneksi. Silakan muat ulang halaman dan coba lagi.');
                        return;
                    }
                    
                    // Get user profile for name
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name')
                        .eq('id', user.id)
                        .single();
                    
                    const name = profile && profile.full_name ? profile.full_name : user.email;
                    
                    const result = await reviewsApi.addReview({
                        user_id: user.id,
                        name,
                        rating: parseInt(rating),
                        review
                    });
                    
                    if (result.success) {
                        alert('Terima kasih! Ulasan Anda telah berhasil dikirim.');
                        window.location.href = 'index.html';
                    } else {
                        console.error('Gagal mengirim ulasan:', result.error);
                        alert('Maaf, terjadi kesalahan saat mengirim ulasan: ' + result.error);
                    }
                } catch (error) {
                    console.error('Error pada form ulasan:', error);
                    alert('Terjadi kesalahan: ' + error.message);
                }
            });
        }
    }
    
    // Initialize authentication check
    checkAuth();
});