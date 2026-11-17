"use strict";
document.addEventListener('DOMContentLoaded', () => {
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

    // Booking ID Generation
    const urlParams = new URLSearchParams(window.location.search);
    let bookingId = urlParams.get('id');
    if (!bookingId) {
        bookingId = 'ET00513508';
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

    // Generate dynamic QR code encoding booking details
    let shareUrl = `https://in.bookmyshow.com/order-summary/ET00513508/PVFF?bookingId=${bookingId}`;
    const qrContainer = document.getElementById('qrContainer');

    // Helper to generate/regenerate QR Code as vector SVG
    function renderQRCode(text) {
        if (qrContainer && typeof qrcode !== 'undefined') {
            qrContainer.innerHTML = '';
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            const svgString = qr.createSvgTag({
                cellSize: 4,
                margin: 1,
                scalable: true
            });
            qrContainer.innerHTML = svgString;
            const svgEl = qrContainer.querySelector('svg');
            if (svgEl) {
                svgEl.setAttribute('width', '100%');
                svgEl.setAttribute('height', '100%');
                svgEl.style.display = 'block';
            }
        } else {
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
                    const params = new URLSearchParams(window.location.search);
                    params.set('poster', trimmedUrl);
                    const newRelativePathQuery = `${window.location.pathname}?${params.toString()}`;
                    history.replaceState(null, '', newRelativePathQuery);
                    shareUrl = `${window.location.origin}${newRelativePathQuery}`;
                    renderQRCode(shareUrl);
                    showToast('Poster updated! Copy browser URL to share.');
                }
            }
        });
    }

    // Allow user to click QR code container to change QR data/url
    if (qrContainer) {
        qrContainer.style.cursor = 'pointer';
        qrContainer.title = 'Click to edit QR Code content';
        qrContainer.addEventListener('click', () => {
            const newQrText = prompt('Enter new URL or text for the QR code:', shareUrl);
            if (newQrText !== null && newQrText.trim() !== '') {
                shareUrl = newQrText.trim();
                renderQRCode(shareUrl);
                showToast('QR Code updated!');
            }
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
        actionEmail.addEventListener('click', closeDrawer);
    }
    if (actionCancel) {
        actionCancel.addEventListener('click', closeDrawer);
    }
    if (actionHelp) {
        actionHelp.addEventListener('click', closeDrawer);
    }

    // ==========================================
    // BookMyShow Auto-Fill & TMDB Integration
    // ==========================================
    const TMDB_KEY = '8196a17676681ce722aaab7098785c6b';
    const TMDB_BASE = 'https://api.themoviedb.org/3';
    const IMG_BASE = 'https://image.tmdb.org/t/p/w500';

    const LANG_MAP = {
        'kn': 'Kannada', 'hi': 'Hindi', 'te': 'Telugu', 'ta': 'Tamil',
        'ml': 'Malayalam', 'en': 'English', 'mr': 'Marathi', 'bn': 'Bengali',
        'pa': 'Punjabi', 'gu': 'Gujarati', 'ja': 'Japanese', 'ko': 'Korean',
        'es': 'Spanish', 'fr': 'French'
    };

    // Modal Elements
    const btnOpenAutoFill = document.getElementById('btnOpenAutoFill');
    const actionAutoFillDrawer = document.getElementById('actionAutoFillDrawer');
    const autoFillModal = document.getElementById('autoFillModal');
    const btnCloseAutoFill = document.getElementById('btnCloseAutoFill');
    const bmsInput = document.getElementById('bmsInput');
    const btnFetchDetails = document.getElementById('btnFetchDetails');
    const fetchStatusMsg = document.getElementById('fetchStatusMsg');

    // "Now Showing at Cinema" elements
    const nowShowingBox = document.getElementById('nowShowingBox');
    const nowShowingPills = document.getElementById('nowShowingPills');

    // Preview Card Elements
    const previewCard = document.getElementById('previewCard');
    const previewPosterImg = document.getElementById('previewPosterImg');
    const previewTitle = document.getElementById('previewTitle');
    const previewMeta = document.getElementById('previewMeta');
    const previewVenue = document.getElementById('previewVenue');
    const previewDate = document.getElementById('previewDate');
    const modalFormFields = document.getElementById('modalFormFields');

    // Form inputs
    const fieldTitle = document.getElementById('fieldTitle');
    const selectCity = document.getElementById('selectCity');
    const selectTheater = document.getElementById('selectTheater');
    const fieldVenue = document.getElementById('fieldVenue');
    const fieldScreen = document.getElementById('fieldScreen');
    const screenChipsContainer = document.getElementById('screenChips');
    const fieldMeta = document.getElementById('fieldMeta');
    const fieldTime = document.getElementById('fieldTime');
    const fieldSeats = document.getElementById('fieldSeats');
    const fieldBookingId = document.getElementById('fieldBookingId');
    const fieldPrice = document.getElementById('fieldPrice');
    const btnApplyDetails = document.getElementById('btnApplyDetails');

    let currentFetchedData = null;
    let cachedNowPlaying = [];

    // ==========================================
    // Indian Cinema Venues Database (Clean BookMyShow Format)
    // ==========================================
    const THEATERS_DB = {
        bengaluru: {
            name: 'Bengaluru',
            language: 'Kannada',
            theaters: [
                {
                    id: 'PVFF',
                    name: 'PVR: Nexus, Koramangala',
                    slugs: ['pvr-nexus-koramangala', 'pvr-nexus-formerly-forum-mall-koramangala-bengaluru', 'pvr-forum-mall-koramangala', 'nexus-koramangala'],
                    keywords: ['koramangala', 'forum mall', 'nexus mall koramangala', 'forum koramangala', 'nexus koramangala'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (IMAX)', 'AUDI 6 (P[XL])'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVVG',
                    name: 'PVR: Vega City, Bannerghatta Road',
                    slugs: ['pvr-vega-city-bannerghatta-road', 'pvr-vega-city-mall-bannerghatta-road', 'vega-city-bannerghatta'],
                    keywords: ['vega city', 'bannerghatta'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVOR',
                    name: 'PVR: Orion Mall, Rajajinagar',
                    slugs: ['pvr-orion-mall-dr-rajkumar-road', 'pvr-orion-mall-rajajinagar', 'orion-mall'],
                    keywords: ['orion mall', 'rajajinagar'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (P[XL])'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVPH',
                    name: 'PVR: Phoenix Marketcity, Whitefield',
                    slugs: ['pvr-phoenix-marketcity-whitefield', 'phoenix-marketcity-whitefield'],
                    keywords: ['marketcity whitefield', 'whitefield', 'phoenix marketcity bengaluru'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'INMN',
                    name: 'INOX: Mantri Square, Malleshwaram',
                    slugs: ['inox-mantri-square-mall-malleswaram', 'inox-mantri-square-mall'],
                    keywords: ['mantri square', 'malleshwaram', 'sampige'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (Insignia)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'CNRN',
                    name: 'Cinépolis: Royal Meenakshi, Hulimavu',
                    slugs: ['cinepolis-royal-meenakshi-mall-hulimavu', 'cinepolis-royal-meenakshi-mall'],
                    keywords: ['royal meenakshi', 'meenakshi mall', 'hulimavu'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'VIP AUDI 1'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        mumbai: {
            name: 'Mumbai',
            language: 'Hindi',
            theaters: [
                {
                    id: 'PVLP',
                    name: 'PVR: Phoenix Palladium, Lower Parel',
                    slugs: ['pvr-phoenix-palladium-lower-parel', 'pvr-phoenix-mills-lower-parel', 'phoenix-palladium-lower-parel'],
                    keywords: ['palladium', 'lower parel', 'phoenix mills'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'INMM',
                    name: 'INOX: Inorbit Mall, Malad',
                    slugs: ['inox-megaplex-inorbit-mall-malad', 'inox-inorbit-mall-malad'],
                    keywords: ['inorbit malad', 'malad', 'megaplex malad'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'AUDI 2 (ScreenX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVMB',
                    name: 'PVR Maison: Jio World Drive, BKC',
                    slugs: ['pvr-maison-jio-world-drive-bkc', 'pvr-jio-world-drive-bkc', 'jio-world-drive'],
                    keywords: ['jio world', 'bkc', 'maison'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'Maison House 1'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'CNEV',
                    name: 'Cinépolis: Viviana Mall, Thane',
                    slugs: ['cinepolis-viviana-mall-thane', 'viviana-mall-thane'],
                    keywords: ['viviana', 'thane'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVEC',
                    name: 'PVR: Oberoi Mall, Goregaon',
                    slugs: ['pvr-ecx-oberoi-mall-goregaon', 'pvr-icon-oberoi-mall-goregaon', 'oberoi-mall'],
                    keywords: ['oberoi mall', 'goregaon'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (P[XL])'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'INNR',
                    name: 'INOX: R City Mall, Ghatkopar',
                    slugs: ['inox-insignia-at-r-city-ghatkopar', 'inox-r-city-ghatkopar', 'r-city-mall'],
                    keywords: ['r city', 'ghatkopar'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (Insignia)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        delhi: {
            name: 'Delhi-NCR',
            language: 'Hindi',
            theaters: [
                {
                    id: 'PVVD',
                    name: 'PVR: Vegas Mall, Dwarka',
                    slugs: ['pvr-vegas-mall-dwarka', 'pvr-vegas-dwarka', 'vegas-mall-dwarka'],
                    keywords: ['vegas', 'dwarka'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVPA',
                    name: 'PVR: Select CITYWALK, Saket',
                    slugs: ['pvr-select-citywalk-saket', 'select-citywalk-saket'],
                    keywords: ['citywalk', 'saket'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'Gold Class 1'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVMO',
                    name: 'PVR: Mall of India, Noida',
                    slugs: ['pvr-mall-of-india-noida', 'pvr-dlf-mall-of-india-noida', 'dlf-mall-of-india'],
                    keywords: ['mall of india', 'noida sector 18', 'dlf noida'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'INAM',
                    name: 'INOX: Ambience Mall, Gurugram',
                    slugs: ['inox-ambience-mall-gurugram', 'inox-ambience-mall-gurgaon', 'ambience-mall-gurgaon'],
                    keywords: ['ambience mall', 'gurugram', 'gurgaon'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (BigPix)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVPR',
                    name: 'PVR Plaza: Connaught Place',
                    slugs: ['pvr-plaza-connaught-place', 'pvr-plaza-cp', 'plaza-cp'],
                    keywords: ['plaza cp', 'connaught place', 'plaza connaught'],
                    screens: ['AUDI 1', 'AUDI 2'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVAP',
                    name: 'PVR Priya: Vasant Vihar',
                    slugs: ['pvr-priya-vasant-vihar', 'pvr-priya-cinema-vasant-vihar', 'priya-vasant-vihar'],
                    keywords: ['priya vasant vihar', 'vasant vihar', 'basant lok'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 1 (P[XL])'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        hyderabad: {
            name: 'Hyderabad',
            language: 'Telugu',
            theaters: [
                {
                    id: 'PRAS',
                    name: 'Prasads Multiplex, Hyderabad',
                    slugs: ['prasads-multiplex-ntr-gardens', 'prasads-multiplex-hyderabad', 'prasads-imax-hyderabad', 'prasads-multiplex'],
                    keywords: ['prasads', 'ntr gardens', 'necklace road', 'khairatabad'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4', 'AUDI 1 (Large Screen PCX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'AMB',
                    name: 'AMB Cinemas: Gachibowli, Hyderabad',
                    slugs: ['amb-cinemas-gachibowli', 'amb-cinemas-sarath-city-capital-mall', 'amb-cinemas'],
                    keywords: ['amb cinemas', 'gachibowli', 'sarath city', 'amb'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'Screen 1 (Laser VIP)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVIN',
                    name: 'PVR: Inorbit Mall, Cyberabad',
                    slugs: ['pvr-inorbit-mall-cyberabad', 'pvr-inorbit-mall-madhapur', 'inorbit-mall-hyderabad'],
                    keywords: ['inorbit cyberabad', 'inorbit hyderabad', 'hitec city', 'madhapur'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVIH',
                    name: 'PVR: Next Galleria, Irrum Manzil',
                    slugs: ['pvr-irrum-manzil-mall', 'pvr-next-galleria-irrum-manzil'],
                    keywords: ['irrum manzil', 'punjagutta', 'next galleria'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'APAR',
                    name: 'Aparna Cinemas: Nallagandla',
                    slugs: ['aparna-cinemas-nalagandla', 'aparna-cinemas-nallagandla'],
                    keywords: ['aparna', 'nallagandla'],
                    screens: ['AUDI 1', 'AUDI 2', 'Screen 1 4K'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        chennai: {
            name: 'Chennai',
            language: 'Tamil',
            theaters: [
                {
                    id: 'PVPL',
                    name: 'PVR Palazzo: Nexus Vijaya, Vadapalani',
                    slugs: ['pvr-palazzo-nexus-vijaya-mall-vadapalani', 'palazzo-nexus-vijaya-mall', 'palazzo-chennai'],
                    keywords: ['palazzo', 'nexus vijaya', 'vadapalani'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'Palazzo 1 (IMAX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'SPIE',
                    name: 'PVR Sathyam: Royapettah',
                    slugs: ['sathyam-cinemas-royapettah', 'pvr-sathyam-royapettah', 'sathyam-cinemas'],
                    keywords: ['sathyam', 'royapettah', 'sathyam cinemas'],
                    screens: ['AUDI 1', 'AUDI 2', 'Sathyam Main Screen'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'INMC',
                    name: 'INOX: The Marina Mall, OMR',
                    slugs: ['inox-marina-mall-omr', 'inox-the-marina-mall'],
                    keywords: ['marina mall', 'omr', 'egattur'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (BigPix)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVGM',
                    name: 'PVR: Grand Mall, Velachery',
                    slugs: ['pvr-grand-mall-velachery', 'grand-mall-velachery'],
                    keywords: ['grand mall velachery', 'velachery'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        kolkata: {
            name: 'Kolkata',
            language: 'Bengali',
            theaters: [
                {
                    id: 'INSC',
                    name: 'INOX: South City Mall, Kolkata',
                    slugs: ['inox-south-city-mall', 'south-city-mall-kolkata', 'south-city-inox'],
                    keywords: ['south city', 'jadavpur', 'anwar shah'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'INQM',
                    name: 'INOX: Quest Mall, Kolkata',
                    slugs: ['inox-quest-mall-park-circus', 'quest-mall-kolkata'],
                    keywords: ['quest mall', 'park circus'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (Insignia)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVMN',
                    name: 'PVR: Mani Square Mall, Kolkata',
                    slugs: ['pvr-mani-square-mall-em-bypass', 'mani-square-mall-kolkata'],
                    keywords: ['mani square', 'em bypass'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        pune: {
            name: 'Pune',
            language: 'Marathi',
            theaters: [
                {
                    id: 'PVMC',
                    name: 'PVR: Phoenix Marketcity, Pune',
                    slugs: ['pvr-phoenix-marketcity-viman-nagar', 'phoenix-marketcity-pune'],
                    keywords: ['viman nagar', 'marketcity pune', 'phoenix pune'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'CNWS',
                    name: 'Cinépolis: Westend Mall, Pune',
                    slugs: ['cinepolis-westend-mall-aundh', 'westend-mall-aundh'],
                    keywords: ['westend', 'aundh'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'PVPC',
                    name: 'PVR: The Pavilion, SB Road',
                    slugs: ['pvr-pavilion-mall-sb-road', 'the-pavilion-mall-pune'],
                    keywords: ['pavilion mall', 'senapati bapat', 'sb road'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (P[XL])'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        ahmedabad: {
            name: 'Ahmedabad',
            language: 'Gujarati',
            theaters: [
                {
                    id: 'PVAC',
                    name: 'PVR: Acropolis Mall, Ahmedabad',
                    slugs: ['pvr-acropolis-mall-thaltej', 'acropolis-mall-ahmedabad'],
                    keywords: ['acropolis', 'thaltej', 'sg highway'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                },
                {
                    id: 'CNAL',
                    name: 'Cinépolis: Nexus Ahmedabad One',
                    slugs: ['cinepolis-alpha-one-mall-vastrapur', 'nexus-ahmedabad-one'],
                    keywords: ['ahmedabad one', 'vastrapur', 'alpha one'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'VIP AUDI 1'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        chandigarh: {
            name: 'Chandigarh',
            language: 'Hindi',
            theaters: [
                {
                    id: 'PVEL',
                    name: 'PVR: Elante Mall, Chandigarh',
                    slugs: ['pvr-elante-mall-industrial-area', 'nexus-elante-mall-chandigarh', 'elante-mall'],
                    keywords: ['elante', 'industrial area phase 1'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        kochi: {
            name: 'Kochi',
            language: 'Malayalam',
            theaters: [
                {
                    id: 'PVLL',
                    name: 'PVR: LuLu Mall, Kochi',
                    slugs: ['pvr-lulu-mall-edappally', 'lulu-mall-kochi'],
                    keywords: ['lulu mall kochi', 'edappally', 'lulu kochi'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (P[XL])', 'AUDI 4 (4DX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        lucknow: {
            name: 'Lucknow',
            language: 'Hindi',
            theaters: [
                {
                    id: 'PVPP',
                    name: 'PVR: Phoenix Palassio, Lucknow',
                    slugs: ['pvr-phoenix-palassio-amar-shaheed-path', 'phoenix-palassio-lucknow'],
                    keywords: ['palassio', 'gomti nagar', 'amar shaheed'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 1 (IMAX)'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        },
        jaipur: {
            name: 'Jaipur',
            language: 'Hindi',
            theaters: [
                {
                    id: 'INCP',
                    name: 'INOX: Crystal Palm, Jaipur',
                    slugs: ['inox-crystal-palm-mall', 'crystal-palm-mall-jaipur'],
                    keywords: ['crystal palm', 'sahkar circle', 'c-scheme'],
                    screens: ['AUDI 1', 'AUDI 2', 'AUDI 3'],
                    defaultFormat: '2D',
                    defaultScreen: 'AUDI 1'
                }
            ]
        }
    };

    // City Aliases mapping
    const CITY_ALIASES = {
        'bangalore': 'bengaluru', 'bang': 'bengaluru', 'blr': 'bengaluru',
        'mumbai': 'mumbai', 'mum': 'mumbai', 'bombay': 'mumbai',
        'delhi': 'delhi', 'ncr': 'delhi', 'new-delhi': 'delhi',
        'national-capital-region-ncr': 'delhi', 'noida': 'delhi', 'gurugram': 'delhi', 'gurgaon': 'delhi',
        'hyderabad': 'hyderabad', 'hyd': 'hyderabad', 'secunderabad': 'hyderabad',
        'chennai': 'chennai', 'madras': 'chennai', 'maa': 'chennai',
        'kolkata': 'kolkata', 'calcutta': 'kolkata', 'ccu': 'kolkata',
        'pune': 'pune', 'pnq': 'pune',
        'ahmedabad': 'ahmedabad', 'amd': 'ahmedabad',
        'chandigarh': 'chandigarh', 'ixc': 'chandigarh',
        'kochi': 'kochi', 'cochin': 'kochi', 'cok': 'kochi',
        'lucknow': 'lucknow', 'lko': 'lucknow',
        'jaipur': 'jaipur', 'jai': 'jaipur'
    };

    // Normalize City Key
    function normalizeCity(str) {
        if (!str) return 'bengaluru';
        const clean = str.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (CITY_ALIASES[clean]) return CITY_ALIASES[clean];
        for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
            if (clean.includes(alias)) return canonical;
        }
        return 'bengaluru';
    }

    // Helper: Find Cinema in database by URL, slug, cinema code, or name
    function findCinema(searchStr, cityHint) {
        if (!searchStr) return null;
        const low = searchStr.toLowerCase();

        // 1. Check exact cinema code (e.g. PVFF, PVVD, PVLP, PRAS, AMB, INSC, etc.)
        for (const [cityKey, cityObj] of Object.entries(THEATERS_DB)) {
            for (const t of cityObj.theaters) {
                const codeRegex = new RegExp(`\\b${t.id}\\b`, 'i');
                const pathCodeRegex = new RegExp(`cinema-[a-z]+-${t.id}-`, 'i');
                if (codeRegex.test(searchStr) || pathCodeRegex.test(searchStr)) {
                    return { cityKey, theater: t };
                }
            }
        }

        // 2. Check slugs
        for (const [cityKey, cityObj] of Object.entries(THEATERS_DB)) {
            for (const t of cityObj.theaters) {
                for (const s of t.slugs) {
                    if (low.includes(s)) {
                        return { cityKey, theater: t };
                    }
                }
            }
        }

        // 3. Check specific theater keywords
        for (const [cityKey, cityObj] of Object.entries(THEATERS_DB)) {
            for (const t of cityObj.theaters) {
                if (t.keywords && t.keywords.some(k => low.includes(k))) {
                    return { cityKey, theater: t };
                }
            }
        }

        // 4. If cityHint is provided, return its premier theater
        const normCity = normalizeCity(cityHint);
        if (THEATERS_DB[normCity] && THEATERS_DB[normCity].theaters.length > 0) {
            return { cityKey: normCity, theater: THEATERS_DB[normCity].theaters[0] };
        }

        return null;
    }

    // Helper: Populate City and Multiplex dropdowns & sync screen chips
    function populateCityAndTheaterDropdowns(activeCityKey, activeTheaterId) {
        if (!selectCity || !selectTheater) return;

        const cityKey = normalizeCity(activeCityKey);

        // Populate City select if empty
        if (selectCity.options.length === 0) {
            selectCity.innerHTML = '';
            for (const [key, obj] of Object.entries(THEATERS_DB)) {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = obj.name;
                selectCity.appendChild(opt);
            }
        }

        selectCity.value = cityKey;

        // Populate Theaters select for this city
        selectTheater.innerHTML = '';
        const cityData = THEATERS_DB[cityKey] || THEATERS_DB.bengaluru;
        cityData.theaters.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.name;
            selectTheater.appendChild(opt);
        });

        if (activeTheaterId) {
            selectTheater.value = activeTheaterId;
        } else if (cityData.theaters.length > 0) {
            selectTheater.value = cityData.theaters[0].id;
        }

        const chosenTheater = cityData.theaters.find(t => t.id === selectTheater.value) || cityData.theaters[0];
        renderScreenChips(chosenTheater);
    }

    // Render interactive Screen / Audi Chips matching the chosen theater
    function renderScreenChips(theater) {
        if (!screenChipsContainer || !theater) return;
        screenChipsContainer.innerHTML = '';

        const screens = theater.screens || ['AUDI 1', 'AUDI 2', 'AUDI 3', 'AUDI 4'];
        screens.forEach((sc) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            const isActive = (fieldScreen && fieldScreen.value.trim() === sc);
            btn.className = 'chip-btn' + (isActive ? ' active' : '');
            btn.setAttribute('data-type', 'screen');
            btn.setAttribute('data-val', sc);
            btn.textContent = sc;
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                screenChipsContainer.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (fieldScreen) fieldScreen.value = sc;
            });
            screenChipsContainer.appendChild(btn);
        });
    }

    // City & Theater dropdown change handlers
    if (selectCity) {
        selectCity.addEventListener('change', () => {
            const cityKey = selectCity.value;
            populateCityAndTheaterDropdowns(cityKey);
            const cityData = THEATERS_DB[cityKey];
            if (cityData && cityData.theaters.length > 0) {
                const t = cityData.theaters[0];
                fieldVenue.value = t.name;
                if (previewVenue) previewVenue.textContent = t.name;

                // Update default language for this city
                const currentFormat = (fieldMeta.value.split(',')[1] || '2D').trim();
                fieldMeta.value = `${cityData.language || 'Hindi'}, ${currentFormat}`;
                if (previewMeta) previewMeta.textContent = fieldMeta.value;
            }
        });
    }

    if (selectTheater) {
        selectTheater.addEventListener('change', () => {
            const cityKey = selectCity.value;
            const cityData = THEATERS_DB[cityKey];
            if (cityData) {
                const t = cityData.theaters.find(th => th.id === selectTheater.value);
                if (t) {
                    fieldVenue.value = t.name;
                    if (previewVenue) previewVenue.textContent = t.name;
                    renderScreenChips(t);
                }
            }
        });
    }

    // Dynamic SVG Poster Generator Fallback
    function generatePosterSvg(title, category = 'CINEMA') {
        const cleanTitle = (title || 'Movie Ticket').replace(/[<>&"']/g, '');
        const words = cleanTitle.split(' ');
        let lines = [];
        let currentLine = '';
        for (let w of words) {
            if ((currentLine + ' ' + w).trim().length > 14) {
                if (currentLine) lines.push(currentLine.trim());
                currentLine = w;
            } else {
                currentLine += ' ' + w;
            }
        }
        if (currentLine) lines.push(currentLine.trim());
        lines = lines.slice(0, 3);

        const textSvg = lines.map((line, idx) => {
            const y = 200 + (idx * 32) - ((lines.length - 1) * 16);
            return `<text x="50%" y="${y}" fill="#ffffff" font-size="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" text-anchor="middle">${line}</text>`;
        }).join('');

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="420" viewBox="0 0 300 420"><rect width="100%" height="100%" fill="#18181b"/><circle cx="150" cy="110" r="35" fill="rgba(244,63,94,0.15)"/><text x="50%" y="118" fill="#f43f5e" font-size="24" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="900" text-anchor="middle">★</text>${textSvg}<rect x="50" y="340" width="200" height="26" rx="13" fill="rgba(255,255,255,0.08)"/><text x="50%" y="357" fill="#f43f5e" font-size="11" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-weight="bold" letter-spacing="1.5" text-anchor="middle">${category}</text></svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }

    // Helper: Clean raw slug into Title Case
    function cleanTitle(str) {
        if (!str) return '';
        let s = str.toLowerCase();
        s = s.replace(/^(?:movie-|cinema-|event-)/i, '');
        s = s.replace(/-[a-z]{2,5}-\d{8}$/i, '');
        s = s.replace(/-(?:bengaluru|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|chandigarh|ahmedabad|kochi|jaipur|lucknow)$/i, '');
        s = s.replace(/-/g, ' ');
        s = s.replace(/\b(part|chapter)\s+(\d+)\b/gi, '$1 $2');
        s = s.replace(/\s+/g, ' ').trim();
        return s.replace(/\b\w/g, c => c.toUpperCase());
    }

    // Helper: Format cinema slug to Title Case
    function formatTheaterSlug(slug) {
        if (!slug) return '';
        const words = slug.split('-');
        const result = [];
        for (let i = 0; i < words.length; i++) {
            const w = words[i].toLowerCase();
            if (['pvr', 'inox', 'imax', '4dx', 'ice', 'pxl', 'pcx'].includes(w)) {
                result.push(w.toUpperCase());
            } else if (w === 'formerly') {
                result.push('(Formerly');
            } else if (w === 'forum' && result.length && result[result.length - 1] === '(Formerly') {
                result.push('Forum)');
            } else if (['audi', 'screen'].includes(w)) {
                result.push(w.toUpperCase());
            } else {
                result.push(w.charAt(0).toUpperCase() + w.slice(1));
            }
        }
        let str = result.join(' ');
        str = str.replace(/PVR\s+/i, 'PVR: ');
        str = str.replace(/INOX\s+/i, 'INOX: ');
        return str;
    }

    // Helper: Parse YYYYMMDD date
    function parseBmsDate(dateStr) {
        if (!dateStr || dateStr.length !== 8) return null;
        const year = parseInt(dateStr.substring(0, 4), 10);
        const month = parseInt(dateStr.substring(4, 6), 10) - 1;
        const day = parseInt(dateStr.substring(6, 8), 10);
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    // Helper: Get formatted current date string
    function getCurrentFormattedDate() {
        const d = new Date();
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    // Helper: Generate random seat identifier
    function getRandomSeat() {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L'];
        const row = rows[Math.floor(Math.random() * rows.length)];
        const num = Math.floor(1 + Math.random() * 20).toString().padStart(2, '0');
        return `SEAT - ${row}${num}`;
    }

    // Fetch popular / now-playing Indian movies from TMDB
    async function fetchIndianNowPlaying() {
        if (cachedNowPlaying && cachedNowPlaying.length > 0) {
            return cachedNowPlaying;
        }
        try {
            const url = `${TMDB_BASE}/discover/movie?api_key=${TMDB_KEY}&region=IN&sort_by=popularity.desc&with_original_language=hi|te|ta|kn&page=1`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                cachedNowPlaying = data.results.slice(0, 8).map(m => {
                    const lang = LANG_MAP[m.original_language] || 'Hindi';
                    return {
                        title: m.title || m.original_title,
                        posterUrl: m.poster_path ? `${IMG_BASE}${m.poster_path}` : generatePosterSvg(m.title),
                        language: lang,
                        releaseDate: m.release_date
                    };
                });
                return cachedNowPlaying;
            }
        } catch (err) {
            console.warn('Failed to load now playing movies:', err);
        }
        return [];
    }

    // Render "Now Showing at this Cinema" pills
    function renderNowShowingPills(movies, onSelectCallback) {
        if (!nowShowingBox || !nowShowingPills || !movies || movies.length === 0) {
            if (nowShowingBox) nowShowingBox.style.display = 'none';
            return;
        }

        nowShowingPills.innerHTML = '';
        movies.forEach((m, idx) => {
            const pill = document.createElement('div');
            pill.className = 'movie-pill' + (idx === 0 ? ' active' : '');
            pill.innerHTML = `
                <img class="movie-pill-thumb" src="${m.posterUrl}" alt="${m.title}">
                <span class="movie-pill-title">${m.title}</span>
            `;
            pill.addEventListener('click', () => {
                nowShowingPills.querySelectorAll('.movie-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                if (onSelectCallback) onSelectCallback(m);
            });
            nowShowingPills.appendChild(pill);
        });
        nowShowingBox.style.display = 'flex';
    }

    // Fetch movie details from TMDB with multiple fallback queries
    async function fetchTmdbDetails(movieQuery) {
        if (!movieQuery) return null;

        const queries = [movieQuery];
        const simplified = movieQuery.replace(/[:\-–].*$/, '').trim();
        if (simplified && simplified.toLowerCase() !== movieQuery.toLowerCase()) {
            queries.push(simplified);
        }
        const words = movieQuery.split(' ');
        if (words.length > 2) {
            queries.push(words.slice(0, 2).join(' '));
        }

        for (let q of queries) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 4000);

                const searchUrl = `${TMDB_BASE}/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(q)}`;
                const res = await fetch(searchUrl, { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (data.results && data.results.length > 0) {
                    const item = data.results.find(r => r.poster_path) || data.results[0];
                    const title = item.title || item.name || movieQuery;
                    const posterPath = item.poster_path;
                    const posterFullUrl = posterPath ? `${IMG_BASE}${posterPath}` : null;
                    const langCode = item.original_language || 'hi';
                    const langName = LANG_MAP[langCode] || langCode.toUpperCase();

                    let releaseFormatted = null;
                    const releaseDate = item.release_date || item.first_air_date;
                    if (releaseDate) {
                        const d = new Date(releaseDate);
                        if (!isNaN(d.getTime())) {
                            releaseFormatted = d.toLocaleDateString('en-US', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });
                        }
                    }

                    return {
                        title: title,
                        language: langName,
                        posterUrl: posterFullUrl,
                        releaseDate: releaseFormatted
                    };
                }
            } catch (err) {
                console.warn(`TMDB search query "${q}" failed:`, err);
            }
        }
        return null;
    }

    // Comprehensive Universal Parser for BookMyShow URLs & SMS/WhatsApp Confirmations
    function parseInputData(raw) {
        const input = raw.trim();

        // Extract any URL anywhere in the input (with or without https://)
        const urlMatch = input.match(/(https?:\/\/[^\s]+|in\.bookmyshow\.com[^\s]+|bms\.bz[^\s]+)/i);
        let targetUrl = urlMatch ? urlMatch[0] : null;
        if (targetUrl && !targetUrl.startsWith('http')) {
            targetUrl = 'https://' + targetUrl;
        }

        const extracted = {
            isUrl: Boolean(targetUrl),
            rawUrl: targetUrl,
            movieQuery: '',
            city: '',
            theater: '',
            theaterId: '',
            format: '2D',
            screen: 'AUDI 1',
            seats: getRandomSeat(),
            bookingId: '',
            date: '',
            time: '07:15 PM',
            price: (Math.floor(350 + Math.random() * 250)).toFixed(2),
            language: 'Hindi',
            isTheaterOnlyUrl: false
        };

        const lowerRaw = input.toLowerCase();

        // 1. Detect Format keywords from URL or text
        if (lowerRaw.includes('imax 3d') || lowerRaw.includes('imax-3d')) {
            extracted.format = 'IMAX 3D';
            extracted.screen = 'AUDI 1 (IMAX)';
        } else if (lowerRaw.includes('imax 2d') || lowerRaw.includes('imax-2d') || lowerRaw.includes('imax')) {
            extracted.format = 'IMAX 2D';
            extracted.screen = 'AUDI 1 (IMAX)';
        } else if (lowerRaw.includes('4dx 3d') || lowerRaw.includes('4dx-3d')) {
            extracted.format = '4DX 3D';
            extracted.screen = 'AUDI 4 (4DX)';
        } else if (lowerRaw.includes('4dx')) {
            extracted.format = '4DX';
            extracted.screen = 'AUDI 4 (4DX)';
        } else if (lowerRaw.includes('dolby atmos') || lowerRaw.includes('atmos')) {
            extracted.format = 'Dolby Atmos';
            extracted.screen = 'AUDI 1';
        } else if (lowerRaw.includes('p[xl]') || lowerRaw.includes('pxl')) {
            extracted.format = 'P[XL]';
            extracted.screen = 'AUDI 1 (P[XL])';
        } else if (lowerRaw.includes('3d')) {
            extracted.format = '3D';
            extracted.screen = 'AUDI 2 (3D)';
        }

        // 2. Detect Audi / Screen number from text if present
        const mAudiNum = lowerRaw.match(/\b(?:audi|screen)\s*[:#-]?\s*(\d+[A-Za-z0-9\s]*?)(?:\)|,|\.|\s+on|\s+at|$)/i);
        if (mAudiNum) {
            const rawAudi = mAudiNum[0].replace(/[),.]/g, '').trim().toUpperCase();
            extracted.screen = rawAudi;
        }

        // 3. Extract any ET... event or booking code
        const etMatch = input.match(/\b(ET\d{6,10})\b/i);
        if (etMatch) {
            extracted.bookingId = etMatch[1].toUpperCase();
        }

        // 4. URL-specific parsing
        if (extracted.isUrl && targetUrl) {
            try {
                const urlObj = new URL(targetUrl);
                const pathname = urlObj.pathname.replace(/\/+$/, '');
                const parts = pathname.split('/').filter(Boolean);

                // Detect city from path segments
                for (let p of parts) {
                    const low = p.toLowerCase();
                    if (CITY_ALIASES[low]) {
                        extracted.city = CITY_ALIASES[low];
                        break;
                    }
                }

                // Detect 8-digit date YYYYMMDD
                for (let p of parts) {
                    if (/^\d{8}$/.test(p)) {
                        const parsedDate = parseBmsDate(p);
                        if (parsedDate) extracted.date = parsedDate;
                        break;
                    }
                }

                // Check if this is a Cinema showtimes link without a movie:
                // e.g. /buytickets/{cinema-slug}/cinema-{city}-{cinemaCode}-MT/{date}
                // or /cinemas/{city}/{cinema-slug}/{cinemaCode}
                const isCinemaOnly = pathname.includes('/cinemas/') ||
                    (pathname.includes('/buytickets/') && pathname.includes('/cinema-'));

                if (isCinemaOnly) {
                    extracted.isTheaterOnlyUrl = true;
                    const matchedCinema = findCinema(pathname, extracted.city);
                    if (matchedCinema) {
                        extracted.city = matchedCinema.cityKey;
                        extracted.theater = matchedCinema.theater.name;
                        extracted.theaterId = matchedCinema.theater.id;
                        extracted.screen = matchedCinema.theater.defaultScreen || 'AUDI 1';
                        extracted.format = matchedCinema.theater.defaultFormat || '2D';
                    }
                }

                // Find ET code index in path
                let etIndex = -1;
                for (let i = 0; i < parts.length; i++) {
                    if (/^ET\d+/i.test(parts[i])) {
                        etIndex = i;
                        extracted.bookingId = parts[i].toUpperCase();
                        break;
                    }
                }

                // In BookMyShow movie URLs, segment immediately before ET... is ALWAYS the movie slug
                if (etIndex > 0) {
                    const candidate = parts[etIndex - 1];
                    if (!CITY_ALIASES[candidate.toLowerCase()] && candidate !== 'movies' && candidate !== 'events' && candidate !== 'explore') {
                        extracted.movieQuery = cleanTitle(candidate);
                    }
                }

                // Pattern: buytickets movie URL (/buytickets/{movie-slug}-{city}/movie-{cityCode}-{eventCode}-MT/{date})
                const buyMovieMatch = pathname.match(/buytickets\/([a-z0-9-]+?)(?:-([a-z]+))?\/movie-/i);
                if (buyMovieMatch) {
                    extracted.movieQuery = cleanTitle(buyMovieMatch[1]);
                    if (buyMovieMatch[2] && CITY_ALIASES[buyMovieMatch[2].toLowerCase()]) {
                        extracted.city = CITY_ALIASES[buyMovieMatch[2].toLowerCase()];
                    }
                }

                // Fallback for movie query if not a cinema-only URL
                if (!extracted.movieQuery && !extracted.isTheaterOnlyUrl) {
                    for (let i = parts.length - 1; i >= 0; i--) {
                        const p = parts[i];
                        if (!CITY_ALIASES[p.toLowerCase()] && !/^(?:movies|events|buytickets|cinemas|in|explore)$/i.test(p) && !/^ET\d+/i.test(p) && !/^\d{8}$/.test(p) && !p.startsWith('cinema-')) {
                            extracted.movieQuery = cleanTitle(p);
                            break;
                        }
                    }
                }

                if (urlObj.searchParams.get('bookingId')) {
                    extracted.bookingId = urlObj.searchParams.get('bookingId');
                }
            } catch (err) {
                console.error('URL parse error:', err);
            }
        } else {
            // Text / SMS parsing (e.g. Booking confirmation messages)
            const mBid = input.match(/(?:booking\s*(?:id|no\.?)|ticket\s*(?:id|no\.?)|id)\s*[:#-]?\s*([A-Za-z0-9]+)/i);
            if (mBid) extracted.bookingId = mBid[1].toUpperCase();

            const mAmt = input.match(/(?:₹|rs\.?|inr|total\s*amount)\s*[:#-]?\s*([\d,]+(?:\.\d{1,2})?)/i);
            if (mAmt) extracted.price = mAmt[1].replace(/,/g, '');

            const mSeats = input.match(/(?:seats?|seat\s*no\.?)\s*[:#-]?\s*([A-Za-z0-9,\s-]+?)(?:\.|\s+booking|\s+total|\s+rs|\s+₹|$)/i);
            if (mSeats) {
                const s = mSeats[1].trim();
                extracted.seats = s.toUpperCase().startsWith('SEAT') ? s.toUpperCase() : `SEAT - ${s.toUpperCase()}`;
            }

            const mTime = input.match(/(\d{1,2}:\d{2}\s*(?:am|pm))/i);
            if (mTime) extracted.time = mTime[1].toUpperCase();

            const mDate = input.match(/(?:on\s+)?([A-Za-z]{3},\s*\d{1,2}\s+[A-Za-z]{3}(?:,?\s*\d{4})?)/i);
            if (mDate) extracted.date = mDate[1].trim();

            const mMovie = input.match(/(?:booking\s+for|movie|film|for)\s+([A-Za-z0-9\s:''-]+?)(?:\s*\(([A-Za-z0-9\s,+-]+)\)|\s+at\s+|\s+on\s+)/i);
            if (mMovie) {
                extracted.movieQuery = cleanTitle(mMovie[1]);
                if (mMovie[2]) {
                    const metaParts = mMovie[2].split(',').map(s => s.trim());
                    if (metaParts.length >= 2) {
                        extracted.language = metaParts[0];
                        extracted.format = metaParts[1];
                    } else if (metaParts.length === 1) {
                        if (['2d', '3d', 'imax', 'imax 2d', 'imax 3d', '4dx'].includes(metaParts[0].toLowerCase())) {
                            extracted.format = metaParts[0].toUpperCase();
                        } else {
                            extracted.language = metaParts[0];
                        }
                    }
                }
            } else {
                extracted.movieQuery = cleanTitle(input);
            }

            // Find city from text if mentioned
            for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
                if (lowerRaw.includes(alias)) {
                    extracted.city = canonical;
                    break;
                }
            }
        }

        // Resolve Theater & Cinema (Clean name only, no address)
        const found = findCinema(targetUrl || input, extracted.city);
        if (found) {
            extracted.city = found.cityKey;
            extracted.theater = found.theater.name;
            extracted.theaterId = found.theater.id;
        } else {
            const cityKey = normalizeCity(extracted.city);
            const cityData = THEATERS_DB[cityKey] || THEATERS_DB.bengaluru;
            const premier = cityData.theaters[0];
            extracted.city = cityKey;
            extracted.theater = premier.name;
            extracted.theaterId = premier.id;
        }

        extracted.language = extracted.language || (THEATERS_DB[extracted.city] && THEATERS_DB[extracted.city].language) || 'Hindi';

        // Set Screen based on Format if still default
        if (!extracted.screen || extracted.screen === 'AUDI 1') {
            if (extracted.format.includes('IMAX')) {
                extracted.screen = 'AUDI 1 (IMAX)';
            } else if (extracted.format.includes('4DX')) {
                extracted.screen = 'AUDI 4 (4DX)';
            } else if (extracted.format.includes('3D')) {
                extracted.screen = 'AUDI 2 (3D)';
            } else {
                extracted.screen = 'AUDI 1';
            }
        }

        // Price estimation based on format
        if (!extracted.price || extracted.price === '350.00') {
            if (extracted.format.includes('IMAX')) {
                extracted.price = (Math.floor(750 + Math.random() * 200)).toFixed(2);
            } else if (extracted.format.includes('4DX')) {
                extracted.price = (Math.floor(550 + Math.random() * 150)).toFixed(2);
            } else {
                extracted.price = (Math.floor(280 + Math.random() * 150)).toFixed(2);
            }
        }

        if (!extracted.bookingId) {
            extracted.bookingId = 'ET' + Math.floor(10000000 + Math.random() * 90000000);
        }

        return extracted;
    }

    // Modal Opening & Closing
    function openAutoFillModal() {
        closeDrawer();
        if (autoFillModal) {
            autoFillModal.classList.add('active');
            if (bmsInput) {
                setTimeout(() => bmsInput.focus(), 100);
            }
        }
    }

    function closeAutoFillModal() {
        if (autoFillModal) {
            autoFillModal.classList.remove('active');
        }
    }

    if (btnOpenAutoFill) btnOpenAutoFill.addEventListener('click', openAutoFillModal);
    if (actionAutoFillDrawer) actionAutoFillDrawer.addEventListener('click', openAutoFillModal);
    if (btnCloseAutoFill) btnCloseAutoFill.addEventListener('click', closeAutoFillModal);
    if (autoFillModal) {
        autoFillModal.addEventListener('click', (e) => {
            if (e.target === autoFillModal) closeAutoFillModal();
        });
    }

    // Live sync between input fields and preview card
    if (fieldTitle) {
        fieldTitle.addEventListener('input', () => {
            if (previewTitle) previewTitle.textContent = fieldTitle.value;
        });
    }
    if (fieldMeta) {
        fieldMeta.addEventListener('input', () => {
            if (previewMeta) previewMeta.textContent = fieldMeta.value;
        });
    }
    if (fieldVenue) {
        fieldVenue.addEventListener('input', () => {
            if (previewVenue) previewVenue.textContent = fieldVenue.value;
        });
    }
    if (fieldTime) {
        fieldTime.addEventListener('input', () => {
            if (previewDate) previewDate.textContent = fieldTime.value;
        });
    }

    // Interactive Format Chips
    document.querySelectorAll('#formatChips .chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#formatChips .chip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const val = btn.getAttribute('data-val');

            const currentLang = (fieldMeta.value.split(',')[0] || 'Hindi').trim();
            fieldMeta.value = `${currentLang}, ${val}`;
            if (previewMeta) previewMeta.textContent = fieldMeta.value;

            // Auto-adjust screen to match format
            if (val.includes('IMAX')) {
                fieldScreen.value = 'AUDI 1 (IMAX)';
            } else if (val.includes('4DX')) {
                fieldScreen.value = 'AUDI 4 (4DX)';
            } else if (val.includes('3D')) {
                fieldScreen.value = 'AUDI 2 (3D)';
            } else {
                fieldScreen.value = 'AUDI 1';
            }

            // Sync screen chips active state
            if (screenChipsContainer) {
                screenChipsContainer.querySelectorAll('.chip-btn').forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-val') === fieldScreen.value);
                });
            }
        });
    });

    // Interactive Showtime Chips
    document.querySelectorAll('#timeChips .chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#timeChips .chip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const timeVal = btn.getAttribute('data-val');

            const currentDate = (fieldTime.value.split('|')[0] || getCurrentFormattedDate()).trim();
            fieldTime.value = `${currentDate} | ${timeVal}`;
            if (previewDate) previewDate.textContent = fieldTime.value;
        });
    });

    // ==========================================
    // Fetch & Auto-Fill Core Engine
    // ==========================================
    async function handleFetchDetails() {
        const raw = bmsInput.value.trim();
        if (!raw) {
            fetchStatusMsg.className = 'fetch-status-msg error';
            fetchStatusMsg.textContent = 'Please paste a BookMyShow link, movie name, or booking text.';
            return;
        }

        // Loading UI
        const btnText = btnFetchDetails.querySelector('.btn-text');
        const btnLoader = btnFetchDetails.querySelector('.btn-loader');
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        btnFetchDetails.disabled = true;
        fetchStatusMsg.className = 'fetch-status-msg info';
        fetchStatusMsg.textContent = 'Detecting movie, cinema & showtimes...';

        try {
            const parsed = parseInputData(raw);

            // Fetch TMDB Movie or Cinema Top Movies
            let tmdb = null;
            let nowPlayingMovies = [];

            if (parsed.movieQuery) {
                tmdb = await fetchTmdbDetails(parsed.movieQuery);
            }

            // If no movie found or it is a cinema showtimes link, fetch trending Indian blockbusters!
            if (!tmdb || parsed.isTheaterOnlyUrl) {
                nowPlayingMovies = await fetchIndianNowPlaying();
                if (nowPlayingMovies.length > 0 && !tmdb) {
                    const top = nowPlayingMovies[0];
                    tmdb = {
                        title: top.title,
                        language: top.language,
                        posterUrl: top.posterUrl,
                        releaseDate: top.releaseDate
                    };
                }
            }

            // Determine Title
            let finalTitle = '';
            if (tmdb && tmdb.title) {
                finalTitle = tmdb.title;
            } else if (parsed.movieQuery) {
                finalTitle = parsed.movieQuery;
            } else {
                finalTitle = 'Movie Experience';
            }

            // Determine Language & Format
            const finalLanguage = (tmdb && tmdb.language) ? tmdb.language : (parsed.language || 'Hindi');
            const finalFormat = parsed.format || '2D';
            const finalMeta = `${finalLanguage}, ${finalFormat}`;

            // Determine Poster
            let finalPoster = (tmdb && tmdb.posterUrl) ? tmdb.posterUrl : generatePosterSvg(finalTitle);

            // Determine Date & Time
            const finalDate = parsed.date || (tmdb && tmdb.releaseDate ? tmdb.releaseDate : getCurrentFormattedDate());
            const finalTime = `${finalDate} | ${parsed.time}`;

            // Populate City & Theater dropdowns
            populateCityAndTheaterDropdowns(parsed.city, parsed.theaterId);

            // Populate form fields with clean values (no full addresses, no extra tags)
            fieldTitle.value = finalTitle;
            fieldMeta.value = finalMeta;
            fieldTime.value = finalTime;
            fieldScreen.value = parsed.screen;
            fieldVenue.value = parsed.theater;
            fieldSeats.value = parsed.seats;
            fieldBookingId.value = parsed.bookingId;
            fieldPrice.value = parsed.price;

            // Highlight matching format chip
            document.querySelectorAll('#formatChips .chip-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-val') === finalFormat);
            });

            // Highlight matching showtime chip
            document.querySelectorAll('#timeChips .chip-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-val') === parsed.time);
            });

            // Update preview card
            previewPosterImg.src = finalPoster;
            previewTitle.textContent = finalTitle;
            previewMeta.textContent = finalMeta;
            previewVenue.textContent = fieldVenue.value;
            previewDate.textContent = finalTime;

            currentFetchedData = {
                title: finalTitle,
                meta: finalMeta,
                time: finalTime,
                venue: fieldVenue.value,
                screen: parsed.screen,
                seats: parsed.seats,
                bookingId: parsed.bookingId,
                price: parsed.price,
                posterUrl: finalPoster,
                qrData: parsed.rawUrl || `https://in.bookmyshow.com/order-summary/${parsed.bookingId}`
            };

            // Render "Now Showing" pills if movies are available
            if (nowPlayingMovies.length > 0) {
                renderNowShowingPills(nowPlayingMovies, (selectedMovie) => {
                    fieldTitle.value = selectedMovie.title;
                    previewTitle.textContent = selectedMovie.title;
                    previewPosterImg.src = selectedMovie.posterUrl;
                    finalPoster = selectedMovie.posterUrl;

                    const currentFormat = (fieldMeta.value.split(',')[1] || '2D').trim();
                    fieldMeta.value = `${selectedMovie.language}, ${currentFormat}`;
                    previewMeta.textContent = fieldMeta.value;

                    currentFetchedData.title = selectedMovie.title;
                    currentFetchedData.meta = fieldMeta.value;
                    currentFetchedData.posterUrl = selectedMovie.posterUrl;
                });
            } else if (nowShowingBox) {
                nowShowingBox.style.display = 'none';
            }

            // Display preview and form
            previewCard.style.display = 'grid';
            modalFormFields.style.display = 'flex';
            fetchStatusMsg.className = 'fetch-status-msg success';
            fetchStatusMsg.textContent = `✓ Auto-fetched: ${finalTitle} at ${parsed.theater}! Review & Apply.`;
        } catch (err) {
            console.error('Fetch error:', err);
            fetchStatusMsg.className = 'fetch-status-msg error';
            fetchStatusMsg.textContent = 'Could not fetch remote details. You can tweak fields manually below.';
            modalFormFields.style.display = 'flex';
        } finally {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            btnFetchDetails.disabled = false;
        }
    }

    if (btnFetchDetails) {
        btnFetchDetails.addEventListener('click', handleFetchDetails);
    }

    if (bmsInput) {
        // Trigger fetch on Enter key
        bmsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleFetchDetails();
            }
        });

        // Instant auto-fetch when user pastes a link
        bmsInput.addEventListener('paste', () => {
            setTimeout(() => {
                if (bmsInput.value.trim().length > 6) {
                    handleFetchDetails();
                }
            }, 120);
        });

        // Debounced auto-fetch on typing or pasting
        let inputDebounce = null;
        bmsInput.addEventListener('input', () => {
            clearTimeout(inputDebounce);
            const val = bmsInput.value.trim();
            if (val.length > 10 && (val.includes('bookmyshow') || val.includes('bms') || val.includes('http') || val.includes('ET00') || val.includes('cinema-'))) {
                inputDebounce = setTimeout(() => {
                    handleFetchDetails();
                }, 600);
            }
        });
    }

    // Apply button: writes the auto-filled details to the ticket card and updates QR code
    if (btnApplyDetails) {
        btnApplyDetails.addEventListener('click', () => {
            const titleVal = fieldTitle.value.trim() || 'Cinema Ticket';
            const metaVal = fieldMeta.value.trim() || 'Hindi, 2D';
            const timeVal = fieldTime.value.trim() || `${getCurrentFormattedDate()} | 07:15 PM`;
            const venueVal = fieldVenue.value.trim() || 'PVR Cinemas';
            const screenVal = fieldScreen.value.trim() || 'AUDI 1';
            const seatsVal = fieldSeats.value.trim() || getRandomSeat();
            const bookingIdVal = fieldBookingId.value.trim() || ('ET' + Math.floor(10000000 + Math.random() * 90000000));
            const priceVal = fieldPrice.value.trim() || '350.00';
            const posterSrc = (currentFetchedData && currentFetchedData.posterUrl)
                ? currentFetchedData.posterUrl
                : generatePosterSvg(titleVal);

            // 1. Update Poster
            if (posterImgEl) {
                posterImgEl.src = posterSrc;
            }

            // 2. Update Movie Title (with rating span if provided)
            const movieTitleEl = document.querySelector('.movie-title');
            if (movieTitleEl) {
                const ratingMatch = titleVal.match(/\s*(\([A-Za-z0-9+-]+\))\s*$/);
                if (ratingMatch) {
                    const rawTitle = titleVal.replace(ratingMatch[0], '').trim();
                    const ratingTag = ratingMatch[1];
                    movieTitleEl.innerHTML = `${rawTitle} <span class="movie-rating">${ratingTag}</span>`;
                } else {
                    movieTitleEl.textContent = titleVal;
                }
            }

            // 3. Update Format / Language
            const movieMetaEl = document.querySelector('.movie-meta');
            if (movieMetaEl) {
                movieMetaEl.textContent = metaVal;
            }

            // 4. Update Time
            const movieTimeEl = document.querySelector('.movie-time');
            if (movieTimeEl) {
                movieTimeEl.textContent = timeVal;
            }

            // 5. Update Venue (clean cinema name, e.g. "PVR: Phoenix Palladium, Lower Parel")
            const movieVenueEl = document.querySelector('.movie-venue');
            if (movieVenueEl) {
                movieVenueEl.textContent = venueVal;
            }

            // 6. Update Screen / Audi in ticket details (clean screen, e.g. "AUDI 1" or "AUDI 1 (IMAX)")
            const ticketScreenEl = document.querySelector('.ticket-screen');
            if (ticketScreenEl) {
                ticketScreenEl.textContent = screenVal;
            }

            // 7. Update Seat
            const ticketSeatEl = document.querySelector('.ticket-seat');
            if (ticketSeatEl) {
                ticketSeatEl.textContent = seatsVal.startsWith('SEAT') ? seatsVal : `SEAT - ${seatsVal}`;
            }

            // 8. Update Booking ID
            bookingId = bookingIdVal;
            if (bookingIdEl) {
                bookingIdEl.textContent = `BOOKING ID: ${bookingIdVal}`;
            }

            // 9. Update Price
            const footerValueEl = document.querySelector('.footer-value');
            if (footerValueEl) {
                const cleanPrice = priceVal.replace(/[₹\s,]/g, '');
                footerValueEl.innerHTML = `&#8377; ${cleanPrice}`;
            }

            // 10. Update QR Code
            if (currentFetchedData && currentFetchedData.qrData) {
                shareUrl = currentFetchedData.qrData;
            } else {
                shareUrl = `https://in.bookmyshow.com/order-summary/${bookingIdVal}`;
            }
            renderQRCode(shareUrl);

            // 11. Update browser URL query params
            const params = new URLSearchParams(window.location.search);
            params.set('id', bookingIdVal);
            if (posterSrc && !posterSrc.startsWith('data:')) {
                params.set('poster', posterSrc);
            }
            const newQuery = `${window.location.pathname}?${params.toString()}`;
            history.replaceState(null, '', newQuery);

            // Close modal & confirm
            closeAutoFillModal();
            showToast(`✓ Ticket updated: ${titleVal}!`);
        });
    }
});
