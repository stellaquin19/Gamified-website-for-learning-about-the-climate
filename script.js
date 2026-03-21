// ============================
// STATE
// ============================
let playerName = '';
let points = 0;
let streak = 0;
let chaptersComplete = 0;
let savedWords = [];
let challengeAttempts = {};
let dragSource = null;
let dropFills = {};
let chapterChallenges = {
    'ch1': { needed: 3, done: 0, challenges: ['ch1-c1', 'ch1-c2', 'ch1-c3'] },
    'ch2': { needed: 3, done: 0, challenges: ['ch2-c1', 'ch2-c2', 'ch2-c3'] },
    'ch3': { needed: 3, done: 0, challenges: ['ch3-c1', 'ch3-c2', 'ch3-c3'] },
    'ch4': { needed: 3, done: 0, challenges: ['ch4-c1', 'ch4-c2', 'ch4-c3'] },
    'ch5': { needed: 3, done: 0, challenges: ['ch5-c1', 'ch5-c2', 'ch5-c3'] },
};
const srWords = [
    { word: 'sunny', def: 'Bright with sunshine ☀️ — "It is sunny in Cairo today!"', emoji: '☀️' },
    { word: 'rainy', def: 'Water falling from clouds 🌧️ — "It is rainy in London."', emoji: '🌧️' },
    { word: 'cloudy', def: 'The sky is full of clouds ⛅ — "It is cloudy in Amsterdam."', emoji: '⛅' },
    { word: 'windy', def: 'A lot of wind in the air 💨 — "It is very windy in Chicago."', emoji: '💨' },
    { word: 'stormy', def: 'Very bad weather ⛈️ — "There is a big storm in Buenos Aires."', emoji: '⛈️' },
    { word: 'hot', def: 'Very warm temperature 🌡️ — "Cairo is very hot!"', emoji: '🌡️' },
    { word: 'cold', def: 'Low temperature ❄️ — "Oslo is cold in winter."', emoji: '❄️' },
    { word: 'umbrella', def: 'A tool to protect from rain ☂️', emoji: '☂️' },
    { word: 'thunder', def: 'A loud sound during a storm 🌩️', emoji: '🌩️' },
    { word: 'lightning', def: 'A flash of light in a storm ⚡', emoji: '⚡' },
    { word: 'football', def: 'A sport with a round ball ⚽', emoji: '⚽' },
    { word: 'bike', def: 'A bicycle 🚲', emoji: '🚲' },
];
let srIndex = 0;
let srFlipped = false;

// ============================
// INIT
// ============================
function startApp() {
    const n = document.getElementById('player-name').value.trim();
    if (!n) { showToast('Please write your name! 😊'); return; }
    playerName = n;
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    document.getElementById('welcome-msg').textContent = `Welcome, ${playerName}! 🌟`;
    document.getElementById('user-tag').textContent = playerName;
    updateUI();
    // Open ch1 by default
    setTimeout(() => toggleChapter('ch1-body', 1), 400);
}

function scrollToContent() {
    document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
}

// ============================
// UI HELPERS
// ============================
function updateUI() {
    document.getElementById('points-display').textContent = points;
    document.getElementById('streak-display').textContent = streak;
    const pct = Math.round((chaptersComplete / 5) * 100);
    document.getElementById('progress-fill').style.width = pct + '%';
    document.getElementById('progress-pct').textContent = pct + '% complete';
    checkAchievements();
}

function showToast(msg, dur = 2200) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), dur);
}

function showModal(emoji, title, body) {
    document.getElementById('modal-emoji').textContent = emoji;
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ============================
// TABS
// ============================
function showTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    event.target.classList.add('active');
}

// ============================
// CHAPTER TOGGLE
// ============================
function toggleChapter(bodyId, num) {
    const body = document.getElementById(bodyId);
    if (body.classList.contains('open')) {
        body.classList.remove('open');
    } else {
        body.classList.add('open');
    }
}

function unlockChapter(num) {
    const card = document.getElementById('ch' + num);
    const lock = document.getElementById('ch' + num + '-lock');
    if (card) {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
    }
    if (lock) lock.textContent = '🔓 Open';
}

function lockChallenge(id, locked) {
    const el = document.getElementById(id);
    if (!el) return;
    if (locked) {
        el.style.opacity = '0.4';
        el.style.pointerEvents = 'none';
    } else {
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
    }
}

// ============================
// ATTEMPTS
// ============================
function useAttempt(challengeId) {
    if (!challengeAttempts[challengeId]) challengeAttempts[challengeId] = 0;
    challengeAttempts[challengeId]++;
    const dots = document.querySelectorAll(`#${challengeId}-dots .attempt-dot`);
    if (dots.length > 0 && challengeAttempts[challengeId] <= dots.length) {
        dots[challengeAttempts[challengeId] - 1].classList.add('used');
    }
    return challengeAttempts[challengeId];
}

// ============================
// CHALLENGE COMPLETE TRACKING
// ============================
function markChallengeComplete(chapterId, challengeId) {
    const ch = chapterChallenges[chapterId];
    if (!ch) return;
    const idx = ch.challenges.indexOf(challengeId);
    if (idx === -1) return;
    ch.done++;
    // Unlock next challenge in this chapter
    if (idx + 1 < ch.challenges.length) {
        lockChallenge(ch.challenges[idx + 1], false);
    }
}

function completeChapter(num) {
    chaptersComplete = Math.max(chaptersComplete, num);
    if (num < 5) unlockChapter(num + 1);
    addPoints(150);
    streak++;
    updateUI();
    const emojis = ['☀️', '🌧️', '⛅', '💨', '⛈️'];
    showModal(emojis[num - 1], `Chapter ${num} Complete!`, `Amazing work, ${playerName}! You saved the friends! 🎉`);
}

// ============================
// POINTS
// ============================
function addPoints(p) {
    points += p;
    updateUI();
    showToast(`+${p} points! ⭐`);
}

// ============================
// SPEECH
// ============================
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.88;
        window.speechSynthesis.speak(u);
    }
}

function speakRP(inputId) {
    const t = document.getElementById(inputId).value;
    if (t) speak(t);
    else showToast('Write your answer first! ✏️');
}

// ============================
// MULTIPLE CHOICE
// ============================
function checkMC(groupId, el, isCorrect, challengeId) {
    const group = document.getElementById(groupId);
    const opts = group.querySelectorAll('.mc-option');
    // Already answered?
    if (group.dataset.answered) return;

    const attempts = useAttempt(challengeId);
    const fbEl = document.getElementById(challengeId + '-fb');

    opts.forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');

    if (isCorrect) {
        el.classList.add('correct');
        opts.forEach(o => o.style.pointerEvents = 'none');
        group.dataset.answered = '1';
        fbEl.innerHTML = '✅ Correct! Great job! 🎉';
        fbEl.className = 'feedback-msg show success';
        addPoints(50);
        // Determine chapter
        const ch = challengeId.substring(0, 3);
        markChallengeComplete(ch, challengeId);
        checkChapterComplete(ch);
    } else {
        el.classList.add('wrong');
        setTimeout(() => el.classList.remove('wrong', 'selected'), 1200);
        fbEl.innerHTML = `❌ Try again! You have ${3 - attempts} attempt(s) left.`;
        fbEl.className = 'feedback-msg show error';
        if (attempts >= 3) {
            opts.forEach(o => o.style.pointerEvents = 'none');
            group.dataset.answered = '1';
            // Show correct answer
            opts.forEach(o => {
                if (o.onclick.toString().includes('true')) o.classList.add('correct');
            });
            fbEl.innerHTML = '💡 Here is the correct answer! Keep practicing!';
            const ch = challengeId.substring(0, 3);
            markChallengeComplete(ch, challengeId);
            checkChapterComplete(ch);
        }
    }
}

// ============================
// DRAG & DROP
// ============================
let currentDrag = null;
function dragStart(e, word) {
    currentDrag = word;
    e.dataTransfer.setData('text', word);
}
function allowDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.add('over');
}
function dropWord(e, dzId, expectedWord, challengeId) {
    e.preventDefault();
    const dz = document.getElementById(dzId);
    dz.classList.remove('over');
    const word = e.dataTransfer.getData('text') || currentDrag;
    if (!word) return;

    // Already filled correctly?
    if (dz.classList.contains('correct')) return;

    dz.textContent = word;
    dz.classList.add('filled');
    dropFills[dzId] = word;

    // Check if correct
    if (word === expectedWord) {
        dz.classList.add('correct');
        // Mark source word used
        const srcEl = document.getElementById('dw-' + word) || document.getElementById('dw3-' + word) || document.getElementById('dw5-' + word);
        if (srcEl) srcEl.classList.add('used');
        checkDragComplete(challengeId);
    } else {
        dz.classList.add('wrong');
        setTimeout(() => {
            dz.textContent = '';
            dz.classList.remove('filled', 'wrong');
            dropFills[dzId] = null;
        }, 900);
        useAttempt(challengeId);
        const fbEl = document.getElementById(challengeId + '-fb');
        fbEl.innerHTML = '❌ Not quite! Try again!';
        fbEl.className = 'feedback-msg show error';
    }
}

function checkDragComplete(challengeId) {
    // Find all drop zones in this challenge
    const section = document.getElementById(challengeId);
    const dropZones = section.querySelectorAll('.drop-zone');
    const allCorrect = [...dropZones].every(dz => dz.classList.contains('correct'));
    if (allCorrect) {
        const fbEl = document.getElementById(challengeId + '-fb');
        fbEl.innerHTML = '✅ Excellent! All correct! 🎊';
        fbEl.className = 'feedback-msg show success';
        addPoints(50);
        const ch = challengeId.substring(0, 3);
        markChallengeComplete(ch, challengeId);
        checkChapterComplete(ch);
    }
}

// ============================
// TYPE INPUT
// ============================
function checkTypeInput(inputId, correctAnswers, fbId, pts, challengeId) {
    const val = document.getElementById(inputId).value.trim().toLowerCase();
    const fbEl = document.getElementById(fbId);
    const attempts = useAttempt(challengeId);
    const isCorrect = correctAnswers.some(a => val.includes(a.toLowerCase()) || a.toLowerCase().includes(val));

    if (isCorrect) {
        document.getElementById(inputId).classList.add('correct');
        document.getElementById(inputId).readOnly = true;
        fbEl.innerHTML = '✅ Perfect! You got it! 🌟';
        fbEl.className = 'feedback-msg show success';
        addPoints(pts);
        const ch = challengeId.substring(0, 3);
        markChallengeComplete(ch, challengeId);
        checkChapterComplete(ch);
    } else {
        document.getElementById(inputId).classList.add('wrong');
        setTimeout(() => document.getElementById(inputId).classList.remove('wrong'), 1000);
        fbEl.innerHTML = `❌ Try again! Think about the weather word... (${3 - attempts} left)`;
        fbEl.className = 'feedback-msg show error';
        if (attempts >= 3) {
            fbEl.innerHTML = `💡 The answer is: <strong>${correctAnswers[0]}</strong>! Keep practicing!`;
            document.getElementById(inputId).value = correctAnswers[0];
            document.getElementById(inputId).readOnly = true;
            const ch = challengeId.substring(0, 3);
            markChallengeComplete(ch, challengeId);
            checkChapterComplete(ch);
        }
    }
}

// ============================
// ROLE PLAY
// ============================
function checkRolePlay(inputId, fbId, keywords, pts, chapterId) {
    const val = document.getElementById(inputId).value.trim().toLowerCase();
    const fbEl = document.getElementById(fbId);
    if (!val) { fbEl.innerHTML = '✏️ Please write your answer first!'; fbEl.className = 'feedback-msg show error'; return; }

    const matchCount = keywords.filter(kw => val.includes(kw.toLowerCase())).length;
    const threshold = Math.ceil(keywords.length * 0.5);

    const challengeId = chapterId + '-c3';
    useAttempt(challengeId);

    if (matchCount >= threshold) {
        fbEl.innerHTML = `✅ Amazing answer, ${playerName}! You're a real weather expert! 🏆`;
        fbEl.className = 'feedback-msg show success';
        document.getElementById(inputId).readOnly = true;
        addPoints(pts);
        markChallengeComplete(chapterId, challengeId);
        checkChapterComplete(chapterId);
        // Show reward
        document.getElementById(chapterId + '-reward').classList.add('show');
        document.getElementById(chapterId + '-complete').classList.add('show');
    } else {
        fbEl.innerHTML = `❌ Good try! Try to use these words: <strong>${keywords.join(', ')}</strong>`;
        fbEl.className = 'feedback-msg show error';
    }
}

// ============================
// MAP
// ============================
function checkMap(el, isCorrect, fbId, challengeId) {
    const parent = el.parentElement;
    if (parent.dataset.answered) return;
    const fbEl = document.getElementById(fbId);
    useAttempt(challengeId);

    if (isCorrect) {
        el.classList.add('correct');
        parent.dataset.answered = '1';
        parent.querySelectorAll('.map-city').forEach(c => c.style.pointerEvents = 'none');
        fbEl.innerHTML = '✅ Perfect choice! That\'s the right city! 🗺️';
        fbEl.className = 'feedback-msg show success';
        addPoints(50);
        const ch = challengeId.substring(0, 3);
        markChallengeComplete(ch, challengeId);
        checkChapterComplete(ch);
    } else {
        el.classList.add('wrong');
        setTimeout(() => el.classList.remove('wrong', 'selected'), 900);
        fbEl.innerHTML = '❌ Not this one! Look at the climate carefully!';
        fbEl.className = 'feedback-msg show error';
    }
}

// ============================
// CHAPTER COMPLETION
// ============================
function checkChapterComplete(chapterId) {
    const ch = chapterChallenges[chapterId];
    if (!ch) return;
    if (ch.done >= ch.needed) {
        const rewardEl = document.getElementById(chapterId + '-reward');
        const completeBtn = document.getElementById(chapterId + '-complete');
        if (rewardEl) rewardEl.classList.add('show');
        if (completeBtn) completeBtn.classList.add('show');
    }
}

// ============================
// VOCABULARY SAVING
// ============================
function saveWord(word, definition) {
    if (savedWords.find(w => w.word === word)) {
        showToast(`"${word}" is already saved! 📚`);
        return;
    }
    savedWords.push({ word, definition });
    addPoints(10);
    showToast(`💛 "${word}" saved to vocabulary!`);
    renderSavedWords();
    if (savedWords.length >= 5) unlockAchievement('ach-vocab');
}

function renderSavedWords() {
    const grid = document.getElementById('saved-vocab-grid');
    if (!grid) return;
    if (savedWords.length === 0) {
        grid.innerHTML = '<div style="color:var(--text-light);font-size:0.9rem;grid-column:1/-1;">Click yellow words in the story to add them here! 💛</div>';
        return;
    }
    grid.innerHTML = savedWords.map(w => {
        const emoji = getWeatherEmoji(w.word);
        return `<div class="vocab-card-item" onclick="reviewWord('${w.word}','${w.definition}','${emoji}')">
      <span class="word-emoji">${emoji}</span>
      <div class="word-en">${w.word}</div>
      <div class="word-def">${w.definition}</div>
    </div>`;
    }).join('');
}

function getWeatherEmoji(word) {
    const map = {
        sunny: '☀️', rainy: '🌧️', cloudy: '⛅', windy: '💨', stormy: '⛈️',
        hot: '🌡️', cold: '❄️', umbrella: '☂️', thunder: '🌩️', lightning: '⚡',
        football: '⚽', tennis: '🎾', bike: '🚲', clouds: '☁️', wet: '💧',
        emergency: '🚨', temperature: '🌡️', London: '🇬🇧', Cairo: '🇪🇬',
        Amsterdam: '🇳🇱', Chicago: '🇺🇸', 'Buenos Aires': '🇦🇷', hiding: '🫣',
        dangerous: '⚠️', inside: '🏠', tree: '🌳', wind: '💨', storm: '⛈️',
        strong: '💪', weather: '🌤️', sun: '⭐', sunglasses: '🕶️'
    };
    return map[word] || '📖';
}

// ============================
// SPACED REPETITION
// ============================
function flipCard() {
    const card = document.getElementById('sr-card');
    card.classList.toggle('flipped');
    srFlipped = !srFlipped;
}

function nextCard(difficulty) {
    srIndex = (srIndex + 1) % srWords.length;
    const w = srWords[srIndex];
    document.getElementById('sr-emoji').textContent = w.emoji;
    document.getElementById('sr-word').textContent = w.word;
    document.getElementById('sr-def').textContent = w.def;
    document.getElementById('sr-counter').textContent = `Card ${srIndex + 1} of ${srWords.length}`;
    document.getElementById('sr-card').classList.remove('flipped');
    srFlipped = false;
    if (difficulty === 'easy') addPoints(5);
}

function reviewWord(word, def, emoji) {
    // Jump to vocab tab and set flashcard
    showTab('vocab');
    document.querySelectorAll('.nav-tab')[1].classList.add('active');
    document.querySelectorAll('.nav-tab')[0].classList.remove('active');
    const idx = srWords.findIndex(w => w.word === word);
    if (idx !== -1) {
        srIndex = idx;
        const w = srWords[idx];
        document.getElementById('sr-emoji').textContent = w.emoji;
        document.getElementById('sr-word').textContent = w.word;
        document.getElementById('sr-def').textContent = w.def;
        document.getElementById('sr-counter').textContent = `Card ${srIndex + 1} of ${srWords.length}`;
        document.getElementById('sr-card').classList.remove('flipped');
    }
    document.getElementById('sr-card').scrollIntoView({ behavior: 'smooth' });
}

// ============================
// ACHIEVEMENTS
// ============================
function unlockAchievement(achId) {
    const el = document.getElementById(achId);
    if (el && el.classList.contains('locked')) {
        el.classList.remove('locked');
        el.classList.add('unlocked');
        showToast('🏆 Achievement unlocked!', 3000);
    }
}

function checkAchievements() {
    if (chaptersComplete >= 1) unlockAchievement('ach-ch1');
    if (chaptersComplete >= 2) unlockAchievement('ach-ch2');
    if (chaptersComplete >= 3) unlockAchievement('ach-ch3');
    if (chaptersComplete >= 4) unlockAchievement('ach-ch4');
    if (chaptersComplete >= 5) { unlockAchievement('ach-ch5'); unlockAchievement('ach-hero'); }
    if (savedWords.length >= 5) unlockAchievement('ach-vocab');
    if (points >= 500) unlockAchievement('ach-stars');
}

// ============================
// KEYBOARD ENTER
// ============================
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        const ws = document.getElementById('welcome-screen');
        if (ws && ws.style.display !== 'none') startApp();
    }
});

// Drag leave handler
document.addEventListener('dragleave', function (e) {
    if (e.target.classList && e.target.classList.contains('drop-zone')) {
        e.target.classList.remove('over');
    }
});

// Touch drag support (simplified)
let touchDragWord = null;
document.querySelectorAll('.drag-word').forEach(el => {
    el.addEventListener('touchstart', e => {
        touchDragWord = el.dataset.word || el.textContent.trim();
    }, { passive: true });
});