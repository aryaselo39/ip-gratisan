import { connect } from 'cloudflare:sockets';

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="https://i.ibb.co/x8fghRZK/970290de75c2.png">
    <title>Proxy IP Tester</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: #0f172a; 
            color: #f8fafc; 
            overflow-y: scroll;
        }
        .glass-panel { 
            background: rgba(30, 41, 59, 0.7); 
            backdrop-filter: blur(12px); 
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(51, 65, 85, 0.5); 
        }
        .custom-scrollbar::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(71, 85, 105, 0.8); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 1); }
        
        select {
            appearance: none;
            background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right 1rem center;
            background-size: 1em;
        }
    </style>
</head>
<body class="min-h-screen p-4 md:p-8 flex flex-col items-center">
    
    <div class="w-full max-w-5xl space-y-6 relative z-10">
        <!-- Header -->
        <div class="text-center space-y-3 mb-8 pt-4">
            <h1 class="text-3xl md:text-5xl font-bold tracking-tight text-white">
                Proxy IP <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Tester</span>
            </h1>
            <p class="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
                Validates routing logic and measures raw TCP edge latency by establishing direct socket connections.
            </p>
        </div>

        <!-- Controls Section -->
        <div class="glass-panel rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div class="flex flex-col md:flex-row gap-4 items-end relative z-10">
                <div class="w-full md:flex-1 space-y-2">
                    <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Select Country</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <i class="fas fa-globe-americas text-slate-400"></i>
                        </div>
                        <select id="country-select" class="w-full bg-slate-800/80 border border-slate-600 rounded-xl pl-12 pr-10 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition shadow-inner font-medium cursor-pointer">
                            <option value="" disabled selected>Loading countries...</option>
                        </select>
                    </div>
                </div>
                
                <button id="btn-test" onclick="startTesting()" disabled class="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3.5 px-8 rounded-xl shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    <i class="fas fa-play mr-2"></i> Run Diagnostics
                </button>
            </div>
        </div>

        <!-- Testing Progress UI -->
        <div id="progress-card" class="hidden glass-panel rounded-2xl p-6 shadow-xl border-blue-500/20">
            <div class="flex justify-between items-center mb-2">
                <h3 id="progress-title" class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Testing Nodes...</h3>
                <span id="progress-stats" class="text-sm font-mono text-blue-400 font-medium">0 / 0</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2.5 mb-2 overflow-hidden border border-slate-700">
                <div id="progress-bar" class="bg-gradient-to-r from-blue-500 to-emerald-400 h-2.5 rounded-full transition-all duration-300 w-0"></div>
            </div>
            <p id="progress-status" class="text-xs text-slate-400 font-medium mt-3 flex items-center">
                <i class="fas fa-circle-notch fa-spin mr-2"></i> Fetching list...
            </p>
        </div>

        <!-- Best Proxy Highlight Card -->
        <div id="best-proxy-card" class="hidden glass-panel rounded-2xl p-6 md:p-8 shadow-2xl border-emerald-500/30 relative overflow-hidden group">
            <div class="absolute -right-10 -bottom-10 opacity-5 pointer-events-none transition transform group-hover:scale-110 group-hover:opacity-10 duration-500">
                <i class="fas fa-trophy text-9xl text-emerald-400"></i>
            </div>
            
            <div class="relative z-10">
                <h2 class="text-emerald-400 font-bold text-xs md:text-sm tracking-wider uppercase mb-3 flex items-center">
                    <span class="bg-emerald-400/20 p-1.5 rounded-md mr-2"><i class="fas fa-star text-emerald-400"></i></span> 
                    Optimal Proxy Node
                </h2>
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div id="best-ip" class="text-4xl md:text-5xl font-mono font-bold tracking-tight text-white mb-2"></div>
                        <div class="flex flex-wrap items-center gap-3 md:gap-4 text-sm md:text-base">
                            <div class="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 shadow-sm">
                                <span class="text-slate-400 font-medium mr-1">Port</span> 
                                <span id="best-port" class="text-white font-mono font-semibold"></span>
                            </div>
                            <div class="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-sm">
                                <span class="text-slate-400 font-medium mr-1">Edge TCP Ping</span> 
                                <span id="best-ping" class="text-emerald-400 font-mono font-bold"></span>
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="copyBestIP(false)" class="flex-1 md:flex-none bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded-xl shadow-lg font-medium transition flex items-center justify-center border border-slate-600">
                            <i class="far fa-copy mr-2"></i> IP
                        </button>
                        <button onclick="copyBestIP(true)" class="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 font-medium transition flex items-center justify-center border border-emerald-500/50">
                            <i class="fas fa-link mr-2"></i> IP:Port
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Results Table -->
        <div id="results-container" class="hidden glass-panel rounded-2xl overflow-hidden shadow-xl border-slate-700/50">
            <div class="bg-slate-800/50 px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
                <h3 class="text-sm font-semibold text-slate-300 uppercase tracking-wider">Test Results</h3>
                <span id="results-count" class="text-xs font-mono bg-slate-700 text-slate-300 px-2 py-1 rounded-md">0 IPs</span>
            </div>
            <div class="overflow-auto custom-scrollbar max-h-[600px]">
                <table class="min-w-full text-left text-sm whitespace-nowrap relative">
                    <thead class="uppercase tracking-wider bg-slate-900/80 text-slate-400 font-semibold text-xs sticky top-0 z-20 backdrop-blur-md shadow-sm">
                        <tr>
                            <th scope="col" class="px-6 py-4">IP Address</th>
                            <th scope="col" class="px-6 py-4">Port</th>
                            <th scope="col" class="px-6 py-4">Status</th>
                            <th scope="col" class="px-6 py-4">Edge Ping</th>
                            <th scope="col" class="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="proxy-list" class="divide-y divide-slate-700/50">
                        <!-- JS populated -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl border border-slate-600 transform transition-all duration-300 translate-y-full opacity-0 z-50 font-medium flex items-center min-w-[250px]">
        <div id="toast-icon" class="mr-3 text-xl"></div>
        <span id="toast-msg" class="text-sm">Notification</span>
    </div>

    <script>
        // Static dictionary of countries and flags
        const COUNTRIES = {
            "AE": { name: "United Arab Emirates", flag: "🇦🇪" },
            "AF": { name: "Afghanistan", flag: "🇦🇫" },
            "AR": { name: "Argentina", flag: "🇦🇷" },
            "AT": { name: "Austria", flag: "🇦🇹" },
            "AU": { name: "Australia", flag: "🇦🇺" },
            "BE": { name: "Belgium", flag: "🇧🇪" },
            "BG": { name: "Bulgaria", flag: "🇧🇬" },
            "BH": { name: "Bahrain", flag: "🇧🇭" },
            "BR": { name: "Brazil", flag: "🇧🇷" },
            "CA": { name: "Canada", flag: "🇨🇦" },
            "CH": { name: "Switzerland", flag: "🇨🇭" },
            "CL": { name: "Chile", flag: "🇨🇱" },
            "CN": { name: "China", flag: "🇨🇳" },
            "CO": { name: "Colombia", flag: "🇨🇴" },
            "CZ": { name: "Czech Republic", flag: "🇨🇿" },
            "DE": { name: "Germany", flag: "🇩🇪" },
            "DK": { name: "Denmark", flag: "🇩🇰" },
            "EG": { name: "Egypt", flag: "🇪🇬" },
            "ES": { name: "Spain", flag: "🇪🇸" },
            "FI": { name: "Finland", flag: "🇫🇮" },
            "FR": { name: "France", flag: "🇫🇷" },
            "GB": { name: "United Kingdom", flag: "🇬🇧" },
            "GE": { name: "Georgia", flag: "🇬🇪" },
            "GR": { name: "Greece", flag: "🇬🇷" },
            "HK": { name: "Hong Kong", flag: "🇭🇰" },
            "HR": { name: "Croatia", flag: "🇭🇷" },
            "HU": { name: "Hungary", flag: "🇭🇺" },
            "ID": { name: "Indonesia", flag: "🇮🇩" },
            "IE": { name: "Ireland", flag: "🇮🇪" },
            "IL": { name: "Israel", flag: "🇮🇱" },
            "IN": { name: "India", flag: "🇮🇳" },
            "IQ": { name: "Iraq", flag: "🇮🇶" },
            "IR": { name: "Iran", flag: "🇮🇷" },
            "IS": { name: "Iceland", flag: "🇮🇸" },
            "IT": { name: "Italy", flag: "🇮🇹" },
            "JP": { name: "Japan", flag: "🇯🇵" },
            "KE": { name: "Kenya", flag: "🇰🇪" },
            "KR": { name: "South Korea", flag: "🇰🇷" },
            "KW": { name: "Kuwait", flag: "🇰🇼" },
            "KZ": { name: "Kazakhstan", flag: "🇰🇿" },
            "LB": { name: "Lebanon", flag: "🇱🇧" },
            "MX": { name: "Mexico", flag: "🇲🇽" },
            "MY": { name: "Malaysia", flag: "🇲🇾" },
            "NG": { name: "Nigeria", flag: "🇳🇬" },
            "NL": { name: "Netherlands", flag: "🇳🇱" },
            "NO": { name: "Norway", flag: "🇳🇴" },
            "NZ": { name: "New Zealand", flag: "🇳🇿" },
            "OM": { name: "Oman", flag: "🇴🇲" },
            "PE": { name: "Peru", flag: "🇵🇪" },
            "PH": { name: "Philippines", flag: "🇵🇭" },
            "PK": { name: "Pakistan", flag: "🇵🇰" },
            "PL": { name: "Poland", flag: "🇵🇱" },
            "PT": { name: "Portugal", flag: "🇵🇹" },
            "QA": { name: "Qatar", flag: "🇶🇦" },
            "RO": { name: "Romania", flag: "🇷🇴" },
            "RS": { name: "Serbia", flag: "🇷🇸" },
            "RU": { name: "Russia", flag: "🇷🇺" },
            "SA": { name: "Saudi Arabia", flag: "🇸🇦" },
            "SE": { name: "Sweden", flag: "🇸🇪" },
            "SG": { name: "Singapore", flag: "🇸🇬" },
            "TH": { name: "Thailand", flag: "🇹🇭" },
            "TR": { name: "Turkey", flag: "🇹🇷" },
            "TW": { name: "Taiwan", flag: "🇹🇼" },
            "UA": { name: "Ukraine", flag: "🇺🇦" },
            "US": { name: "United States", flag: "🇺🇸" },
            "VN": { name: "Vietnam", flag: "🇻🇳" },
            "ZA": { name: "South Africa", flag: "🇿🇦" }
        };

        let proxies = [];
        let isTesting = false;
        let activeAbortController = null;
        let currentBest = null;
        const MAX_CONCURRENT_PINGS = 20;

        document.addEventListener('DOMContentLoaded', initApp);

        function initApp() {
            const select = document.getElementById('country-select');
            const btn = document.getElementById('btn-test');
            
            let html = '<option value="" disabled selected>Choose a country...</option>';
            
            // Sort by Country Name
            const sortedCodes = Object.keys(COUNTRIES).sort((a, b) => {
                return COUNTRIES[a].name.localeCompare(COUNTRIES[b].name);
            });

            sortedCodes.forEach(cc => {
                const info = COUNTRIES[cc];
                html += \`<option value="\${cc}">\${info.flag} \${info.name} (\${cc})</option>\`;
            });
            
            select.innerHTML = html;
            
            select.addEventListener('change', () => {
                if(select.value && !isTesting) {
                    btn.disabled = false;
                }
            });
        }

        async function startTesting() {
            const select = document.getElementById('country-select');
            const cc = select.value;
            
            if (!cc) return;
            
            isTesting = true;
            select.disabled = true;
            document.getElementById('btn-test').disabled = true;
            document.getElementById('btn-test').innerHTML = '<i class="fas fa-circle-notch fa-spin mr-2"></i> Testing Nodes...';
            
            document.getElementById('best-proxy-card').classList.add('hidden');
            document.getElementById('results-container').classList.add('hidden');
            
            const progressCard = document.getElementById('progress-card');
            progressCard.classList.remove('hidden');
            updateProgressText('Fetching IP list from GitHub...');
            setProgressBar(5);
            
            if (activeAbortController) activeAbortController.abort();
            activeAbortController = new AbortController();
            
            try {
                const res = await fetch('/api/proxies?cc=' + encodeURIComponent(cc));
                const data = await res.json();
                
                if (!res.ok) {
                    if (data.error === 'not available') {
                        throw new Error('Proxy list for this country is not available on the repository yet.');
                    }
                    throw new Error(data.error || 'Server error fetching proxies');
                }
                
                if (data.proxies.length === 0) throw new Error('Proxy list is empty');
                
                proxies = data.proxies.map(p => ({ 
                    ip: p.ip, 
                    port: p.port, 
                    ping: null, 
                    isValid: false,
                    isTesting: false 
                }));
                
                document.getElementById('results-count').textContent = \`\${proxies.length} IPs\`;
                document.getElementById('results-container').classList.remove('hidden');
                renderTable();
                
                updateProgressText('Opening direct TCP connections to proxy nodes...');
                await runConcurrentTests(activeAbortController.signal);
                
                if (!activeAbortController.signal.aborted) {
                    updateProgressText('<span class="text-emerald-400"><i class="fas fa-check-circle mr-1"></i> Testing Complete!</span>');
                    setProgressBar(100);
                }
                
            } catch (err) {
                if (err.name !== 'AbortError') {
                    showToast(err.message, 'error');
                    updateProgressText('<span class="text-red-400"><i class="fas fa-exclamation-circle mr-1"></i> ' + err.message + '</span>');
                }
            } finally {
                isTesting = false;
                select.disabled = false;
                document.getElementById('btn-test').disabled = false;
                document.getElementById('btn-test').innerHTML = '<i class="fas fa-play mr-2"></i> Run Diagnostics';
            }
        }

        async function runConcurrentTests(signal) {
            let currentIndex = 0;
            let completedCount = 0;
            const total = proxies.length;
            
            return new Promise((resolve) => {
                const spawnWorker = async () => {
                    while (currentIndex < total) {
                        if (signal.aborted) return resolve();
                        
                        const index = currentIndex++;
                        const p = proxies[index];
                        p.isTesting = true;
                        
                        if (index % 5 === 0) renderTable(); 
                        
                        try {
                            const result = await pingProxyEdge(p, signal);
                            if (signal.aborted) return resolve();
                            
                            p.ping = result.ping;
                            p.isValid = result.isValid;
                        } catch (e) {
                            p.ping = -1;
                            p.isValid = false;
                        }
                        
                        p.isTesting = false;
                        completedCount++;
                        
                        const percentage = 5 + Math.floor((completedCount / total) * 95);
                        setProgressBar(percentage);
                        document.getElementById('progress-stats').textContent = \`\${completedCount} / \${total}\`;
                        
                        sortProxies();
                        updateBestProxyCard();
                        renderTable();
                    }
                };

                const workers = [];
                for (let i = 0; i < Math.min(MAX_CONCURRENT_PINGS, total); i++) {
                    workers.push(spawnWorker());
                }
                
                Promise.all(workers).then(() => resolve());
            });
        }

        async function pingProxyEdge(proxy, signal) {
            try {
                const res = await fetch(\`/api/ping?ip=\${proxy.ip}&port=\${proxy.port}\`, { signal });
                const data = await res.json();
                return {
                    ping: data.ping,
                    isValid: data.isValid
                };
            } catch (e) {
                return { ping: -1, isValid: false };
            }
        }

        function sortProxies() {
            proxies.sort((a, b) => {
                if (a.isValid && !b.isValid) return -1;
                if (!a.isValid && b.isValid) return 1;
                
                if (a.isValid && b.isValid) {
                    return a.ping - b.ping;
                }
                
                if (a.ping === null && b.ping !== null) return 1;
                if (a.ping !== null && b.ping === null) return -1;
                
                if (a.ping === null && b.ping === null) return 0;
                
                if (a.ping === -1 && b.ping !== -1) return 1;
                if (a.ping !== -1 && b.ping === -1) return -1;
                
                return a.ping - b.ping;
            });
        }

        function updateBestProxyCard() {
            const best = proxies.find(p => p.isValid && p.ping > 0);
            const card = document.getElementById('best-proxy-card');
            
            if (best) {
                currentBest = best;
                document.getElementById('best-ip').innerHTML = \`<a href="https://browserleaks.com/ip/\${best.ip}" target="_blank" rel="noopener noreferrer" class="hover:text-emerald-300 transition-colors hover:underline decoration-emerald-300/50 underline-offset-8" title="Check IP details on BrowserLeaks">\${best.ip}</a>\`;
                document.getElementById('best-port').textContent = best.port;
                document.getElementById('best-ping').textContent = best.ping + ' ms';
                card.classList.remove('hidden');
            } else {
                currentBest = null;
                card.classList.add('hidden');
            }
        }

        function renderTable() {
            const tbody = document.getElementById('proxy-list');
            const fragment = document.createDocumentFragment();
            
            proxies.forEach(p => {
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-700/30 transition duration-150 group';
                if (p.isValid) tr.classList.add('bg-emerald-500/5');
                
                let statusHtml = '';
                let pingHtml = '';
                
                if (p.isTesting) {
                    statusHtml = '<span class="text-blue-400 font-medium"><i class="fas fa-circle-notch fa-spin mr-1"></i> Testing</span>';
                    pingHtml = '<span class="text-slate-500">-</span>';
                } else if (p.ping === null) {
                    statusHtml = '<span class="text-slate-500 font-medium"><i class="far fa-clock mr-1"></i> Queued</span>';
                    pingHtml = '<span class="text-slate-600">-</span>';
                } else if (p.isValid) {
                    statusHtml = '<span class="text-emerald-400 font-semibold bg-emerald-400/10 px-2 py-1 rounded text-xs border border-emerald-400/20"><i class="fas fa-check mr-1"></i> Valid TCP</span>';
                    
                    let color = p.ping < 100 ? 'text-emerald-400' : (p.ping < 250 ? 'text-yellow-400' : 'text-orange-400');
                    pingHtml = \`<span class="\${color} font-mono font-bold">\${p.ping} ms</span>\`;
                } else {
                    statusHtml = '<span class="text-red-400 font-medium bg-red-400/10 px-2 py-1 rounded text-xs border border-red-400/20"><i class="fas fa-times mr-1"></i> Timeout</span>';
                    pingHtml = '<span class="text-slate-600 font-mono text-xs">Unreachable</span>';
                }
                
                tr.innerHTML = \`
                    <td class="px-6 py-4 font-mono font-medium">
                        <a href="https://browserleaks.com/ip/\${p.ip}" target="_blank" rel="noopener noreferrer" class="text-slate-200 hover:text-blue-400 hover:underline transition-colors decoration-blue-400/50 underline-offset-4" title="Check IP details on BrowserLeaks">\${p.ip}</a>
                    </td>
                    <td class="px-6 py-4 text-slate-400 font-mono">\${p.port}</td>
                    <td class="px-6 py-4">\${statusHtml}</td>
                    <td class="px-6 py-4">\${pingHtml}</td>
                    <td class="px-6 py-4 text-right">
                        <button onclick="copyText('\${p.ip}')" class="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded transition text-xs font-medium mr-2 border border-slate-600 opacity-70 group-hover:opacity-100">
                            IP
                        </button>
                        <button onclick="copyText('\${p.ip}:\${p.port}')" class="bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-3 py-1.5 rounded transition text-xs font-medium border border-slate-600 opacity-70 group-hover:opacity-100">
                            IP:Port
                        </button>
                    </td>
                \`;
                fragment.appendChild(tr);
            });
            
            tbody.innerHTML = '';
            tbody.appendChild(fragment);
        }

        function setProgressBar(percent) {
            document.getElementById('progress-bar').style.width = percent + '%';
        }
        
        function updateProgressText(html) {
            document.getElementById('progress-status').innerHTML = html;
        }

        function copyBestIP(includePort = false) {
            if (!currentBest) return;
            const text = includePort ? \`\${currentBest.ip}:\${currentBest.port}\` : currentBest.ip;
            copyText(text);
        }

        function copyText(text) {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text).then(() => showToast('Copied: ' + text, 'success')).catch(() => copyTextFallback(text));
            } else {
                copyTextFallback(text);
            }
        }

        function copyTextFallback(text) {
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            try {
                document.execCommand('copy');
                showToast('Copied: ' + text, 'success');
            } catch (err) {
                showToast('Failed to copy text', 'error');
            }
            document.body.removeChild(input);
        }

        function showToast(msg, type = 'info') {
            const toast = document.getElementById('toast');
            const icon = document.getElementById('toast-icon');
            
            document.getElementById('toast-msg').textContent = msg;
            
            // Force a DOM reflow so the animation restarts smoothly on rapid clicks
            toast.classList.remove('transition-all', 'duration-300');
            void toast.offsetWidth; 
            toast.classList.add('transition-all', 'duration-300');

            toast.className = 'fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl border transform transition-all duration-300 z-50 font-medium flex items-center min-w-[250px]';
            
            if (type === 'success') {
                toast.classList.add('bg-emerald-900/90', 'border-emerald-500/50', 'text-emerald-100');
                icon.innerHTML = '<i class="fas fa-check-circle text-emerald-400"></i>';
            } else if (type === 'error') {
                toast.classList.add('bg-red-900/90', 'border-red-500/50', 'text-red-100');
                icon.innerHTML = '<i class="fas fa-exclamation-circle text-red-400"></i>';
            } else {
                toast.classList.add('bg-slate-800/90', 'border-slate-600', 'text-white');
                icon.innerHTML = '<i class="fas fa-info-circle text-blue-400"></i>';
            }
            
            toast.classList.remove('translate-y-full', 'opacity-0');
            
            if (window.toastTimeout) clearTimeout(window.toastTimeout);
            window.toastTimeout = setTimeout(() => {
                toast.classList.add('translate-y-full', 'opacity-0');
            }, 3000);
        }
    </script>
</body>
</html>
`;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (url.pathname === '/') {
            return new Response(HTML_CONTENT, {
                headers: { 'Content-Type': 'text/html;charset=UTF-8' }
            });
        }

        if (url.pathname === '/api/proxies') {
            try {
                const cc = url.searchParams.get('cc');
                if (!cc) {
                    return new Response(JSON.stringify({ error: 'Country code is required' }), { status: 400, headers: corsHeaders });
                }

                const githubUrl = `https://raw.githubusercontent.com/NiREvil/vless/main/sub/country_proxies/${cc.toUpperCase()}.txt`;
                const ghRes = await fetch(githubUrl, {
                    headers: { 'User-Agent': 'Cloudflare-Worker-BPB-Pro-Tester' }
                });

                if (ghRes.status === 404) {
                    return new Response(JSON.stringify({ error: 'not available' }), { status: 404, headers: corsHeaders });
                }
                
                if (!ghRes.ok) throw new Error('GitHub fetch failed');

                const text = await ghRes.text();
                
                const proxies = text.split('\n')
                    .map(l => l.trim())
                    .filter(l => l.length > 0)
                    .map(line => {
                        const parts = line.split(/[:\s]+/);
                        return { ip: parts[0], port: parts[1] || '443' };
                    });

                return new Response(JSON.stringify({ proxies }), { 
                    headers: { 'Content-Type': 'application/json', ...corsHeaders } 
                });
            } catch (err) {
                return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
            }
        }

        if (url.pathname === '/api/ping') {
            const ip = url.searchParams.get('ip');
            const port = url.searchParams.get('port') || '443';
            
            if (!ip) return new Response(JSON.stringify({ error: 'IP required' }), { status: 400, headers: corsHeaders });

            const start = Date.now();
            let isValid = false;
            let ping = -1;
            let socket = null;

            try {
                socket = connect({ hostname: ip, port: parseInt(port) });
                
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Timeout')), 2000);
                });

                await Promise.race([
                    socket.opened,
                    timeoutPromise
                ]);

                ping = Date.now() - start;
                isValid = true;

            } catch (err) {
                isValid = false;
                ping = -1;
            } finally {
                if (socket) {
                    try { socket.close(); } catch(e) {}
                }
            }
            
            return new Response(JSON.stringify({ ping, isValid }), { 
                headers: { 'Content-Type': 'application/json', ...corsHeaders } 
            });
        }

        return new Response('Route Not Found', { status: 404 });
    }
};
