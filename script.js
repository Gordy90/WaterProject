// --- Pipeline for Hope: Optimized Game Logic ---
const ROWS = 5, COLS = 8, OBSTACLE_CHANCE = 0.2, BUCKET_STEP = 20, TIMER_START = 10;
let started = false, currentPipe = null, bucket = 0, jerryCans = 0, timer = null, time = TIMER_START;
const board = [], obstacles = [], start = {row:0,col:0}, finish = {row:0,col:7};

const PIPE_TYPES = [
  { name: 'straight', img: 'images/pipe_straight_LR.png.png', rot: [0,90] },
  { name: 'corner', img: 'images/pipe_elbow_TR.png.png', rot: [0,90,180,270] },
  { name: 't-junction', img: 'images/pipe_elbow_TR.png.png', rot: [0,90,180,270] }
];
const CHARITY_STORIES = [
  { title: "Clean Water in Ethiopia", url: "https://www.charitywater.org/our-projects/ethiopia" },
  { title: "School Handwashing in Nepal", url: "https://www.charitywater.org/our-projects/nepal" },
  { title: "Community Well in Uganda", url: "https://www.charitywater.org/our-projects/uganda" },
  { title: "Women Water Champions in Mali", url: "https://www.charitywater.org/our-projects/mali" }
];

const $ = id => document.getElementById(id);
const boardEl = $('board'), pipeBox = $('pipeBox'), pipeImg = $('currentPipe'), bucketFill = $('bucketFill'), timerEl = $('timer'), msg = $('message'), cans = $('jerryCans');

function init() {
  createBoard();
  pipeBox.onclick = () => started ? showMsg('Game already started!') : startGame();
  const skipBtn = document.getElementById('skipPipeBtn');
  skipBtn.onclick = () => {
    if (!started) return showMsg('Start the game first!');
    nextPipe();
    startTimer();
    showMsg('Pipe skipped!');
  };
}

function createBoard() {
  boardEl.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    board[r] = [];
    for (let c = 0; c < COLS; c++) {
      board[r][c] = null;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      if (Math.random() < OBSTACLE_CHANCE && !(r === start.row && c === start.col) && !(r === finish.row && c === finish.col)) {
        cell.classList.add('obstacle');
        obstacles.push({r,c});
      }
      cell.onclick = () => placePipe(r, c, cell);
      boardEl.appendChild(cell);
    }
  }
  setCell(start, 'start', 'Start');
  setCell(finish, 'finish', 'Finish');
}

function setCell(pos, cls, txt) {
  const cell = boardEl.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
  cell.classList.add(cls);
  cell.textContent = txt;
}

function startGame() {
  started = true;
  nextPipe();
  startTimer();
  showMsg('Game started! Place your pipe.');
}

function nextPipe() {
  currentPipe = PIPE_TYPES[Math.floor(Math.random()*PIPE_TYPES.length)];
  pipeImg.src = currentPipe.img;
  pipeImg.classList.add('appear');
  setTimeout(()=>pipeImg.classList.remove('appear'),500);
}

function startTimer() {
  clearInterval(timer);
  time = TIMER_START;
  updateTimer();
  timer = setInterval(()=>{
    time--;
    updateTimer();
    if (time <= 0) {
      clearInterval(timer);
      nextPipe();
      startTimer();
      showMsg("Time's up! New pipe.");
    }
  },1000);
}

function updateTimer() {
  timerEl.textContent = `${time} sec`;
  timerEl.classList.toggle('urgent', time <= 3);
}

function placePipe(r, c, cell) {
  if (!started || !currentPipe || cell.classList.contains('obstacle','placed','start','finish')) return showMsg("Can't place here!");
  if (cell.classList.contains('placed') || cell.classList.contains('start') || cell.classList.contains('finish') || cell.classList.contains('obstacle')) return showMsg("Can't place here!");
  const img = document.createElement('img');
  img.src = currentPipe.img;
  img.style.transform = `rotate(${currentPipe.rot[Math.floor(Math.random()*currentPipe.rot.length)]}deg)`;
  cell.appendChild(img);
  cell.classList.add('placed');
  board[r][c] = currentPipe.name;
  checkConnection();
  nextPipe();
  startTimer();
}

function checkConnection() {
  if (adjacentPipe(start) && adjacentPipe(finish)) {
    fillBucket();
    showMsg('Connection made! Bucket filling...');
  }
}

function adjacentPipe(pos) {
  return [
    {r:pos.row-1,c:pos.col}, {r:pos.row+1,c:pos.col},
    {r:pos.row,c:pos.col-1}, {r:pos.row,c:pos.col+1}
  ].some(({r,c})=>r>=0&&r<ROWS&&c>=0&&c<COLS&&board[r][c]);
}

function fillBucket() {
  bucket += BUCKET_STEP;
  bucketFill.style.height = `${bucket}%`;
  if (bucket >= 100) {
    addJerryCan();
    bucket = 0;
    setTimeout(()=>{
      bucketFill.style.height = '0%';
      showMsg('Bucket full! You earned a Jerry Can!');
    },1000);
  }
}

function addJerryCan() {
  jerryCans++;
  const can = document.createElement('div');
  can.className = 'jerrycan';
  can.title = `Jerry Can ${jerryCans} - Click for a Charity Water Story`;
  can.onclick = ()=>{
    const s = CHARITY_STORIES[(jerryCans-1)%CHARITY_STORIES.length];
    window.open(s.url,'_blank');
  };
  cans.appendChild(can);
}

function showMsg(text) {
  msg.textContent = text;
  msg.classList.remove('show');
  setTimeout(()=>msg.classList.add('show'),10);
  setTimeout(()=>msg.classList.remove('show'),3000);
}

window.addEventListener('load', init);
// --- End ---