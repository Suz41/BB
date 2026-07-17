document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('shareBtn');
    const closeBtn = document.getElementById('closeBtn');
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

    // Booking ID Generation (uses ?id= param if present, else generates random one)
    const urlParams = new URLSearchParams(window.location.search);
    let bookingId = urlParams.get('id');
    if (!bookingId) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        bookingId = '';
        for (let i = 0; i < 7; i++) {
            bookingId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    }

    // Update booking ID in UI
    const bookingIdEl = document.querySelector('.booking-id');
    if (bookingIdEl) {
        bookingIdEl.textContent = `BOOKING ID: ${bookingId}`;
    }

    // Generate dynamic QR code encoding the verification link
    const qrContainer = document.getElementById('qrContainer');
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${bookingId}`;
    
    if (qrContainer && typeof QRCode !== 'undefined') {
        QRCode.toString(shareUrl, { type: 'svg', margin: 0 }, function (err, svgString) {
            if (err) {
                console.error(err);
            } else {
                qrContainer.innerHTML = svgString;
                const svgElement = qrContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.classList.add('qr-svg');
                    svgElement.setAttribute('shape-rendering', 'crispEdges');
                }
            }
        });
    }

    // Share
    shareBtn.addEventListener('click', () => {
        const shareText = `My Ticket: The Odyssey (English, IMAX 2D) | Thu, 23 Jul @ 07:00 PM | PVR: Nexus, Koramangala | Booking ID: ${bookingId}`;
        if (navigator.share) {
            navigator.share({
                title: "Your Ticket - The Odyssey",
                text: shareText,
                url: shareUrl
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(`${shareText} | Link: ${shareUrl}`)
                .then(() => showToast('Ticket details copied!'))
                .catch(() => showToast('Sharing failed'));
        }
    });

    // Close
    closeBtn.addEventListener('click', () => {
        showToast('Ticket closed');
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
