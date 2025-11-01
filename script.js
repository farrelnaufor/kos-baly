document.addEventListener('DOMContentLoaded', function () {
    // Data kamar
    const roomData = {
        type1: { name: 'Kamar Type 1', price: 'Rp 800.000', priceValue: 800000, image: 'https://picsum.photos/seed/kamar1/1200/600.jpg', type: 'type1' },
        type2: { name: 'Kamar Type 2', price: 'Rp 700.000', priceValue: 700000, image: 'https://picsum.photos/seed/kamar2/1200/600.jpg', type: 'type2' }
    };

    // Cached elements
    const checkInEl = document.getElementById('check-in');
    const checkOutEl = document.getElementById('check-out');
    const roomSelectorEl = document.getElementById('room-selector');
    const roomCards = Array.from(document.querySelectorAll('.room-card'));
    const durationEl = document.getElementById('duration');
    const totalPriceEl = document.getElementById('total-price');
    const roomTypeEl = document.getElementById('room-type');
    const roomPriceEl = document.getElementById('price-value'); // perbaikan: sesuai id di index.html
    const heroSection = document.getElementById('hero');
    const btnBookNow = document.getElementById('btn-book-now');
    const btnWriteReview = document.querySelector('.btn-write-review');
    
    // Review button - hanya tampilkan untuk user yang login
    if (btnWriteReview) {
        // Cek status login
        const checkLoginStatus = async () => {
            try {
                // Pastikan supabase sudah dimuat
                if (typeof supabase === 'undefined') {
                    console.log('Menunggu Supabase dimuat...');
                    setTimeout(checkLoginStatus, 500);
                    return;
                }
                
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    // User sudah login, tampilkan tombol
                    btnWriteReview.style.display = 'block';
                    btnWriteReview.addEventListener('click', function() {
                        window.location.href = 'review.html';
                    });
                } else {
                    // User belum login, sembunyikan tombol atau tampilkan pesan login
                    btnWriteReview.style.display = 'none';
                    
                    // Tambahkan pesan login jika diperlukan
                    const reviewsSection = document.querySelector('.reviews-section');
                    if (reviewsSection) {
                        const loginMessage = document.createElement('div');
                        loginMessage.className = 'login-message';
                        loginMessage.innerHTML = '<p>Silakan <a href="login.html">login</a> untuk memberikan ulasan</p>';
                        loginMessage.style.textAlign = 'center';
                        loginMessage.style.margin = '20px 0';
                        reviewsSection.appendChild(loginMessage);
                    }
                }
            } catch (error) {
                console.error('Error checking login status:', error);
            }
        };
        
        // Panggil fungsi cek login
        checkLoginStatus();
    }
    
    // Load reviews on index page
    async function loadReviews() {
        try {
            // Check if we're on the index page with reviews section
            const reviewsSection = document.querySelector('.reviews-section');
            if (!reviewsSection) return;
            
            // Ensure Supabase is loaded
            if (!window.supabase && typeof supabase === 'undefined') {
                console.log('Supabase belum dimuat, mencoba memuat script...');
                // Load Supabase if not already loaded
                const supabaseJsScript = document.createElement('script');
                supabaseJsScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                document.head.appendChild(supabaseJsScript);
                
                const supabaseScript = document.createElement('script');
                supabaseScript.src = 'supabaseClient.js';
                document.head.appendChild(supabaseScript);
                
                // Load reviewsApi if not already loaded
                const reviewsApiScript = document.createElement('script');
                reviewsApiScript.src = 'reviewsApi.js';
                document.head.appendChild(reviewsApiScript);
                
                // Wait for scripts to load
                setTimeout(loadReviews, 1500);
                return;
            }
            
            // Load the supabase client if not already loaded
            if (typeof supabase === 'undefined' && typeof supabaseClient !== 'undefined') {
                supabase = supabaseClient;
            }
            
            console.log('Memuat ulasan...');
            
            // Load reviews API if not already loaded
            if (typeof reviewsApi === 'undefined') {
                // Create a simple implementation if the API isn't available
                window.reviewsApi = {
                    async getReviews() {
                        try {
                            const { data, error } = await supabase
                                .from('reviews')
                                .select('*')
                                .order('created_at', { ascending: false });
                                
                            if (error) throw error;
                            return { success: true, data };
                        } catch (error) {
                            console.error('Error fetching reviews:', error);
                            return { success: false, error, data: [] };
                        }
                    },
                    calculateAverageRating(reviews) {
                        if (!reviews || reviews.length === 0) return 0;
                        const sum = reviews.reduce((total, review) => total + parseInt(review.rating), 0);
                        return (sum / reviews.length).toFixed(1);
                    }
                };
            }
            
            // Get reviews from API
            const result = await reviewsApi.getReviews();
            if (!result.success) {
                console.error('Gagal memuat ulasan:', result.error);
                return;
            }
            
            const reviews = result.data;
            console.log('Ulasan berhasil dimuat:', reviews);
            
            // Update average rating
            const avgRating = reviewsApi.calculateAverageRating(reviews);
            const ratingValueEl = document.querySelector('.rating-value');
            if (ratingValueEl) {
                ratingValueEl.textContent = avgRating;
            }
            
            // Clear existing reviews except the header and button
            const reviewItems = Array.from(document.querySelectorAll('.review-item'));
            reviewItems.forEach(item => item.remove());
            
            // Get references to where we'll insert reviews
            const reviewsHeader = document.querySelector('.reviews-header');
            const writeReviewBtn = document.querySelector('.btn-write-review');
            
            // Add reviews to the page
            if (reviews && reviews.length > 0) {
                reviews.slice(0, 5).forEach(review => {
                    const reviewEl = createReviewElement(review);
                    reviewsSection.insertBefore(reviewEl, writeReviewBtn);
                });
            } else {
                const noReviewsEl = document.createElement('div');
                noReviewsEl.className = 'no-reviews';
                noReviewsEl.textContent = 'Belum ada ulasan. Jadilah yang pertama memberikan ulasan!';
                reviewsSection.insertBefore(noReviewsEl, writeReviewBtn);
            }
        } catch (error) {
            console.error('Error loading reviews:', error);
        }
    }
    
    // Helper function to create a review element
    function createReviewElement(review) {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item';
        
        // Format date
        const reviewDate = new Date(review.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - reviewDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let dateText;
        if (diffDays < 7) {
            dateText = diffDays + ' hari yang lalu';
        } else if (diffDays < 30) {
            dateText = Math.floor(diffDays / 7) + ' minggu yang lalu';
        } else {
            dateText = Math.floor(diffDays / 30) + ' bulan yang lalu';
        }
        
        // Create avatar initial
        const initial = review.name ? review.name.charAt(0).toUpperCase() : 'A';
        
        // Create stars based on rating
        const rating = parseInt(review.rating) || 5;
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        
        reviewEl.innerHTML = `
            <div class="review-header">
                <div class="reviewer-info">
                    <div class="reviewer-avatar">${initial}</div>
                    <div>
                        <div class="reviewer-name">${review.name}</div>
                        <div class="review-date">${dateText}</div>
                    </div>
                </div>
                <div class="review-rating">
                    ${starsHtml}
                </div>
            </div>
            <div class="review-content">
                ${review.review}
            </div>
        `;
        
        return reviewEl;
    }
    
    // Load reviews when page loads
    loadReviews();

    // Helpers
    function setMinDateInputs() {
        const today = new Date();
        const isoToday = today.toISOString().split('T')[0];
        if (checkInEl) checkInEl.min = isoToday;
        if (checkOutEl) checkOutEl.min = isoToday;
    }
    setMinDateInputs();

    function normalizeRoomKey(key) {
        if (!key) return 'type1';
        return roomData[key] ? key : 'type1';
    }

    function renderRoomUI(roomKey) {
        roomKey = normalizeRoomKey(roomKey);
        const room = roomData[roomKey];
        if (!room) return;
        // highlight card
        roomCards.forEach(c => c.classList.toggle('selected', c.dataset.room === roomKey));
        // sync hidden select
        if (roomSelectorEl) roomSelectorEl.value = roomKey;
        // update header/price/hero
        if (roomTypeEl) roomTypeEl.textContent = room.name; // Update room type display
        if (roomPriceEl) roomPriceEl.textContent = room.price; // Update room price display
        if (heroSection) heroSection.style.backgroundImage = `url(${room.image})`; // Update hero image

        const selectedRoomEl = document.getElementById('selected-room');
        if (selectedRoomEl) selectedRoomEl.textContent = room.name;
    }

    function getSelectedRoomKey() {
        const selectedCard = document.querySelector('.room-card.selected');
        const cardKey = selectedCard && selectedCard.dataset.room ? selectedCard.dataset.room : null;
        const selectKey = roomSelectorEl && roomSelectorEl.value ? roomSelectorEl.value : null;
        if (cardKey) {
            if (roomSelectorEl && roomSelectorEl.value !== cardKey) roomSelectorEl.value = cardKey;
            return normalizeRoomKey(cardKey);
        }
        if (selectKey) return normalizeRoomKey(selectKey);
        return 'type1';
    }

    function parseDateLocal(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    // calculate months: same-day or <1 month => 1
    // Jan15 -> Feb14 = 1 ; Jan15 -> Feb16 = 2
    function calculateMonths(checkInDate, checkOutDate) {
        if (!checkInDate || !checkOutDate || checkOutDate < checkInDate) return 0;
        let months = (checkOutDate.getFullYear() - checkInDate.getFullYear()) * 12;
        months += checkOutDate.getMonth() - checkInDate.getMonth();
        // add 1 month only if checkout day > checkin day
        if (checkOutDate.getDate() > checkInDate.getDate()) months += 1;
        return Math.max(1, months);
    }

    function formatCurrency(value) {
        return `Rp ${value.toLocaleString('id-ID')}`;
    }

    function calculateAndRender() {
        // ensure selected room is normalized and UI consistent
        const roomKey = getSelectedRoomKey();
        renderRoomUI(roomKey);

        const checkInStr = checkInEl ? checkInEl.value : '';
        const checkOutStr = checkOutEl ? checkOutEl.value : '';
        const checkIn = parseDateLocal(checkInStr);
        const checkOut = parseDateLocal(checkOutStr);
        const room = roomData[roomKey] || roomData['type1'];

        if (!checkInStr || !checkOutStr) {
            if (durationEl) durationEl.textContent = '0 Bulan';
            if (totalPriceEl) totalPriceEl.textContent = formatCurrency(0);
            return null;
        }

        if (checkOut < checkIn) {
            if (durationEl) durationEl.textContent = 'Tanggal tidak valid';
            if (totalPriceEl) totalPriceEl.textContent = formatCurrency(0);
            return null;
        }

        const months = calculateMonths(checkIn, checkOut);
        const totalPrice = room.priceValue * months;

        if (durationEl) {
            durationEl.textContent = `${months} Bulan`;
            durationEl.style.transform = 'scale(1.03)';
            setTimeout(() => durationEl.style.transform = '', 120);
        }
        if (totalPriceEl) {
            totalPriceEl.textContent = formatCurrency(totalPrice);
            totalPriceEl.style.transform = 'scale(1.03)';
            setTimeout(() => totalPriceEl.style.transform = '', 120);
        }

        return { months, totalPrice };
    }

    // Event bindings
    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            const key = normalizeRoomKey(card.dataset.room);
            renderRoomUI(key);
            calculateAndRender();
        });
    });

    if (roomSelectorEl) {
        roomSelectorEl.addEventListener('change', (e) => {
            const key = normalizeRoomKey(e.target.value);
            renderRoomUI(key);
            calculateAndRender();
        });
    }

    if (checkInEl) checkInEl.addEventListener('change', calculateAndRender);
    if (checkOutEl) checkOutEl.addEventListener('change', calculateAndRender);

    // initial render + calc
    const urlParams = new URLSearchParams(window.location.search);
    const initialRoomRaw = urlParams.get('room') || urlParams.get('room_type') || (roomSelectorEl ? roomSelectorEl.value : 'type1');
    const initialRoom = normalizeRoomKey(initialRoomRaw);
    renderRoomUI(initialRoom);
    setTimeout(calculateAndRender, 80);

    // Book now handler -> redirect to payment.html with params
    if (btnBookNow) {
        btnBookNow.addEventListener('click', function (e) {
            e.preventDefault();
            const res = calculateAndRender();
            if (!res) {
                alert('Periksa pilihan kamar dan tanggal sewa.');
                return;
            }
            const roomKey = getSelectedRoomKey();
            const room = roomData[roomKey];
            const checkInStr = checkInEl ? checkInEl.value : '';
            const checkOutStr = checkOutEl ? checkOutEl.value : '';
            const params = new URLSearchParams({
                room_type: room.name,
                price: res.totalPrice.toString(),
                check_in: checkInStr,
                check_out: checkOutStr,
                duration: res.months.toString()
            });
            window.location.href = `payment.html?${params.toString()}`;
        });
    }
});