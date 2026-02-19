let introIndex = 0;
let score = 0;
let typing = false;
let c1Mode = "intro";
let c2Mode = "intro";
let c3Mode = "intro";

let buzzTimer1;
let buzzTimer2;

/* ================= AUDIO ENGINE ================= */
let currentBGM = null;
let fadeOutInterval = null;
let fadeInInterval = null;
let started = false;

const bgmVolumes = {
    'startBGM': 0.32, 
    'introBGM': 0.40, 
    'room1BGM': 0.32, 
    'room2BGM': 0.15, 
    'room3BGM': 0.36, 
    'closingBGM': 0.35, 
    'endBGM': 0.28    
};

const sfxVolumes = {
    'correctSFX': 0.6, 
    'wrongSFX': 0.6    
};

document.addEventListener('click', () => {
    if(!started) { started = true; playBGM('startBGM'); }
}, { once: true });

function fadeOutCurrentBGM() {
    if (currentBGM) {
        const oldBGM = currentBGM;
        clearInterval(fadeInInterval);
        clearInterval(fadeOutInterval);
        fadeOutInterval = setInterval(() => {
            if (oldBGM.volume > 0.05) { oldBGM.volume -= 0.05; } 
            else { oldBGM.volume = 0; oldBGM.pause(); oldBGM.currentTime = 0; clearInterval(fadeOutInterval); }
        }, 50);
    }
}

function playBGM(id) {
    const nextBGM = document.getElementById(id);
    if (currentBGM === nextBGM) return;
    fadeOutCurrentBGM(); 
    if (nextBGM) {
        nextBGM.loop = true; nextBGM.volume = 0;
        nextBGM.play().catch(e => console.log("BGM blocked:", e));
        const targetVol = bgmVolumes[id] || 0.4;
        clearInterval(fadeInInterval);
        fadeInInterval = setInterval(() => {
            if (nextBGM.volume < targetVol - 0.05) { nextBGM.volume += 0.05; } 
            else { nextBGM.volume = targetVol; clearInterval(fadeInInterval); } 
        }, 50);
        currentBGM = nextBGM;
    } else {
        currentBGM = null;
    }
}

function playSFX(id){
    const sound = document.getElementById(id);
    sound.volume = sfxVolumes[id] !== undefined ? sfxVolumes[id] : 1.0; 
    sound.currentTime = 0; 
    sound.play().catch(e => console.log("SFX blocked:", e));
}

function typeText(elementId, text, callback){
    typing = true;
    let i = 0;
    const el = document.getElementById(elementId);
    el.textContent = "";

    const textAudio = document.getElementById("textSFX");
    textAudio.volume = 1.0; textAudio.loop = true; textAudio.play().catch(()=>{});

    const interval = setInterval(()=>{
        el.textContent += text.charAt(i);
        i++;
        if(i >= text.length){
            clearInterval(interval);
            typing = false;
            textAudio.pause(); textAudio.currentTime = 0; 
            if(callback) callback();
        }
    }, 20);
}

/* ================= UNIFIED VIDEO ENGINE ================= */
let activeVideo = null;

function initVideo(src){
    if(activeVideo) { activeVideo.pause(); activeVideo.remove(); }
    activeVideo = document.createElement("video");
    activeVideo.src = src;
    activeVideo.muted = true; activeVideo.playsInline = true; activeVideo.preload = "auto";
    activeVideo.style.position = "fixed"; activeVideo.style.inset = "0";
    activeVideo.style.width = "960px"; activeVideo.style.height = "540px";
    activeVideo.style.objectFit = "cover"; activeVideo.style.zIndex = "0";
    document.body.appendChild(activeVideo);
    activeVideo.addEventListener("loadeddata", ()=>{ activeVideo.currentTime = 0; activeVideo.pause(); });
}

function playActiveBriefFreeze(){
    if(!activeVideo) return;
    activeVideo.play().catch(()=>{});
    setTimeout(()=>{ activeVideo.pause(); }, 650);
}

// Sequence for CORRECT Answers (Plays video, transitions background)
function playActiveFullThenTransition(nextRoomFunc, nextVideoSrc){
    if(!activeVideo) return;
    activeVideo.play();
    playSFX('unlockSFX'); 
    
    setTimeout(()=>{
        fadeOutCurrentBGM();
        const fade = document.getElementById("fade");
        fade.style.opacity = 1;
        setTimeout(()=>{
            if(nextVideoSrc) { initVideo(nextVideoSrc); } 
            else { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
            nextRoomFunc(); 
            setTimeout(() => { fade.style.opacity = 0; }, 50);
        }, 1500);
    }, 2700);
}

// Sequence for WRONG Answers (Fades to black, NO video change)
function transitionWithoutVideo(nextRoomFunc){
    playSFX('goSFX');
    fadeOutCurrentBGM(); 
    const fade = document.getElementById("fade");
    fade.style.opacity = 1;
    setTimeout(()=>{
        nextRoomFunc(); 
        setTimeout(() => { fade.style.opacity = 0; }, 50);
    }, 600);
}

/* ---------------- TEXT DATA ---------------- */
const introLines = [
"Hello there human. You are a student in training at the School of Artificial Intelligence Defense, where we train students to be prepared for the world and dangers of AI.",
"The world has become a complex and dangerous place, with AI lurking in every corner. To graduate, you will need to prove your competency that you can stand against AI.",
"You will need to complete the various challenges in the following rooms that will test your knowledge of AI, and escape successfully to complete your training. Good luck."
];
const c1IntroLines = [
"Deepfakes and AI edited photographs of real things and people run rampant on social media. AI generative images can be used for propaganda, political manipulation, false events, and fabricated evidence.",
"It is crucial to be able to differentiate real from AI images. Click on the picture that is AI generated to complete this challenge."
];
const c2IntroLines = [
"Your next challenge. Turn on your volume. You will need your ears for this one. There are two audio clips presented to you. One is real and one is AI generated.",
"AI generated audio is often used to impersonate voices in fraudulent calls, fooling people into believing they’re speaking with a loved one, a colleague, or an executive.",
"You will need to know how to discern between real and fake. Analyze the samples and select the AI generated audio to complete the challenge."
];
const c3IntroLines = [
"Your last challenge. Be alert. AI can now generate text that looks exactly like the way someone you trust would write.",
"These AI-generated messages are used for scams - pretending to be a parent, a boss, or even government officials. Their goal: to steal your personal information or trick you into dangerous actions.",
"Two messages are shown before you. One is real, harmless, and written by a human. The other is an AI-generated scam designed to deceive. Click on the tablet that is the AI-generated scam. Choose wisely."
];

/* ---------------- UTIL ---------------- */
function showScreen(id){
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
function updateScore(){
    document.getElementById('score').innerText = score;
}

/* ---------------- SYSTEM TRANSITION HANDLER ---------------- */
function triggerCyberTransition(callback) {
    const trans = document.getElementById('cyberTransition');
    const textAudio = document.getElementById("textSFX");
    
    // Reset and start animation
    trans.classList.remove('active-boot');
    void trans.offsetWidth; // Trigger reflow to restart CSS animations
    trans.classList.add('active-boot');
    trans.classList.remove('hidden');
    
    textAudio.volume = 1.0; textAudio.loop = true; textAudio.play().catch(()=>{});

    setTimeout(() => {
        textAudio.pause(); textAudio.currentTime = 0;
        callback();
        
        // Fade out transition
        trans.style.transition = "opacity 0.3s ease";
        trans.style.opacity = 0;
        setTimeout(() => {
            trans.classList.add('hidden');
            trans.style.opacity = 1; // Reset for next use
            trans.style.transition = "";
        }, 300);
    }, 1500); // Waits for the 1.2s progress bar animation
}

/* ---------------- START GAME ---------------- */
function startGame(){
    playSFX('goSFX');
    fadeOutCurrentBGM();
    
    triggerCyberTransition(() => {
        playBGM('introBGM'); 
        score = 0; updateScore(); introIndex = 0;
        showScreen('intro');
        const btn = document.getElementById("introBtn");
        btn.disabled = true; btn.onclick = nextIntro;
        typeText("introText", introLines[introIndex], ()=>btn.disabled=false);
    });
}
function nextIntro(){
    if(typing) return;
    introIndex++; playSFX('boopSFX'); 
    const btn = document.getElementById("introBtn");
    if(introIndex < introLines.length - 1){
        btn.disabled = true;
        typeText("introText", introLines[introIndex], ()=>btn.disabled=false);
    } else {
        btn.innerText = "Let's go!";
        btn.onclick = startFadeToRoom1; btn.disabled = true;
        typeText("introText", introLines[introIndex], ()=>btn.disabled=false);
    }
}
function startFadeToRoom1(){
    playSFX('goSFX'); fadeOutCurrentBGM();
    const fade = document.getElementById("fade"); fade.style.opacity = 1;
    setTimeout(()=>{
        showScreen('c1'); document.getElementById("hud").classList.remove("hidden");
        initVideo('assets/room1.mp4');
        playBGM('room1BGM'); startC1Intro();
        setTimeout(() => { fade.style.opacity = 0; }, 50);
    }, 600);
}

/* ---------------- CHALLENGE 1 ---------------- */
let c1Step = 0;
function startC1Intro(){
    c1Mode = "intro"; c1Step = 0;
    document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)";
    const panel = document.getElementById("c1Dialogue"); panel.classList.remove("hidden");
    const btn = document.getElementById("c1Btn"); btn.innerText = "Next"; btn.disabled = true;
    typeText("c1Text", c1IntroLines[0], ()=>enableC1Btn("Next", nextC1Intro));
}
function nextC1Intro(){
    if(typing) return;
    playSFX('boopSFX'); c1Step++;
    const btn = document.getElementById("c1Btn");
    if(c1Step === 1){
        btn.innerText = "Let's go!"; btn.disabled = true;
        typeText("c1Text", c1IntroLines[1], ()=>enableC1Btn("Let's go!", startC1Game));
    }
}
function startC1Game(){
    playSFX('goSFX'); c1Mode = "gameplay";
    const panel = document.getElementById("c1Dialogue");
    const overlay = document.getElementById("overlay");
    const images = document.getElementById("c1Images");
    panel.style.animation = "slideDown 0.5s ease forwards";
    setTimeout(()=>{
        panel.classList.add("hidden"); panel.style.animation = "slideUp 0.5s ease"; 
        overlay.style.background = "transparent"; images.classList.remove("hidden");
    },500);
}
function answerC1(correct){
    if(c1Mode !== "gameplay") return;
    c1Mode = "result";
    
    const overlay = document.getElementById("overlay");
    const panel = document.getElementById("c1Dialogue"); panel.classList.remove("hidden");
    const btn = document.getElementById("c1Btn"); btn.innerText = "Next"; btn.disabled = true;

    if(correct){
        playSFX('correctSFX'); playActiveBriefFreeze(); score++; updateScore();
        overlay.style.background = "rgba(0,255,0,0.3)";
        typeText("c1Text", "Correct! This picture is AI generated. To identify an AI generated picture, pay attention to the skin - is it too smooth? Look at the fingers and eyes.", ()=>enableC1Btn("Next", correctC1Step2));
    } else {
        playSFX('wrongSFX');
        overlay.style.background = "rgba(255,0,0,0.3)";
        typeText("c1Text", "Wrong! This picture is real. To identify a AI generated picture, pay attention to the skin - is it too smooth? Look at the fingers and eyes - does it look wrong, is there an extra finger?", ()=>enableC1Btn("Next", wrongC1Step2));
    }
}
function correctC1Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c1Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    typeText("c1Text", "You paid close attention to such details and identified AI correctly.", ()=>enableC1Btn("Next challenge", unlockRoom1));
}
function wrongC1Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c1Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    typeText("c1Text", "You need to pay close attention to such details to make sure you are not scammed.", ()=>enableC1Btn("Next challenge", wrongUnlockRoom1));
}
function unlockRoom1(){
    playSFX('goSFX');
    const panel = document.getElementById("c1Dialogue"); const images = document.getElementById("c1Images"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; images.classList.add("fade-out"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); images.style.display = "none";
        playActiveFullThenTransition(()=>{
            showScreen('c2'); playBGM('room2BGM'); startC2Intro();
        }, 'assets/room2.mp4');
    },500);
}
function wrongUnlockRoom1(){
    const panel = document.getElementById("c1Dialogue"); const images = document.getElementById("c1Images"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; images.classList.add("fade-out"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); images.style.display = "none";
        transitionWithoutVideo(()=>{
            showScreen('c2'); playBGM('room2BGM'); startC2Intro();
        });
    },500);
}

/* ---------------- CHALLENGE 2 ---------------- */
let c2Step = 0;
function startC2Intro(){
    c2Mode = "intro"; c2Step = 0;
    document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)";
    const panel = document.getElementById("c2Dialogue"); panel.style.animation = "slideUp 0.5s ease"; panel.classList.remove("hidden");
    const btn = document.getElementById("c2Btn"); btn.innerText = "Next"; btn.disabled = true;
    typeText("c2Text", c2IntroLines[0], ()=>enableC2Btn("Next", nextC2Intro));
}
function nextC2Intro(){
    if(typing) return;
    playSFX('boopSFX'); c2Step++;
    const btn = document.getElementById("c2Btn");
    if(c2Step === 1){
        btn.innerText = "Next"; btn.disabled = true;
        typeText("c2Text", c2IntroLines[1], ()=>enableC2Btn("Next", nextC2Intro));
    } else if(c2Step === 2){
        btn.innerText = "Let's go!"; btn.disabled = true;
        typeText("c2Text", c2IntroLines[2], ()=>enableC2Btn("Let's go!", startC2Game));
    }
}
function startC2Game(){
    playSFX('goSFX'); c2Mode = "gameplay";
    const panel = document.getElementById("c2Dialogue"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards";
    setTimeout(()=>{
        panel.classList.add("hidden"); panel.style.animation = "slideUp 0.5s ease"; 
        overlay.style.background = "transparent"; document.getElementById("c2AudioBoxes").classList.remove("hidden");
    },500);
}
function playAudioClip(audioId, visualizerId) {
    if (currentBGM) {
        clearInterval(fadeInInterval); clearInterval(fadeOutInterval);
        fadeOutInterval = setInterval(() => {
            if(currentBGM.volume > 0.05) currentBGM.volume -= 0.05;
            else { currentBGM.volume = 0; clearInterval(fadeOutInterval); }
        }, 50);
    }
    ['realAudio', 'fakeAudio'].forEach(id => { const a = document.getElementById(id); a.pause(); a.currentTime = 0; });
    document.querySelectorAll('.visualizer-screen').forEach(v => v.classList.remove('playing'));
    
    const audio = document.getElementById(audioId); audio.play().catch(e => console.log(e));
    if(visualizerId) {
        const vis = document.getElementById(visualizerId); vis.classList.add('playing');
        audio.onended = () => {
            vis.classList.remove('playing');
            if (currentBGM) {
                const targetVol = bgmVolumes[currentBGM.id] || 0.4;
                clearInterval(fadeOutInterval);
                fadeInInterval = setInterval(() => {
                    if(currentBGM.volume < targetVol - 0.05) currentBGM.volume += 0.05;
                    else { currentBGM.volume = targetVol; clearInterval(fadeInInterval); }
                }, 50);
            }
        };
    }
}
function answerC2(isAI) {
    if (c2Mode !== "gameplay") return;
    c2Mode = "result";
    if (currentBGM && currentBGM.volume < (bgmVolumes[currentBGM.id] || 0.4)) {
        const targetVol = bgmVolumes[currentBGM.id] || 0.4;
        clearInterval(fadeOutInterval);
        fadeInInterval = setInterval(() => {
            if(currentBGM.volume < targetVol - 0.05) currentBGM.volume += 0.05;
            else { currentBGM.volume = targetVol; clearInterval(fadeInInterval); }
        }, 50);
    }
    ['realAudio', 'fakeAudio'].forEach(id => { const a = document.getElementById(id); a.pause(); a.currentTime = 0; });
    document.querySelectorAll('.visualizer-screen').forEach(v => v.classList.remove('playing'));

    const panel = document.getElementById("c2Dialogue"); panel.classList.remove("hidden");
    const overlay = document.getElementById("overlay");
    const btn = document.getElementById("c2Btn"); btn.innerText = "Next"; btn.disabled = true;

    if (isAI) {
        playSFX('correctSFX'); playActiveBriefFreeze(); score++; updateScore(); 
        overlay.style.background = "rgba(0,255,0,0.3)";
        typeText("c2Text", "Correct! This audio is AI generated. To identify an AI generated audio, pay attention to the tone - is it too monotonous? Listen to the pronunciation - is the accent right?", () => enableC2Btn("Next", correctC2Step2));
    } else {
        playSFX('wrongSFX');
        overlay.style.background = "rgba(255,0,0,0.3)";
        typeText("c2Text", "Wrong! This audio is real. To identify a AI generated audio, pay attention to the tone - is it too monotonous? Listen to the pronunciation - is the accent right?", () => enableC2Btn("Next", wrongC2Step2));
    }
}
function correctC2Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c2Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    typeText("c2Text", "You listened close to such details to make sure you are not deceived. Good job!", ()=>enableC2Btn("Next challenge", unlockRoom2));
}
function wrongC2Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c2Btn");
    btn.innerText = "Next challenge"; btn.disabled = true;
    typeText("c2Text", "You need to listen close to such details to make sure you are not deceived.", ()=>enableC2Btn("Next challenge", wrongUnlockRoom2));
}
function unlockRoom2(){
    playSFX('goSFX');
    const panel = document.getElementById("c2Dialogue"); const boxes = document.getElementById("c2AudioBoxes"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; boxes.classList.add("fade-out"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); boxes.style.display = "none";
        playActiveFullThenTransition(()=>{
            showScreen('c3'); document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)"; playBGM('room3BGM'); startC3();
        }, 'assets/room3.mp4');
    }, 500);
}
function wrongUnlockRoom2(){
    const panel = document.getElementById("c2Dialogue"); const boxes = document.getElementById("c2AudioBoxes"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; boxes.classList.add("fade-out"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); boxes.style.display = "none";
        transitionWithoutVideo(()=>{
            showScreen('c3'); document.getElementById("overlay").style.background = "rgba(0,0,0,0.6)"; playBGM('room3BGM'); startC3();
        });
    }, 500);
}

/* ---------------- CHALLENGE 3 ---------------- */
let c3Step = 0;
function startC3() {
    c3Mode = "intro"; c3Step = 0;
    const panel = document.getElementById("c3Dialogue"); panel.style.animation = "slideUp 0.5s ease"; panel.classList.remove("hidden");
    const btn = document.getElementById("c3Btn"); btn.innerText = "Next"; btn.disabled = true;
    typeText("c3Text", c3IntroLines[0], () => enableC3Btn("Next", nextC3Intro));
}
function nextC3Intro() {
    if(typing) return;
    playSFX('boopSFX'); c3Step++;
    const btn = document.getElementById("c3Btn");
    if(c3Step === 1) {
        btn.innerText = "Next"; btn.disabled = true;
        typeText("c3Text", c3IntroLines[1], () => enableC3Btn("Next", nextC3Intro));
    } else if (c3Step === 2) {
        btn.innerText = "Let's go!"; btn.disabled = true;
        typeText("c3Text", c3IntroLines[2], () => enableC3Btn("Let's go!", startC3Game));
    }
}
function startC3Game() {
    playSFX('goSFX'); c3Mode = "gameplay";
    const panel = document.getElementById("c3Dialogue"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards";
    setTimeout(() => {
        panel.classList.add("hidden"); panel.style.animation = "slideUp 0.5s ease"; 
        overlay.style.background = "transparent";
        document.getElementById("c3Instruction").classList.remove("hidden"); document.getElementById("c3Tablets").classList.remove("hidden");
        buzzTimer1 = setTimeout(() => playSFX('buzzSFX'), 1000); 
        buzzTimer2 = setTimeout(() => playSFX('buzzSFX'), 6000); 
    }, 500);
}
function answerC3(isAI) {
    if (c3Mode !== "gameplay") return;
    c3Mode = "result";
    clearTimeout(buzzTimer1); clearTimeout(buzzTimer2);

    const panel = document.getElementById("c3Dialogue"); panel.classList.remove("hidden");
    const overlay = document.getElementById("overlay");
    const btn = document.getElementById("c3Btn"); btn.innerText = "Next"; btn.disabled = true;

    if (isAI) {
        playSFX('correctSFX'); playActiveBriefFreeze(); score++; updateScore(); 
        overlay.style.background = "rgba(0,255,0,0.3)";
        typeText("c3Text", "Correct! This message is AI generated. Scam messages generated by AI often use urgency, fear, or pressure to force quick decisions. They also ask for sensitive information such as passwords, bank details, or identification numbers.", () => enableC3Btn("Next", c3Step2));
    } else {
        playSFX('wrongSFX');
        overlay.style.background = "rgba(255,0,0,0.3)";
        typeText("c3Text", "Wrong! This message is real. Scam messages generated by AI often use urgency, fear, or pressure to force quick decisions. They also ask for sensitive information such as passwords, bank details, or identification numbers.", () => enableC3Btn("Next", wrongC3Step2));
    }
}
function c3Step2() {
    playSFX('boopSFX'); const btn = document.getElementById("c3Btn");
    btn.innerText = "Finish"; btn.disabled = true;
    typeText("c3Text", "Always check if the tone feels unnatural, too formal, or unusually urgent. Never give private information without verifying the sender.", () => enableC3Btn("Finish", unlockRoom3));
}
function wrongC3Step2(){
    playSFX('boopSFX'); const btn = document.getElementById("c3Btn");
    btn.innerText = "Finish"; btn.disabled = true;
    typeText("c3Text", "Always check if the tone feels unnatural, too formal, or unusually urgent. Never give private information without verifying the sender.", () => enableC3Btn("Finish", wrongUnlockRoom3));
}
function unlockRoom3() {
    playSFX('goSFX');
    const panel = document.getElementById("c3Dialogue"); const tablets = document.getElementById("c3Tablets"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; tablets.classList.add("fade-out"); document.getElementById("c3Instruction").classList.add("hidden"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); tablets.style.display = "none";
        playActiveFullThenTransition(()=>{
            showEnd();
        }, null); 
    }, 500);
}
function wrongUnlockRoom3(){
    const panel = document.getElementById("c3Dialogue"); const tablets = document.getElementById("c3Tablets"); const overlay = document.getElementById("overlay");
    panel.style.animation = "slideDown 0.5s ease forwards"; tablets.classList.add("fade-out"); document.getElementById("c3Instruction").classList.add("hidden"); overlay.style.background = "transparent";
    setTimeout(()=>{
        panel.classList.add("hidden"); tablets.style.display = "none";
        transitionWithoutVideo(()=>{
            showEnd();
        });
    }, 500);
}

/* ---------------- END SCREEN & RESTART LOGIC ---------------- */
function showEnd() {
    const endScreen = document.getElementById('end');
    const panel = document.getElementById("endDialogue");
    const isWin = (score === 3);
    
    if (isWin) { playBGM('endBGM'); } 
    else { playBGM('closingBGM'); }
    
    document.querySelectorAll('.screen').forEach(s => { if(s.id !== 'end') s.classList.remove('active'); });
    endScreen.classList.add('active');
    
    document.getElementById("hud").classList.add("hidden");
    document.getElementById("overlay").style.background = "transparent";
    document.getElementById("finalResultsCard").classList.add("hidden");

    if (isWin) {
        if(activeVideo) { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
        endScreen.className = 'screen active bg-graduation';
        panel.className = 'dialogue-panel hidden'; 
        panel.style.animation = "slideUp 0.5s ease forwards";
    } else {
        endScreen.className = 'screen active'; 
        endScreen.style.background = 'transparent';
        panel.className = 'dialogue-panel failed-closing hidden'; 
        panel.style.animation = "none";
        panel.style.opacity = "0";
        setTimeout(() => panel.style.opacity = "1", 50); 
        panel.style.transition = "opacity 0.5s ease";
    }
    
    panel.classList.remove("hidden");
    const btn = document.getElementById("endBtn");
    btn.innerText = "Next"; btn.disabled = true;

    const endMsg = isWin 
        ? "Congratulations, operative! You have completed all challenges successfully. You have proven your competency in the world of Artificial Intelligence. You are now a graduate of the School of Artificial Intelligence Defense."
        : "Unfortunately, you have failed the final test, and will not be graduating from the School of Artificial Intelligence Defence. But fret not! You have learnt a great deal from your mistakes, and you can try again!";

    typeText("endText", endMsg, () => {
        btn.disabled = false;
        btn.onclick = showFinalResults;
    });
}

function showFinalResults() {
    playSFX('boopSFX');
    const panel = document.getElementById("endDialogue");
    const resultsCard = document.getElementById("finalResultsCard");
    
    panel.style.transition = "opacity 0.5s ease";
    panel.style.opacity = "0";
    
    setTimeout(() => {
        panel.classList.add("hidden");
        panel.style.opacity = "1";
        panel.style.transition = ""; 
        
        resultsCard.classList.remove("hidden");
        document.getElementById("finalScore").innerText = `Final Score: ${score}/3`;
        
        let evalText = "";
        if(score === 3) evalText = "Exemplary! You are a Guardian of Truth. AI cannot easily deceive you.";
        else if(score >= 1) evalText = "Passable. You have a foundation, but you must remain vigilant. AI is evolving faster than we are.";
        else evalText = "Failed. You were easily manipulated by the machine. Return to the academy and study the signs of synthetic media.";
        
        document.getElementById("evaluation").innerText = evalText;
    }, 500);
}

function restartGame(skipToIntro) {
    playSFX('goSFX');
    fadeOutCurrentBGM(); 
    if(activeVideo) { activeVideo.pause(); activeVideo.remove(); activeVideo = null; }
    
    if (skipToIntro) {
        triggerCyberTransition(() => {
            playBGM('introBGM'); 
            score = 0; updateScore(); introIndex = 1;
            showScreen('intro');
            document.getElementById("hud").classList.add("hidden"); 
            const btn = document.getElementById("introBtn");
            btn.disabled = true; btn.innerText = "Next"; btn.onclick = nextIntro;
            typeText("introText", introLines[introIndex], () => btn.disabled = false);
        });
    } else {
        const fade = document.getElementById("fade");
        fade.style.opacity = 1;
        setTimeout(() => {
            playBGM('startBGM'); 
            showScreen('start');
            setTimeout(() => { fade.style.opacity = 0; }, 50);
        }, 600);
    }
}

function enableC1Btn(text, action){ const btn = document.getElementById("c1Btn"); btn.innerText = text; btn.disabled = false; btn.onclick = action; }
function enableC2Btn(text, action){ const btn = document.getElementById("c2Btn"); btn.innerText = text; btn.disabled = false; btn.onclick = action; }
function enableC3Btn(text, action){ const btn = document.getElementById("c3Btn"); btn.innerText = text; btn.disabled = false; btn.onclick = action; }