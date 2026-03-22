/**
 * BetterEcho — Shared Navigation Component
 * Included via JS across all pages for DRY code
 */

// Inject the navbar dynamically so we don't repeat it in every HTML
function injectNav(activePage) {
    const html = `
    <nav class="navbar" id="main-nav">
        <a href="/" class="nav-logo">
            <div class="logo-img-wrapper">
                <img src="/docs/logo.jpeg" alt="BetterEcho Logo" class="nav-logo-img">
            </div>
            <h1>Better<span>Echo</span></h1>
        </a>
        <ul class="nav-links">
            <li><a href="/" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
            <li><a href="/app" class="${activePage === 'app' ? 'active' : ''}">Recorder</a></li>
            <li><a href="/sessions" class="${activePage === 'sessions' ? 'active' : ''}">My Sessions</a></li>
            <li><a href="/app" class="nav-cta">Start Recording</a></li>
        </ul>
    </nav>`;
    document.body.insertAdjacentHTML('afterbegin', html);
}
