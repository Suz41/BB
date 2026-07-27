"use strict";
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
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 2500);
        }
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
    // Dynamic Poster Image from URL query parameter
    const posterUrl = urlParams.get('poster') || urlParams.get('img');
    if (posterUrl) {
        const posterImgEl = document.querySelector('.poster-img');
        if (posterImgEl) {
            posterImgEl.src = posterUrl;
        }
    }
    // Generate dynamic QR code encoding the verification link
    let shareUrl = `${window.location.origin}${window.location.pathname}?id=${bookingId}`;
    if (posterUrl) {
        shareUrl += `&poster=${encodeURIComponent(posterUrl)}`;
    }
    const qrContainer = document.getElementById('qrContainer');
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: shareUrl,
            width: 80,
            height: 80,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
        const qrCanvas = qrContainer.querySelector('canvas');
        const qrImage = qrContainer.querySelector('img');
        if (qrCanvas) {
            qrCanvas.style.width = '100%';
            qrCanvas.style.height = '100%';
            qrCanvas.style.display = 'block';
            qrCanvas.style.imageRendering = 'pixelated';
        }
        if (qrImage) {
            qrImage.style.display = 'none';
        }
    }
    else {
        console.warn('QRCode library is undefined');
    }
    // Share
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareText = `My Ticket: Spider-Man: Brand New Day (English, 3D) | Thu, 30 Jul @ 08:00 AM | Prasads Multiplex: Hyderabad | Booking ID: ${bookingId}`;
            if (navigator.share) {
                navigator.share({
                    title: "Your Ticket - Spider-Man: Brand New Day",
                    text: shareText,
                    url: shareUrl
                }).catch(() => { });
            }
            else {
                navigator.clipboard.writeText(`${shareText} | Link: ${shareUrl}`)
                    .then(() => showToast('Ticket details copied!'))
                    .catch(() => showToast('Sharing failed'));
            }
        });
    }
    // Close
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            showToast('Ticket closed');
        });
    }
    // Support Drawer
    function openDrawer() {
        if (supportDrawer) {
            supportDrawer.classList.add('active');
        }
    }
    // Close Drawer
    function closeDrawer() {
        if (supportDrawer) {
            supportDrawer.classList.remove('active');
        }
    }
    if (supportBannerBtn) {
        supportBannerBtn.addEventListener('click', () => {
            openDrawer();
        });
    }
    if (supportDrawer) {
        supportDrawer.addEventListener('click', (e) => {
            if (e.target === supportDrawer)
                closeDrawer();
        });
    }
    if (actionDownload) {
        actionDownload.addEventListener('click', () => {
            closeDrawer();
            const ticketCard = document.querySelector('.ticket-card');
            if (ticketCard && typeof html2canvas !== 'undefined') {
                html2canvas(ticketCard, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                }).then((canvas) => {
                    const link = document.createElement('a');
                    link.download = `ticket-${bookingId}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    showToast('Ticket downloaded!');
                }).catch(() => {
                    showToast('Download failed');
                });
            }
        });
    }
    if (actionEmail) {
        actionEmail.addEventListener('click', () => {
            closeDrawer();
        });
    }
    if (actionCancel) {
        actionCancel.addEventListener('click', () => {
            closeDrawer();
        });
    }
    if (actionHelp) {
        actionHelp.addEventListener('click', () => {
            closeDrawer();
        });
    }
});
