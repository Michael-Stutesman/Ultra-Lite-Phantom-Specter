// ==UserScript==
// @name         Phantom+Specter v5.4 (Adblocker)
// @namespace    ultralean.universal.adblocker
// @version      5.4
// @description  Ultra-lean content blocker featuring network interception, selective deep scanning, iframe/script filtering, and minimal-overhead page cleanup with privacy-first design.
// @author       Michael Stutesman
// @license      MIT
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @downloadURL https://update.greasyfork.org/scripts/583278/Phantom%2BSpecter%20v54%20%28Adblocker%29.user.js
// @updateURL https://update.greasyfork.org/scripts/583278/Phantom%2BSpecter%20v54%20%28Adblocker%29.meta.js
// ==/UserScript==

(() => {
    'use strict';

    /* ---------------- SINGLETON GUARD ---------------- */
    const KEY = "__PHANTOM_SPECTER_V53__";
    if (window[KEY]) return;
    Object.defineProperty(window, KEY, {
        value: true,
        configurable: false
    });

    /* ---------------- SITE EXCLUSIONS ---------------- */
    const HOST = location.hostname.toLowerCase();

    const excluded =
        GM_getValue("ps_excluded_sites", []) || [];

    if (excluded.includes(HOST)) return;

    /* ---------------- BLOCK RULES ---------------- */
    const blocked =
        /amazon-adsystem\.com|doubleclick\.net|googlesyndication\.com|google-analytics\.com|googletagmanager\.com|scorecardresearch\.com|taboola\.com|outbrain\.com|adsafeprotected\.com|adservice\.google\.com|adnxs\.com|rubiconproject\.com|openx\.net|pubmatic\.com|criteo\.net|media\.net|moatads\.com|adsrvr\.org|teads\.tv|sharethrough\.com|zemanta\.com|ligatus\.com|revcontent\.com|mgid\.com|segment\.io|mixpanel\.com|amplitude\.com|hotjar\.com|fullstory\.com|connect\.facebook\.net|facebook\.com\/tr/;

    const isBlocked = (u) => !!u && blocked.test(u);

    /* ---------------- CSS LAYER ---------------- */
    const style = document.createElement('style');
    style.textContent = `
        iframe[src*="ads"],
        iframe[src*="doubleclick"],
        iframe[src*="advert"],
        [id^="ad_"],
        [class^="ad_"],
        [id*="sponsor"],
        [class*="sponsor"],
        [aria-label="Sponsored"] {
            display:none !important;
        }
    `;
    document.documentElement.appendChild(style);

    /* ---------------- FETCH HOOK ---------------- */
    const nativeFetch = window.fetch;
    window.fetch = function (...args) {
        const r = args[0];
        const url = typeof r === "string" ? r : r?.url;
        if (isBlocked(url)) {
            return Promise.reject(new DOMException("Blocked", "AbortError"));
        }
        return nativeFetch.apply(this, args);
    };

    /* ---------------- XHR HOOK ---------------- */
    const XHR = XMLHttpRequest.prototype;

    const open = XHR.open;
    const send = XHR.send;

    XHR.open = function (method, url, ...rest) {
        if (isBlocked(url)) {
            this._blocked = 1;
            return;
        }
        return open.call(this, method, url, ...rest);
    };

    XHR.send = function (...args) {
        if (this._blocked) return;
        return send.apply(this, args);
    };

    /* ---------------- SRC HOOK ---------------- */
    const hookSrc = (proto) => {
        const desc = Object.getOwnPropertyDescriptor(proto, "src");
        if (!desc || !desc.set) return;

        const set = desc.set;
        const get = desc.get;

        Object.defineProperty(proto, "src", {
            set(v) {
                if (!isBlocked(v)) set.call(this, v);
            },
            get,
            configurable: true
        });
    };

    hookSrc(HTMLImageElement.prototype);
    hookSrc(HTMLIFrameElement.prototype);

    /* ---------------- INTELLIGENCE ENGINE ---------------- */
    const SUSPICIOUS_IFRAME_HINTS = [
        "ads", "doubleclick", "adservice", "banner", "sponsor"
    ];

    const isSuspicious = (src = "") => {
        for (let i = 0; i < SUSPICIOUS_IFRAME_HINTS.length; i++) {
            if (src.includes(SUSPICIOUS_IFRAME_HINTS[i])) return true;
        }
        return false;
    };

    const deepScan = (root) => {
        if (!root || !root.querySelectorAll) return;

        const nodes = root.querySelectorAll("iframe,script,img");

        for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];

            const src = n.src || n.getAttribute?.("src");
            if (isBlocked(src)) {
                n.remove();
            }
        }
    };

    /* ---------------- MUTATION OBSERVER (LIGHT CORE) ---------------- */
    let mutationBudget = 0;
    const BUDGET_LIMIT = 40;

    const observer = new MutationObserver((muts) => {
        mutationBudget++;

        const doDeep = mutationBudget > BUDGET_LIMIT;
        if (doDeep) mutationBudget = 0;

        for (let i = 0; i < muts.length; i++) {
            const nodes = muts[i].addedNodes;
            if (!nodes) continue;

            for (let j = 0; j < nodes.length; j++) {
                const el = nodes[j];
                if (!el || el.nodeType !== 1) continue;

                const tag = el.tagName;

                if (tag === "SCRIPT" || tag === "IMG") {
                    const src = el.src || el.getAttribute?.("src");
                    if (isBlocked(src)) {
                        el.remove();
                        continue;
                    }
                }

                if (tag === "IFRAME") {
                    const src = el.src;

                    if (isBlocked(src)) {
                        el.style.display = "none";
                        continue;
                    }

                    if (doDeep || isSuspicious(src)) {
                        deepScan(el);
                    }
                }

                if (doDeep) {
                    deepScan(el);
                }
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    /* ---------------- INITIAL CLEAN ---------------- */
    const initial = document.querySelectorAll("script,iframe,img");
    for (let i = 0; i < initial.length; i++) {
        const n = initial[i];
        const src = n.src || n.getAttribute?.("src");
        if (isBlocked(src)) n.remove();
    }

    /* ---------------- VIDEO OBSERVER (MINIMAL) ---------------- */
    const io = new IntersectionObserver((entries) => {
        for (let i = 0; i < entries.length; i++) {
            const e = entries[i];
            if (!e.isIntersecting) continue;

            const el = e.target;
            if (el.tagName === "VIDEO") {
                try { el.play(); } catch {}
            }

            io.unobserve(el);
        }
    }, {
        rootMargin: "250px",
        threshold: 0.01
    });

    const vids = document.getElementsByTagName("video");
    for (let i = 0; i < vids.length; i++) {
        io.observe(vids[i]);
    }

    /* ---------------- MENU COMMANDS ---------------- */
    GM_registerMenuCommand("🚫 Exclude this site", () => {
        const list = GM_getValue("ps_excluded_sites", []) || [];
        if (!list.includes(HOST)) {
            list.push(HOST);
            GM_setValue("ps_excluded_sites", list);
            location.reload();
        }
    });

    GM_registerMenuCommand("🔄 Clear exclusions", () => {
        GM_setValue("ps_excluded_sites", []);
        location.reload();
    });

    console.log("[Phantom Specter v5.4 Hybrid] Active");
})();
