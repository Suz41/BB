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
declare let html2canvas: any;

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

    // Dynamic Poster Image from URL query parameter
    const posterUrl = urlParams.get('poster') || urlParams.get('img');
    const posterImgEl = document.querySelector('.poster-img') as HTMLImageElement | null;
    if (posterUrl && posterImgEl) {
        posterImgEl.src = posterUrl;
    }

    // Generate dynamic QR code encoding the verification link
    let shareUrl = `${window.location.origin}${window.location.pathname}?id=${bookingId}`;
    if (posterUrl) {
        shareUrl += `&poster=${encodeURIComponent(posterUrl)}`;
    }

    const qrContainer = document.getElementById('qrContainer') as HTMLElement | null;

    // Helper to generate/regenerate QR Code
    function renderQRCode(text: string) {
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = '';
            new QRCode(qrContainer, {
                text: text,
                width: 80,
                height: 80,
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
            if (e.target === supportDrawer) closeDrawer();
        });
    }

    if (actionDownload) {
        actionDownload.addEventListener('click', () => {
            closeDrawer();
            const ticketCard = document.querySelector('.ticket-card') as HTMLElement | null;
            if (ticketCard && typeof html2canvas !== 'undefined') {
                html2canvas(ticketCard, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true
                }).then((canvas: HTMLCanvasElement) => {
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
