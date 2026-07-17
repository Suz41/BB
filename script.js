document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const ticketCard = document.getElementById('ticketCard');
    const copyBookingIdBtn = document.getElementById('copyBookingId');
    const shareBtn = document.getElementById('shareBtn');
    const closeBtn = document.getElementById('closeBtn');
    const watchTrailerBtn = document.getElementById('watchTrailerBtn');
    const posterContainer = document.getElementById('posterContainer');
    const trailerModal = document.getElementById('trailerModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const supportBannerBtn = document.getElementById('supportBannerBtn');
    const supportDrawer = document.getElementById('supportDrawer');
    const toast = document.getElementById('toast');
    const findVenueBtn = document.getElementById('findVenueBtn');

    // Drawer Actions
    const actionDownload = document.getElementById('actionDownload');
    const actionEmail = document.getElementById('actionEmail');
    const actionCancel = document.getElementById('actionCancel');
    const actionHelp = document.getElementById('actionHelp');

    // 1. Theme Toggle System
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        showToast(`Switched to ${newTheme} mode`);
    });

    // 2. Toast System
    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // 3. 3D Tilt Effect on Ticket Card (Desktop Only)
    if (window.innerWidth > 768) {
        ticketCard.addEventListener('mousemove', (e) => {
            const rect = ticketCard.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within element
            const y = e.clientY - rect.top;  // y position within element
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Calculate tilt angles (max 6 degrees)
            const rotateY = ((x - centerX) / centerX) * 6;
            const rotateX = -((y - centerY) / centerY) * 6;
            
            ticketCard.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
        });

        ticketCard.addEventListener('mouseleave', () => {
            ticketCard.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        });
    }

    // 4. Clipboard & Share System
    const bookingId = "T9AFDXQ";
    const shareText = "My Ticket: O' Romeo (Hindi, 2D) | Sat, 14 Feb @ 02:40 PM | PVR: Inorbit, Cyberabad | Booking ID: T9AFDXQ";

    copyBookingIdBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(bookingId)
            .then(() => showToast('Booking ID copied to clipboard!'))
            .catch(() => showToast('Failed to copy Booking ID'));
    });

    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: "Your Ticket - O' Romeo",
                text: shareText,
                url: window.location.href
            }).catch(() => {
                // User cancelled or share failed
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(shareText)
                .then(() => showToast('Ticket details copied for sharing!'))
                .catch(() => showToast('Sharing failed'));
        }
    });

    closeBtn.addEventListener('click', () => {
        showToast('Ticket closed (mock action)');
    });

    // 5. Cinematic Trailer Modal System
    function openTrailer() {
        trailerModal.classList.add('active');
        // Reset and play mock video progress animation
        const progress = document.querySelector('.progress-filled');
        progress.style.width = '0%';
        setTimeout(() => {
            progress.style.transition = 'width 10s linear';
            progress.style.width = '100%';
        }, 50);
    }

    function closeTrailer() {
        trailerModal.classList.remove('active');
        const progress = document.querySelector('.progress-filled');
        progress.style.transition = 'none';
        progress.style.width = '0%';
    }

    watchTrailerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTrailer();
    });

    posterContainer.addEventListener('click', () => {
        openTrailer();
    });

    modalCloseBtn.addEventListener('click', closeTrailer);
    trailerModal.addEventListener('click', (e) => {
        if (e.target === trailerModal) {
            closeTrailer();
        }
    });

    // Play/Pause button in video modal
    const playPauseBtn = document.querySelector('.btn-play-pause');
    let isPlaying = true;
    playPauseBtn.addEventListener('click', () => {
        const progress = document.querySelector('.progress-filled');
        if (isPlaying) {
            // Pause
            const computedStyle = window.getComputedStyle(progress);
            const currentWidth = computedStyle.width;
            const parentWidth = window.getComputedStyle(progress.parentElement).width;
            const percent = (parseFloat(currentWidth) / parseFloat(parentWidth)) * 100;
            progress.style.transition = 'none';
            progress.style.width = `${percent}%`;
            playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"></polygon></svg>';
            isPlaying = false;
        } else {
            // Play
            progress.style.transition = 'width 10s linear';
            progress.style.width = '100%';
            playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
            isPlaying = true;
        }
    });

    // 6. Action Drawer System
    function openDrawer() {
        supportDrawer.classList.add('active');
    }

    function closeDrawer() {
        supportDrawer.classList.remove('active');
    }

    supportBannerBtn.addEventListener('click', openDrawer);
    supportDrawer.addEventListener('click', (e) => {
        if (e.target === supportDrawer) {
            closeDrawer();
        }
    });

    // Drawer item click event handlers
    actionDownload.addEventListener('click', () => {
        closeDrawer();
        showToast('Preparing PDF download...');
        setTimeout(() => showToast('PDF ticket downloaded successfully!'), 1500);
    });

    actionEmail.addEventListener('click', () => {
        closeDrawer();
        showToast('Sending confirmation email...');
        setTimeout(() => showToast('Email sent to user@example.com!'), 1500);
    });

    actionCancel.addEventListener('click', () => {
        closeDrawer();
        const doubleCheck = confirm("Are you sure you want to cancel this ticket booking? Cancellation charges may apply.");
        if (doubleCheck) {
            showToast('Processing cancellation...');
            setTimeout(() => {
                showToast('Booking cancelled. Refund of ₹ 367.76 initiated!');
                ticketCard.style.opacity = '0.5';
                ticketCard.style.pointerEvents = 'none';
                findVenueBtn.style.opacity = '0.5';
                findVenueBtn.style.pointerEvents = 'none';
            }, 2000);
        }
    });

    actionHelp.addEventListener('click', () => {
        closeDrawer();
        showToast('Connecting to support desk...');
    });

    // 7. Find Venue
    findVenueBtn.addEventListener('click', () => {
        showToast('Opening directions to PVR Inorbit, Cyberabad...');
        setTimeout(() => {
            window.open('https://maps.google.com/?q=PVR+Inorbit+Cyberabad', '_blank');
        }, 1000);
    });
});
