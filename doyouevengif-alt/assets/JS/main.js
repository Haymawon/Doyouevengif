(function() {
    'use strict';

    // ─── API Base URL ──────────────────────────────────────
    const API_BASE = 'https://haymawonn.pythonanywhere.com';

    // ─── DOM refs ────────────────────────────────────────────
    const postsData = window.POSTS || [];

    const searchInput = document.getElementById('searchInput');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const searchResults = document.getElementById('searchResults');
    const searchResultsMobile = document.getElementById('searchResultsMobile');
    const searchClear = document.getElementById('searchClear');
    const searchClearMobile = document.getElementById('searchClearMobile');
    const hamburger = document.getElementById('hamburger');
    const navMobile = document.getElementById('navMobile');
    const postsGrid = document.getElementById('postsGrid');

    const newsletterOverlay = document.getElementById('newsletterOverlay');
    const newsletterClose = document.getElementById('newsletterClose');
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterMessage = document.getElementById('newsletterMessage');

    // ─── Render Posts ──────────────────────────────────────
    function renderPosts(posts) {
        if (!postsGrid) return;
        if (!posts || posts.length === 0) {
            postsGrid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#a09890; padding:2rem 0;">No posts yet. Come back later.</p>`;
            return;
        }
        postsGrid.innerHTML = posts.map(post => {
            const imageHtml = post.image ? `<img src="${post.image}" alt="${post.title}" class="post-card-img" loading="lazy" onerror="this.style.display='none'" />` : '';
            const authorPicHtml = post.authorPic ? `<img src="${post.authorPic}" alt="${post.author}" class="post-card-author-pic" onerror="this.style.display='none'" />` : '';

            return `
                <a href="${post.url}" class="post-card">
                    ${imageHtml}
                    <div class="post-card-body">
                        <h2 class="post-card-title">${post.title}</h2>
                        <div class="post-card-meta">
                            ${authorPicHtml}
                            <span>${post.author}</span>
                            <span>•</span>
                            <span>${post.date}</span>
                        </div>
                        <p class="post-card-description">${post.description}</p>
                    </div>
                </a>
            `;
        }).join('');
    }

    renderPosts(postsData);

    // ─── Search Logic ──────────────────────────────────────
    function performSearch(query, resultsContainer, inputElement) {
        const q = query.trim().toLowerCase();
        if (!q) {
            resultsContainer.classList.remove('active');
            if (searchClear) searchClear.classList.remove('visible');
            if (searchClearMobile) searchClearMobile.classList.remove('visible');
            return;
        }

        if (inputElement === searchInput && searchClear) searchClear.classList.add('visible');
        if (inputElement === searchInputMobile && searchClearMobile) searchClearMobile.classList.add('visible');

        const matches = postsData.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.author.toLowerCase().includes(q)
        );

        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div class="no-results">No posts found for “${query}”</div>`;
            resultsContainer.classList.add('active');
            return;
        }

        resultsContainer.innerHTML = matches.map(p => {
            const imageHtml = p.image ? `<img src="${p.image}" alt="${p.title}" loading="lazy" onerror="this.style.display='none'" />` : '';
            return `
                <a href="${p.url}" class="search-result-item" role="option">
                    ${imageHtml}
                    <div class="result-info">
                        <span class="result-title">${p.title}</span>
                        <span class="result-meta">${p.author} • ${p.date}</span>
                    </div>
                </a>
            `;
        }).join('');
        resultsContainer.classList.add('active');
    }

    function clearSearch(inputElement, resultsContainer, clearBtn) {
        if (inputElement) inputElement.value = '';
        if (resultsContainer) {
            resultsContainer.classList.remove('active');
            resultsContainer.innerHTML = '';
        }
        if (clearBtn) clearBtn.classList.remove('visible');
        if (inputElement) inputElement.focus();
    }

    // Desktop search
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', function() {
            performSearch(this.value, searchResults, this);
        });
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearSearch(this, searchResults, searchClear);
            }
        });
        if (searchClear) {
            searchClear.addEventListener('click', function() {
                clearSearch(searchInput, searchResults, this);
            });
        }
        document.addEventListener('click', function(e) {
            const wrapper = searchInput.closest('.search-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                searchResults.classList.remove('active');
            }
        });
    }

    // Mobile search
    if (searchInputMobile && searchResultsMobile) {
        searchInputMobile.addEventListener('input', function() {
            performSearch(this.value, searchResultsMobile, this);
        });
        searchInputMobile.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                clearSearch(this, searchResultsMobile, searchClearMobile);
            }
        });
        if (searchClearMobile) {
            searchClearMobile.addEventListener('click', function() {
                clearSearch(searchInputMobile, searchResultsMobile, this);
            });
        }
        document.addEventListener('click', function(e) {
            const wrapper = searchInputMobile.closest('.mobile-search');
            if (wrapper && !wrapper.contains(e.target)) {
                searchResultsMobile.classList.remove('active');
            }
        });
    }

    // ─── Hamburger ──────────────────────────────────────────
    if (hamburger && navMobile) {
        hamburger.addEventListener('click', function() {
            const isOpen = navMobile.classList.toggle('open');
            this.classList.toggle('active');
            this.setAttribute('aria-expanded', isOpen);
        });

        navMobile.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                navMobile.classList.remove('open');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // ─── Newsletter Popup ──────────────────────────────────
    function showNewsletter() {
        if (newsletterOverlay) {
            newsletterOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideNewsletter() {
        if (newsletterOverlay) {
            newsletterOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    let popupShown = false;
    window.addEventListener('load', function() {
        if (!popupShown && !sessionStorage.getItem('newsletterClosed')) {
            setTimeout(showNewsletter, 600);
            popupShown = true;
        }
    });

    if (newsletterClose) {
        newsletterClose.addEventListener('click', function() {
            hideNewsletter();
            sessionStorage.setItem('newsletterClosed', 'true');
        });
    }

    if (newsletterOverlay) {
        newsletterOverlay.addEventListener('click', function(e) {
            if (e.target === this) {
                hideNewsletter();
                sessionStorage.setItem('newsletterClosed', 'true');
            }
        });
    }

    // ─── Newsletter Form Submission ──────────────────────
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = newsletterEmail.value.trim();
            const msgEl = newsletterMessage;
            if (!email || !email.includes('@') || !email.includes('.')) {
                msgEl.textContent = 'Please enter a valid email address.';
                msgEl.style.color = '#f0a090';
                return;
            }
            msgEl.textContent = 'Subscribing...';
            msgEl.style.color = '#d4c8b0';

            try {
                const resp = await fetch(`${API_BASE}/api/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await resp.json();
                if (resp.ok && data.success) {
                    msgEl.textContent = 'Subscribed! Check your email (if we had one).';
                    msgEl.style.color = '#a0d0b0';
                    newsletterEmail.value = '';
                    setTimeout(() => {
                        hideNewsletter();
                        sessionStorage.setItem('newsletterClosed', 'true');
                    }, 1800);
                } else {
                    msgEl.textContent = data.message || 'Something went wrong. Try again.';
                    msgEl.style.color = '#f0a090';
                }
            } catch (err) {
                msgEl.textContent = 'Network error. Please try again later.';
                msgEl.style.color = '#f0a090';
                console.error('Newsletter subscribe error:', err);
            }
        });
    }

    // ─── Contact Form (on contact page) ──────────────────
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const emailInput = document.getElementById('contactEmail');
        const messageInput = document.getElementById('contactMessage');
        const statusEl = document.getElementById('contactMessageStatus');

        const allowedDomains = ['gmail.com', 'protonmail.com', 'proton.me'];

        function isValidEmail(email) {
            if (!email || !email.includes('@')) return false;
            const domain = email.split('@')[1].toLowerCase();
            return allowedDomains.includes(domain);
        }

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            if (!isValidEmail(email)) {
                statusEl.textContent = 'Please use a Gmail or Proton email address.';
                statusEl.style.color = '#f0a090';
                return;
            }
            if (!message) {
                statusEl.textContent = 'Message cannot be empty.';
                statusEl.style.color = '#f0a090';
                return;
            }

            statusEl.textContent = 'Sending...';
            statusEl.style.color = '#d4c8b0';

            try {
                const resp = await fetch(`${API_BASE}/api/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, message })
                });
                const data = await resp.json();
                if (resp.ok && data.success) {
                    statusEl.textContent = 'Message sent! (i\'ll get back to you eventually)';
                    statusEl.style.color = '#a0d0b0';
                    emailInput.value = '';
                    messageInput.value = '';
                } else {
                    statusEl.textContent = data.message || 'Something went wrong. Try again.';
                    statusEl.style.color = '#f0a090';
                }
            } catch (err) {
                statusEl.textContent = 'Network error. Please try again later.';
                statusEl.style.color = '#f0a090';
                console.error('Contact error:', err);
            }
        });
    }

    // ─── Keyboard shortcuts ──────────────────────────────
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && newsletterOverlay && newsletterOverlay.classList.contains('active')) {
            hideNewsletter();
            sessionStorage.setItem('newsletterClosed', 'true');
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const input = window.innerWidth <= 992 ? searchInputMobile : searchInput;
            if (input) {
                input.focus();
                input.select();
            }
        }
    });

    function handleSearchBlur(input, clearBtn) {
        if (input && clearBtn) {
            input.addEventListener('blur', function() {
                if (!this.value) clearBtn.classList.remove('visible');
            });
        }
    }
    handleSearchBlur(searchInput, searchClear);
    handleSearchBlur(searchInputMobile, searchClearMobile);

    console.log('DoYouEvenGif-alt loaded.');
})();
