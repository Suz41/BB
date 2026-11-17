/**
 * BookMyShow (BMS) Dedicated Data Extractor for BB
 * Modular extraction engine with validation, status tracking, and strict anti-fabrication rules.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.BmsExtractor = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Status Constants
    const STATUS = {
        VERIFIED: 'verified',
        INFERRED: 'inferred',
        MANUAL: 'manual',
        MISSING: 'missing'
    };

    const OVERALL_STATUS = {
        IDLE: 'IDLE',
        FETCHING: 'FETCHING',
        SUCCESS: 'SUCCESS',
        NEEDS_CONFIRMATION: 'NEEDS_CONFIRMATION',
        LOGIN_REQUIRED: 'LOGIN_REQUIRED',
        UNAVAILABLE: 'UNAVAILABLE'
    };

    // Approved BookMyShow hosts to prevent SSRF / malicious requests
    const APPROVED_HOSTS = new Set([
        'in.bookmyshow.com',
        'bookmyshow.com',
        'www.bookmyshow.com',
        'bms.bz',
        'm.bookmyshow.com'
    ]);

    /**
     * Create a standard validated field descriptor
     */
    function createField(value = null, source = 'none', extractionStatus = STATUS.MISSING, confidence = 0.0) {
        const isPresent = value !== null && value !== undefined && String(value).trim() !== '';
        return {
            value: isPresent ? value : null,
            source: isPresent ? source : 'none',
            extractionStatus: isPresent ? extractionStatus : STATUS.MISSING,
            confidence: isPresent ? Math.min(1.0, Math.max(0.0, confidence)) : 0.0
        };
    }

    /**
     * Helper to clean slugs into human-readable Title Case
     */
    function cleanTitle(str) {
        if (!str) return '';
        let s = str.toLowerCase();
        s = s.replace(/^(?:movie-|cinema-|event-)/i, '');
        s = s.replace(/-[a-z]{2,5}-\d{8}$/i, '');
        s = s.replace(/-(?:bengaluru|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata|chandigarh|ahmedabad|kochi|jaipur|lucknow|indore|surat|bhopal)$/i, '');
        s = s.replace(/[-_]+/g, ' ');
        s = s.replace(/\b(part|chapter)\s+(\d+)\b/gi, '$1 $2');
        s = s.replace(/\s+/g, ' ').trim();
        return s.replace(/\b\w/g, c => c.toUpperCase());
    }

    /**
     * Format cinema slug into Title Case
     */
    function formatCinemaSlug(slug) {
        if (!slug) return '';
        const words = slug.split(/[-_]+/);
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

    /**
     * Parse YYYYMMDD date string to localized readable date
     */
    function parseDateYmd(dateStr) {
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

    /**
     * Check if a URL belongs to approved BookMyShow domains
     */
    function isApprovedBmsHost(urlStr) {
        try {
            const url = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
            const host = url.hostname.toLowerCase();
            if (APPROVED_HOSTS.has(host)) return true;
            for (const approved of APPROVED_HOSTS) {
                if (host.endsWith('.' + approved)) return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    /**
     * Route handler: /order-summary/{bookingId}/{routeCode}
     */
    function handleOrderSummaryRoute(pathname, urlObj) {
        // e.g. /order-summary/ET00516631/IMMO
        const parts = pathname.split('/').filter(Boolean);
        // parts[0] === 'order-summary'
        let bookingId = '';
        let routeCode = '';

        if (parts.length >= 2) {
            // Check if parts[1] is ET...
            if (/^ET\d+/i.test(parts[1])) {
                bookingId = parts[1].toUpperCase();
                routeCode = parts[2] ? parts[2].toUpperCase() : '';
            } else if (parts.length >= 3 && /^ET\d+/i.test(parts[2])) {
                routeCode = parts[1].toUpperCase();
                bookingId = parts[2].toUpperCase();
            } else {
                bookingId = parts[1].toUpperCase();
                routeCode = parts[2] ? parts[2].toUpperCase() : '';
            }
        }

        // Check query param fallback
        if (!bookingId && urlObj && urlObj.searchParams.get('bookingId')) {
            bookingId = urlObj.searchParams.get('bookingId').toUpperCase();
        }

        return {
            routeType: 'order-summary',
            isBookingUrl: true,
            isTheaterOnlyUrl: false,
            bookingId: bookingId,
            orderCode: routeCode,
            movieQuery: '', // CRITICAL: Never interpret routeCode (e.g. IMMO) as movie title!
            city: '',
            date: '',
            format: '',
            screen: '',
            requiresAuth: true
        };
    }

    /**
     * Route handler: /movies/{city}/{movie-slug} or /{city}/movies/{movie-slug}/{eventCode}
     */
    function handleMoviesRoute(pathname, urlObj) {
        const parts = pathname.split('/').filter(Boolean);
        let city = '';
        let movieSlug = '';
        let eventCode = '';

        if (parts[0] === 'movies' && parts.length >= 2) {
            // /movies/{city}/{movie-slug}/...
            city = parts[1].toLowerCase();
            movieSlug = parts[2] || '';
            if (parts[3] && /^ET\d+/i.test(parts[3])) {
                eventCode = parts[3].toUpperCase();
            }
        } else if (parts[1] === 'movies' && parts.length >= 3) {
            // /{city}/movies/{movie-slug}/{eventCode}
            city = parts[0].toLowerCase();
            movieSlug = parts[2] || '';
            if (parts[3] && /^ET\d+/i.test(parts[3])) {
                eventCode = parts[3].toUpperCase();
            }
        }

        // Also check if movieSlug contains trailing event code
        if (!eventCode && movieSlug) {
            const mEt = movieSlug.match(/-(ET\d+)$/i);
            if (mEt) {
                eventCode = mEt[1].toUpperCase();
                movieSlug = movieSlug.replace(/-(ET\d+)$/i, '');
            }
        }

        const movieTitle = cleanTitle(movieSlug);

        return {
            routeType: 'movies',
            isBookingUrl: false,
            isTheaterOnlyUrl: false,
            bookingId: eventCode,
            orderCode: '',
            movieQuery: movieTitle,
            city: city,
            date: '',
            format: '',
            screen: '',
            requiresAuth: false
        };
    }

    /**
     * Route handler: /buytickets/{movie-slug}-{city}/... or /buytickets/{cinema-slug}/cinema-...
     */
    function handleBuyTicketsRoute(pathname, urlObj) {
        const parts = pathname.split('/').filter(Boolean);
        // parts[0] === 'buytickets'
        let city = '';
        let movieQuery = '';
        let theater = '';
        let isTheaterOnly = false;
        let date = '';
        let eventCode = '';

        // Extract date YYYYMMDD from parts
        for (const p of parts) {
            if (/^\d{8}$/.test(p)) {
                date = parseDateYmd(p) || '';
                break;
            }
            if (/^ET\d+/i.test(p)) {
                eventCode = p.toUpperCase();
            }
        }

        if (parts[2] && parts[2].startsWith('cinema-')) {
            // /buytickets/{cinema-slug}/cinema-{cityCode}-{cinemaCode}-MT/{date}
            isTheaterOnly = true;
            theater = formatCinemaSlug(parts[1]);
            const mCity = parts[2].match(/cinema-([a-z]+)-/i);
            if (mCity) city = mCity[1].toLowerCase();
        } else if (parts[1]) {
            // /buytickets/{movie-slug}-{city}/movie-{cityCode}-{eventCode}-MT/{date}
            const mMovie = parts[1].match(/^(.+?)-([a-z]+)$/i);
            if (mMovie) {
                movieQuery = cleanTitle(mMovie[1]);
                city = mMovie[2].toLowerCase();
            } else {
                movieQuery = cleanTitle(parts[1]);
            }

            if (!eventCode && parts[2]) {
                const mEt = parts[2].match(/(ET\d+)/i);
                if (mEt) eventCode = mEt[1].toUpperCase();
            }
        }

        return {
            routeType: 'buytickets',
            isBookingUrl: false,
            isTheaterOnlyUrl: isTheaterOnly,
            bookingId: eventCode,
            orderCode: '',
            movieQuery: movieQuery,
            city: city,
            theater: theater,
            date: date,
            format: '',
            screen: '',
            requiresAuth: false
        };
    }

    /**
     * Route handler: /cinemas/{city}/{cinema-slug}/{cinemaCode}
     */
    function handleCinemasRoute(pathname, urlObj) {
        const parts = pathname.split('/').filter(Boolean);
        // parts[0] === 'cinemas' or parts contains 'cinemas'
        const cIdx = parts.indexOf('cinemas');
        const city = parts[cIdx + 1] ? parts[cIdx + 1].toLowerCase() : '';
        const cinemaSlug = parts[cIdx + 2] || '';
        const cinemaName = formatCinemaSlug(cinemaSlug);

        return {
            routeType: 'cinemas',
            isBookingUrl: false,
            isTheaterOnlyUrl: true,
            bookingId: '',
            orderCode: '',
            movieQuery: '',
            city: city,
            theater: cinemaName,
            date: '',
            format: '',
            screen: '',
            requiresAuth: false
        };
    }

    /**
     * Route handler: generic BMS URL fallback
     */
    function handleGenericBmsRoute(pathname, urlObj) {
        const parts = pathname.split('/').filter(Boolean);
        let bookingId = '';
        let date = '';

        for (const p of parts) {
            if (/^ET\d+/i.test(p)) {
                bookingId = p.toUpperCase();
            } else if (/^\d{8}$/.test(p)) {
                date = parseDateYmd(p) || '';
            }
        }

        return {
            routeType: 'unknown-bms',
            isBookingUrl: false,
            isTheaterOnlyUrl: false,
            bookingId: bookingId,
            orderCode: '',
            movieQuery: '',
            city: '',
            date: date,
            format: '',
            screen: '',
            requiresAuth: false
        };
    }

    /**
     * Extract structured fields from booking confirmation SMS or WhatsApp text
     */
    function extractFromConfirmationText(rawText) {
        const input = rawText.trim();
        const lower = input.toLowerCase();

        // 1. Booking ID (ET... or alphanumeric booking reference)
        let bookingId = null;
        let bookingIdConfidence = 0.0;
        const etMatch = input.match(/\b(ET\d{6,12})\b/i);
        if (etMatch) {
            bookingId = etMatch[1].toUpperCase();
            bookingIdConfidence = 1.0;
        } else {
            const bIdMatch = input.match(/(?:booking\s*(?:id|no\.?|code|ref\.?)|ticket\s*(?:id|no\.?)|id)\s*[:#-]?\s*([A-Za-z0-9]{6,16})/i);
            if (bIdMatch) {
                bookingId = bIdMatch[1].toUpperCase();
                bookingIdConfidence = 0.9;
            }
        }

        // 2. Movie Title & Language & Format
        let movieTitle = null;
        let movieLang = null;
        let movieFormat = null;
        let movieConfidence = 0.0;

        const mMovie = input.match(/(?:booking\s+confirmed\s+for|booking\s+for|movie|film)\s*[:#-]?\s*([^,\n]+?)(?:\s*\(([^)]+)\)|,\s*venue|,\s*theater|,\s*theatre|,\s*cinema|,\s*date|,\s*time|\s+at\s+|\s+on\s+|$)/i);
        if (mMovie) {
            movieTitle = mMovie[1].trim();
            movieConfidence = 0.95;
            if (mMovie[2]) {
                const metaParts = mMovie[2].split(',').map(s => s.trim());
                if (metaParts.length >= 2) {
                    movieLang = metaParts[0];
                    movieFormat = metaParts[1];
                } else if (metaParts.length === 1) {
                    const tag = metaParts[0].toLowerCase();
                    if (['2d', '3d', 'imax', 'imax 2d', 'imax 3d', '4dx', '4dx 3d', 'dolby atmos'].includes(tag)) {
                        movieFormat = metaParts[0].toUpperCase();
                    } else {
                        movieLang = metaParts[0];
                    }
                }
            }
        }

        // Format detection if not in parenthesized metadata
        if (!movieFormat) {
            if (lower.includes('imax 3d') || lower.includes('imax-3d')) movieFormat = 'IMAX 3D';
            else if (lower.includes('imax 2d') || lower.includes('imax-2d') || lower.includes('imax')) movieFormat = 'IMAX 2D';
            else if (lower.includes('4dx 3d') || lower.includes('4dx-3d')) movieFormat = '4DX 3D';
            else if (lower.includes('4dx')) movieFormat = '4DX';
            else if (lower.includes('dolby atmos') || lower.includes('atmos')) movieFormat = 'Dolby Atmos';
            else if (lower.includes('3d')) movieFormat = '3D';
            else if (lower.includes('2d')) movieFormat = '2D';
        }

        // 3. Cinema Name & Location
        let cinemaName = null;
        let cinemaLocation = null;
        let cinemaConfidence = 0.0;

        const mVenue = input.match(/(?:venue|theater|theatre|cinema|at)\s*[:#-]?\s*([^,\n]+?(?:,[^,\n]+?)?)(?:,\s*screen|,\s*audi|,\s*time|,\s*date|,\s*movie|,\s*seats?|\s+on\s+\w+|\s+at\s+\d+|$)/i);
        if (mVenue && !mVenue[1].toLowerCase().includes('confirmed for')) {
            const venueStr = mVenue[1].trim();
            cinemaName = venueStr;
            cinemaConfidence = 0.9;
            const vParts = venueStr.split(',').map(s => s.trim());
            if (vParts.length >= 2) {
                cinemaLocation = vParts[vParts.length - 1];
            }
        }

        // 4. Screen / Audi
        let screen = null;
        let screenConfidence = 0.0;
        const mAudi = input.match(/\b(?:screen|audi)\s*[:#-]?\s*(\d+[A-Za-z0-9\s()]*?)(?:[,.]|\s+seats?|\s+on|\s+at|$)/i);
        if (mAudi) {
            screen = mAudi[0].replace(/[,.]/g, '').trim().toUpperCase();
            screenConfidence = 0.9;
        }

        // 5. Seats
        let seats = null;
        let seatsConfidence = 0.0;
        const mSeats = input.match(/(?:seats?|seat\s*no\.?)\s*[:#-]?\s*([A-Za-z0-9,\s-]+?)(?:[.]|\s+ticket|\s+convenience|\s+total|\s+booking|\s+rs|\s+₹|$)/i);
        if (mSeats) {
            const rawSeats = mSeats[1].trim().toUpperCase();
            seats = rawSeats.startsWith('SEAT') ? rawSeats : `SEAT - ${rawSeats}`;
            seatsConfidence = 0.95;
        }

        // 6. Show Date
        let showDate = null;
        let showDateConfidence = 0.0;
        const mDate = input.match(/(?:date\s*[:#-]?\s*|on\s+)?([A-Za-z]{3},\s*\d{1,2}\s+[A-Za-z]{3}(?:,?\s*\d{4})?|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3}\s+\d{4})/i);
        if (mDate) {
            showDate = mDate[1].trim();
            showDateConfidence = 0.9;
        }

        // 7. Show Time
        let showTime = null;
        let showTimeConfidence = 0.0;
        const mTime = input.match(/\b(\d{1,2}:\d{2}\s*(?:am|pm))\b/i);
        if (mTime) {
            showTime = mTime[1].toUpperCase();
            showTimeConfidence = 0.95;
        }

        // 8. Pricing: Ticket Price, Convenience Fee, Total Amount
        let ticketPrice = null;
        let convenienceFee = null;
        let totalAmount = null;

        const mTotal = input.match(/(?:total\s*amount|total\s*paid|total)\s*[:#-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (mTotal) {
            totalAmount = mTotal[1].replace(/,/g, '');
        }

        const mPrice = input.match(/(?:ticket\s*price|base\s*amount|tickets?)\s*[:#-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (mPrice) {
            ticketPrice = mPrice[1].replace(/,/g, '');
        }

        const mFee = input.match(/(?:convenience\s*fee|conv\.\s*fee|taxes?)\s*[:#-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);
        if (mFee) {
            convenienceFee = mFee[1].replace(/,/g, '');
        }

        // Fallback for single price match if total not explicitly labeled
        if (!totalAmount && !ticketPrice) {
            const mAnyAmount = input.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
            if (mAnyAmount) {
                totalAmount = mAnyAmount[1].replace(/,/g, '');
            }
        }

        return {
            movieTitle: createField(movieTitle, 'bms-text', movieTitle ? STATUS.VERIFIED : STATUS.MISSING, movieConfidence),
            movieLanguage: createField(movieLang, 'bms-text', movieLang ? STATUS.VERIFIED : STATUS.MISSING, movieLang ? 0.9 : 0.0),
            cinemaName: createField(cinemaName, 'bms-text', cinemaName ? STATUS.VERIFIED : STATUS.MISSING, cinemaConfidence),
            cinemaLocation: createField(cinemaLocation, 'bms-text', cinemaLocation ? STATUS.INFERRED : STATUS.MISSING, cinemaLocation ? 0.7 : 0.0),
            bookingId: createField(bookingId, 'bms-text', bookingId ? STATUS.VERIFIED : STATUS.MISSING, bookingIdConfidence),
            showDate: createField(showDate, 'bms-text', showDate ? STATUS.VERIFIED : STATUS.MISSING, showDateConfidence),
            showTime: createField(showTime, 'bms-text', showTime ? STATUS.VERIFIED : STATUS.MISSING, showTimeConfidence),
            screen: createField(screen, 'bms-text', screen ? STATUS.VERIFIED : STATUS.MISSING, screenConfidence),
            seats: createField(seats, 'bms-text', seats ? STATUS.VERIFIED : STATUS.MISSING, seatsConfidence),
            ticketPrice: createField(ticketPrice, 'bms-text', ticketPrice ? STATUS.VERIFIED : STATUS.MISSING, ticketPrice ? 0.9 : 0.0),
            convenienceFee: createField(convenienceFee, 'bms-text', convenienceFee ? STATUS.VERIFIED : STATUS.MISSING, convenienceFee ? 0.9 : 0.0),
            totalAmount: createField(totalAmount, 'bms-text', totalAmount ? STATUS.VERIFIED : STATUS.MISSING, totalAmount ? 0.95 : 0.0),
            format: createField(movieFormat, 'bms-text', movieFormat ? STATUS.INFERRED : STATUS.MISSING, movieFormat ? 0.8 : 0.0)
        };
    }

    /**
     * Parse structured data from JSON-LD scripts embedded in BMS pages
     */
    function extractFromJsonLd(htmlText) {
        const results = {};
        if (!htmlText || typeof htmlText !== 'string') return results;

        const jsonLdRegex = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let match;

        while ((match = jsonLdRegex.exec(htmlText)) !== null) {
            try {
                const parsed = JSON.parse(match[1].trim());
                const items = Array.isArray(parsed) ? parsed : [parsed];
                for (const item of items) {
                    const type = item['@type'];
                    if (type === 'Movie') {
                        if (item.name) results.movieTitle = item.name;
                        if (item.inLanguage) results.movieLanguage = item.inLanguage;
                        if (item.image) results.posterUrl = typeof item.image === 'string' ? item.image : (item.image.url || null);
                    } else if (type === 'ScreeningEvent' || type === 'Event') {
                        if (item.name && !results.movieTitle) results.movieTitle = item.name;
                        if (item.startDate) {
                            const d = new Date(item.startDate);
                            if (!isNaN(d.getTime())) {
                                results.showDate = d.toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });
                                results.showTime = d.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                });
                            }
                        }
                        if (item.location) {
                            if (typeof item.location === 'string') results.cinemaName = item.location;
                            else if (item.location.name) results.cinemaName = item.location.name;
                            if (item.location.address) {
                                results.cinemaLocation = typeof item.location.address === 'string'
                                    ? item.location.address
                                    : (item.location.address.addressLocality || null);
                            }
                        }
                    } else if (type === 'MovieTheater') {
                        if (item.name) results.cinemaName = item.name;
                        if (item.address) {
                            results.cinemaLocation = typeof item.address === 'string'
                                ? item.address
                                : (item.address.addressLocality || null);
                        }
                    }
                }
            } catch {
                // Ignore JSON-LD parse errors for non-standard scripts
            }
        }

        return results;
    }

    /**
     * Parse HTML fallback (meta tags, title, window initial state)
     */
    function extractFromHtmlFallback(htmlText) {
        const results = {};
        if (!htmlText || typeof htmlText !== 'string') return results;

        // OpenGraph tags
        const ogTitleMatch = htmlText.match(/<meta\s+[^>]*property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                             htmlText.match(/<meta\s+[^>]*content=["']([^"']+)["']\s+property=["']og:title["']/i);
        if (ogTitleMatch) {
            const rawTitle = ogTitleMatch[1];
            const clean = rawTitle.replace(/\s*\|.*$/, '').replace(/Tickets.*$/i, '').trim();
            if (clean && !results.movieTitle) results.movieTitle = clean;
        }

        // Embedded initial state (window.__INITIAL_STATE__ or window.__DATA__)
        const stateMatch = htmlText.match(/window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});/);
        if (stateMatch) {
            try {
                const state = JSON.parse(stateMatch[1]);
                if (state.movie && state.movie.title) results.movieTitle = state.movie.title;
                if (state.movie && state.movie.language) results.movieLanguage = state.movie.language;
                if (state.venue && state.venue.name) results.cinemaName = state.venue.name;
            } catch {
                // Ignore embedded JSON syntax errors
            }
        }

        return results;
    }

    /**
     * Compute field summary statistics
     */
    function computeSummary(fields) {
        let verifiedCount = 0;
        let inferredCount = 0;
        let missingCount = 0;
        let manualCount = 0;

        for (const key of Object.keys(fields)) {
            const status = fields[key].extractionStatus;
            if (status === STATUS.VERIFIED) verifiedCount++;
            else if (status === STATUS.INFERRED) inferredCount++;
            else if (status === STATUS.MANUAL) manualCount++;
            else missingCount++;
        }

        return {
            verifiedCount,
            inferredCount,
            missingCount,
            manualCount,
            totalFields: Object.keys(fields).length
        };
    }

    /**
     * Core BMS Parser: Analyzes URL structure or confirmation text
     * Returns structured parsed metadata and initial fields without making network calls.
     */
    function parseInput(rawInput) {
        const input = (rawInput || '').trim();

        // 1. Check if input contains an approved or standard URL
        const urlMatch = input.match(/(https?:\/\/[^\s]+|in\.bookmyshow\.com[^\s]+|bookmyshow\.com[^\s]+|bms\.bz[^\s]+)/i);
        const rawUrl = urlMatch ? (urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`) : null;

        // If no URL, parse as text / SMS
        if (!rawUrl) {
            const textFields = extractFromConfirmationText(input);
            const summary = computeSummary(textFields);
            const bookingIdVal = textFields.bookingId.value || '';
            const movieVal = textFields.movieTitle.value || '';

            return {
                isUrl: false,
                isValidBmsUrl: false,
                rawUrl: null,
                routeType: 'text',
                isBookingUrl: Boolean(bookingIdVal),
                isTheaterOnlyUrl: false,
                bookingId: bookingIdVal,
                orderCode: '',
                movieQuery: movieVal,
                city: textFields.cinemaLocation.value || '',
                status: summary.verifiedCount > 0 ? OVERALL_STATUS.SUCCESS : OVERALL_STATUS.NEEDS_CONFIRMATION,
                statusMessage: summary.verifiedCount > 0
                    ? 'Information retrieved from confirmation text.'
                    : 'Some fields require confirmation.',
                requiresAuth: false,
                fields: textFields,
                summary: summary
            };
        }

        // 2. Validate URL host
        const isValidBms = isApprovedBmsHost(rawUrl);
        let urlObj;
        try {
            urlObj = new URL(rawUrl);
        } catch {
            return {
                isUrl: true,
                isValidBmsUrl: false,
                rawUrl: rawUrl,
                routeType: 'malformed',
                isBookingUrl: false,
                isTheaterOnlyUrl: false,
                bookingId: '',
                orderCode: '',
                movieQuery: '',
                city: '',
                status: OVERALL_STATUS.UNAVAILABLE,
                statusMessage: 'Invalid URL provided.',
                requiresAuth: false,
                fields: {
                    movieTitle: createField(null),
                    movieLanguage: createField(null),
                    cinemaName: createField(null),
                    cinemaLocation: createField(null),
                    bookingId: createField(null),
                    showDate: createField(null),
                    showTime: createField(null),
                    screen: createField(null),
                    seats: createField(null),
                    ticketPrice: createField(null),
                    convenienceFee: createField(null),
                    totalAmount: createField(null),
                    format: createField(null)
                },
                summary: { verifiedCount: 0, inferredCount: 0, missingCount: 13, manualCount: 0, totalFields: 13 }
            };
        }

        if (!isValidBms) {
            return {
                isUrl: true,
                isValidBmsUrl: false,
                rawUrl: rawUrl,
                routeType: 'external-host',
                isBookingUrl: false,
                isTheaterOnlyUrl: false,
                bookingId: '',
                orderCode: '',
                movieQuery: '',
                city: '',
                status: OVERALL_STATUS.UNAVAILABLE,
                statusMessage: 'URL host is not an approved BookMyShow domain.',
                requiresAuth: false,
                fields: {
                    movieTitle: createField(null),
                    movieLanguage: createField(null),
                    cinemaName: createField(null),
                    cinemaLocation: createField(null),
                    bookingId: createField(null),
                    showDate: createField(null),
                    showTime: createField(null),
                    screen: createField(null),
                    seats: createField(null),
                    ticketPrice: createField(null),
                    convenienceFee: createField(null),
                    totalAmount: createField(null),
                    format: createField(null)
                },
                summary: { verifiedCount: 0, inferredCount: 0, missingCount: 13, manualCount: 0, totalFields: 13 }
            };
        }

        // 3. Route Classification
        const pathname = urlObj.pathname.replace(/\/+$/, '');
        let routeData;

        if (pathname.includes('/order-summary/') || pathname.startsWith('/order-summary')) {
            routeData = handleOrderSummaryRoute(pathname, urlObj);
        } else if (pathname.includes('/movies/') || pathname.startsWith('/movies')) {
            routeData = handleMoviesRoute(pathname, urlObj);
        } else if (pathname.includes('/buytickets/') || pathname.startsWith('/buytickets')) {
            routeData = handleBuyTicketsRoute(pathname, urlObj);
        } else if (pathname.includes('/cinemas/') || pathname.startsWith('/cinemas')) {
            routeData = handleCinemasRoute(pathname, urlObj);
        } else {
            routeData = handleGenericBmsRoute(pathname, urlObj);
        }

        // Format detection from URL or query
        let formatVal = routeData.format || null;
        let formatStatus = STATUS.MISSING;
        let formatConfidence = 0.0;
        const lowerUrl = rawUrl.toLowerCase();
        if (lowerUrl.includes('imax-3d') || lowerUrl.includes('imax%203d')) {
            formatVal = 'IMAX 3D';
            formatStatus = STATUS.INFERRED;
            formatConfidence = 0.8;
        } else if (lowerUrl.includes('imax-2d') || lowerUrl.includes('imax%202d') || lowerUrl.includes('imax')) {
            formatVal = 'IMAX 2D';
            formatStatus = STATUS.INFERRED;
            formatConfidence = 0.8;
        } else if (lowerUrl.includes('4dx-3d') || lowerUrl.includes('4dx%203d')) {
            formatVal = '4DX 3D';
            formatStatus = STATUS.INFERRED;
            formatConfidence = 0.8;
        } else if (lowerUrl.includes('4dx')) {
            formatVal = '4DX';
            formatStatus = STATUS.INFERRED;
            formatConfidence = 0.8;
        }

        // Initialize 13 fields with strict attribution and NO fabricated values
        const fields = {
            movieTitle: createField(
                routeData.movieQuery || null,
                routeData.movieQuery ? 'bms-url' : 'none',
                routeData.movieQuery ? STATUS.INFERRED : STATUS.MISSING,
                routeData.movieQuery ? 0.75 : 0.0
            ),
            movieLanguage: createField(null),
            cinemaName: createField(
                routeData.theater || null,
                routeData.theater ? 'bms-url' : 'none',
                routeData.theater ? STATUS.INFERRED : STATUS.MISSING,
                routeData.theater ? 0.8 : 0.0
            ),
            cinemaLocation: createField(
                routeData.city || null,
                routeData.city ? 'bms-url' : 'none',
                routeData.city ? STATUS.INFERRED : STATUS.MISSING,
                routeData.city ? 0.8 : 0.0
            ),
            bookingId: createField(
                routeData.bookingId || null,
                routeData.bookingId ? 'bms-url' : 'none',
                routeData.bookingId ? STATUS.VERIFIED : STATUS.MISSING,
                routeData.bookingId ? 1.0 : 0.0
            ),
            showDate: createField(
                routeData.date || null,
                routeData.date ? 'bms-url' : 'none',
                routeData.date ? STATUS.INFERRED : STATUS.MISSING,
                routeData.date ? 0.85 : 0.0
            ),
            showTime: createField(null),
            screen: createField(null),
            seats: createField(null),
            ticketPrice: createField(null),
            convenienceFee: createField(null),
            totalAmount: createField(null),
            format: createField(formatVal, formatVal ? 'bms-url' : 'none', formatStatus, formatConfidence)
        };

        const summary = computeSummary(fields);

        // Determine default status
        let status = OVERALL_STATUS.NEEDS_CONFIRMATION;
        let statusMessage = 'Some fields require confirmation.';

        if (routeData.requiresAuth) {
            status = OVERALL_STATUS.LOGIN_REQUIRED;
            statusMessage = 'Login required: Private booking details require authentication. Enter seats & amount below or paste your booking SMS.';
        } else if (summary.missingCount === 0) {
            status = OVERALL_STATUS.SUCCESS;
            statusMessage = 'Information retrieved.';
        }

        return {
            isUrl: true,
            isValidBmsUrl: true,
            rawUrl: rawUrl,
            routeType: routeData.routeType,
            isBookingUrl: routeData.isBookingUrl,
            isTheaterOnlyUrl: routeData.isTheaterOnlyUrl,
            bookingId: routeData.bookingId || '',
            orderCode: routeData.orderCode || '',
            movieQuery: routeData.movieQuery || '',
            city: routeData.city || '',
            status: status,
            statusMessage: statusMessage,
            requiresAuth: routeData.requiresAuth,
            fields: fields,
            summary: summary
        };
    }

    /**
     * Real Data Retrieval Layer:
     * Attempts retrieval of public BookMyShow page data when permitted.
     * Enforces strict host validation, timeouts, auth checks, and error handling.
     */
    async function retrievePageData(urlStr, options = {}) {
        const timeoutMs = options.timeoutMs || 4500;
        const fetchFn = options.fetchFn || (typeof fetch !== 'undefined' ? fetch : null);

        if (!fetchFn) {
            return {
                status: OVERALL_STATUS.UNAVAILABLE,
                message: 'Network fetch is not supported in this runtime environment.',
                data: null
            };
        }

        if (!isApprovedBmsHost(urlStr)) {
            return {
                status: OVERALL_STATUS.UNAVAILABLE,
                message: 'Access denied: URL is not an approved BookMyShow host.',
                data: null
            };
        }

        // Check if route is a private order summary
        if (urlStr.includes('/order-summary/')) {
            // Private order-summary pages require BookMyShow user session authentication.
            // Do not pretend unauthenticated public HTTP request has access.
            return {
                status: OVERALL_STATUS.LOGIN_REQUIRED,
                message: 'Login required: Order summary details require active BookMyShow account credentials.',
                data: null
            };
        }

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        let timer = null;
        if (controller) {
            timer = setTimeout(() => controller.abort(), timeoutMs);
        }

        try {
            const res = await fetchFn(urlStr, {
                signal: controller ? controller.signal : undefined,
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            });

            if (timer) clearTimeout(timer);

            if (res.status === 401 || res.status === 403) {
                return {
                    status: OVERALL_STATUS.LOGIN_REQUIRED,
                    message: 'Authentication required by BookMyShow.',
                    data: null
                };
            }

            if (res.status === 404) {
                return {
                    status: OVERALL_STATUS.UNAVAILABLE,
                    message: 'BookMyShow page was not found (404).',
                    data: null
                };
            }

            if (!res.ok) {
                return {
                    status: OVERALL_STATUS.UNAVAILABLE,
                    message: `BookMyShow server returned HTTP ${res.status}.`,
                    data: null
                };
            }

            const html = await res.text();

            // Check if page redirected to login shell
            if (html.includes('signin') && html.includes('login') && html.length < 5000) {
                return {
                    status: OVERALL_STATUS.LOGIN_REQUIRED,
                    message: 'Session authentication required.',
                    data: null
                };
            }

            const jsonLdData = extractFromJsonLd(html);
            const fallbackData = extractFromHtmlFallback(html);

            return {
                status: OVERALL_STATUS.SUCCESS,
                message: 'Page retrieved successfully.',
                data: Object.assign({}, fallbackData, jsonLdData)
            };
        } catch (err) {
            if (timer) clearTimeout(timer);
            const isAbort = err && (err.name === 'AbortError' || err.message?.includes('aborted'));
            return {
                status: OVERALL_STATUS.UNAVAILABLE,
                message: isAbort ? 'Request timed out.' : 'Network request to BookMyShow failed or was blocked.',
                error: err,
                data: null
            };
        }
    }

    /**
     * Complete extraction orchestrator:
     * 1. Parses input (URL or text)
     * 2. If valid public URL and not order-summary, attempts retrieval
     * 3. Merges genuine retrieved data without ever fabricating missing fields
     */
    async function extract(rawInput, options = {}) {
        const parsed = parseInput(rawInput);

        // If it's not a URL, or requires auth (order-summary), or is invalid, return immediately
        if (!parsed.isUrl || !parsed.isValidBmsUrl || parsed.requiresAuth) {
            return parsed;
        }

        // If public page retrieval is requested/permitted:
        if (options.retrieve !== false) {
            const retrieval = await retrievePageData(parsed.rawUrl, options);

            if (retrieval.status === OVERALL_STATUS.SUCCESS && retrieval.data) {
                const d = retrieval.data;

                if (d.movieTitle && !parsed.fields.movieTitle.value) {
                    parsed.fields.movieTitle = createField(d.movieTitle, 'bms-page', STATUS.VERIFIED, 0.95);
                    parsed.movieQuery = d.movieTitle;
                }
                if (d.movieLanguage && !parsed.fields.movieLanguage.value) {
                    parsed.fields.movieLanguage = createField(d.movieLanguage, 'bms-page', STATUS.VERIFIED, 0.9);
                }
                if (d.cinemaName && !parsed.fields.cinemaName.value) {
                    parsed.fields.cinemaName = createField(d.cinemaName, 'bms-page', STATUS.VERIFIED, 0.9);
                }
                if (d.cinemaLocation && !parsed.fields.cinemaLocation.value) {
                    parsed.fields.cinemaLocation = createField(d.cinemaLocation, 'bms-page', STATUS.VERIFIED, 0.85);
                }
                if (d.showDate && !parsed.fields.showDate.value) {
                    parsed.fields.showDate = createField(d.showDate, 'bms-page', STATUS.VERIFIED, 0.95);
                }
                if (d.showTime && !parsed.fields.showTime.value) {
                    parsed.fields.showTime = createField(d.showTime, 'bms-page', STATUS.VERIFIED, 0.95);
                }
            } else if (retrieval.status === OVERALL_STATUS.LOGIN_REQUIRED) {
                parsed.status = OVERALL_STATUS.LOGIN_REQUIRED;
                parsed.statusMessage = retrieval.message;
            } else if (retrieval.status === OVERALL_STATUS.UNAVAILABLE) {
                // If page couldn't be loaded, keep inferred URL fields but set status
                parsed.status = OVERALL_STATUS.NEEDS_CONFIRMATION;
                parsed.statusMessage = 'Some fields require confirmation (could not fetch remote page).';
            }
        }

        parsed.summary = computeSummary(parsed.fields);
        return parsed;
    }

    return {
        STATUS,
        OVERALL_STATUS,
        APPROVED_HOSTS,
        createField,
        cleanTitle,
        formatCinemaSlug,
        parseDateYmd,
        isApprovedBmsHost,
        parseInput,
        extractFromConfirmationText,
        extractFromJsonLd,
        extractFromHtmlFallback,
        retrievePageData,
        extract
    };
}));
