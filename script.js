// Bokyabot Meme Generator Controller

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM Elements
    const inputBrand = document.getElementById('input-brand');
    const inputEntry = document.getElementById('input-entry');
    const inputLine1 = document.getElementById('input-line1');
    const inputLine2 = document.getElementById('input-line2');
    const inputColor = document.getElementById('input-color');
    const inputBg = document.getElementById('input-bg');
    
    const cardBrand = document.getElementById('card-brand');
    const cardEntry = document.getElementById('card-entry');
    const cardLine1 = document.getElementById('card-line1');
    const cardLine2 = document.getElementById('card-line2');
    const cardLogoPath = document.getElementById('card-logo-path');
    const memeCard = document.getElementById('meme-card');
    const colorHexSpan = document.querySelector('.color-hex');
    const downloadBtn = document.getElementById('download-btn');
    
    // 2. Real-time Live Binding & Synchronisation
    function updatePreview() {
        cardBrand.textContent = inputBrand.value.toUpperCase();
        cardEntry.textContent = inputEntry.value.toUpperCase();
        cardLine1.textContent = inputLine1.value;
        cardLine2.textContent = inputLine2.value;
        
        // Brand color updates
        const colorVal = inputColor.value;
        cardBrand.style.color = colorVal;
        cardLogoPath.setAttribute('stroke', colorVal);
        colorHexSpan.textContent = colorVal.toUpperCase();
        
        // Card tint background updates
        memeCard.style.backgroundColor = inputBg.value;
    }

    // Set listeners for all controls
    [inputBrand, inputEntry, inputLine1, inputLine2, inputColor, inputBg].forEach(element => {
        element.addEventListener('input', updatePreview);
        element.addEventListener('change', updatePreview);
    });

    // Initialize preview state
    updatePreview();

    // 3. High-Resolution Canvas Exporter
    // Exports standard 1200 x 1600 px (3:4 aspect ratio) high-quality PNG
    downloadBtn.addEventListener('click', async () => {
        downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Rendering...';
        downloadBtn.disabled = true;

        // Ensure google fonts are loaded
        await document.fonts.ready;

        const canvas = document.getElementById('export-canvas');
        const ctx = canvas.getContext('2d');
        
        // Target canvas size (high res for socials)
        canvas.width = 1200;
        canvas.height = 1600;

        // Clear and draw background tint
        ctx.fillStyle = inputBg.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const brandColor = inputColor.value;
        const mainTextColor = '#0b0b0b';

        // Helper: Wrap and draw multiline text cleanly on canvas
        function drawTextLine(text, x, y, maxWidth, lineHeight, font) {
            ctx.font = font;
            ctx.fillStyle = mainTextColor;
            ctx.textBaseline = 'top';

            const words = text.split(' ');
            let line = '';
            let currentY = y;

            for (let n = 0; n < words.length; n++) {
                let testLine = line + words[n] + ' ';
                let metrics = ctx.measureText(testLine);
                let testWidth = metrics.width;
                if (testWidth > maxWidth && n > 0) {
                    ctx.fillText(line, x, currentY);
                    line = words[n] + ' ';
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, currentY);
            // Returns the next Y position
            return currentY + lineHeight;
        }

        // Draw BOKYABOT brand title
        ctx.font = "bold 44px 'Space Grotesk', sans-serif";
        ctx.fillStyle = brandColor;
        ctx.fillText(inputBrand.value.toUpperCase(), 100, 120);

        // Draw ENTRY # number
        ctx.font = "bold 42px 'Space Grotesk', sans-serif";
        ctx.fillStyle = mainTextColor;
        ctx.textAlign = 'right';
        ctx.fillText(inputEntry.value.toUpperCase(), 1100, 120);
        ctx.textAlign = 'left'; // reset align

        // Draw the solid header divider line
        ctx.lineWidth = 14;
        ctx.strokeStyle = mainTextColor;
        ctx.beginPath();
        ctx.moveTo(100, 190);
        ctx.lineTo(1100, 190);
        ctx.stroke();

        // Draw Main Quote lines
        // We calculate vertical center positioning for the quote container
        const quoteBoxY = 320;
        const fontStyle = "800 85px 'Plus Jakarta Sans', -apple-system, sans-serif";
        const textMaxWidth = 1000;
        const textLineHeight = 110;

        let nextY = drawTextLine(inputLine1.value, 100, quoteBoxY, textMaxWidth, textLineHeight, fontStyle);
        // Spacing between Paragraph 1 and Paragraph 2
        drawTextLine(inputLine2.value, 100, nextY + 60, textMaxWidth, textLineHeight, fontStyle);

        // Draw cursive brand logo path in the bottom right corner
        // Scaled and offset to fit perfectly on the 1200x1600 output
        const scale = 2.0;
        const offsetX = 1200 - 100 - (100 * scale); // 100 is svg viewBox width
        const offsetY = 1600 - 100 - (100 * scale); // 100 is svg viewBox height

        ctx.beginPath();
        ctx.moveTo(30 * scale + offsetX, 85 * scale + offsetY); 
        ctx.bezierCurveTo(35 * scale + offsetX, 70 * scale + offsetY, 58 * scale + offsetX, 25 * scale + offsetY, 58 * scale + offsetX, 15 * scale + offsetY); 
        ctx.bezierCurveTo(58 * scale + offsetX, 5 * scale + offsetY, 45 * scale + offsetX, 5 * scale + offsetY, 40 * scale + offsetX, 25 * scale + offsetY); 
        ctx.bezierCurveTo(35 * scale + offsetX, 45 * scale + offsetY, 35 * scale + offsetX, 75 * scale + offsetY, 35 * scale + offsetX, 82 * scale + offsetY); 
        ctx.bezierCurveTo(35 * scale + offsetX, 88 * scale + offsetY, 43 * scale + offsetX, 90 * scale + offsetY, 52 * scale + offsetX, 82 * scale + offsetY); 
        ctx.bezierCurveTo(61 * scale + offsetX, 74 * scale + offsetY, 68 * scale + offsetX, 60 * scale + offsetY, 68 * scale + offsetX, 52 * scale + offsetY); 
        ctx.bezierCurveTo(68 * scale + offsetX, 44 * scale + offsetY, 60 * scale + offsetX, 42 * scale + offsetY, 54 * scale + offsetX, 48 * scale + offsetY); 
        ctx.bezierCurveTo(48 * scale + offsetX, 54 * scale + offsetY, 50 * scale + offsetX, 70 * scale + offsetY, 60 * scale + offsetX, 70 * scale + offsetY); 
        ctx.bezierCurveTo(65 * scale + offsetX, 70 * scale + offsetY, 75 * scale + offsetX, 60 * scale + offsetY, 82 * scale + offsetX, 50 * scale + offsetY); 
        
        ctx.strokeStyle = brandColor;
        ctx.lineWidth = 7.5 * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Export data to image download
        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `${inputEntry.value.toLowerCase().replace(/[^a-z0-9]/g, '_')}_meme.png`;
            link.href = dataUrl;
            link.click();
        } catch (e) {
            console.error("Failed to generate image download", e);
            alert("Error generating PNG. Try writing shorter text blocks.");
        }

        // Restore download button status
        downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download Meme (PNG)';
        downloadBtn.disabled = false;
    });
});
