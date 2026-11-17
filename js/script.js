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
    // Booking ID Generation (uses ?id= param if present, else generates random one)
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
            // Create QR code using auto-detected version (0) and Medium error correction level (M)
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            // Generate clean SVG markup with margin for scannability
            const svgString = qr.createSvgTag({
                cellSize: 4,
                margin: 1,
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

    // Helper: Clean movie slug into search keywords
    function cleanMovieSlug(slug) {
        let cleaned = slug.toLowerCase();
        cleaned = cleaned.replace(/^(?:movie-|cinema-)/, '');
        cleaned = cleaned.replace(/-[a-z]{2,5}-\d{8}$/, '');
        cleaned = cleaned.replace(/-(?:bengaluru|mumbai|delhi|hyderabad|chennai|pune|kolkata|chandigarh|ahmedabad|kochi)$/i, '');
        return cleaned.replace(/-/g, ' ').trim();
    }

    // Helper: Format cinema slug to Title Case with standard abbreviations
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

    // Main parser for BMS Link or Confirmation Text
    function parseInputData(raw) {
        const input = raw.trim();
        const extracted = {
            rawUrl: input.startsWith('http') ? input : null,
            movieQuery: '',
            movieTitle: '',
            movieMeta: '',
            posterUrl: '',
            date: '',
            time: '06:30 AM',
            theater: '',
            screen: 'AUDI 1 IMAX',
            seats: 'SEAT - K09',
            bookingId: 'ET' + Math.floor(10000000 + Math.random() * 90000000),
            price: '1681.42',
            qrData: input.startsWith('http') ? input : shareUrl
        };

        // 1. Check if input is a URL
        if (input.startsWith('http')) {
            // Pattern A: Movie Details: /city/movies/slug/ET00xxxx
            const m1 = input.match(/bookmyshow\.com\/([^/]+)\/movies\/([^/]+)\/([A-Za-z0-9]+)/i);
            if (m1) {
                const city = m1[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                extracted.movieQuery = cleanMovieSlug(m1[2]);
                extracted.bookingId = m1[3];
                extracted.theater = `PVR: Nexus, ${city}`;
            }

            // Pattern B: Buy Tickets / Showtimes: /buytickets/{movie-slug}-{city}/movie-{cityCode}-{eventCode}-MT/{date}
            const m2 = input.match(/buytickets\/([a-z0-9-]+?)-([a-z]+)\/movie-[a-z]+-([A-Za-z0-9]+)-MT\/(\d{8})/i);
            if (m2) {
                extracted.movieQuery = cleanMovieSlug(m2[1]);
                extracted.bookingId = m2[3];
                const parsedDate = parseBmsDate(m2[4]);
                if (parsedDate) extracted.date = parsedDate;
                const city = m2[2].charAt(0).toUpperCase() + m2[2].slice(1);
                extracted.theater = `PVR: Nexus, ${city}`;
            }

            // Pattern C: Cinema showtimes: /buytickets/{cinema-slug}/cinema-{cityCode}-{venueCode}-MT/{date}
            const m3 = input.match(/buytickets\/([a-z0-9-]+)\/cinema-[a-z]+-([A-Za-z0-9]+)-MT\/(\d{8})/i);
            if (m3) {
                extracted.theater = formatTheaterSlug(m3[1]);
                const parsedDate = parseBmsDate(m3[3]);
                if (parsedDate) extracted.date = parsedDate;
                if (m3[1].toLowerCase().includes('imax')) extracted.screen = 'AUDI 1 IMAX';
            }

            // Pattern D: Order summary / booking ID
            const mBooking = input.match(/bookingId=([A-Za-z0-9]+)/i) || input.match(/order-summary\/([A-Za-z0-9]+)/i);
            if (mBooking) {
                extracted.bookingId = mBooking[1];
            }

            // If no specific movie query yet, extract from path slug
            if (!extracted.movieQuery) {
                const slugMatch = input.match(/bookmyshow\.com\/(?:[^/]+\/)?(?:movies|buytickets)\/([^/?#]+)/i);
                if (slugMatch) {
                    extracted.movieQuery = cleanMovieSlug(slugMatch[1]);
                }
            }
        } else {
            // 2. Parse confirmation text (SMS / WhatsApp / Email)
            // Booking ID
            const mBid = input.match(/(?:booking\s*(?:id|no\.?)|ticket\s*(?:id|no\.?)|id)\s*[:#-]?\s*([A-Za-z0-9]+)/i);
            if (mBid) extracted.bookingId = mBid[1].toUpperCase();

            // Total Amount / Price
            const mAmt = input.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
            if (mAmt) extracted.price = mAmt[1].replace(/,/g, '');

            // Seats
            const mSeats = input.match(/(?:seats?|seat\s*no\.?)\s*[:#-]?\s*([A-Za-z0-9,\s-]+?)(?:\s+(?:audi|booking|total|rs|₹|\.|$)|$)/i);
            if (mSeats) {
                const s = mSeats[1].trim();
                extracted.seats = s.toUpperCase().startsWith('SEAT') ? s.toUpperCase() : `SEAT - ${s.toUpperCase()}`;
            }

            // Audi / Screen
            const mAudi = input.match(/(audi\s*\d+(?:\s+imax)?|screen\s*\d+|imax\s*2d|imax\s*3d)/i);
            if (mAudi) extracted.screen = mAudi[1].toUpperCase();

            // Cinema / Theater
            const mCinema = input.match(/(?:at|venue|cinema)\s*[:#-]?\s*([^,\n|]+(?:pvr|inox|cinepolis|cine|mall|nexus)[^,\n|]*)/i)
                || input.match(/((?:pvr|inox|cinepolis|miraj)[^,\n|]+)/i);
            if (mCinema) {
                let c = mCinema[1].trim();
                c = c.replace(/\s+on\s+(?:mon|tue|wed|thu|fri|sat|sun).*$/i, '');
                extracted.theater = c;
            }

            // Time
            const mTime = input.match(/(\d{1,2}:\d{2}\s*(?:am|pm))/i);
            if (mTime) extracted.time = mTime[1].toUpperCase();

            // Movie name from text: "ticket for {Movie} at" or "for {Movie} ("
            const mMovie = input.match(/(?:for|movie|film)\s+([A-Za-z0-9\s:''-]+?)(?:\s*\((?:a|ua|u|pg-13|r)\)|\s+at\s+|\s+on\s+)/i);
            if (mMovie) {
                extracted.movieQuery = mMovie[1].trim();
            } else {
                // First line or non-empty string as search query
                const firstLine = input.split('\n')[0].trim();
                if (firstLine.length < 50) extracted.movieQuery = firstLine;
            }
        }

        return extracted;
    }

    // Fetch movie details from TMDB API
    async function fetchTmdbDetails(movieQuery) {
        if (!movieQuery) return null;
        try {
            const searchUrl = `${TMDB_BASE}/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(movieQuery)}`;
            const res = await fetch(searchUrl);
            const data = await res.json();
            if (!data.results || data.results.length === 0) return null;

            const movie = data.results[0];
            // Fetch detailed record with release dates for Indian certification
            const detailUrl = `${TMDB_BASE}/movie/${movie.id}?api_key=${TMDB_KEY}&append_to_response=release_dates`;
            const detailRes = await fetch(detailUrl);
            const detailData = await detailRes.json();

            // Determine certification
            let cert = '';
            if (detailData.release_dates && detailData.release_dates.results) {
                const inRelease = detailData.release_dates.results.find(r => r.iso_3166_1 === 'IN');
                if (inRelease && inRelease.release_dates) {
                    const c = inRelease.release_dates.find(d => d.certification && d.certification.trim() !== '');
                    if (c) cert = c.certification.trim();
                }
                if (!cert) {
                    const usRelease = detailData.release_dates.results.find(r => r.iso_3166_1 === 'US');
                    if (usRelease && usRelease.release_dates) {
                        const c = usRelease.release_dates.find(d => d.certification && d.certification.trim() !== '');
                        if (c) cert = c.certification.trim();
                    }
                }
            }
            if (!cert && detailData.adult) cert = 'A';

            // Determine language
            const langCode = detailData.original_language || movie.original_language || 'en';
            const langName = LANG_MAP[langCode] || langCode.toUpperCase();

            // Poster
            const posterPath = detailData.poster_path || movie.poster_path;
            const posterFullUrl = posterPath ? `${IMG_BASE}${posterPath}` : null;

            // Release date fallback
            let releaseDateFormatted = null;
            if (detailData.release_date) {
                const d = new Date(detailData.release_date);
                if (!isNaN(d.getTime())) {
                    releaseDateFormatted = d.toLocaleDateString('en-US', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                    });
                }
            }

            return {
                title: detailData.title || movie.title,
                tagline: detailData.tagline || '',
                cert: cert,
                language: langName,
                posterUrl: posterFullUrl,
                releaseDate: releaseDateFormatted
            };
        } catch (err) {
            console.error('TMDB fetch error:', err);
            return null;
        }
    }

    // Handle Fetch button click
    async function handleFetchDetails() {
        const raw = bmsInput.value.trim();
        if (!raw) {
            fetchStatusMsg.className = 'fetch-status-msg error';
            fetchStatusMsg.textContent = 'Please paste a BookMyShow link or booking confirmation text.';
            return;
        }

        // Show loading state
        const btnText = btnFetchDetails.querySelector('.btn-text');
        const btnLoader = btnFetchDetails.querySelector('.btn-loader');
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        btnFetchDetails.disabled = true;
        fetchStatusMsg.className = 'fetch-status-msg info';
        fetchStatusMsg.textContent = 'Extracting link & fetching movie data...';

        try {
            const parsed = parseInputData(raw);
            let tmdb = null;
            if (parsed.movieQuery) {
                tmdb = await fetchTmdbDetails(parsed.movieQuery);
            }

            // Construct title with rating
            let titleString = '';
            let metaString = '';
            let posterSrc = parsed.posterUrl || posterImgEl.src;
            let dateString = parsed.date || (tmdb && tmdb.releaseDate ? tmdb.releaseDate : 'Wed, 26 Aug, 2026');
            let fullTimeString = `${dateString} | ${parsed.time}`;

            if (tmdb) {
                // If TMDB has a catchy tagline and title is brief, display both
                if (tmdb.tagline && tmdb.tagline.length < 40 && !tmdb.title.toLowerCase().includes(tmdb.tagline.toLowerCase())) {
                    const cleanTagline = tmdb.tagline.replace(/[.]+$/, '');
                    titleString = `${tmdb.title}: ${cleanTagline}`;
                } else {
                    titleString = tmdb.title;
                }
                if (tmdb.cert) {
                    titleString += ` (${tmdb.cert})`;
                }
                metaString = `${tmdb.language}, IMAX 2D`;
                if (tmdb.posterUrl) {
                    posterSrc = tmdb.posterUrl;
                }
            } else if (parsed.movieQuery) {
                titleString = parsed.movieQuery.replace(/\b\w/g, c => c.toUpperCase());
                metaString = 'Kannada, IMAX 2D';
            } else {
                titleString = 'Toxic: A Fairy Tale for Grown-ups (A)';
                metaString = 'Kannada, IMAX 2D';
            }

            const venueString = parsed.theater
                ? (parsed.theater.includes('(') ? parsed.theater : `${parsed.theater} (${parsed.screen})`)
                : 'PVR: Nexus (Formerly Forum), Koramangala (AUDI 1 IMAX)';

            // Populate form fields
            fieldTitle.value = titleString;
            fieldMeta.value = metaString;
            fieldTime.value = fullTimeString;
            fieldVenue.value = venueString;
            fieldScreen.value = parsed.screen;
            fieldSeats.value = parsed.seats;
            fieldBookingId.value = parsed.bookingId;
            fieldPrice.value = parsed.price;

            // Update preview
            previewPosterImg.src = posterSrc;
            previewTitle.textContent = titleString;
            previewMeta.textContent = metaString;
            previewVenue.textContent = venueString;
            previewDate.textContent = fullTimeString;

            currentFetchedData = {
                title: titleString,
                meta: metaString,
                time: fullTimeString,
                venue: venueString,
                screen: parsed.screen,
                seats: parsed.seats,
                bookingId: parsed.bookingId,
                price: parsed.price,
                posterUrl: posterSrc,
                qrData: parsed.rawUrl || `https://in.bookmyshow.com/order-summary/${parsed.bookingId}/PVFF?bookingId=${parsed.bookingId}`
            };

            // Display preview and fields
            previewCard.style.display = 'grid';
            modalFormFields.style.display = 'flex';
            fetchStatusMsg.className = 'fetch-status-msg success';
            fetchStatusMsg.textContent = 'Details fetched successfully! Review and click Apply.';
        } catch (err) {
            console.error('Fetch failed:', err);
            fetchStatusMsg.className = 'fetch-status-msg error';
            fetchStatusMsg.textContent = 'Could not parse link. You can still enter details manually below.';
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

    // Apply button: updates the ticket card & QR code
    if (btnApplyDetails) {
        btnApplyDetails.addEventListener('click', () => {
            const titleVal = fieldTitle.value.trim() || 'Toxic: A Fairy Tale for Grown-ups (A)';
            const metaVal = fieldMeta.value.trim() || 'Kannada, IMAX 2D';
            const timeVal = fieldTime.value.trim() || 'Wed, 26 Aug, 2026 | 06:30 AM';
            const venueVal = fieldVenue.value.trim() || 'PVR: Nexus, Koramangala (AUDI 1 IMAX)';
            const screenVal = fieldScreen.value.trim() || 'AUDI 1 IMAX';
            const seatsVal = fieldSeats.value.trim() || 'SEAT - K09';
            const bookingIdVal = fieldBookingId.value.trim() || 'ET00513508';
            const priceVal = fieldPrice.value.trim() || '1681.42';
            const posterSrc = (currentFetchedData && currentFetchedData.posterUrl)
                ? currentFetchedData.posterUrl
                : posterImgEl.src;

            // 1. Update Poster
            if (posterImgEl) {
                posterImgEl.src = posterSrc;
            }

            // 2. Update Movie Title (with rating span)
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

            // 3. Update Meta
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

            // 6. Update Screen
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
                shareUrl = `https://in.bookmyshow.com/order-summary/${bookingIdVal}/PVFF?bookingId=${bookingIdVal}`;
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
            showToast('Ticket auto-filled from BookMyShow!');
        });
    }
});
