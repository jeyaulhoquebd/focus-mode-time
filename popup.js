let timerInterval;

// চালু করার সময় ডেটা ও হিস্টোরি লোড করা
chrome.storage.local.get(['endTime', 'history', 'isAlarmRinging'], (result) => {
    updateHistoryUI(result.history || []);
    
    if (result.isAlarmRinging) {
        showAlarmRingingUI();
    } else if (result.endTime && result.endTime > Date.now()) {
        startDisplay(result.endTime);
    } else {
        resetUI();
    }
});

document.getElementById('start-btn').addEventListener('click', () => {
    let taskName = document.getElementById('task-name').value.trim() || "অজানা কাজ";
    let minutes = parseInt(document.getElementById('minutes').value);
    let soundEnabled = document.getElementById('sound-enabled').checked;

    if (!minutes || minutes <= 0) {
        alert("দয়া করে সঠিক সময় (মিনিট) দিন!"); return;
    }

    let endTime = Date.now() + minutes * 60000;
    chrome.storage.local.set({ 
        endTime: endTime, taskName: taskName, minutes: minutes, soundEnabled: soundEnabled 
    });

    chrome.runtime.sendMessage({ action: "start", minutes: minutes });
    startDisplay(endTime);
});

// টাইমার মাঝপথে বন্ধ করা
document.getElementById('stop-btn').addEventListener('click', () => {
    chrome.storage.local.remove(['endTime', 'taskName', 'minutes', 'soundEnabled']);
    chrome.runtime.sendMessage({ action: "stop" });
    resetUI();
});

// বাজার সময় অ্যালার্ম বন্ধ করা
document.getElementById('stop-alarm-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: "stopAudio" });
    resetUI();
});

// হিস্টোরি ডিলিট করা
document.getElementById('clear-history-btn').addEventListener('click', () => {
    chrome.storage.local.set({ history: [] }, () => {
        updateHistoryUI([]);
    });
});

function startDisplay(endTime) {
    document.getElementById('input-area').style.display = "none";
    document.getElementById('stop-btn').style.display = "inline-block";
    document.getElementById('stop-alarm-btn').style.display = "none";

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        let timeLeft = endTime - Date.now();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer-display').innerText = "00:00";
        } else {
            let m = Math.floor(timeLeft / 60000);
            let s = Math.floor((timeLeft % 60000) / 1000);
            document.getElementById('timer-display').innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

function resetUI() {
    clearInterval(timerInterval);
    document.getElementById('timer-display').innerText = "00:00";
    document.getElementById('input-area').style.display = "block";
    document.getElementById('stop-btn').style.display = "none";
    document.getElementById('stop-alarm-btn').style.display = "none";
    document.getElementById('minutes').value = "";
    document.getElementById('task-name').value = "";
}

function showAlarmRingingUI() {
    clearInterval(timerInterval);
    document.getElementById('timer-display').innerText = "00:00";
    document.getElementById('input-area').style.display = "none";
    document.getElementById('stop-btn').style.display = "none";
    document.getElementById('stop-alarm-btn').style.display = "inline-block";
}

function updateHistoryUI(history) {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    document.getElementById('task-count').innerText = history.length;
    
    // নতুন হিস্টোরি সবার উপরে দেখানোর জন্য reverse() করা হয়েছে
    history.slice().reverse().forEach(item => { 
        let li = document.createElement('li');
        li.innerText = `${item.task} (${item.duration} মিনিট) - ${item.date}`;
        list.appendChild(li);
    });
}

// ব্যাকগ্রাউন্ড থেকে আপডেট পেলে অটো চেঞ্জ হওয়া
chrome.storage.onChanged.addListener((changes) => {
    if (changes.history) updateHistoryUI(changes.history.newValue || []);
    if (changes.isAlarmRinging) {
        if (changes.isAlarmRinging.newValue === true) showAlarmRingingUI();
        else resetUI();
    }
});