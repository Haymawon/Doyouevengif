```js
// Individual post page JS – share buttons and back link
(function () {
    'use strict';

    // ─── Helper: get meta description ─────────────────────
    function getMetaDescription() {
        const meta = document.querySelector('meta[name="description"]');
        return meta ? meta.getAttribute('content') : '';
    }

    // ─── Helper: get post title ───────────────────────────
    function getPostTitle() {
        const titleEl = document.querySelector('.post-title');

        if (titleEl) {
            return titleEl.textContent.trim();
        }

        return document.title
            .replace(' — DoYouEvenGif-alt', '')
            .trim();
    }

    // ─── Share metadata ───────────────────────────────────
    function ensureShareMeta() {
        const currentUrl = window.location.href;
        const origin = window.location.origin || 'https://doyouevengif-alt.netlify.app';
        const imageUrl = `${origin}/faviconn.png`;

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage) {
            ogImage.setAttribute('content', imageUrl);
        }

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) {
            ogUrl.setAttribute('content', currentUrl);
        }

        const twitterImage = document.querySelector('meta[name="twitter:image"]');
        if (twitterImage) {
            twitterImage.setAttribute('content', imageUrl);
        }
    }

    // ─── Build share text ─────────────────────────────────
    function buildShareText(title, desc) {
        let text = title;

        if (desc) {
            text += `\n\n${desc}`;
        }

        return text;
    }

    ensureShareMeta();

    // ─── Share buttons ────────────────────────────────────
    const shareTelegram = document.getElementById('shareTelegram');
    const shareThreads = document.getElementById('shareThreads');

    // Telegram
    if (shareTelegram) {
        shareTelegram.addEventListener('click', function (e) {
            e.preventDefault();

            const title = getPostTitle();
            const desc = getMetaDescription();
            const text = buildShareText(title, desc);
            const currentUrl = window.location.href;

            const tgUrl =
                `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}` +
                `&text=${encodeURIComponent(text)}`;

            window.open(
                tgUrl,
                '_blank',
                'width=600,height=500'
            );
        });
    }

    // Threads
    if (shareThreads) {
        shareThreads.addEventListener('click', function (e) {
            e.preventDefault();

            const title = getPostTitle();
            const desc = getMetaDescription();
            const text = buildShareText(title, desc);
            const currentUrl = window.location.href;

            const threadsUrl =
                `https://www.threads.net/intent/post?text=${encodeURIComponent(
                    `${text}\n\n${currentUrl}`
                )}`;

            window.open(
                threadsUrl,
                '_blank',
                'width=600,height=500'
            );
        });
    }

    console.log('Posts JS loaded.');

})();
```
