Ultra-Lite Phantom+Specter
Lightweight Web Content Blocker Userscript for Tampermonkey

📌 Overview
Ultra-Lite Phantom+Specter is a lightweight Tampermonkey userscript designed to reduce ads, tracking scripts, and sponsored content across the web.
It works at document-start and uses multiple protection layers (network + DOM + mutation observation) to remove unwanted content early and efficiently.

⚙️ Features

🚫 Blocks major ad, tracker, and analytics domains
⚡ Runs at document-start for early interception
🌐 Intercepts fetch, XMLHttpRequest, and element src loads
🧠 Uses MutationObserver for dynamic page cleanup
🪶 Lightweight with no external dependencies
📺 Reduces sponsored and embedded ad elements
🔄 Works across most websites (*://*/*)


🔧 How It Works
The script applies multiple layers of filtering:


Network Blocking

Prevents requests to known ad/tracking domains



Request Interception

Hooks into fetch and XMLHttpRequest to block unwanted calls



Element Protection

Blocks or removes scripts, images, and iframes from blocked sources



Dynamic Cleanup

Uses MutationObserver to remove injected ads in real time



Lazy Loading Support

Safely handles visible content while minimizing unnecessary loads




📦 Installation
1. Install Tampermonkey

https://www.tampermonkey.net/

2. Install the script
Click here to install directly:
[https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/Ultra-Lite-Phantom.user.js](https://raw.githubusercontent.com/Michael-Stutesman/Ultra-Lite-Phantom-Specter/main/Ultra-Lite-Phantom.user.js)

Or:

Open Tampermonkey dashboard
Create a new script
Paste the contents of Ultra-Lite-Phantom.user.js
Save


⚠️ Important Notes

Some websites may break or behave unexpectedly due to blocked resources
Sites relying heavily on tracking or third-party scripts may not function correctly
This script prioritizes privacy and performance over full site compatibility


🧪 Compatibility

Chrome (Tampermonkey)
Edge (Tampermonkey)
Firefox (Tampermonkey / Greasemonkey)


📈 Performance
Designed to stay lightweight:

Minimal CPU overhead
Debounced mutation processing
Early request blocking to reduce wasted loading


📄 License
MIT License (recommended)

🙌 Disclaimer
This script is intended for privacy improvement and reducing unwanted content. Use responsibly and be aware that blocking certain resources may affect site functionality.

🧠 Future Ideas

Per-site toggle system
Whitelist manager
UI overlay for live stats
Extension version (optional future upgrade)

