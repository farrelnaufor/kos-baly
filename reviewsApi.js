// reviewsApi.js - API functions for reviews
const reviewsApi = {
    // Get all reviews
    getReviews: async function() {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching reviews:', error);
                return { success: false, error: error.message, data: [] };
            }
            
            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Exception in getReviews:', err);
            return { success: false, error: err.message, data: [] };
        }
    },
    
    // Add a new review
    addReview: async function(reviewData) {
        try {
            // Cek apakah user sudah login
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                return { success: false, error: 'Anda harus login untuk memberikan ulasan' };
            }
            
            // Pastikan user_id ada
            if (!reviewData.user_id) {
                reviewData.user_id = user.id;
            }
            
            // Tambahkan timestamp
            const reviewWithTimestamp = {
                ...reviewData,
                created_at: new Date().toISOString()
            };
            
            console.log('Mengirim data ke Supabase:', reviewWithTimestamp);
            
            // Insert data
            const { data, error } = await supabase
                .from('reviews')
                .insert([reviewWithTimestamp]);
                
            if (error) {
                console.error('Error adding review:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (err) {
            console.error('Exception in addReview:', err);
            return { success: false, error: err.message };
        }
    },
    
    // Get reviews by user ID
    getUserReviews: async function(userId) {
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching user reviews:', error);
                return { success: false, error: error.message, data: [] };
            }
            
            return { success: true, data: data || [] };
        } catch (err) {
            console.error('Exception in getUserReviews:', err);
            return { success: false, error: err.message, data: [] };
        }
    },
    
    // Calculate average rating
    calculateAverageRating: function(reviews) {
        if (!reviews || reviews.length === 0) {
            return 0;
        }
        
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }
};