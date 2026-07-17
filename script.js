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
