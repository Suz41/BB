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
    const previewCard = document.getElementById('previewCard');
    const previewPosterImg = document.getElementById('previewPosterImg');
    const previewTitle = document.getElementById('previewTitle');
    const previewMeta = document.getElementById('previewMeta');
    const previewVenue = document.getElementById('previewVenue');
    const previewDate = document.getElementById('previewDate');
    const modalFormFields = document.getElementById('modalFormFields');

    // Form inputs
    const fieldTitle = document.getElementById('fieldTitle');
    const fieldMeta = document.getElementById('fieldMeta');
    const fieldTime = document.getElementById('fieldTime');
    const fieldVenue = document.getElementById('fieldVenue');
    const fieldScreen = document.getElementById('fieldScreen');
    const fieldSeats = document.getElementById('fieldSeats');
    const fieldBookingId = document.getElementById('fieldBookingId');
    const fieldPrice = document.getElementById('fieldPrice');
    const btnApplyDetails = document.getElementById('btnApplyDetails');

    let currentFetchedData = null;

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

    if (btnOpenAutoFill) {
        btnOpenAutoFill.addEventListener('click', openAutoFillModal);
    }
    if (actionAutoFillDrawer) {
        actionAutoFillDrawer.addEventListener('click', openAutoFillModal);
    }
    if (btnCloseAutoFill) {
        btnCloseAutoFill.addEventListener('click', closeAutoFillModal);
    }
    if (autoFillModal) {
        autoFillModal.addEventListener('click', (e) => {
            if (e.target === autoFillModal) {
                closeAutoFillModal();
            }
        });
    }

    // Helper: Generate a customized dynamic SVG poster badge if no poster image is found
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

    // City presets for default theater venues & local languages
    const CITY_THEATERS = {
        'mumbai': 'PVR: Phoenix Palladium, Lower Parel, Mumbai',
        'delhi': 'PVR: Vegas Mall, Dwarka, Delhi',
        'national-capital-region-ncr': 'PVR: Vegas Mall, Dwarka, Delhi',
        'ncr': 'PVR: Vegas Mall, Dwarka, Delhi',
        'bengaluru': 'PVR: Nexus, Koramangala, Bengaluru',
        'bangalore': 'PVR: Nexus, Koramangala, Bengaluru',
        'hyderabad': 'Prasads Multiplex, Banjara Hills, Hyderabad',
        'chennai': 'PVR: Grand Mall, Velachery, Chennai',
        'kolkata': 'INOX: South City Mall, Kolkata',
        'pune': 'PVR: Phoenix Marketcity, Viman Nagar, Pune',
        'ahmedabad': 'PVR: Acropolis Mall, Thaltej, Ahmedabad',
        'chandigarh': 'PVR: Elante Mall, Industrial Area, Chandigarh',
        'kochi': 'PVR: LuLu Mall, Edappally, Kochi',
        'coimbatore': 'PVR: The Marina Mall, Coimbatore',
        'lucknow': 'PVR: Phoenix Palassio, Lucknow',
        'jaipur': 'INOX: Crystal Palm, Jaipur',
        'indore': 'PVR: Treasure Island, Indore'
    };

    const CITY_LANG = {
        'mumbai': 'Hindi', 'delhi': 'Hindi', 'national-capital-region-ncr': 'Hindi', 'ncr': 'Hindi',
        'bengaluru': 'Kannada', 'bangalore': 'Kannada', 'hyderabad': 'Telugu', 'chennai': 'Tamil',
        'kolkata': 'Bengali', 'pune': 'Marathi', 'ahmedabad': 'Gujarati', 'kochi': 'Malayalam'
    };

    // Helper: Clean raw slug into Title Case
    function cleanTitle(str) {
        if (!str) return '';
        let s = str.toLowerCase();
        s = s.replace(/^(?:movie-|cinema-|event-)/i, '');
        s = s.replace(/-[a-z]{2,5}-\d{8}$/i, '');
        s = s.replace(/-(?:bengaluru|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|chandigarh|ahmedabad|kochi)$/i, '');
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
            if (['pvr', 'inox', 'imax', '4dx', 'ice', 'pxl'].includes(w)) {
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

    // Helper: Generate random seat identifier
    function getRandomSeat() {
        const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L'];
        const row = rows[Math.floor(Math.random() * rows.length)];
        const num = Math.floor(1 + Math.random() * 20).toString().padStart(2, '0');
        return `SEAT - ${row}${num}`;
    }

    // Comprehensive Universal Parser
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
            format: '2D',
            screen: 'AUDI 1',
            seats: getRandomSeat(),
            bookingId: '',
            date: '',
            time: '07:15 PM',
            price: (Math.floor(350 + Math.random() * 500)).toFixed(2),
            language: 'Hindi'
        };

        // Extract format and screen from input text or URL keywords
        const lowerRaw = input.toLowerCase();
        if (lowerRaw.includes('imax 3d') || lowerRaw.includes('imax-3d')) {
            extracted.format = 'IMAX 3D';
            extracted.screen = 'AUDI 1 IMAX';
        } else if (lowerRaw.includes('imax 2d') || lowerRaw.includes('imax-2d') || lowerRaw.includes('imax')) {
            extracted.format = 'IMAX 2D';
            extracted.screen = 'AUDI 1 IMAX';
        } else if (lowerRaw.includes('4dx 3d') || lowerRaw.includes('4dx-3d')) {
            extracted.format = '4DX 3D';
            extracted.screen = 'AUDI 4DX';
        } else if (lowerRaw.includes('4dx')) {
            extracted.format = '4DX';
            extracted.screen = 'AUDI 4DX';
        } else if (lowerRaw.includes('ice 3d') || lowerRaw.includes('ice-3d') || lowerRaw.includes('ice')) {
            extracted.format = 'ICE 3D';
            extracted.screen = 'ICE AUDI';
        } else if (lowerRaw.includes('screenx')) {
            extracted.format = 'ScreenX';
            extracted.screen = 'AUDI ScreenX';
        } else if (lowerRaw.includes('3d')) {
            extracted.format = '3D';
            extracted.screen = 'AUDI 2 (3D)';
        }

        const mAudiNum = lowerRaw.match(/(?:audi|screen)\s*[:#-]?\s*(\d+)/i);
        if (mAudiNum) {
            extracted.screen = extracted.format.includes('IMAX') ? `AUDI ${mAudiNum[1]} IMAX` : `AUDI ${mAudiNum[1]}`;
        }

        // Extract any ET... event code from input string
        const etMatch = input.match(/\b(ET\d{6,10})\b/i);
        if (etMatch) {
            extracted.bookingId = etMatch[1].toUpperCase();
        }

        if (extracted.isUrl && targetUrl) {
            try {
                const urlObj = new URL(targetUrl);
                const pathname = urlObj.pathname.replace(/\/+$/, '');
                const parts = pathname.split('/').filter(Boolean);

                // 1. Identify city if present in path segments
                for (let p of parts) {
                    const low = p.toLowerCase();
                    if (CITY_THEATERS[low]) {
                        extracted.city = low;
                        extracted.language = CITY_LANG[low] || 'Hindi';
                        break;
                    }
                }

                // 2. Identify 8-digit date YYYYMMDD
                for (let p of parts) {
                    if (/^\d{8}$/.test(p)) {
                        const parsedDate = parseBmsDate(p);
                        if (parsedDate) extracted.date = parsedDate;
                        break;
                    }
                }

                // 3. Find ET code index in path
                let etIndex = -1;
                for (let i = 0; i < parts.length; i++) {
                    if (/^ET\d+/i.test(parts[i])) {
                        etIndex = i;
                        extracted.bookingId = parts[i].toUpperCase();
                        break;
                    }
                }

                // In BookMyShow, the segment immediately before ET... is ALWAYS the movie/event slug!
                if (etIndex > 0) {
                    const candidate = parts[etIndex - 1];
                    if (!CITY_THEATERS[candidate.toLowerCase()] && candidate !== 'movies' && candidate !== 'events' && candidate !== 'explore') {
                        extracted.movieQuery = cleanTitle(candidate);
                    }
                }

                // 4. Pattern: buytickets movie URL
                const buyMovieMatch = pathname.match(/buytickets\/([a-z0-9-]+?)(?:-([a-z]+))?\/movie-/i);
                if (buyMovieMatch) {
                    extracted.movieQuery = cleanTitle(buyMovieMatch[1]);
                    if (buyMovieMatch[2] && CITY_THEATERS[buyMovieMatch[2].toLowerCase()]) {
                        extracted.city = buyMovieMatch[2].toLowerCase();
                        extracted.language = CITY_LANG[extracted.city] || 'Hindi';
                    }
                }

                // 5. Pattern: cinema showtimes URL
                if (pathname.includes('/cinemas/') || pathname.includes('/cinema-') || (!extracted.movieQuery && parts.includes('buytickets'))) {
                    for (let i = 0; i < parts.length; i++) {
                        if (parts[i] === 'cinemas' && parts[i + 1]) {
                            if (CITY_THEATERS[parts[i + 1].toLowerCase()] && parts[i + 2]) {
                                extracted.theater = formatTheaterSlug(parts[i + 2]);
                            } else {
                                extracted.theater = formatTheaterSlug(parts[i + 1]);
                            }
                        }
                        if (parts[i] === 'buytickets' && parts[i + 1] && !parts[i + 1].startsWith('cinema-') && !/^[A-Z0-9]{4,6}$/.test(parts[i + 1])) {
                            extracted.theater = formatTheaterSlug(parts[i + 1]);
                        }
                    }
                }

                // Fallback for movie query if still empty
                if (!extracted.movieQuery) {
                    for (let i = parts.length - 1; i >= 0; i--) {
                        const p = parts[i];
                        if (!CITY_THEATERS[p.toLowerCase()] && !/^(?:movies|events|buytickets|cinemas|in|explore)$/i.test(p) && !/^ET\d+/i.test(p) && !/^\d{8}$/.test(p)) {
                            extracted.movieQuery = cleanTitle(p);
                            break;
                        }
                    }
                }

                // Booking ID from query param
                if (urlObj.searchParams.get('bookingId')) {
                    extracted.bookingId = urlObj.searchParams.get('bookingId');
                } else if (urlObj.searchParams.get('id')) {
                    extracted.bookingId = urlObj.searchParams.get('id');
                }
            } catch (err) {
                console.error('URL parse error:', err);
            }
        } else {
            // Text parsing (SMS / WhatsApp / Direct movie name)
            const mBid = input.match(/(?:booking\s*(?:id|no\.?)|ticket\s*(?:id|no\.?)|id)\s*[:#-]?\s*([A-Za-z0-9]+)/i);
            if (mBid) extracted.bookingId = mBid[1].toUpperCase();

            const mAmt = input.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
            if (mAmt) extracted.price = mAmt[1].replace(/,/g, '');

            const mSeats = input.match(/(?:seats?|seat\s*no\.?)\s*[:#-]?\s*([A-Za-z0-9,\s-]+?)(?:\\s+(?:audi|booking|total|rs|₹|\.|$)|$)/i);
            if (mSeats) {
                const s = mSeats[1].trim();
                extracted.seats = s.toUpperCase().startsWith('SEAT') ? s.toUpperCase() : `SEAT - ${s.toUpperCase()}`;
            }

            const mAudi = input.match(/(audi\s*\d+(?:\s+imax)?|screen\s*\d+|imax\s*2d|imax\s*3d)/i);
            if (mAudi) extracted.screen = mAudi[1].toUpperCase();

            const mCinema = input.match(/(?:at|venue|cinema)\s*[:#-]?\s*([^,\n|]+(?:pvr|inox|cinepolis|cine|mall|nexus)[^,\n|]*)/i)
                || input.match(/((?:pvr|inox|cinepolis|miraj)[^,\n|]+)/i);
            if (mCinema) {
                let c = mCinema[1].trim();
                c = c.replace(/\s+on\s+(?:mon|tue|wed|thu|fri|sat|sun).*$/i, '');
                extracted.theater = c;
            }

            const mTime = input.match(/(\d{1,2}:\d{2}\s*(?:am|pm))/i);
            if (mTime) extracted.time = mTime[1].toUpperCase();

            const mMovie = input.match(/(?:for|movie|film)\s+([A-Za-z0-9\s:''-]+?)(?:\s*\((?:a|ua|u|pg-13|r)\)|\s+at\s+|\s+on\s+)/i);
            if (mMovie) {
                extracted.movieQuery = cleanTitle(mMovie[1]);
            } else if (!extracted.theater) {
                extracted.movieQuery = cleanTitle(input);
            }
        }

        // Assign theater if not yet set
        if (!extracted.theater) {
            if (extracted.city && CITY_THEATERS[extracted.city]) {
                extracted.theater = CITY_THEATERS[extracted.city];
            } else {
                extracted.theater = 'PVR: Phoenix Palladium, Lower Parel, Mumbai';
            }
        }

        // Generate Booking ID if still empty
        if (!extracted.bookingId) {
            extracted.bookingId = 'ET' + Math.floor(10000000 + Math.random() * 90000000);
        }

        return extracted;
    }

    // Fetch movie details from TMDB with multiple fallback queries and AbortController timeout
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

    // Real-time input synchronization between form fields and preview
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
    if (fieldScreen) {
        fieldScreen.addEventListener('input', () => {
            const base = fieldVenue.value.replace(/\s*\([^)]*\)$/, '').trim();
            if (fieldScreen.value.trim()) {
                fieldVenue.value = `${base} (${fieldScreen.value.trim()})`;
                if (previewVenue) previewVenue.textContent = fieldVenue.value;
            }
        });
    }

    // Interactive Quick Selection Chips (Format, Screen Audi, Venue)
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = btn.getAttribute('data-type');
            const val = btn.getAttribute('data-val');

            const group = btn.closest('.quick-chip-group');
            if (group) {
                group.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            }

            if (type === 'format') {
                const currentLang = (fieldMeta.value.split(',')[0] || 'Hindi').trim();
                fieldMeta.value = `${currentLang}, ${val}`;
                if (previewMeta) previewMeta.textContent = fieldMeta.value;

                if (val.includes('IMAX')) {
                    fieldScreen.value = 'AUDI 1 IMAX';
                } else if (val.includes('4DX')) {
                    fieldScreen.value = 'AUDI 4DX';
                } else if (val.includes('3D')) {
                    fieldScreen.value = 'AUDI 2 (3D)';
                } else {
                    fieldScreen.value = 'AUDI 1';
                }
                const baseVenue = fieldVenue.value.replace(/\s*\([^)]*\)$/, '').trim();
                fieldVenue.value = `${baseVenue} (${fieldScreen.value})`;
                if (previewVenue) previewVenue.textContent = fieldVenue.value;
            } else if (type === 'screen') {
                fieldScreen.value = val;
                const baseVenue = fieldVenue.value.replace(/\s*\([^)]*\)$/, '').trim();
                fieldVenue.value = `${baseVenue} (${val})`;
                if (previewVenue) previewVenue.textContent = fieldVenue.value;
            } else if (type === 'venue') {
                const currentScreen = fieldScreen.value.trim() || 'AUDI 1';
                fieldVenue.value = `${val} (${currentScreen})`;
                if (previewVenue) previewVenue.textContent = fieldVenue.value;
            }
        });
    });

    // Handle Fetch Details click
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
        fetchStatusMsg.textContent = 'Parsing link & fetching details...';

        try {
            const parsed = parseInputData(raw);
            const tmdb = await fetchTmdbDetails(parsed.movieQuery);

            // Determine Title
            let finalTitle = '';
            if (tmdb && tmdb.title) {
                finalTitle = tmdb.title;
            } else if (parsed.movieQuery) {
                finalTitle = parsed.movieQuery;
            } else if (parsed.theater) {
                finalTitle = parsed.theater;
            } else {
                finalTitle = 'Movie Experience';
            }

            // Determine Language & Meta
            const finalLanguage = (tmdb && tmdb.language) ? tmdb.language : (parsed.language || 'Hindi');
            const finalFormat = parsed.format || '2D';
            const finalMeta = `${finalLanguage}, ${finalFormat}`;

            // Determine Poster (TMDB official poster OR customized dynamic SVG badge)
            let finalPoster = (tmdb && tmdb.posterUrl) ? tmdb.posterUrl : generatePosterSvg(finalTitle);

            // Determine Date & Time
            const finalDate = parsed.date || (tmdb && tmdb.releaseDate ? tmdb.releaseDate : 'Sat, 21 Nov, 2026');
            const finalTime = `${finalDate} | ${parsed.time}`;

            // Venue with Screen Audi
            const finalVenue = parsed.theater ? `${parsed.theater} (${parsed.screen})` : `PVR Cinemas (${parsed.screen})`;

            // Populate form fields
            fieldTitle.value = finalTitle;
            fieldMeta.value = finalMeta;
            fieldTime.value = finalTime;
            fieldVenue.value = finalVenue;
            fieldScreen.value = parsed.screen;
            fieldSeats.value = parsed.seats;
            fieldBookingId.value = parsed.bookingId;
            fieldPrice.value = parsed.price;

            // Highlight matching quick chips
            document.querySelectorAll('#formatChips .chip-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-val') === finalFormat);
            });
            document.querySelectorAll('#screenChips .chip-btn').forEach(b => {
                b.classList.toggle('active', b.getAttribute('data-val') === parsed.screen);
            });

            // Update preview
            previewPosterImg.src = finalPoster;
            previewTitle.textContent = finalTitle;
            previewMeta.textContent = finalMeta;
            previewVenue.textContent = finalVenue;
            previewDate.textContent = finalTime;

            currentFetchedData = {
                title: finalTitle,
                meta: finalMeta,
                time: finalTime,
                venue: finalVenue,
                screen: parsed.screen,
                seats: parsed.seats,
                bookingId: parsed.bookingId,
                price: parsed.price,
                posterUrl: finalPoster,
                qrData: parsed.rawUrl || `https://in.bookmyshow.com/order-summary/${parsed.bookingId}`
            };

            // Display preview and fields
            previewCard.style.display = 'grid';
            modalFormFields.style.display = 'flex';
            fetchStatusMsg.className = 'fetch-status-msg success';
            fetchStatusMsg.textContent = 'Details loaded! Review below and click Apply.';
        } catch (err) {
            console.error('Fetch error:', err);
            fetchStatusMsg.className = 'fetch-status-msg error';
            fetchStatusMsg.textContent = 'Could not fetch remote details. You can enter details manually below.';
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
        bmsInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleFetchDetails();
            }
        });
    }

    // Apply button: updates the ticket card & QR code with the exact fetched data
    if (btnApplyDetails) {
        btnApplyDetails.addEventListener('click', () => {
            const titleVal = fieldTitle.value.trim() || 'Cinema Ticket';
            const metaVal = fieldMeta.value.trim() || 'Hindi, 2D';
            const timeVal = fieldTime.value.trim() || 'Sat, 21 Nov, 2026 | 07:15 PM';
            const venueVal = fieldVenue.value.trim() || 'PVR Cinemas (AUDI 1)';
            const screenVal = fieldScreen.value.trim() || 'AUDI 1';
            const seatsVal = fieldSeats.value.trim() || getRandomSeat();
            const bookingIdVal = fieldBookingId.value.trim() || ('ET' + Math.floor(10000000 + Math.random() * 90000000));
            const priceVal = fieldPrice.value.trim() || '450.00';
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

            // 5. Update Venue
            const movieVenueEl = document.querySelector('.movie-venue');
            if (movieVenueEl) {
                movieVenueEl.textContent = venueVal;
            }

            // 6. Update Screen / Audi
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
            showToast(`Ticket updated: ${titleVal}!`);
        });
    }
});
