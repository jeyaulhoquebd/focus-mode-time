chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "playAudio") {
        playBeep();
    }
});

function playBeep() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    for (let i = 0; i < 20; i++) { 
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine'; 
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const startTime = audioCtx.currentTime + i * 0.5;
        gainNode.gain.setValueAtTime(1, startTime);
        gainNode.gain.setValueAtTime(0, startTime + 0.3); 
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.3);
    }
}