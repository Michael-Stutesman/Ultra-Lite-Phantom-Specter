// ==UserScript==
// @name         Ultra-Lite Phantom+Specter v5.0 (Stable Universal)
// @namespace    universal.ultralite.safe.perf
// @version      5.0
// @description  Cross-browser stable ad/script/iframe blocking with minimal risk footprint
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // ---------------- Blocklist ----------------
    const blocked =
/amazon-adsystem\.com|doubleclick\.net|googlesyndication\.com|google-analytics\.com|googletagmanager\.com|scorecardresearch\.com|taboola\.com|outbrain\.com|adsafeprotected\.com|adservice\.google\.com|adnxs\.com|rubiconproject\.com|openx\.net|pubmatic\.com|criteo\.net|media\.net|moatads\.com|adsrvr\.org|teads\.tv|sharethrough\.com|zemanta\.com|ligatus\.com|revcontent\.com|mgid\.com|segment\.io|mixpanel\.com|amplitude\.com|hotjar\.com|fullstory\.com|connect\.facebook\.net|facebook\.com\/tr/;
    const isBlocked = (url) => !!url && blocked.test(url);

    const safeTags = ["IMG", "VIDEO", "SECTION", "ARTICLE", "ASIDE"];

    const adSelectors =
        'iframe[src*="ads"], iframe[src*="doubleclick"], iframe[src*="advert"], div[id^="ad_"], div[class^="ad_"], div[id*="sponsor"], div[class*="sponsor"], [aria-label="Sponsored"]';

    // ---------------- Safe src hook (Firefox-safe) ----------------
    function hookSrc(proto) {
        const desc = Object.getOwnPropertyDescriptor(proto, "src");
        if (!desc || !desc.set) return;

        Object.defineProperty(proto, "src", {
            set(v) {
                if (!isBlocked(v)) desc.set.call(this, v);
            },
            get: desc.get,
            configurable: true
        });
    }

    hookSrc(HTMLImageElement.prototype);
    hookSrc(HTMLIFrameElement.prototype);

    // ---------------- Safe fetch override ----------------
    const nativeFetch = window.fetch;

    window.fetch = function (...args) {
        const url = args?.[0]?.url || args?.[0];
        if (isBlocked(url)) {
            return Promise.reject(new DOMException("Blocked", "AbortError"));
        }
        return nativeFetch.apply(this, args);
    };

    // ---------------- XHR protection ----------------
    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (isBlocked(url)) {
            this._blocked = true;
            return;
        }
        return open.call(this, method, url, ...rest);
    };

    const send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function (...args) {
        if (this._blocked) return;
        return send.apply(this, args);
    };

    // ---------------- Lazy loader ----------------
    const io = new IntersectionObserver((entries) => {
        for (const e of entries) {
            const el = e.target;
            if (!e.isIntersecting) continue;

            el.classList.remove("ul-lite-hidden");
            if (el.tagName === "VIDEO") {
                try { el.play(); } catch {}
            }
            io.unobserve(el);
        }
    }, {
        rootMargin: "250px",
        threshold: 0.01
    });

    function attach(node) {
        if (!node || node.nodeType !== 1) return;

        if (safeTags.includes(node.tagName)) {
            io.observe(node);
        }

        node.querySelectorAll?.(safeTags.join(",")).forEach(io.observe.bind(io));
    }

    // ---------------- Mutation system ----------------
    let lastRun = 0;
    const cooldown = 200;

    const observer = new MutationObserver((muts) => {
        const now = performance.now();
        if (now - lastRun < cooldown) return;
        lastRun = now;

        for (const m of muts) {
            for (const n of m.addedNodes || []) {
                if (n.nodeType !== 1) continue;

                const el = n;

                // block obvious junk immediately
                if (
                    ["SCRIPT", "IFRAME", "IMG"].includes(el.tagName) &&
                    isBlocked(el.src || el.getAttribute?.("src"))
                ) {
                    el.remove();
                    continue;
                }

                // hide ad iframe instead of hard remove (safer)
                if (el.tagName === "IFRAME" && isBlocked(el.src)) {
                    el.style.display = "none";
                    continue;
                }

                attach(el);

                el.querySelectorAll?.("script,iframe,img").forEach((c) => {
                    if (isBlocked(c.src || c.getAttribute?.("src"))) {
                        c.remove();
                    }
                });
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // ---------------- Initial cleanup ----------------
    document.querySelectorAll("script,iframe,img").forEach((n) => {
        if (isBlocked(n.src || n.getAttribute?.("src"))) n.remove();
    });

    document.querySelectorAll(safeTags.join(",")).forEach(attach);

    // ---------------- CSS block layer ----------------
    const style = document.createElement("style");
    style.textContent = `
        ${adSelectors} { display:none !important; }
        .ul-lite-hidden {
            visibility:hidden !important;
            opacity:0 !important;
            pointer-events:none !important;
        }
    `;
    document.documentElement.appendChild(style);

    console.log("[Ultra-Lite Phantom+Specter v5.0] Stable universal mode active");
})();
