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
    :root { --max-width: 100% !important; }
    .container { max-width: 100% !important; width: 100% !important; padding: 0 !important; box-sizing: border-box !important; }
    .panel-content * { color: #ffffff; }
    .panel-content h1, .panel-content h2, .panel-content h3, .panel-content h4 { color: #ffffff !important; background: none !important; -webkit-text-fill-color: #ffffff !important; }
    .panel-content p, .panel-content li, .panel-content span, .panel-content label, .panel-content td, .panel-content th { color: rgba(255,255,255,0.9) !important; }
    .panel-content a { color: #ffffff !important; text-decoration: underline; }
    .panel-content a:hover { opacity: 0.8; }
    main, section, .section, .section-alt, .hero, .hero--center { background: transparent !important; padding-left: 0 !important; padding-right: 0 !important; }
    .panel-content .card--center, .panel-content .faq-item, .panel-content .step-card {
      background: rgba(255,255,255,0.1) !important;
      border: 1px solid rgba(255,255,255,0.15) !important;
      color: #ffffff !important;
    }
    .panel-content button, .panel-content .cta-button, .panel-content .btn {
      background: #ffffff !important;
      color: #4a6a8a !important;
      border: none !important;
    }
    .panel-content pre, .panel-content code {
      background: rgba(0,0,0,0.2) !important;
      color: #e0e8f0 !important;
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

  // Sync reflection
  function syncReflection() {
    reflection.innerHTML = '';
    const clone = panelContent.cloneNode(true);
    clone.removeAttribute('id');
    clone.style.pointerEvents = 'none';
    reflection.appendChild(clone);
  }
  setTimeout(syncReflection, 500);
  setInterval(syncReflection, 5000);

  panelContent.addEventListener('scroll', () => {
    const clone = reflection.querySelector('.panel-content');
    if (clone) clone.scrollTop = panelContent.scrollTop;
  });
});
