/**
 * TANGENT Panel Template Wrapper
 *
 * Automatically wraps page content in the blue panel template.
 * Include this script + panel-template.css on any page to apply the design.
 *
 * Usage: Add to <head>:
 *   <link rel="stylesheet" href="/panel-template.css" />
 *   <script src="/panel-wrapper.js" defer></script>
 */
document.addEventListener('DOMContentLoaded', () => {
  // Skip if page already has panel-overlay (manually set up)
  if (document.querySelector('.panel-overlay')) return;

  // Hide original header and footer
  const header = document.querySelector('.site-header, header');
  const footer = document.querySelector('.site-footer, footer');
  if (header) header.style.display = 'none';
  if (footer) footer.style.display = 'none';

  // Override body styles for panel template
  document.body.style.cssText = `
    background: url('/images/tangent_white_background.png') center center / cover no-repeat fixed !important;
    min-height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1vh 1vw;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    margin: 0;
  `;

  // Grab all body children (except scripts and hidden elements)
  const children = Array.from(document.body.children).filter(el => {
    if (el.tagName === 'SCRIPT') return false;
    if (el.style.display === 'none') return false;
    if (el.classList.contains('site-header') || el.classList.contains('site-footer')) return false;
    if (el.tagName === 'HEADER' || el.tagName === 'FOOTER') return false;
    return true;
  });

  // Create logo
  const logo = document.createElement('img');
  logo.src = '/images/tangent_blue_logo.png';
  logo.alt = 'TANGENT';
  logo.className = 'main-logo';

  // Create panel structure
  const panelOverlay = document.createElement('div');
  panelOverlay.className = 'panel-overlay';

  const panelMain = document.createElement('div');
  panelMain.className = 'panel-main';

  const panelContent = document.createElement('div');
  panelContent.className = 'panel-content';
  panelContent.id = 'page-panel-content';

  // Override content styles for white-on-blue
  const styleOverride = document.createElement('style');
  styleOverride.textContent = `
    :root { --max-width: 1040px !important; }
    .container { max-width: 1040px !important; width: 100% !important; margin: 0 auto !important; padding: 0 16px !important; box-sizing: border-box !important; }
    main, section, .section, .section-alt, .hero, .hero--center { background: transparent !important; padding-left: 0 !important; padding-right: 0 !important; }
    }
    /* FAQ specific */
    .panel-content .faq-answer { color: rgba(255,255,255,0.85) !important; }
    .panel-content .faq-question { color: #ffffff !important; }
  `;
  document.head.appendChild(styleOverride);

  // Move children into panel content
  children.forEach(child => {
    panelContent.appendChild(child);
  });

  panelMain.appendChild(panelContent);
  panelOverlay.appendChild(panelMain);

  // Create reflection
  const reflection = document.createElement('div');
  reflection.className = 'panel-reflection';
  reflection.id = 'page-panel-reflection';
  panelOverlay.appendChild(reflection);

  // Insert into body
  document.body.insertBefore(logo, document.body.firstChild);
  logo.after(panelOverlay);

  // Reflection
  function updateReflection() {
    var contentClone = panelContent.cloneNode(true);
    contentClone.removeAttribute('id');
    // Bake the current scroll position into the clone
    // by scrolling it after appending
    reflection.innerHTML = '';
    reflection.appendChild(contentClone);
    // Sync scroll position
    var bottomEdge = panelContent.scrollTop + panelContent.clientHeight;
    contentClone.scrollTop = Math.max(0, bottomEdge - contentClone.clientHeight);
  }

  updateReflection();
  setTimeout(updateReflection, 1000);
  setTimeout(updateReflection, 3000);

  // Re-clone on every scroll for reliable sync
  panelContent.addEventListener('scroll', function() {
    requestAnimationFrame(updateReflection);
  }, { passive: true });
});
