// --- FUNZIONI DI CALCOLO ---

function formatDuration(totalSeconds) {
    const units = [
        { label: 'y',  seconds: 365.25 * 24 * 3600 },
        { label: 'mo', seconds: 30.44 * 24 * 3600 },
        { label: 'w',  seconds: 7 * 24 * 3600 },
        { label: 'd',  seconds: 24 * 3600 },
        { label: 'h',  seconds: 3600 },
        { label: 'm',  seconds: 60 },
        { label: 's',  seconds: 1 },
    ];

    const parts = [];
    let remaining = totalSeconds;

    for (const unit of units) {
        const value = Math.floor(remaining / unit.seconds);
        if (value > 0) {
            parts.push(`${value}${unit.label}`);
            remaining -= value * unit.seconds;
        }
    }

    return parts.length > 0 ? parts.join(' ') : '0s';
}

function parseTime(timeString) {
    const parts = timeString.trim().split(':').map(Number);
    let seconds = 0;
    if (parts.length === 3) {
        seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        seconds = parts[0] * 60 + parts[1];
    } else {
        seconds = parts[0];
    }
    return seconds;
}

function updatePlaylistDuration() {
    // *** CONTROLLO FONDAMENTALE ***
    // Se l'URL non contiene "list=", non siamo in una playlist. Fermati.
    if (!window.location.href.includes('list=')) {
        // Rimuoviamo il box se per caso siamo usciti da una playlist ma è rimasto lì
        const oldBox = document.getElementById('my-yt-duration-box');
        if (oldBox) oldBox.remove();
        return;
    }

    // 1. Cerca i tempi sulle miniature
    const timeElements = document.querySelectorAll('span.ytd-thumbnail-overlay-time-status-renderer');
    
    // Se non trovo miniature (es. playlist vuota), mi fermo
    if (timeElements.length === 0) return;

    let totalSeconds = 0;

    timeElements.forEach(element => {
        const text = element.innerText.replace(/\n/g, '').trim();
        if (text) {
            totalSeconds += parseTime(text);
        }
    });

    const outputText = formatDuration(totalSeconds);

    insertResultUnderStats(outputText, timeElements.length);
}

// --- FUNZIONI INTERFACCIA ---

function insertResultUnderStats(text, count) {
    // Cerchiamo l'header. NOTA: Alcune playlist hanno un layout leggermente diverso.
    const headerRenderer = document.querySelector('ytd-playlist-header-renderer');
    
    // Se non c'è l'header standard, proviamo a non fare nulla per ora 
    // (evita errori su pagine video normali)
    if (!headerRenderer) return;

    // Cerchiamo la sezione statistiche
    const statsSection = headerRenderer.querySelector('.metadata-stats');

    // Se troviamo la sezione statistiche, inseriamo lì sotto
    if (statsSection) {
        let myBox = document.getElementById('my-yt-duration-box');
        
        if (!myBox) {
            myBox = document.createElement('div');
            myBox.id = 'my-yt-duration-box';
            
            myBox.style.marginTop = '15px';
            myBox.style.paddingTop = '10px';
            myBox.style.borderTop = '1px solid rgba(255,255,255,0.2)';
            myBox.style.color = '#AAAAAA';
            myBox.style.fontSize = '1.4rem';
            myBox.style.fontWeight = '500';
            myBox.style.fontFamily = 'Roboto, Arial, sans-serif';
            
            statsSection.insertAdjacentElement('afterend', myBox);
        }

        // Recuperiamo lo stato del bottone
        const existingBtn = document.getElementById('my-scroll-btn');
        let btnText = "Scroll and update";
        let isWorking = false;
        let isFinished = false;

        if (existingBtn) {
            if (existingBtn.dataset.status === "working") {
                btnText = existingBtn.innerText; 
                isWorking = true;
            } else if (existingBtn.dataset.status === "finished") {
                btnText = "✅ Finished!";
                isFinished = true;
            }
        }

        myBox.innerHTML = `
            <div style="margin-bottom: 8px;">
                <span style="color: #3ea6ff; font-weight: bold; font-size: 1.6rem;">⏱ ${text}</span>
                <br>
                <span style="font-size: 1.2rem; opacity: 0.8;">(Calculated on ${count} videos)</span>
            </div>
            <button id="my-scroll-btn" style="
                background-color: ${isFinished ? '#2ba640' : '#272727'}; 
                color: #fff; 
                border: 1px solid ${isFinished ? '#2ba640' : '#3ea6ff'}; 
                border-radius: 18px; 
                padding: 5px 15px; 
                cursor: ${isWorking ? 'wait' : 'pointer'}; 
                opacity: ${isWorking ? '0.7' : '1'};
                font-size: 1.2rem;
                font-weight: 500;
                transition: all 0.3s;
            ">${btnText}</button>
        `;

        const newBtn = document.getElementById('my-scroll-btn');
        if (isWorking) newBtn.dataset.status = "working";
        if (isFinished) newBtn.dataset.status = "finished";
        newBtn.disabled = isWorking; 
        newBtn.onclick = startAutoScroll;
        
        if (!isWorking && !isFinished) {
            newBtn.onmouseover = () => newBtn.style.backgroundColor = '#3ea6ff';
            newBtn.onmouseout = () => newBtn.style.backgroundColor = '#272727';
        }
    }
}

// --- FUNZIONE SCORRIMENTO (10 SECONDI) ---

function startAutoScroll() {
    const btn = document.getElementById('my-scroll-btn');
    if (!btn) return;

    btn.innerText = "⏳ Loading (10s)...";
    btn.dataset.status = "working";
    btn.disabled = true;
    btn.style.cursor = "wait";
    
    const scroller = setInterval(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
    }, 1000);

    setTimeout(() => {
        clearInterval(scroller);
        const finalBtn = document.getElementById('my-scroll-btn');
        if (finalBtn) {
            finalBtn.innerText = "✅ Finished!";
            finalBtn.dataset.status = "finished";
            finalBtn.style.borderColor = "#2ba640"; 
            finalBtn.style.backgroundColor = "#2ba640";
            finalBtn.style.cursor = "default";
            finalBtn.style.opacity = "1";
            finalBtn.disabled = false;

            setTimeout(() => {
                finalBtn.innerText = "Scroll and update";
                finalBtn.dataset.status = "ready";
                finalBtn.style.backgroundColor = "#272727";
                finalBtn.style.borderColor = "#3ea6ff";
                finalBtn.style.cursor = "pointer";
                finalBtn.onmouseover = () => finalBtn.style.backgroundColor = '#3ea6ff';
                finalBtn.onmouseout = () => finalBtn.style.backgroundColor = '#272727';
            }, 4000);
        }
    }, 10000); 
}

// --- RILEVAMENTO NAVIGAZIONE ---

// Intercettiamo pushState/replaceState (YouTube li usa per la navigazione SPA)
(function() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        onUrlChange();
    };
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        onUrlChange();
    };
    window.addEventListener('popstate', onUrlChange);
})();

function onUrlChange() {
    console.log('[YT Duration] URL changed:', window.location.href);
    if (window.location.href.includes('list=')) {
        waitForPlaylistAndUpdate();
    } else {
        const oldBox = document.getElementById('my-yt-duration-box');
        if (oldBox) oldBox.remove();
    }
}

// Aspetta che gli elementi della playlist appaiano nel DOM, poi aggiorna
function waitForPlaylistAndUpdate() {
    let attempts = 0;
    const maxAttempts = 30; // 30 tentativi x 500ms = 15 secondi max

    const tryUpdate = setInterval(() => {
        attempts++;
        const header = document.querySelector('ytd-playlist-header-renderer');
        const times = document.querySelectorAll('span.ytd-thumbnail-overlay-time-status-renderer');
        
        console.log(`[YT Duration] Attempt ${attempts}: header=${!!header}, times=${times.length}`);

        if (header && times.length > 0) {
            updatePlaylistDuration();
            if (document.getElementById('my-yt-duration-box')) {
                console.log('[YT Duration] Box inserted successfully');
                clearInterval(tryUpdate);
            }
        }
        if (attempts >= maxAttempts) {
            console.log('[YT Duration] Gave up after max attempts');
            clearInterval(tryUpdate);
        }
    }, 500);
}

// Fallback: controllo periodico ogni 2 secondi
setInterval(updatePlaylistDuration, 2000);

// Anche yt-navigate-finish come ulteriore fallback
document.addEventListener('yt-navigate-finish', () => {
    console.log('[YT Duration] yt-navigate-finish fired');
    if (window.location.href.includes('list=')) {
        waitForPlaylistAndUpdate();
    }
});

// Esecuzione iniziale
if (window.location.href.includes('list=')) {
    waitForPlaylistAndUpdate();
}

// Messaggio dal service worker
chrome.runtime.onMessage.addListener(function (request) {
    if (request.message === 'playlistDetected') {
        console.log('[YT Duration] Message from background: playlistDetected');
        waitForPlaylistAndUpdate();
    }
});