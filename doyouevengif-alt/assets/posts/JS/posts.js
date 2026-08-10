// Individual post page JS – share buttons and back link
(function() {
    'use strict';

    // ─── Helper: get meta description ─────────────────────
    function getMetaDescription() {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute('content') : '';
    }

    // ─── Helper: get post title (fallback to document title) ──
    function getPostTitle() {
        const titleEl = document.querySelector('.post-title');
        if (titleEl) return titleEl.textContent.trim();
        return document.title.replace(' — DoYouEvenGif-alt', '').trim();
    }

    function ensureShareMeta() {
        const currentUrl = window.location.href;
        const origin = window.location.origin || 'http://127.0.0.1:5000';
        const imageUrl = `${origin}/favicon.png`;

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) ogImage.setAttribute('content', imageUrl);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', currentUrl);

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) twitterImage.setAttribute('content', imageUrl);
    }

    function buildShareText(title, desc) {
        const pageUrl = window.location.href;
        let text = `${title}`;
        if (desc) text += `\n\n${desc}`;
        text += `\n\nRead more: ${pageUrl}`;
        return text;
    }

    ensureShareMeta();

    // ─── Share buttons ──────────────────────────────────────
    const shareTelegram = document.getElementById('shareTelegram');
    const shareThreads = document.getElementById('shareThreads');

    if (shareTelegram) {
        shareTelegram.addEventListener('click', function(e) {
            e.preventDefault();
            const title = getPostTitle();
            const desc = getMetaDescription();
            const text = buildShareText(title, desc);
            const url = encodeURIComponent(window.location.href);
            const tgUrl = `https://t.me/share/url?url=${url}&text=${encodeURIComponent(text)}`;
            window.open(tgUrl, '_blank', 'width=600,height=500');
        });
    }

    if (shareThreads) {
        shareThreads.addEventListener('click', function(e) {
            e.preventDefault();
            const title = getPostTitle();
            const desc = getMetaDescription();
            const text = buildShareText(title, desc);
            const threadsUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
            window.open(threadsUrl, '_blank', 'width=600,height=500');
        });
    }

    console.log('Posts JS loaded.');
})();
