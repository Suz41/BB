document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('shareBtn');
    const closeBtn = document.getElementById('closeBtn');
    const watchTrailerBtn = document.querySelector('.watch-trailer-btn');
    const posterContainer = document.querySelector('.poster-art');
    const trailerModal = document.getElementById('trailerModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const supportBannerBtn = document.getElementById('supportBannerBtn');
    const supportDrawer = document.getElementById('supportDrawer');
    const toast = document.getElementById('toast');
    const actionDownload = document.getElementById('actionDownload');
    const actionEmail = document.getElementById('actionEmail');
    const actionCancel = document.getElementById('actionCancel');
    const actionHelp = document.getElementById('actionHelp');

    // Toast System
    let toastTimeout;
    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    // Share
    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: "Your Ticket - O' Romeo",
                text: "My Ticket: O' Romeo (Hindi, 2D) | Sat, 14 Feb @ 02:40 PM | PVR: Inorbit, Cyberabad | Booking ID: T9AFDXQ",
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText("My Ticket: O' Romeo (Hindi, 2D) | Sat, 14 Feb @ 02:40 PM | PVR: Inorbit, Cyberabad | Booking ID: T9AFDXQ")
                .then(() => showToast('Ticket details copied!'))
                .catch(() => showToast('Sharing failed'));
        }
    });

    // Close
    closeBtn.addEventListener('click', () => {
        showToast('Ticket closed');
    });

    // Trailer Modal
    function openTrailer() {
        trailerModal.classList.add('active');
    }

    function closeTrailer() {
        trailerModal.classList.remove('active');
    }

    watchTrailerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openTrailer();
    });

    posterContainer.addEventListener('click', openTrailer);
    modalCloseBtn.addEventListener('click', closeTrailer);
    trailerModal.addEventListener('click', (e) => {
        if (e.target === trailerModal) closeTrailer();
    });

    // Play/Pause
    const playPauseBtn = document.querySelector('.btn-play-pause');
    let isPlaying = false;
    playPauseBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playPauseBtn.innerHTML = isPlaying
            ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,3 20,12 6,21"></polygon></svg>';
    });

    // Support Drawer
    function openDrawer() {
        supportDrawer.classList.add('active');
    }

    function closeDrawer() {
        supportDrawer.classList.remove('active');
    }

    supportBannerBtn.addEventListener('click', openDrawer);
    supportDrawer.addEventListener('click', (e) => {
        if (e.target === supportDrawer) closeDrawer();
    });

    actionDownload.addEventListener('click', () => {
        closeDrawer();
        showToast('Preparing PDF download...');
        setTimeout(() => showToast('PDF ticket downloaded!'), 1500);
    });

    actionEmail.addEventListener('click', () => {
        closeDrawer();
        showToast('Sending confirmation email...');
        setTimeout(() => showToast('Email sent!'), 1500);
    });

    actionCancel.addEventListener('click', () => {
        closeDrawer();
        if (confirm("Cancel this booking? Cancellation charges may apply.")) {
            showToast('Processing cancellation...');
            setTimeout(() => showToast('Booking cancelled.'), 2000);
        }
    });

    actionHelp.addEventListener('click', () => {
        closeDrawer();
        showToast('Connecting to support...');
    });
});
