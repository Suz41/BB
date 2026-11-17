/**
 * Automated Test Suite for BookMyShow (BMS) Data Extractor in BB
 * Covers all 10 required test scenarios
 */

const assert = require('assert');
const BmsExtractor = require('../js/bms-extractor');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
    totalTests++;
    try {
        fn();
        console.log(`  ✓ ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ ${testName}`);
        console.error(`    ${err.message}`);
        throw err;
    }
}

async function runAsyncTest(testName, fn) {
    totalTests++;
    try {
        await fn();
        console.log(`  ✓ ${testName}`);
        passedTests++;
    } catch (err) {
        console.error(`  ✗ ${testName}`);
        console.error(`    ${err.message}`);
        throw err;
    }
}

async function main() {
    console.log('\n--- Running BMS Extractor Test Suite ---\n');

    // 1. Provided order-summary URL
    runTest('1. Order Summary URL: /order-summary/ET00516631/IMMO', () => {
        const url = 'https://in.bookmyshow.com/order-summary/ET00516631/IMMO';
        const parsed = BmsExtractor.parseInput(url);

        assert.strictEqual(parsed.isBookingUrl, true, 'isBookingUrl must be true');
        assert.strictEqual(parsed.bookingId, 'ET00516631', 'bookingId must be ET00516631');
        assert.strictEqual(parsed.orderCode, 'IMMO', 'orderCode must be IMMO');
        assert.strictEqual(parsed.movieQuery, '', 'movieQuery must be empty string, never IMMO');
        assert.strictEqual(parsed.routeType, 'order-summary', 'routeType must be order-summary');
        assert.strictEqual(parsed.requiresAuth, true, 'requiresAuth must be true for order-summary');
        assert.strictEqual(parsed.status, BmsExtractor.OVERALL_STATUS.LOGIN_REQUIRED, 'status must be LOGIN_REQUIRED');

        // Verify fields are not fabricated
        assert.strictEqual(parsed.fields.bookingId.value, 'ET00516631');
        assert.strictEqual(parsed.fields.bookingId.extractionStatus, 'verified');
        assert.strictEqual(parsed.fields.seats.value, null, 'Seats must be null (not fabricated)');
        assert.strictEqual(parsed.fields.seats.extractionStatus, 'missing');
        assert.strictEqual(parsed.fields.totalAmount.value, null, 'Total amount must be null');
        assert.strictEqual(parsed.fields.cinemaName.value, null, 'Cinema name must be null');
    });

    // 2. Standard BookMyShow movie URL
    runTest('2. Standard Movie URL: /mumbai/movies/kalki-2898-ad/ET00352941', () => {
        const url = 'https://in.bookmyshow.com/mumbai/movies/kalki-2898-ad/ET00352941';
        const parsed = BmsExtractor.parseInput(url);

        assert.strictEqual(parsed.routeType, 'movies');
        assert.strictEqual(parsed.isBookingUrl, false);
        assert.strictEqual(parsed.city, 'mumbai');
        assert.strictEqual(parsed.bookingId, 'ET00352941');
        assert.strictEqual(parsed.movieQuery, 'Kalki 2898 Ad');
        assert.strictEqual(parsed.fields.movieTitle.value, 'Kalki 2898 Ad');
        assert.strictEqual(parsed.fields.movieTitle.extractionStatus, 'inferred');
        assert.strictEqual(parsed.fields.seats.extractionStatus, 'missing');
    });

    // 3. Buytickets URL
    runTest('3. Buytickets URL: /buytickets/toxic-a-fairy-tale-for-grown-ups-bengaluru/movie-bang-ET00378770-MT/20260826', () => {
        const url = 'https://in.bookmyshow.com/buytickets/toxic-a-fairy-tale-for-grown-ups-bengaluru/movie-bang-ET00378770-MT/20260826';
        const parsed = BmsExtractor.parseInput(url);

        assert.strictEqual(parsed.routeType, 'buytickets');
        assert.strictEqual(parsed.city, 'bengaluru');
        assert.strictEqual(parsed.bookingId, 'ET00378770');
        assert.strictEqual(parsed.movieQuery, 'Toxic A Fairy Tale For Grown Ups');
        assert.ok(parsed.fields.showDate.value.includes('Aug 26, 2026') || parsed.fields.showDate.value.includes('26 Aug, 2026'), 'Date must be parsed accurately');
        assert.strictEqual(parsed.fields.seats.value, null, 'Seats must be missing');
    });

    // 4. Cinema URL
    runTest('4. Cinema URL: /cinemas/bengaluru/pvr-nexus-koramangala/PVKG', () => {
        const url = 'https://in.bookmyshow.com/cinemas/bengaluru/pvr-nexus-koramangala/PVKG';
        const parsed = BmsExtractor.parseInput(url);

        assert.strictEqual(parsed.routeType, 'cinemas');
        assert.strictEqual(parsed.isTheaterOnlyUrl, true);
        assert.strictEqual(parsed.city, 'bengaluru');
        assert.strictEqual(parsed.fields.cinemaName.value, 'PVR: Nexus Koramangala');
        assert.strictEqual(parsed.movieQuery, '', 'Cinema page has no specific movie query');
    });

    // 5. URL with query parameters
    runTest('5. URL with Query Parameters', () => {
        const url = 'https://in.bookmyshow.com/order-summary/ET00516631/IMMO?bookingId=ET00516631&source=sms&utm_medium=bms';
        const parsed = BmsExtractor.parseInput(url);

        assert.strictEqual(parsed.bookingId, 'ET00516631');
        assert.strictEqual(parsed.orderCode, 'IMMO');
        assert.strictEqual(parsed.movieQuery, '');
        assert.strictEqual(parsed.isBookingUrl, true);
    });

    // 6. Malformed URL & Unapproved External Host
    runTest('6. Malformed URL and Unapproved Host', () => {
        const malformed = 'https://not-bms.com/order-summary/ET123456/FAKE';
        const parsed = BmsExtractor.parseInput(malformed);

        assert.strictEqual(parsed.isValidBmsUrl, false);
        assert.strictEqual(parsed.status, BmsExtractor.OVERALL_STATUS.UNAVAILABLE);
        assert.strictEqual(parsed.fields.bookingId.value, null);
    });

    // 7. Inaccessible booking page
    await runAsyncTest('7. Inaccessible booking page handling (network error / 500)', async () => {
        const mockFetch = async () => {
            return {
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            };
        };

        const res = await BmsExtractor.retrievePageData('https://in.bookmyshow.com/movies/mumbai/test/ET12345678', {
            fetchFn: mockFetch
        });

        assert.strictEqual(res.status, BmsExtractor.OVERALL_STATUS.UNAVAILABLE);
        assert.ok(res.message.includes('500'));
    });

    // 8. Authentication-required booking page
    await runAsyncTest('8. Authentication-required booking page', async () => {
        // Direct order-summary check
        const orderSummaryRes = await BmsExtractor.retrievePageData('https://in.bookmyshow.com/order-summary/ET00516631/IMMO');
        assert.strictEqual(orderSummaryRes.status, BmsExtractor.OVERALL_STATUS.LOGIN_REQUIRED);

        // Simulated 401 HTTP response
        const mockFetch401 = async () => ({
            ok: false,
            status: 401,
            text: async () => 'Unauthorized'
        });
        const res401 = await BmsExtractor.retrievePageData('https://in.bookmyshow.com/movies/mumbai/test/ET12345678', {
            fetchFn: mockFetch401
        });
        assert.strictEqual(res401.status, BmsExtractor.OVERALL_STATUS.LOGIN_REQUIRED);
    });

    // 9. Confirmation SMS
    runTest('9. Confirmation SMS parsing', () => {
        const sms = 'Hi! Booking confirmed for Toxic (Kannada, 2D) at PVR: Nexus, Koramangala on Wed, 26 Aug, 2026 at 06:30 AM. Screen: AUDI 1 IMAX. Seats: K09. Ticket Price: Rs. 300, Convenience Fee: Rs. 50, Total: Rs. 350. Booking ID: ET00516631';
        const parsed = BmsExtractor.parseInput(sms);

        assert.strictEqual(parsed.isUrl, false);
        assert.strictEqual(parsed.routeType, 'text');
        assert.strictEqual(parsed.bookingId, 'ET00516631');
        assert.strictEqual(parsed.fields.movieTitle.value, 'Toxic');
        assert.strictEqual(parsed.fields.movieTitle.extractionStatus, 'verified');
        assert.strictEqual(parsed.fields.movieLanguage.value, 'Kannada');
        assert.strictEqual(parsed.fields.format.value, '2D');
        assert.strictEqual(parsed.fields.cinemaName.value, 'PVR: Nexus, Koramangala');
        assert.strictEqual(parsed.fields.showDate.value, 'Wed, 26 Aug, 2026');
        assert.strictEqual(parsed.fields.showTime.value, '06:30 AM');
        assert.strictEqual(parsed.fields.screen.value, 'AUDI 1 IMAX');
        assert.strictEqual(parsed.fields.seats.value, 'SEAT - K09');
        assert.strictEqual(parsed.fields.ticketPrice.value, '300');
        assert.strictEqual(parsed.fields.convenienceFee.value, '50');
        assert.strictEqual(parsed.fields.totalAmount.value, '350');
        assert.strictEqual(parsed.fields.bookingId.value, 'ET00516631');
        assert.strictEqual(parsed.summary.verifiedCount >= 9, true);
    });

    // 10. Missing seat, price, and showtime fields remain missing
    runTest('10. Missing seat, price, and showtime fields remain missing', () => {
        const partialUrl = 'https://in.bookmyshow.com/movies/mumbai/toxic-a-fairy-tale-for-grown-ups/ET00378770';
        const parsed = BmsExtractor.parseInput(partialUrl);

        // Ensure missing fields are strictly missing with value null and confidence 0
        assert.strictEqual(parsed.fields.seats.value, null);
        assert.strictEqual(parsed.fields.seats.extractionStatus, 'missing');
        assert.strictEqual(parsed.fields.seats.confidence, 0.0);

        assert.strictEqual(parsed.fields.ticketPrice.value, null);
        assert.strictEqual(parsed.fields.ticketPrice.extractionStatus, 'missing');
        assert.strictEqual(parsed.fields.ticketPrice.confidence, 0.0);

        assert.strictEqual(parsed.fields.convenienceFee.value, null);
        assert.strictEqual(parsed.fields.convenienceFee.extractionStatus, 'missing');
        assert.strictEqual(parsed.fields.convenienceFee.confidence, 0.0);

        assert.strictEqual(parsed.fields.totalAmount.value, null);
        assert.strictEqual(parsed.fields.totalAmount.extractionStatus, 'missing');
        assert.strictEqual(parsed.fields.totalAmount.confidence, 0.0);

        assert.strictEqual(parsed.fields.showTime.value, null);
        assert.strictEqual(parsed.fields.showTime.extractionStatus, 'missing');
        assert.strictEqual(parsed.fields.showTime.confidence, 0.0);
    });

    console.log(`\nAll tests passed: ${passedTests}/${totalTests} ✅\n`);
}

main().catch(err => {
    console.error('Test suite failed:', err);
    process.exit(1);
});
