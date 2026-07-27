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
    const posterImgEl = document.querySelector('.poster-img');
    if (posterUrl && posterImgEl) {
        posterImgEl.src = posterUrl;
    }
    // Generate dynamic QR code encoding the verification link
    let shareUrl = `${window.location.origin}${window.location.pathname}?id=${bookingId}`;
    if (posterUrl) {
        shareUrl += `&poster=${encodeURIComponent(posterUrl)}`;
    }
    const qrContainer = document.getElementById('qrContainer');
    // Helper to generate/regenerate QR Code as vector SVG
    function renderQRCode(text) {
        if (qrContainer && typeof qrcode !== 'undefined') {
            qrContainer.innerHTML = '';
            // Create QR code using auto-detected version (0) and High error correction level (H)
            const qr = qrcode(0, 'H');
            qr.addData(text);
            qr.make();
            // Generate clean SVG markup (4px cell size, 0 margin, scalable vector format)
            const svgString = qr.createSvgTag({
                cellSize: 4,
                margin: 0,
                scalable: true
            });
            qrContainer.innerHTML = svgString;
            // Configure SVG elements to scale perfectly inside our container
            const svgEl = qrContainer.querySelector('svg');
            if (svgEl) {
                svgEl.setAttribute('width', '100%');
                svgEl.setAttribute('height', '100%');
                svgEl.style.display = 'block';
            }
        }
        else {
            console.warn('qrcode-generator library is undefined');
        }
    }
    // Initial QR Code render
    renderQRCode(shareUrl);
    // Allow user to click the poster to insert a custom poster URL
    if (posterImgEl) {
        posterImgEl.style.cursor = 'pointer';
        posterImgEl.title = 'Click to change poster image';
        posterImgEl.addEventListener('click', () => {
            const newPosterUrl = prompt('Enter a custom poster image URL:');
            if (newPosterUrl !== null) {
                const trimmedUrl = newPosterUrl.trim();
                if (trimmedUrl) {
                    posterImgEl.src = trimmedUrl;
                    // Update URL in address bar without reloading
                    const params = new URLSearchParams(window.location.search);
                    params.set('poster', trimmedUrl);
                    const newRelativePathQuery = `${window.location.pathname}?${params.toString()}`;
                    history.replaceState(null, '', newRelativePathQuery);
                    // Update shareUrl and regenerate QR Code
                    shareUrl = `${window.location.origin}${newRelativePathQuery}`;
                    renderQRCode(shareUrl);
                    showToast('Poster updated! Copy browser URL to share.');
                }
            }
        });
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
            if (ticketCard && typeof html2canvas !== 'undefined' && typeof jspdf !== 'undefined') {
                html2canvas(ticketCard, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                }).then((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    const { jsPDF } = jspdf;
                    // Set standard width for PDF in mm, and scale height proportionally
                    const imgWidth = 80;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    const pdf = new jsPDF({
                        orientation: 'p',
                        unit: 'mm',
                        format: [imgWidth, imgHeight]
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                    pdf.save(`ticket-${bookingId}.pdf`);
                    showToast('PDF Ticket downloaded!');
                }).catch((err) => {
                    console.error('PDF generation failed:', err);
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
