const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const scoreXEl = document.getElementById('score-x');
const scoreOEl = document.getElementById('score-o');
const scoreDrawEl = document.getElementById('score-draw');
const restartBtn = document.getElementById('restart-btn');
const settingsBtn = document.getElementById('settings-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalOverlay = document.getElementById('modal-overlay');
const aiToggle = document.getElementById('ai-toggle');
const soundToggle = document.getElementById('sound-toggle');
const resetScoreBtn = document.getElementById('reset-score-btn');

// Dynamic Label Elements
const labelX = document.getElementById('label-x');
const labelO = document.getElementById('label-o');
const subtitle = document.getElementById('game-mode-subtitle');

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X"; 
let gameActive = true;
let scores = { X: 0, O: 0, Draw: 0 };
let isAIEnabled = false;
let soundEnabled = true;

// Load scores from local storage
if (localStorage.getItem('ttt_scores')) {
    scores = JSON.parse(localStorage.getItem('ttt_scores'));
    updateScoreboard();
}

const winConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// --- Core Game Logic ---

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (board[index] !== "" || !gameActive) return;
    if (isAIEnabled && currentPlayer === "O") return; // Prevent clicking during AI turn

    makeMove(cell, index, currentPlayer);
    
    if (gameActive && isAIEnabled && currentPlayer === "O") {
        setTimeout(makeAIMove, 600); // Delay for realism
    }
}

function makeMove(cell, index, player) {
    board[index] = player;
    cell.innerText = player;
    cell.classList.add(player.toLowerCase());
    
    if (checkWin(board, player)) {
        endGame(false, player);
    } else if (isDraw(board)) {
        endGame(true, null);
    } else {
        currentPlayer = currentPlayer === "X" ? "O" : "X";
        updateStatusText();
    }
}

// --- Unbeatable AI (Minimax Algorithm) ---

function makeAIMove() {
    if (!gameActive) return;

    let bestScore = -Infinity;
    let move;

    for (let i = 0; i < 9; i++) {
        if (board[i] === "") {
            board[i] = "O"; // AI is 'O'
            let score = minimax(board, 0, false);
            board[i] = ""; // Undo move
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }

    const cell = document.querySelector(`.cell[data-index='${move}']`);
    makeMove(cell, move, "O");
}

const scoresMap = {
    O: 10,
    X: -10,
    tie: 0
};

function minimax(board, depth, isMaximizing) {
    let result = checkWinnerForMinimax();
    if (result !== null) {
        return scoresMap[result];
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = "O";
                let score = minimax(board, depth + 1, false);
                board[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === "") {
                board[i] = "X";
                let score = minimax(board, depth + 1, true);
                board[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function checkWinnerForMinimax() {
    for (let i = 0; i < winConditions.length; i++) {
        const [a, b, c] = winConditions[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (!board.includes("")) return "tie";
    return null;
}

// --- UI & State Helpers ---

function updateStatusText() {
    if (isAIEnabled) {
        statusText.innerText = currentPlayer === "X" ? "Your Turn" : "AI is thinking...";
    } else {
        statusText.innerText = `Player ${currentPlayer}'s Turn`;
    }
    statusText.style.color = currentPlayer === "X" ? "var(--primary)" : "var(--accent)";
}

function checkWin(currentBoard, player) {
    return winConditions.some(condition => {
        return condition.every(index => currentBoard[index] === player);
    });
}

function isDraw(currentBoard) {
    return !currentBoard.includes("");
}

function endGame(draw, winner) {
    gameActive = false;
    if (draw) {
        statusText.innerText = "It's a Draw!";
        statusText.style.color = "var(--text-muted)";
        scores.Draw++;
        playSound('draw');
    } else {
        if (isAIEnabled) {
            statusText.innerText = winner === "X" ? "You Won!" : "AI Won!";
        } else {
            statusText.innerText = `Player ${winner} Won!`;
        }
        statusText.style.color = winner === "X" ? "var(--win)" : "var(--lose)";
        scores[winner]++;
        playSound(winner === "X" ? 'win' : 'lose');
        highlightWinningCells(winner);
    }
    updateScoreboard();
}

function highlightWinningCells(winner) {
    winConditions.forEach(condition => {
        const [a, b, c] = condition;
        if (board[a] === winner && board[b] === winner && board[c] === winner) {
            document.querySelector(`.cell[data-index='${a}']`).classList.add('win');
            document.querySelector(`.cell[data-index='${b}']`).classList.add('win');
            document.querySelector(`.cell[data-index='${c}']`).classList.add('win');
        }
    });
}

function updateScoreboard() {
    scoreXEl.innerText = scores.X;
    scoreOEl.innerText = scores.O;
    scoreDrawEl.innerText = scores.Draw;
    localStorage.setItem('ttt_scores', JSON.stringify(scores));
}

function resetGame() {
    board = ["", "", "", "", "", "", "", "", ""];
    gameActive = true;
    currentPlayer = "X";
    updateStatusText();
    cells.forEach(cell => {
        cell.innerText = "";
        cell.classList.remove('x', 'o', 'win');
    });
}

function resetScores() {
    scores = { X: 0, O: 0, Draw: 0 };
    updateScoreboard();
    resetGame();
}

// --- Toggle Logic (2 Player vs AI) ---

function toggleMode(enabled) {
    isAIEnabled = enabled;
    if (enabled) {
        labelX.innerText = "YOU (X)";
        labelO.innerText = "AI (O)";
        subtitle.innerText = "AI Mode (Unbeatable)";
    } else {
        labelX.innerText = "PLAYER 1 (X)";
        labelO.innerText = "PLAYER 2 (O)";
        subtitle.innerText = "2 Player Mode";
    }
    resetGame(); // Reset board when mode changes
}

// --- Sound Effects (Web Audio API) ---

function playSound(type) {
    if (!soundEnabled) return;
    
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'click') {
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } else if (type === 'win') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
        setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 1200;
            gain2.gain.value = 0.2;
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.2);
        }, 100);
    } else if (type === 'lose') {
        oscillator.frequency.value = 300;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'draw') {
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    }
}

// --- Event Listeners ---

cells.forEach(cell => cell.addEventListener('click', handleCellClick));
restartBtn.addEventListener('click', resetGame);

settingsBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
});

resetScoreBtn.addEventListener('click', () => {
    resetScores();
    modalOverlay.style.display = 'none';
});

aiToggle.addEventListener('change', (e) => {
    toggleMode(e.target.checked);
});

soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
});

// Close modal when clicking outside
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        modalOverlay.style.display = 'none';
    }
});