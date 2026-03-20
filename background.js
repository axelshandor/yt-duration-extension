function notifyContentScript(tabId, url) {
    if (url && url.includes("list=")) {
        chrome.tabs.sendMessage(tabId, { message: "playlistDetected" }).catch(() => {});
    }
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // Navigazione completa (refresh o primo caricamento)
    if (changeInfo.status === "complete") {
        notifyContentScript(tabId, tab.url);
    }
    // Cambio URL via SPA (history.pushState) — YouTube lo usa per navigare
    if (changeInfo.url) {
        notifyContentScript(tabId, changeInfo.url);
    }
});
