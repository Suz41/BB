// Interactive Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation / View Controller
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            item.classList.add('active');
            const targetId = item.id.replace('nav-', 'view-');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }
        });
    });

    // 2. Real-time Clock Widget
    const timeDisplay = document.getElementById('time-display');
    function updateClock() {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        const secs = String(now.getSeconds()).padStart(2, '0');
        timeDisplay.textContent = `${hrs}:${mins}:${secs}`;
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 3. Ephemeral Notes Persistent State
    const textarea = document.querySelector('.scratchpad');
    textarea.value = localStorage.getItem('bb_ephemeral_notes') || '';
    textarea.addEventListener('input', () => {
        localStorage.setItem('bb_ephemeral_notes', textarea.value);
    });

    // 4. Interactive Canvas Particle Pad
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const maxParticles = 50;

    // Resize observer/handler
    function resizeCanvas() {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const mouse = {
        x: null,
        y: null
    };

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        
        // Spawn particles
        for(let i = 0; i < 2; i++) {
            particlesArray.push(new Particle(mouse.x, mouse.y));
        }
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 1;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.color = `hsl(${Math.random() * 60 + 240}, 90%, 70%)`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.1) this.size -= 0.05;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Render floating particles if array is low
        if (particlesArray.length < 15 && Math.random() < 0.1) {
            particlesArray.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
        }

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();

            if (particlesArray[i].size <= 0.1) {
                particlesArray.splice(i, 1);
                i--;
            }
        }
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // 5. Audio Player Mock Control
    const playBtn = document.getElementById('play-ambient-btn');
    const visualizer = document.querySelector('.audio-visualizer');
    const visualizerThemeBtn = document.getElementById('visualizer-theme-btn');
    let isPlaying = false;
    let audioContext, oscillator, gainNode;

    playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        if (isPlaying) {
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Ambient';
            visualizer.classList.add('playing');
            // Play ambient synth sound
            startAudio();
        } else {
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i> Play Ambient';
            visualizer.classList.remove('playing');
            stopAudio();
        }
    });

    visualizerThemeBtn.addEventListener('click', () => {
        const randomHue = Math.floor(Math.random() * 360);
        document.documentElement.style.setProperty('--primary-hue', randomHue);
        document.documentElement.style.setProperty('--accent-hue', (randomHue + 70) % 360);
        generatePalette();
    });

    function startAudio() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            oscillator = audioContext.createOscillator();
            gainNode = audioContext.createGain();

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(120, audioContext.currentTime); // low hum
            
            // Subtle vibrato
            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            lfo.frequency.value = 0.2; // very slow
            lfoGain.gain.value = 1.5;
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            
            gainNode.gain.setValueAtTime(0.04, audioContext.currentTime); // keep it soft

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            lfo.start();
            oscillator.start();
        } catch(e) {
            console.log("Audio not supported or interaction block", e);
        }
    }

    function stopAudio() {
        if (oscillator) {
            oscillator.stop();
        }
        if (audioContext) {
            audioContext.close();
        }
    }

    // 6. Color Palette Playground
    const paletteContainer = document.getElementById('palette-colors');
    const generatePaletteBtn = document.getElementById('generate-palette-btn');

    function generatePalette() {
        paletteContainer.innerHTML = '';
        const baseHue = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--primary-hue').trim()) || 250;
        
        for (let i = 0; i < 5; i++) {
            const h = (baseHue + (i * 30)) % 360;
            const s = 70 + (i * 5);
            const l = 50 + (i * 5);
            const hex = hslToHex(h, s, l);
            
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = `hsl(${h}, ${s}%, ${l}%)`;
            swatch.textContent = hex;
            
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(hex);
                const originalText = swatch.textContent;
                swatch.textContent = 'Copied!';
                setTimeout(() => {
                    swatch.textContent = originalText;
                }, 1000);
            });

            paletteContainer.appendChild(swatch);
        }
    }
    
    generatePaletteBtn.addEventListener('click', () => {
        // Randomise primary hue and regenerate
        const randomHue = Math.floor(Math.random() * 360);
        document.documentElement.style.setProperty('--primary-hue', randomHue);
        generatePalette();
    });

    generatePalette();

    // Helper: HSL to HEX
    function hslToHex(h, s, l) {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = n => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            return Math.round(255 * color).toString(16).padStart(2, '0');
        };
        return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
    }

    // 7. Settings Controller
    const themeSelect = document.getElementById('setting-bg-theme');
    const glassIntensitySlider = document.getElementById('setting-glass-intensity');
    const animToggle = document.getElementById('setting-ambient-anim');
    const orbs = document.querySelectorAll('.glow-orb');

    themeSelect.addEventListener('change', () => {
        const val = themeSelect.value;
        if (val === 'cyber') {
            document.documentElement.style.setProperty('--primary-hue', '250');
            document.documentElement.style.setProperty('--accent-hue', '320');
        } else if (val === 'sunset') {
            document.documentElement.style.setProperty('--primary-hue', '15');
            document.documentElement.style.setProperty('--accent-hue', '350');
        } else if (val === 'aurora') {
            document.documentElement.style.setProperty('--primary-hue', '140');
            document.documentElement.style.setProperty('--accent-hue', '200');
        } else if (val === 'mono') {
            document.documentElement.style.setProperty('--primary-hue', '0');
            document.documentElement.style.setProperty('--accent-hue', '0');
        }
        generatePalette();
    });

    glassIntensitySlider.addEventListener('input', () => {
        const intensity = glassIntensitySlider.value;
        document.documentElement.style.setProperty('--glass-bg', `rgba(18, 19, 30, ${intensity / 100})`);
    });

    animToggle.addEventListener('change', () => {
        orbs.forEach(orb => {
            orb.style.animationPlayState = animToggle.checked ? 'running' : 'paused';
        });
    });

    // Lab triggers
    const expTriggers = document.querySelectorAll('.exp-trigger');
    expTriggers.forEach(btn => {
        btn.addEventListener('click', () => {
            const exp = btn.getAttribute('data-exp');
            alert(`Initiating Experiment: ${exp.toUpperCase()} effect loaded into main renderer.`);
        });
    });
});
