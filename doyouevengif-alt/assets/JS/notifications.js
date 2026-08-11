(function () {
'use strict';

const API_BASE = window.location.origin;

// ─── DOM Elements ──────────────────────────────────────

const wrapper = document.createElement('div');
wrapper.className = 'notification-wrapper';
wrapper.id = 'notificationWrapper';

wrapper.innerHTML = `
    <div class="notification-bell" id="notificationBell">
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        <span
            class="notification-badge"
            id="notificationBadge"
        >0</span>
    </div>

    <div
        class="notification-dropdown"
        id="notificationDropdown"
    >
        <div class="notif-dropdown-header">
            <span>Notifications</span>

            <button
                class="clear-btn"
                id="clearAllBtn"
                type="button"
            >
                Clear all
            </button>
        </div>

        <div
            class="notif-list"
            id="notifList"
        ></div>
    </div>
`;

document.body.appendChild(wrapper);


// ─── Chat Overlay ──────────────────────────────────────

const chatOverlay = document.createElement('div');

chatOverlay.className = 'chat-overlay';
chatOverlay.id = 'chatOverlay';

chatOverlay.innerHTML = `
    <div class="chat-modal">

        <div class="chat-header">

            <button
                class="back-btn"
                id="chatBackBtn"
                type="button"
                aria-label="Back"
            >
                ←
            </button>

            <img
                class="chat-avatar"
                id="chatAvatar"
                src="/favicon.png"
                alt="DoYouEvenGif-alt"
            >

            <span
                class="chat-name"
                id="chatName"
            >
                DoYouEvenGif-alt
            </span>

        </div>

        <div
            class="chat-messages"
            id="chatMessages"
        ></div>

    </div>
`;

document.body.appendChild(chatOverlay);


// ─── References ────────────────────────────────────────

const bell =
    document.getElementById('notificationBell');

const badge =
    document.getElementById('notificationBadge');

const dropdown =
    document.getElementById('notificationDropdown');

const list =
    document.getElementById('notifList');

const clearBtn =
    document.getElementById('clearAllBtn');

const chatOverlayEl =
    document.getElementById('chatOverlay');

const chatBackBtn =
    document.getElementById('chatBackBtn');

const chatAvatar =
    document.getElementById('chatAvatar');

const chatName =
    document.getElementById('chatName');

const chatMessages =
    document.getElementById('chatMessages');


// ─── State ─────────────────────────────────────────────

let notifications = [];
let isDropdownOpen = false;
let currentNotif = null;


// ─── Security / Message Formatting ────────────────────

function appendFormattedMessage(container, text) {

    if (!text) {
        return;
    }

    const message = String(text);

    const urlRegex =
        /https?:\/\/[^\s<>"']+/gi;

    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(message)) !== null) {

        // Text before URL
        if (match.index > lastIndex) {

            container.appendChild(
                document.createTextNode(
                    message.slice(
                        lastIndex,
                        match.index
                    )
                )
            );
        }

        let url = match[0];

        // Remove punctuation that should not be part
        // of the URL.
        let trailing = '';

        while (
            /[.,!?;:)\]}]+$/.test(url)
        ) {
            trailing =
                url.slice(-1) + trailing;

            url =
                url.slice(0, -1);
        }

        const link =
            document.createElement('a');

        link.href = url;
        link.textContent = url;

        link.target = '_blank';
        link.rel = 'noopener noreferrer';

        link.className =
            'notification-link';

        /*
         * IMPORTANT:
         *
         * Clicking the URL should NOT also trigger
         * the notification item's click handler.
         */
        link.addEventListener(
            'click',
            function (e) {
                e.stopPropagation();
            }
        );

        container.appendChild(link);

        if (trailing) {

            container.appendChild(
                document.createTextNode(
                    trailing
                )
            );
        }

        lastIndex =
            match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < message.length) {

        container.appendChild(
            document.createTextNode(
                message.slice(lastIndex)
            )
        );
    }
}


// ─── Fetch Notifications ──────────────────────────────

async function fetchNotifications() {

    try {

        const resp =
            await fetch(
                `${API_BASE}/api/notifications`,
                {
                    cache: 'no-store'
                }
            );

        if (!resp.ok) {
            throw new Error(
                `HTTP ${resp.status}`
            );
        }

        notifications =
            await resp.json();

        updateUI();

    } catch (err) {

        console.error(
            'Error fetching notifications:',
            err
        );
    }
}


// ─── Fetch Unread Count ───────────────────────────────

async function fetchUnreadCount() {

    try {

        const resp =
            await fetch(
                `${API_BASE}/api/notifications/unread`,
                {
                    cache: 'no-store'
                }
            );

        if (!resp.ok) {
            throw new Error(
                `HTTP ${resp.status}`
            );
        }

        const data =
            await resp.json();

        const count =
            Number(data.count) || 0;

        if (count > 0) {

            badge.textContent =
                count > 99
                    ? '99+'
                    : String(count);

            badge.classList.add(
                'visible'
            );

        } else {

            badge.textContent = '0';

            badge.classList.remove(
                'visible'
            );
        }

    } catch (err) {

        console.error(
            'Error fetching unread count:',
            err
        );
    }
}


// ─── Format Time ───────────────────────────────────────

function formatTime(timestamp) {

    if (!timestamp) {
        return '';
    }

    const date =
        new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: '2-digit',
            minute: '2-digit'
        }
    );
}


// ─── Get Message Count ────────────────────────────────

function getMessageCount(notification) {

    const count =
        notification.message_count ??
        notification.count ??
        1;

    const number =
        Number(count);

    return Number.isFinite(number) &&
           number > 0
        ? number
        : 1;
}


// ─── Update Notification UI ───────────────────────────

function updateUI() {

    if (!Array.isArray(notifications)) {
        notifications = [];
    }

    if (notifications.length === 0) {

        list.innerHTML = `
            <div class="notif-empty">
                No notifications yet.
            </div>
        `;

        return;
    }


    // Clear existing notifications
    list.innerHTML = '';


    notifications.forEach(function (n) {

        const item =
            document.createElement('div');

        item.className =
            `notif-item ${n.read ? '' : 'unread'}`;

        item.dataset.id =
            String(n.id);


        // ─── Avatar ───────────────────────────────

        const avatar =
            document.createElement('img');

        avatar.className =
            'notif-avatar';

        avatar.src =
            n.avatar || '/favicon.png';

        avatar.alt =
            'DoYouEvenGif-alt';

        avatar.onerror =
            function () {
                this.src = '/favicon.png';
            };


        // ─── Content ─────────────────────────────

        const content =
            document.createElement('div');

        content.className =
            'notif-content';


        const name =
            document.createElement('div');

        name.className =
            'notif-name';

        name.textContent =
            'DoYouEvenGif-alt';


        const preview =
            document.createElement('div');

        preview.className =
            'notif-preview';


        appendFormattedMessage(
            preview,
            n.message || ''
        );


        content.appendChild(name);
        content.appendChild(preview);


        // ─── Right Side ──────────────────────────

        const right =
            document.createElement('div');

        right.className =
            'notif-right';


        const time =
            document.createElement('div');

        time.className =
            'notif-time';

        time.textContent =
            formatTime(n.timestamp);


        right.appendChild(time);


        /*
         * =================================================
         * FIX:
         *
         * ONLY show the number when notification
         * is unread.
         *
         * Read notification = NO NUMBER.
         * =================================================
         */

        if (!n.read) {

            const count =
                document.createElement('span');

            count.className =
                'notif-unread-count';

            count.textContent =
                getMessageCount(n);

            right.appendChild(count);
        }


        // ─── Assemble Item ───────────────────────

        item.appendChild(avatar);
        item.appendChild(content);
        item.appendChild(right);


        // ─── Click ───────────────────────────────

        item.addEventListener(
            'click',
            function () {

                const id =
                    Number(this.dataset.id);

                const notif =
                    notifications.find(
                        function (notification) {

                            return Number(
                                notification.id
                            ) === id;
                        }
                    );

                if (notif) {

                    openChat(notif);
                }
            }
        );


        list.appendChild(item);
    });


    /*
     * Update bell number too.
     */
    fetchUnreadCount();
}


// ─── Dropdown Toggle ──────────────────────────────────

bell.addEventListener(
    'click',
    function (e) {

        e.stopPropagation();

        isDropdownOpen =
            !isDropdownOpen;

        dropdown.classList.toggle(
            'open',
            isDropdownOpen
        );

        if (isDropdownOpen) {

            fetchNotifications();
        }
    }
);


// ─── Close Dropdown ───────────────────────────────────

document.addEventListener(
    'click',
    function (e) {

        if (
            !wrapper.contains(e.target) &&
            isDropdownOpen
        ) {

            isDropdownOpen = false;

            dropdown.classList.remove(
                'open'
            );
        }
    }
);


// ─── Clear All ────────────────────────────────────────

clearBtn.addEventListener(
    'click',
    async function (e) {

        e.stopPropagation();

        if (
            notifications.length === 0
        ) {
            return;
        }

        if (
            !confirm(
                'Clear all notifications?'
            )
        ) {
            return;
        }

        try {

            const resp =
                await fetch(
                    `${API_BASE}/api/notifications/clear`,
                    {
                        method: 'POST'
                    }
                );

            if (!resp.ok) {
                throw new Error(
                    `HTTP ${resp.status}`
                );
            }

            notifications = [];

            updateUI();

            badge.textContent = '0';

            badge.classList.remove(
                'visible'
            );

        } catch (err) {

            console.error(
                'Clear error:',
                err
            );
        }
    }
);


// ─── Open Chat ─────────────────────────────────────────

async function openChat(notif) {

    currentNotif = notif;


    /*
     * =================================================
     * MARK AS READ IMMEDIATELY
     * =================================================
     *
     * We update the local notification FIRST.
     *
     * This makes the "1" disappear immediately,
     * instead of waiting for the server.
     * =================================================
     */

    if (!notif.read) {

        // Immediately mark local state as read
        notif.read = true;

        // Immediately remove:
        // - notification number
        // - unread styling
        // - unread bell count
        updateUI();

        /*
         * Update the server in the background.
         */
        try {

            const resp =
                await fetch(
                    `${API_BASE}/api/notifications/mark-read`,
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({
                            id: notif.id
                        })
                    }
                );

            if (!resp.ok) {
                throw new Error(
                    `HTTP ${resp.status}`
                );
            }

            /*
             * Refresh unread count after
             * server confirms.
             */
            fetchUnreadCount();

        } catch (err) {

            console.error(
                'Mark read error:',
                err
            );
        }
    }


    // ─── Chat Header ─────────────────────────────

    chatAvatar.src =
        notif.avatar || '/favicon.png';

    chatAvatar.onerror =
        function () {
            this.src = '/favicon.png';
        };

    chatName.textContent =
        'DoYouEvenGif-alt';


    // ─── Chat Message ────────────────────────────

    chatMessages.innerHTML = '';

    const message =
        document.createElement('div');

    message.className =
        'chat-message';


    appendFormattedMessage(
        message,
        notif.message || ''
    );


    const msgTime =
        document.createElement('span');

    msgTime.className =
        'msg-time';

    msgTime.textContent =
        formatTime(notif.timestamp);


    message.appendChild(msgTime);

    chatMessages.appendChild(message);


    // ─── Open Chat ───────────────────────────────

    chatOverlayEl.classList.add(
        'open'
    );

    document.body.style.overflow =
        'hidden';
}


// ─── Back Button ──────────────────────────────────────

chatBackBtn.addEventListener(
    'click',
    function () {

        chatOverlayEl.classList.remove(
            'open'
        );

        document.body.style.overflow =
            '';

        currentNotif = null;

        fetchNotifications();
    }
);


// ─── Click Outside Chat ───────────────────────────────

chatOverlayEl.addEventListener(
    'click',
    function (e) {

        if (e.target === this) {

            chatBackBtn.click();
        }
    }
);


// ─── Escape Key ───────────────────────────────────────

document.addEventListener(
    'keydown',
    function (e) {

        if (
            e.key === 'Escape' &&
            chatOverlayEl.classList.contains('open')
        ) {

            chatBackBtn.click();
        }
    }
);


// ─── Initial Load ─────────────────────────────────────

fetchNotifications();
fetchUnreadCount();


// ─── Auto Refresh ────────────────────────────────────

setInterval(
    fetchNotifications,
    60000
);

setInterval(
    fetchUnreadCount,
    60000
);


console.log(
    'Notification bell loaded.'
);

})();