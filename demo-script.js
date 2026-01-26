/* ═══════════════════════════════════════════════════════════════════════════
   TANGENT HERO DEMO - DIRECTOR
   ═══════════════════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    // ═══ ELEMENT REFERENCES ═══
    const article = document.getElementById('demo-article');
    const anchor = document.getElementById('tangent-anchor');
    const chips = document.getElementById('demo-chips');
    const panelShell = document.getElementById('demo-panel-shell');
    const panel = document.getElementById('demo-panel');
    const stream = document.getElementById('demo-stream');
    const demoInput = document.getElementById('demo-input');
    const faqDropdown = document.getElementById('demo-faq-dropdown');

    // Verify critical elements exist
    if (!article || !anchor || !chips || !panelShell || !panel || !stream) {
        return;
    }

    // ═══ ELEMENT INDEX ═══
    const DEMO_ELEMENT_INDEX = new Map();
    DEMO_ELEMENT_INDEX.set('tangent-word', anchor);

    // ═══ CHIP RESPONSE DATA ═══
    const CHIP_RESPONSES = {
        'what': {
            title: '"What Is..."',
            content: '[What Is]'
        },
        'faq': {
            title: '"Prompt Chips"',
            content: '[Prompt Chips]'
        },
        'pricing': {
            title: '"Pricing"',
            content: '[Pricing]'
        }
    };

    // ═══ FAQ ANSWERS DATA (from actual FAQ page) ═══
    const FAQ_ANSWERS = {
        'what-is': 'Tangent is a floating, on-page AI assistant built to support the natural way people think. It helps you stay immersed in the subject in front of you while giving you the freedom to explore any question, tangent, or idea that arises along the way. Instead of switching tabs or copy-pasting text into a chatbot, Tangent appears directly on the webpages you\'re working on and responds with context-aware intelligence. It becomes part of your workflow—an unobtrusive companion that moves at the speed of your curiosity.',
        'how-works': 'Tangent listens only when you interact with it. When you ask a question or click a prompt chip, it gathers the text you highlighted, the surrounding paragraph, and anything you typed. It sends this structured context to Tangent\'s secure backend, where your subscription is checked, the right model is selected, and a clean prompt is built for the AI. The backend returns the result, and Tangent displays it directly in the floating mini-chat. Heavy lifting happens in the cloud; the smooth, responsive experience happens in your browser. All data transmission uses end-to-end encryption, and Tangent\'s backend does not store your conversations or page content after processing your request.',
        'prompt-chips': 'Prompt Chips are Tangent\'s one-click action buttons that appear when you select text. Each chip contains a pre-written, optimized prompt designed to perform a specific task—for example, summarizing a passage, explaining a concept in simple terms, rewriting text more clearly, comparing ideas, or extracting key points. Instead of crafting a prompt manually, you click a chip and Tangent knows exactly what to do.',
        'custom-chips': 'Yes. If you frequently perform a certain type of analysis or transformation, you can create your own custom chip with your preferred wording or structure. Your chip then appears in your chip bar just like the built-in ones.',
        'pricing': 'Tangent offers two subscription tiers: Pro ($12/month or $120/year) with 6,000 queries per month, and Business Solo ($30/month or $306/year) with 15,000 queries per month. A 7-day free trial with 1,000 queries is available. Tangent automatically selects the optimal AI model for each task—no manual switching required.',
        'privacy': 'Yes. Tangent uses a security-first design. Your browser never stores or sends OpenAI API keys—only Tangent\'s backend communicates with the model. All communication is encrypted, Supabase enforces strong row-level security, and sensitive information is automatically redacted on your device before leaving your browser. Tangent automatically turns itself off on banking, medical, tax, or government websites.',
        'browsers': 'Tangent works on Chrome and most Chromium browsers such as Brave, Edge, Opera, and Arc. A Safari version is planned for the future.'
    };

    // ═══ STATE ═══
    let state = {
        mode: 'idle',
        currentChip: null,
        typewriterTimeout: null,
        dragData: null,
        isPinned: false
    };

    // ═══ UTILITY: WAIT ═══
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ═══ UTILITY: DETECT MOBILE ═══
    function isMobile() {
        return window.innerWidth <= 768;
    }

    function isSmallMobile() {
        return window.innerWidth <= 480;
    }

    // ═══ UTILITY: GET RESPONSIVE PANEL POSITION ═══
    function getResponsivePanelPosition() {
        const containerRect = document.getElementById('demo-stage-container').getBoundingClientRect();

        if (isSmallMobile()) {
            // Small phones: center horizontally, position lower to avoid covering chip bar
            // Add 2 lines worth of space: 16px font × 1.6 line-height × 2 = ~51px
            const twoLinesOffset = 16 * 1.6 * 2; // ~51px
            return {
                left: '50%',
                top: `${180 + twoLinesOffset}px`, // ~231px - two lines lower
                transform: 'translateX(-50%)'
            };
        } else if (isMobile()) {
            // Regular mobile: center horizontally, positioned below chip bar
            // Add 2 lines worth of space: 18px font × 1.6 line-height × 2 = ~58px
            const twoLinesOffset = 18 * 1.6 * 2; // ~58px
            return {
                left: '50%',
                top: `${200 + twoLinesOffset}px`, // ~258px - two lines lower
                transform: 'translateX(-50%)'
            };
        } else {
            // Desktop: original positioning
            return {
                left: '600px',
                top: '105px',
                transform: 'none'
            };
        }
    }

    // ═══ UTILITY: POSITION ELEMENT BELOW ANCHOR ═══
    function positionBelowAnchor(element, anchorEl, offsetY = 8) {
        const rect = anchorEl.getBoundingClientRect();
        const containerRect = document.getElementById('demo-stage-container').getBoundingClientRect();

        const RIGHT_OFFSET = 80; // Shift chip bar significantly to the right
        const left = rect.left - containerRect.left + (rect.width / 2) - (element.offsetWidth / 2) + RIGHT_OFFSET;
        const top = rect.bottom - containerRect.top + offsetY;

        element.style.left = left + 'px';
        element.style.top = top + 'px';
    }

    // ═══ CURSOR ANIMATION HELPERS ═══
    const demoCursor = document.getElementById('demo-cursor');
    const demoCursorImg = document.getElementById('demo-cursor-img');
    let cursorHidden = false;
    let allowCursorHiding = false; // Flag to control when cursor can be hidden

    function showCursor() {
        if (!demoCursor) return;
        demoCursor.style.display = 'block';
        demoCursor.style.opacity = '0';
        setTimeout(() => {
            demoCursor.style.opacity = '1';
        }, 50);
    }

    function hideCursor() {
        if (!demoCursor) return;
        demoCursor.style.opacity = '0';
        setTimeout(() => {
            demoCursor.style.display = 'none';
        }, 300);
    }

    function moveCursor(x, y) {
        if (!demoCursor) return;
        demoCursor.style.left = x + 'px';
        demoCursor.style.top = y + 'px';
    }

    function setCursorType(type) {
        if (!demoCursorImg) return;
        if (type === 'i_beam') {
            demoCursorImg.src = '/images/i_beam.png';
        } else {
            demoCursorImg.src = '/images/cursor.png';
        }
    }

    // Hide cursor on user mouseover (only when animation is not playing)
    const demoStageContainer = document.getElementById('demo-stage-container');
    if (demoStageContainer) {
        demoStageContainer.addEventListener('mousemove', () => {
            // Only hide cursor if:
            // 1. Animation is not playing or typing
            // 2. Cursor hiding is allowed (1 second grace period after animation ends)
            // 3. Cursor is not already hidden
            const animationActive = state.mode === 'playing' || state.mode === 'typing';
            if (!animationActive && allowCursorHiding && !cursorHidden && demoCursor && demoCursor.style.display !== 'none') {
                hideCursor();
                cursorHidden = true;
            }
        });
    }

    // ═══ DIRECTOR: INTRO SEQUENCE ═══
    async function playIntro() {
        if (state.mode === 'playing') return;
        state.mode = 'playing';

        // Reset everything
        anchor.classList.remove('tg-demo-highlighted');
        chips.style.display = 'none';
        chips.classList.remove('tg-demo-visible');
        chipBarPinned = false; // Disable chip bar pinning
        panelShell.style.display = 'none';
        panelShell.classList.remove('tg-demo-visible');
        stream.innerHTML = '';
        cursorHidden = false; // Reset cursor state
        allowCursorHiding = false; // Prevent cursor from hiding during animation

        // Start scroll at the very top
        article.scrollTop = 0;

        // Reset paragraph opacity
        const paragraphs = article.querySelectorAll('p');
        paragraphs.forEach(p => p.style.opacity = '0');

        // CURSOR: Show i_beam cursor immediately at starting position
        setCursorType('i_beam');
        const containerRect = document.getElementById('demo-stage-container').getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();

        // Start cursor in center-right of viewport (not too high or low)
        const cursorStartX = containerRect.width - 150; // Right side but not edge
        const cursorStartY = containerRect.height / 2; // Center vertically
        moveCursor(cursorStartX, cursorStartY);
        showCursor();

        await wait(255); // 340 * 0.75 = 255 (25% faster)

        // 1. Scroll down until "Tangent" is at top third of the page - SLOW & GENTLE
        const articleRect = article.getBoundingClientRect();
        const twoLinesHeight = 26 * 1.6 * 2; // font-size * line-height * 2 lines = ~83px
        const targetPosition = anchorRect.top - articleRect.top - (articleRect.height / 3) + twoLinesHeight;

        // Smooth, constant-speed scroll with gentle final deceleration
        const startScroll = article.scrollTop;
        const scrollDistance = targetPosition;
        const scrollDuration = 1400;
        const startTime = performance.now();

        // Fade in paragraphs with staggered timing during scroll
        setTimeout(() => paragraphs[0].style.opacity = '1', 0);
        setTimeout(() => paragraphs[1].style.opacity = '1', 180);
        setTimeout(() => paragraphs[2].style.opacity = '1', 360);
        setTimeout(() => paragraphs[3].style.opacity = '1', 540);

        // CURSOR: Start moving cursor toward where "Tangent" will be (move earlier - right at scroll start)
        setTimeout(() => {
            // Calculate where "Tangent" will end up after scroll
            const finalAnchorY = containerRect.height / 3 - twoLinesHeight;
            // Re-query anchor to get its horizontal position
            const anchorRectMid = anchor.getBoundingClientRect();
            // Position to the left of where "Tangent" will be
            const targetX = anchorRectMid.left - containerRect.left - 30;
            const targetY = finalAnchorY + (anchorRect.height / 2);
            moveCursor(targetX, targetY);
        }, 100); // Move much earlier - 100ms into scroll (was 400ms)

        function animateScroll(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / scrollDuration, 1);

            // Completely linear scroll - no easing
            article.scrollTop = startScroll + (scrollDistance * progress);

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        }

        requestAnimationFrame(animateScroll);

        await wait(1400); // Wait for scroll to complete

        // 2. Highlight the word LETTER BY LETTER with actual selection
        const anchorText = anchor.textContent; // "Tangent"
        const letterDuration = 60; // 60ms per letter for natural feel

        // Re-query anchor position after scroll
        const anchorRectFinal = anchor.getBoundingClientRect();

        // Create selection effect by wrapping letters in spans with progressive highlight
        anchor.innerHTML = ''; // Clear original text
        for (let i = 0; i < anchorText.length; i++) {
            const span = document.createElement('span');
            span.textContent = anchorText[i];
            span.className = 'tg-demo-letter';
            span.style.backgroundColor = 'transparent';
            anchor.appendChild(span);
        }

        // Animate highlighting letter by letter
        const letters = anchor.querySelectorAll('.tg-demo-letter');
        for (let i = 0; i < letters.length; i++) {
            letters[i].style.backgroundColor = '#669fc3'; // Blue highlight
            letters[i].style.color = '#ffffff'; // White text

            // Move cursor to follow the selection edge
            const letterRect = letters[i].getBoundingClientRect();
            const cursorX = letterRect.right - containerRect.left + 2;
            const cursorY = letterRect.top - containerRect.top + (letterRect.height / 2);
            moveCursor(cursorX, cursorY);

            await wait(letterDuration);
        }

        // Full word is now highlighted - add the demo class for any additional styling
        anchor.classList.add('tg-demo-highlighted');

        await wait(150); // Brief pause after highlighting completes

        // 3. Show chips ONLY AFTER full word is highlighted
        chips.style.display = 'flex';
        positionBelowAnchor(chips, anchor, 12);

        // CURSOR: Start moving toward chip bar as soon as chips appear
        const chipsRect = chips.getBoundingClientRect();
        const chipsMidX = chipsRect.left - containerRect.left + (chipsRect.width / 2);
        const chipsTopY = chipsRect.top - containerRect.top - 10;
        moveCursor(chipsMidX, chipsTopY);

        await wait(50);
        chips.classList.add('tg-demo-visible');
        chipBarPinned = true; // Enable chip bar pinning to highlighted text

        await wait(150); // Increased from 100 to give cursor more time to reach chip bar

        // CURSOR: Change to normal cursor when over chip bar
        setCursorType('normal');

        // CURSOR: Move to first chip immediately
        const firstChip = document.querySelector('[data-chip="what"]');
        if (firstChip) {
            const firstChipRect = firstChip.getBoundingClientRect();
            const chipCenterX = firstChipRect.left - containerRect.left + (firstChipRect.width / 2);
            const chipCenterY = firstChipRect.top - containerRect.top + (firstChipRect.height / 2);
            moveCursor(chipCenterX, chipCenterY);

            await wait(500); // Wait for cursor to arrive at chip before starting click animation

            // 4. Auto-click first chip
            firstChip.style.transform = 'scale(0.95)';
            await wait(96); // 128 * 0.75 = 96 (25% faster)
            firstChip.style.transform = '';

            await handleChipClick('what', true);
        }

        state.mode = 'interactive';

        // Wait 1 second after animation ends before allowing cursor to be hidden
        setTimeout(() => {
            allowCursorHiding = true;
        }, 1000);
    }

    // ═══ CHIP CLICK HANDLER ═══
    async function handleChipClick(chipId, fromIntro = false) {
        const response = CHIP_RESPONSES[chipId];
        if (!response) return;

        if (state.typewriterTimeout) {
            clearTimeout(state.typewriterTimeout);
        }

        state.currentChip = chipId;
        state.mode = 'typing';

        // Restore panel if minimized
        if (isMinimized) {
            toggleMinimize();
        }

        // Show panel if closed
        const isFirstOpen = panelShell.style.display === 'none';
        if (isFirstOpen) {
            panelShell.style.display = 'block';

            const containerRect = document.getElementById('demo-stage-container').getBoundingClientRect();

            // Position panel responsively based on screen size
            const position = getResponsivePanelPosition();
            panelShell.style.left = position.left;
            panelShell.style.top = position.top;
            panelShell.style.transform = position.transform;

            await wait(32); // 43 * 0.75 = 32.25 ≈ 32 (25% faster)
            panelShell.classList.add('tg-demo-visible');
            await wait(224); // 298 * 0.75 = 223.5 ≈ 224 (25% faster)

            // Show intro message with typewriter effect
            const introMsg = document.createElement('div');
            introMsg.className = 'tg-demo-msg';
            stream.appendChild(introMsg);

            const introContent = document.createElement('span');
            introMsg.appendChild(introContent);

            // Typewrite the intro message
            const introText = 'Welcome to TANGENT.\n\nAccess the full knowledge of AI without breaking your train of thought. Go on tangents, explore ideas, and get instant answers—all without ever opening another tab.';
            const chunkSize = 3;
            const chunks = [];
            for (let i = 0; i < introText.length; i += chunkSize) {
                chunks.push(introText.slice(i, i + chunkSize));
            }

            for (let i = 0; i < chunks.length; i++) {
                if (state.mode !== 'typing') break;

                let chunk = chunks[i];
                // Convert newlines to <br> tags for display
                chunk = chunk.replace(/\n/g, '<br>');

                introContent.innerHTML += chunk;
                stream.scrollTop = stream.scrollHeight;

                await wait(13); // 17 * 0.75 = 12.75 ≈ 13 (25% faster)
            }

            // Ensure final formatted text with bold and italic
            introContent.innerHTML = `<strong>Welcome to TANGENT.</strong><br><br>Access the full knowledge of AI <em>without breaking your train of thought</em>. Go on tangents, explore ideas, and get instant answers—all without ever opening another tab.`;
            stream.scrollTop = stream.scrollHeight;

            // Return early - don't show user message or AI response on first open
            if (state.mode === 'typing') {
                state.mode = 'interactive';
            }
            return;
        }

        // Show user message (only on subsequent interactions)
        stream.innerHTML = `<div class="tg-demo-msg tg-user">${response.title}</div>`;

        await wait(255); // 340 * 0.75 = 255 (25% faster)

        // Show thinking
        const thinkingEl = document.createElement('div');
        thinkingEl.className = 'tg-demo-thinking';
        thinkingEl.innerHTML = '<span></span><span></span><span></span>';
        stream.appendChild(thinkingEl);

        await wait(fromIntro ? 510 : 319); // 680 * 0.75 = 510, 425 * 0.75 = 318.75 ≈ 319 (25% faster)

        // Remove thinking
        thinkingEl.remove();

        // Typewrite AI response
        await typewriteMessage(response.content);

        if (state.mode === 'typing') {
            state.mode = 'interactive';
        }
    }

    // ═══ TYPEWRITER ═══
    async function typewriteMessage(text) {
        const msgEl = document.createElement('div');
        msgEl.className = 'tg-demo-msg';
        msgEl.innerHTML = '<strong>Tangent:</strong><br>';
        stream.appendChild(msgEl);

        const contentSpan = document.createElement('span');
        msgEl.appendChild(contentSpan);

        const chunkSize = 3;
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }

        for (let i = 0; i < chunks.length; i++) {
            if (state.mode !== 'typing') break;

            contentSpan.textContent += chunks[i];
            stream.scrollTop = stream.scrollHeight;

            await wait(20);
        }

        contentSpan.textContent = text;
        stream.scrollTop = stream.scrollHeight;
    }

    // ═══ DRAGGING SYSTEM (Header Only) ═══
    let dragState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        initialLeft: 0,
        initialTop: 0
    };

    const header = panel.querySelector('.tg-demo-panel__header');

    header.addEventListener('mousedown', (e) => {
        // Don't drag if clicking buttons
        if (e.target.closest('.tg-demo-pin') ||
            e.target.closest('.tg-demo-panel__min') ||
            e.target.closest('.tg-demo-panel__close')) {
            return;
        }

        dragState.isDragging = true;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;

        const rect = panelShell.getBoundingClientRect();
        const containerRect = document.getElementById('demo-stage-container').getBoundingClientRect();

        dragState.initialLeft = rect.left - containerRect.left;
        dragState.initialTop = rect.top - containerRect.top;

        panel.classList.add('tg-demo-dragging');
        state.mode = 'dragging';

        e.preventDefault(); // Prevent text selection while dragging
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragState.isDragging) return;

        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        panelShell.style.left = (dragState.initialLeft + dx) + 'px';
        panelShell.style.top = (dragState.initialTop + dy) + 'px';
    });

    document.addEventListener('mouseup', () => {
        if (!dragState.isDragging) return;

        dragState.isDragging = false;
        panel.classList.remove('tg-demo-dragging');

        if (state.mode === 'dragging') {
            state.mode = 'interactive';
        }
    });

    // ═══ RESIZE SYSTEM (Bottom-Right Corner) ═══
    const MIN_W = 437.5; // 350px * 1.25 - matches actual TANGENT MIN_W
    const MIN_H = 150;   // 120px * 1.25 - matches actual TANGENT MIN_H

    let resizeState = {
        isResizing: false,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0
    };

    const resizeHandle = panel.querySelector('.tg-demo-resize-handle');

    resizeHandle.addEventListener('mousedown', (e) => {
        resizeState.isResizing = true;
        resizeState.startX = e.clientX;
        resizeState.startY = e.clientY;
        resizeState.startWidth = panel.offsetWidth;
        resizeState.startHeight = panel.offsetHeight;

        panel.classList.add('tg-demo-resizing');
        state.mode = 'resizing';

        e.preventDefault();
        e.stopPropagation(); // Prevent drag from triggering
    });

    document.addEventListener('mousemove', (e) => {
        if (!resizeState.isResizing) return;

        const dx = e.clientX - resizeState.startX;
        const dy = e.clientY - resizeState.startY;

        const newWidth = Math.max(MIN_W, resizeState.startWidth + dx);
        const newHeight = Math.max(MIN_H, resizeState.startHeight + dy);

        panel.style.width = newWidth + 'px';
        panel.style.height = newHeight + 'px';

        e.preventDefault();
    });

    document.addEventListener('mouseup', () => {
        if (!resizeState.isResizing) return;

        resizeState.isResizing = false;
        panel.classList.remove('tg-demo-resizing');

        if (state.mode === 'resizing') {
            state.mode = 'interactive';
        }
    });

    // ═══ WINDOW CONTROLS ═══

    // Close button - hides the panel
    const closeBtn = panel.querySelector('.tg-demo-panel__close');
    closeBtn.addEventListener('click', () => {
        panelShell.classList.remove('tg-demo-visible');
        setTimeout(() => {
            panelShell.style.display = 'none';
        }, 300); // Match transition duration
    });

    // Minimize button and double-click header to minimize
    const minBtn = panel.querySelector('.tg-demo-panel__min');
    let isMinimized = false;
    let savedHeight = panel.style.height || '525px';
    let savedWidth = panel.style.width || '475px';

    function toggleMinimize() {
        if (isMinimized) {
            // Restore
            panel.style.height = savedHeight;
            panel.style.width = savedWidth;
            panel.classList.remove('tg-demo-minimized');
            panel.querySelector('.tg-demo-panel__body').style.display = 'flex';
            panel.querySelector('.tg-demo-panel__footer').style.display = 'block';
            minBtn.querySelector('.tg-demo-panel__icon-dash').style.display = 'inline';
            minBtn.querySelector('.tg-demo-panel__icon-square').style.display = 'none';
            isMinimized = false;
        } else {
            // Minimize
            savedHeight = panel.style.height || getComputedStyle(panel).height;
            savedWidth = panel.style.width || getComputedStyle(panel).width;
            panel.style.height = 'auto';
            panel.style.width = '300px'; // Split the difference between auto and full width
            panel.classList.add('tg-demo-minimized');
            panel.querySelector('.tg-demo-panel__body').style.display = 'none';
            panel.querySelector('.tg-demo-panel__footer').style.display = 'none';
            minBtn.querySelector('.tg-demo-panel__icon-dash').style.display = 'none';
            minBtn.querySelector('.tg-demo-panel__icon-square').style.display = 'inline';
            isMinimized = true;
        }
    }

    minBtn.addEventListener('click', toggleMinimize);

    // Double-click header to minimize/restore
    let lastClickTime = 0;
    header.addEventListener('click', (e) => {
        // Don't trigger on button clicks or dragging
        if (e.target.closest('.tg-demo-pin') ||
            e.target.closest('.tg-demo-panel__min') ||
            e.target.closest('.tg-demo-panel__close') ||
            dragState.isDragging) {
            return;
        }

        const now = Date.now();
        if (now - lastClickTime < 300) {
            // Double-click detected
            toggleMinimize();
            lastClickTime = 0; // Reset to prevent triple-click
        } else {
            lastClickTime = now;
        }
    });

    // ═══ FAQ DROPDOWN SYSTEM ═══

    // Show dropdown when input is focused
    demoInput.addEventListener('focus', () => {
        faqDropdown.style.display = 'block';
        setTimeout(() => {
            faqDropdown.classList.add('tg-demo-visible');
        }, 10);
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!demoInput.contains(e.target) && !faqDropdown.contains(e.target)) {
            faqDropdown.classList.remove('tg-demo-visible');
            setTimeout(() => {
                if (!faqDropdown.classList.contains('tg-demo-visible')) {
                    faqDropdown.style.display = 'none';
                }
            }, 128); // 170 * 0.75 = 127.5 ≈ 128 (25% faster)
        }
    });

    // Handle FAQ item clicks
    faqDropdown.querySelectorAll('.tg-demo-faq-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            e.stopPropagation();

            const faqId = item.getAttribute('data-faq');
            const answer = FAQ_ANSWERS[faqId];

            if (!answer) {
                return;
            }

            // Extract question text from <strong> element
            const questionText = item.querySelector('strong')?.textContent || item.textContent;

            // Ensure panel is visible
            if (panelShell.style.display === 'none') {
                panelShell.style.display = 'block';

                // Position panel responsively based on screen size
                const position = getResponsivePanelPosition();
                panelShell.style.left = position.left;
                panelShell.style.top = position.top;
                panelShell.style.transform = position.transform;

                await wait(32); // 43 * 0.75 = 32.25 ≈ 32 (25% faster)
                panelShell.classList.add('tg-demo-visible');
                await wait(224); // 298 * 0.75 = 223.5 ≈ 224 (25% faster)
            }

            // Hide dropdown
            faqDropdown.classList.remove('tg-demo-visible');
            setTimeout(() => {
                faqDropdown.style.display = 'none';
            }, 128); // 170 * 0.75 = 127.5 ≈ 128 (25% faster)

            // Blur input
            demoInput.blur();

            // Clear stream and show answer
            stream.innerHTML = '';

            // Show user question (just the bold question text)
            const userDiv = document.createElement('div');
            userDiv.className = 'tg-demo-msg tg-user';
            userDiv.innerHTML = `<strong>${questionText}</strong>`;
            stream.appendChild(userDiv);

            await wait(191); // 255 * 0.75 = 191.25 ≈ 191 (25% faster)

            // Show AI response with typewriter effect
            state.mode = 'typing';
            const msgEl = document.createElement('div');
            msgEl.className = 'tg-demo-msg';
            stream.appendChild(msgEl);

            const contentSpan = document.createElement('span');
            msgEl.appendChild(contentSpan);

            const chunkSize = 3;
            const chunks = [];
            for (let i = 0; i < answer.length; i += chunkSize) {
                chunks.push(answer.slice(i, i + chunkSize));
            }

            for (let i = 0; i < chunks.length; i++) {
                if (state.mode !== 'typing') break;

                contentSpan.textContent += chunks[i];
                stream.scrollTop = stream.scrollHeight;

                await wait(13); // 17 * 0.75 = 12.75 ≈ 13 (25% faster)
            }

            contentSpan.textContent = answer;
            stream.scrollTop = stream.scrollHeight;
        });
    });

    // ═══ CHIP BAR PINNING SYSTEM ═══
    // Keep chip bar pinned underneath highlighted "Tangent" text during scroll
    let chipBarPinned = false;

    article.addEventListener('scroll', () => {
        if (chipBarPinned && chips.style.display === 'flex') {
            positionBelowAnchor(chips, anchor, 12);
        }
    });

    // ═══ RESPONSIVE: REPOSITION ON WINDOW RESIZE ═══
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Reposition panel if visible
            if (panelShell.style.display !== 'none') {
                const position = getResponsivePanelPosition();
                panelShell.style.left = position.left;
                panelShell.style.top = position.top;
                panelShell.style.transform = position.transform;
            }

            // Reposition chips if visible
            if (chipBarPinned && chips.style.display === 'flex') {
                positionBelowAnchor(chips, anchor, 12);
            }
        }, 150); // Debounce resize events
    });

    // ═══ CHIP CLICK LISTENERS ═══
    document.querySelectorAll('.tg-demo-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            if (state.mode === 'playing') return;

            const chipId = chip.dataset.chip;
            handleChipClick(chipId, false);
        });
    });

    // ═══ PANEL BUTTON HANDLERS ═══
    document.querySelector('.tg-demo-close')?.addEventListener('click', () => {
        panelShell.classList.remove('tg-demo-visible');
        setTimeout(() => {
            panelShell.style.display = 'none';
            stream.innerHTML = '';
        }, 300);
    });

    // ═══ AUTO-START ON SCROLL INTO VIEW ═══
    let hasPlayed = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasPlayed) {
                hasPlayed = true;
                setTimeout(() => {
                    playIntro();
                }, 800);
            }
        });
    }, { threshold: 0.4 });

    const demoSection = document.querySelector('.hero-demo');
    if (demoSection) {
        observer.observe(demoSection);
    }
})();
