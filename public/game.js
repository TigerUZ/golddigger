
const tg = (window.Telegram && window.Telegram.WebApp) || {};
if (typeof tg.ready === 'function') tg.ready();


const scoreEl            = document.getElementById('score');
const bestScoreLabel     = document.getElementById('best-score-label');
const bestScoreEl        = document.getElementById('best-score');
const playBtn            = document.getElementById('play-btn');
const homeScreen         = document.getElementById('home-screen');
const gameScreen         = document.getElementById('game-screen');
const gameField          = document.getElementById('game-field');
const livesEl            = document.getElementById('lives');
const energyFill         = document.getElementById('energy-fill');
const timerFill          = document.getElementById('timer-fill');

let lives      = 6;
let bestScore  = 0;
let totalScore = 0;
let streak     = 0;
let score      = 0;
let timeLeft   = 60;
let gameOver   = true;
let moleSI, timerSI;


const fact = [1,1,2,6,24];


async function loadStatus() {
  const userId = tg.initDataUnsafe?.user?.id || 'guest';
  try {
    const resp = await fetch(`http://localhost:3000/status?userId=${userId}`);
    const { lives: l, best_score, total_score } = await resp.json();
    lives      = l;
    bestScore  = best_score;
    totalScore = total_score;
  } catch (e) {
    console.error('Ошибка при загрузке статуса:', e);
  }
}


function renderHome() {
  
  scoreEl.textContent = `TOTAL SCORE ${totalScore}`;
  
  bestScoreLabel.hidden = true;

  
  livesEl.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const d = document.createElement('div');
    d.className = 'life' + (i > lives ? ' empty' : '');
    livesEl.append(d);
  }
  energyFill.style.width = `${(lives / 6) * 100}%`;

  playBtn.disabled = (lives === 0);
}


playBtn.addEventListener('click', () => {
  if (lives === 0) return;
  lives--;
  renderHome();
  startGame();
});


function startGame() {
  homeScreen.hidden = true;
  gameScreen.hidden = false;
  streak     = 0;
  score      = 0;
  timeLeft   = 60;
  gameOver   = false;

  
  scoreEl.textContent    = `SCORE ${score}`;
  bestScoreEl.textContent = bestScore;
  bestScoreLabel.hidden   = false;

  timerFill.style.width = '100%';
  buildField();
  moleSI  = setInterval(spawnMole, 1000);
  timerSI = setInterval(updateTimer, 1000);
}


function buildField() {
  gameField.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    gameField.append(hole);
  }
}


function spawnMole() {
  if (gameOver) return;
  const holes = document.querySelectorAll('.hole');
  const idx   = Math.floor(Math.random() * holes.length);
  const m     = document.createElement('div');
  m.className = 'mole';
  holes[idx].append(m);

  m.addEventListener('click', () => {
    if (gameOver) return;
    streak = Math.min(4, streak + 1);
    score += fact[streak];
    scoreEl.textContent = `SCORE ${score}`;
    m.remove();
  });

  setTimeout(() => {
    if (gameOver) return;
    streak = 0;
    m.remove();
  }, 800);
}


function updateTimer() {
  timeLeft--;
  timerFill.style.width = `${(timeLeft / 60) * 100}%`;
  if (timeLeft <= 0) endGame();
}


async function endGame() {
  gameOver = true;
  clearInterval(moleSI);
  clearInterval(timerSI);

  try {
    const userId = tg.initDataUnsafe?.user?.id || 'guest';
    await fetch('http://localhost:3000/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, score, lives })
    });
  } catch (e) {
    console.error('Ошибка при сохранении результата:', e);
  }

  alert(`Игра окончена! Ваш результат: ${score}`);
  gameScreen.hidden = true;
  homeScreen.hidden = false;

  await loadStatus();
  renderHome();
}


loadStatus().then(renderHome);
