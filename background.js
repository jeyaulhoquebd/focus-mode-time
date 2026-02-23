chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        chrome.alarms.create("focusAlarm", { delayInMinutes: message.minutes });
    } else if (message.action === "stop" || message.action === "stopAudio") {
        chrome.alarms.clear("focusAlarm");
        closeOffscreen();
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "focusAlarm") {
        handleAlarmFinish();
    }
});

async function handleAlarmFinish() {
    chrome.storage.local.get(['taskName', 'minutes', 'soundEnabled', 'history'], async (data) => {
        // হিস্টোরিতে কাজের তথ্য যুক্ত করা
        const newRecord = {
            task: data.taskName || "অজানা কাজ",
            duration: data.minutes || 0,
            date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        const history = data.history || [];
        history.push(newRecord);
        await chrome.storage.local.set({ history: history });
        
        // ব্যবহারকারী চাইলে অ্যালার্ম বাজবে
        if (data.soundEnabled) {
            await playAlarmSound();
        } else {
            // অ্যালার্ম না বাজলে ব্যাকগ্রাউন্ড ডেটা ক্লিয়ার করে দেওয়া
            await chrome.storage.local.remove(['endTime', 'taskName', 'minutes', 'soundEnabled']);
        }
    });
}

async function playAlarmSound() {
    await createOffscreen();
    await chrome.storage.local.set({ isAlarmRinging: true });
    chrome.runtime.sendMessage({ action: "playAudio" });
    
    // ১০ সেকেন্ড পর অ্যালার্ম অটোমেটিক বন্ধ হয়ে যাবে
    setTimeout(() => {
        closeOffscreen();
    }, 10000);
}

async function createOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'ফোকাস মোডের জন্য অ্যালার্ম সাউন্ড'
    });
}

async function closeOffscreen() {
    if (await chrome.offscreen.hasDocument()) {
        await chrome.offscreen.closeDocument();
    }
    await chrome.storage.local.set({ isAlarmRinging: false });
    await chrome.storage.local.remove(['endTime', 'taskName', 'minutes', 'soundEnabled']);
}