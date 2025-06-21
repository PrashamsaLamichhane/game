// --- Dark Mode Toggle ---
const toggleSwitch = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';

  document.body.classList.toggle('dark', isDark);
  if (toggleSwitch && themeIcon) {
    toggleSwitch.checked = isDark;
    themeIcon.textContent = isDark ? '🌙' : '🌞';
  }

  initGame();
});

if (toggleSwitch) {
  toggleSwitch.addEventListener('change', () => {
    themeIcon.style.transition = 'transform 0.5s ease, opacity 0.25s ease';
    themeIcon.style.transform = 'rotate(0deg)';
    const isDark = toggleSwitch.checked;
    document.body.classList.toggle('dark', isDark);
    themeIcon.style.opacity = '0';
    setTimeout(() => {
      themeIcon.style.transform = 'rotate(180deg)';
      themeIcon.textContent = isDark ? '🌙' : '🌞';
      themeIcon.style.opacity = '1';
    }, 250);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

let score = { X: 0, O: 0, draw: 0 };

function updateScore(winner) {
  if (winner === "draw") {
    score.draw++;
    document.getElementById("scoreDraw").textContent = score.draw;
  } else {
    score[winner]++;
    document.getElementById(`score${winner}`).textContent = score[winner];
  }
}

function initGame() {
  const resetScoreBtn = document.getElementById('resetScoreBtn');
  const board = document.getElementById('board');
  const cells = board.querySelectorAll('.cell');
  const status = document.getElementById('status');
  const restartBtn = document.getElementById('restartBtn');
  const modeSelect = document.getElementById('modeSelect');
  const difficultySelect = document.getElementById('difficultySelect');
  const difficultyLabel = document.getElementById('difficultyLabel');

  const soundClick = document.getElementById("soundClick");
  const soundWin = document.getElementById("soundWin");
  const soundDraw = document.getElementById("soundDraw");

  let boardState = ['', '', '', '', '', '', '', '', ''];
  let currentPlayer = 'X';
  let gameActive = true;

  let mode = modeSelect.value;
  let difficulty = difficultySelect.value;

  function updateDifficultyVisibility() {
    difficultyLabel.style.display = (mode === 'ai') ? 'inline-block' : 'none';
  }
  updateDifficultyVisibility();

  const winningConditions = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function checkDraw() {
    return boardState.every(cell => cell !== '');
  }

  function updateStatus(text) {
    status.textContent = text;
  }

  function playSound(audio) {
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
  }

  function clearBoardStyles() {
    cells.forEach(cell => {
      cell.classList.remove('place-x', 'place-o', 'win', 'win-line');
    });
  }

  function highlightWin(cellsToHighlight) {
    cellsToHighlight.forEach(i => {
      cells[i].classList.add('win', 'win-line');
    });
  }

  function makeMove(index, player) {
    boardState[index] = player;
    cells[index].textContent = player;
    cells[index].classList.add(player === 'X' ? 'place-x' : 'place-o');

    playSound(soundClick);

    const winningCombo = checkWin(player);
    if (winningCombo) {
      updateScore(player);
      updateStatus(`Player ${player} Wins! 🎉`);
      highlightWin(winningCombo);
      playSound(soundWin);
      gameActive = false;
      return;
    }

    if (checkDraw()) {
      updateScore("draw");
      updateStatus("It's a Draw!");
      playSound(soundDraw);
      gameActive = false;
      return;
    }

    currentPlayer = player === 'X' ? 'O' : 'X';
    updateStatus(mode === 'ai' && currentPlayer === 'O' ? `AI's Turn (${difficulty})` : `Player ${currentPlayer}'s Turn`);

  if (resetScoreBtn) {
    resetScoreBtn.addEventListener('click', () => {
      score = { X: 0, O: 0, draw: 0 };
      document.getElementById("scoreX").textContent = 0;
      document.getElementById("scoreO").textContent = 0;
      document.getElementById("scoreDraw").textContent = 0;
    });
  }
  }

  function checkWin(player) {
    return winningConditions.find(condition => {
      return condition.every(i => boardState[i] === player);
    }) || null;
  }

  function handleCellClick(e) {
    const index = +e.target.getAttribute('data-index');
    if (boardState[index] !== '' || !gameActive) return;
    if (mode === 'ai' && currentPlayer === 'O') return;

    makeMove(index, currentPlayer);

    if (gameActive && mode === 'ai' && currentPlayer === 'O') {
      setTimeout(aiMove, 400);
    }
  }

  function aiMove() {
    if (!gameActive) return;

    let moveIndex;
    if (difficulty === 'easy') {
      const emptyCells = boardState
        .map((val, idx) => val === '' ? idx : null)
        .filter(i => i !== null);
      moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    else if (difficulty === 'medium') {
      if (Math.random() < 0.7) {
        moveIndex = minimax(boardState, 'O').index;
      } else {
        const emptyCells = boardState
          .map((val, idx) => val === '' ? idx : null)
          .filter(i => i !== null);
        moveIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    }
    else {
      moveIndex = minimax(boardState, 'O').index;
    }

    makeMove(moveIndex, 'O');
  }

  function minimax(newBoard, player) {
    const availSpots = newBoard
      .map((v,i) => v === '' ? i : null)
      .filter(i => i !== null);

    if (checkWinFor('X', newBoard)) {
      return { score: -10 };
    } else if (checkWinFor('O', newBoard)) {
      return { score: 10 };
    } else if (availSpots.length === 0) {
      return { score: 0 };
    }

    let moves = [];

    for (let i = 0; i < availSpots.length; i++) {
      let move = {};
      move.index = availSpots[i];
      newBoard[availSpots[i]] = player;

      if (player === 'O') {
        let result = minimax(newBoard, 'X');
        move.score = result.score;
      } else {
        let result = minimax(newBoard, 'O');
        move.score = result.score;
      }

      newBoard[availSpots[i]] = '';
      moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
      let bestScore = -Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = moves[i];
        }
      }
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = moves[i];
        }
      }
    }

    return bestMove;
  }

  function checkWinFor(player, boardToCheck) {
    return winningConditions.some(condition => {
      return condition.every(i => boardToCheck[i] === player);
    });
  }

  function restartGame() {
    boardState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    cells.forEach(cell => {
      cell.textContent = '';
      cell.classList.remove('place-x', 'place-o', 'win', 'win-line');
    });

    updateStatus(mode === 'ai' && currentPlayer === 'O' ? `AI's Turn (${difficulty})` : `Player ${currentPlayer}'s Turn`);

    if (mode === 'ai' && currentPlayer === 'O') {
      setTimeout(aiMove, 300);
    }
  }

  cells.forEach(cell => cell.addEventListener('click', handleCellClick));
  restartBtn.addEventListener('click', restartGame);
  modeSelect.addEventListener('change', e => {
    mode = e.target.value;
    updateDifficultyVisibility();
    restartGame();
  });
  difficultySelect.addEventListener('change', e => {
    difficulty = e.target.value;
    restartGame();
  });

  updateStatus(mode === 'ai' && currentPlayer === 'O' ? `AI's Turn (${difficulty})` : `Player ${currentPlayer}'s Turn`);
  if (mode === 'ai' && currentPlayer === 'O') {
    setTimeout(aiMove, 300);
  }
}