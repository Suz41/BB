document.addEventListener('DOMContentLoaded', () => {
    const shareBtn = document.getElementById('shareBtn');
    const closeBtn = document.getElementById('closeBtn');

    // Share functionality
    shareBtn.addEventListener('click', () => {
        const shareData = {
            title: "Your Ticket - O' Romeo",
            text: "My Ticket: O' Romeo (Hindi, 2D) | Sat, 14 Feb @ 02:40 PM | PVR: Inorbit, Cyberabad | Booking ID: T9AFDXQ"
        };

        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            navigator.clipboard.writeText(shareData.text)
                .then(() => alert('Ticket details copied!'))
                .catch(() => alert('Failed to copy'));
        }
    });

    // Close button
    closeBtn.addEventListener('click', () => {
        alert('Ticket closed');
    });

    // Watch Trailer button
    const watchTrailerBtn = document.querySelector('.watch-trailer-btn');
    watchTrailerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        alert('Opening trailer...');
    });

    // Find Venue button
    const findVenueBtn = document.querySelector('.find-venue-btn');
    findVenueBtn.addEventListener('click', () => {
        alert('Opening venue on map...');
    });
});
