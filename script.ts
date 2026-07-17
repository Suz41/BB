declare class QRCode {
    static CorrectLevel: {
        L: number;
        M: number;
        Q: number;
        H: number;
    };
    constructor(element: HTMLElement, options: {
        text: string;
        width?: number;
        height?: number;
        colorDark?: string;
        colorLight?: string;
        correctLevel?: number;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('shareBtn') as HTMLElement | null;
    const closeBtn = document.getElementById('closeBtn') as HTMLElement | null;
    const supportBannerBtn = document.getElementById('supportBannerBtn') as HTMLElement | null;
    const supportDrawer = document.getElementById('supportDrawer') as HTMLElement | null;
    const toast = document.getElementById('toast') as HTMLElement | null;
    const actionDownload = document.getElementById('actionDownload') as HTMLElement | null;
    const actionEmail = document.getElementById('actionEmail') as HTMLElement | null;
    const actionCancel = document.getElementById('actionCancel') as HTMLElement | null;
    const actionHelp = document.getElementById('actionHelp') as HTMLElement | null;

    // Toast System
    let toastTimeout: number | undefined;
    function showToast(message: string) {
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            if (toastTimeout) {
                clearTimeout(toastTimeout);
            }
            toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 2500) as unknown as number;
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
    const bookingIdEl = document.querySelector('.booking-id') as HTMLElement | null;
    if (bookingIdEl) {
        bookingIdEl.textContent = `BOOKING ID: ${bookingId}`;
    }

    // Generate dynamic QR code encoding the verification link
    const qrContainer = document.getElementById('qrContainer') as HTMLElement | null;
    const shareUrl = `${window.location.origin}${window.location.pathname}?id=${bookingId}`;
    
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: shareUrl,
            width: 100,
            height: 100,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
        const qrCanvas = qrContainer.querySelector('canvas') as HTMLCanvasElement | null;
        const qrImage = qrContainer.querySelector('img') as HTMLImageElement | null;
        if (qrCanvas) {
            qrCanvas.style.width = '100%';
            qrCanvas.style.height = '100%';
            qrCanvas.style.display = 'block';
            qrCanvas.style.imageRendering = 'pixelated';
        }
        if (qrImage) {
            qrImage.style.display = 'none';
        }
    } else {
        console.warn('QRCode library is undefined');
    }

    // Share
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const shareText = `My Ticket: The Odyssey (English, IMAX 2D) | Fri, 17 Jul @ 07:00 PM | PVR: Nexus, Koramangala | Booking ID: ${bookingId}`;
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

    function closeDrawer() {
        if (supportDrawer) {
            supportDrawer.classList.remove('active');
        }
    }

    if (supportBannerBtn) {
        supportBannerBtn.addEventListener('click', openDrawer);
    }
    if (supportDrawer) {
        supportDrawer.addEventListener('click', (e) => {
            if (e.target === supportDrawer) closeDrawer();
        });
    }

    if (actionDownload) {
        actionDownload.addEventListener('click', () => {
            closeDrawer();
            showToast('Preparing PDF download...');
            setTimeout(() => showToast('PDF ticket downloaded!'), 1500);
        });
    }

    if (actionEmail) {
        actionEmail.addEventListener('click', () => {
            closeDrawer();
            showToast('Sending confirmation email...');
            setTimeout(() => showToast('Email sent!'), 1500);
        });
    }

    if (actionCancel) {
        actionCancel.addEventListener('click', () => {
            closeDrawer();
            if (confirm("Cancel this booking? Cancellation charges may apply.")) {
                showToast('Processing cancellation...');
                setTimeout(() => showToast('Booking cancelled.'), 2000);
            }
        });
    }

    if (actionHelp) {
        actionHelp.addEventListener('click', () => {
            closeDrawer();
            showToast('Connecting to support...');
        });
    }
});
