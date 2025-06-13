// Pipeline for Hope - Simplified
const ROWS = 5, COLS = 8, OBSTACLE_CHANCE = 0.2, BUCKET_STEP = 100, TIMER_START = 10;
let started = false, currentPipe = null, bucket = 0, jerryCans = 0, timer = null, time = TIMER_START;
const board = [], obstacles = [], start = {row:0,col:0}, finish = {row:0,col:7};
let validNextCells = [];
const DIRS = [
  {dr:-1,dc:0}, {dr:1,dc:0}, {dr:0,dc:-1}, {dr:0,dc:1}
];
const PIPE_TYPES = [
  {name:'straight',img:'images/pipe_straight_LR.png.png',dirs:['L','R']},
  {name:'corner',img:'images/pipe_elbow_TR.png.png',dirs:['T','R']},
  {name:'t-junction',img:'images/pipe_cross_LRTB.png',dirs:['T','R','B']}
];
const CHARITY_STORIES = [
  {title:'Clean Water in Ethiopia',url:'https://www.charitywater.org/our-projects/ethiopia'},
  {title:'School Handwashing in Nepal',url:'https://www.charitywater.org/our-projects/nepal'},
  {title:'Community Well in Uganda',url:'https://www.charitywater.org/our-projects/uganda'},
  {title:'Women Water Champions in Mali',url:'https://www.charitywater.org/our-projects/mali'}
];
const $ = id => document.getElementById(id);
const boardEl = $('board'), pipeBox = $('pipeBox'), bucketFill = $('bucketFill'), timerEl = $('timer'), msg = $('message'), cans = $('jerryCans');

function init() {
  createBoard();
  pipeBox.onclick = () => started ? null : startGame();
  $('skipPipeBtn').onclick = () => { if (started) { nextPipe(); startTimer(); } };
}

function createBoard() {
  boardEl.innerHTML = '';
  obstacles.length = 0;
  for (let r=0; r<ROWS; r++) {
    board[r]=[];
    for (let c=0; c<COLS; c++) {
      board[r][c]=null;
      const cell=document.createElement('div');
      cell.className='cell';
      cell.dataset.row=r; cell.dataset.col=c;
      let canPlaceObstacle = Math.random()<OBSTACLE_CHANCE && !(r===start.row&&c===start.col) && !(r===finish.row&&c===finish.col);
      if (canPlaceObstacle) {
        obstacles.push({r,c});
        cell.classList.add('obstacle');
        if (!pathExists(start, finish, obstacles)) {
          obstacles.pop();
          cell.classList.remove('obstacle');
        }
      }
      cell.onclick=()=>placePipe(r,c,cell);
      boardEl.appendChild(cell);
    }
  }
  setCell(start,'start','Start');
  setCell(finish,'finish','Finish');
  validNextCells = neighbors(start.row, start.col);
  updateValidCellHighlights();
}

function setCell(pos,cls,txt) {
  const cell=boardEl.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
  cell.classList.add(cls); cell.textContent=txt;
}

function startGame() {
  started=true; nextPipe(); startTimer(); updateValidCellHighlights();
}

function nextPipe() {
  const t=PIPE_TYPES[Math.floor(Math.random()*PIPE_TYPES.length)];
  currentPipe={type:t};
  pipeBox.innerHTML=`<img src="${t.img}" class="pipe-img" alt="${t.name}">`;
}

function startTimer() {
  clearInterval(timer); time=TIMER_START; updateTimer();
  timer=setInterval(()=>{time--; updateTimer(); if(time<=0){clearInterval(timer); nextPipe(); startTimer();}},1000);
}

function updateTimer() {
  timerEl.textContent=`${time} sec`;
}

function placePipe(r,c,cell) {
  if(!started||!isValidPlacement(r,c)||cell.classList.contains('placed')||cell.classList.contains('obstacle')||cell.classList.contains('start')||cell.classList.contains('finish')) return;
  const img=document.createElement('img');
  img.src=currentPipe.type.img;
  cell.appendChild(img); cell.classList.add('placed');
  board[r][c]={row:r,col:c,name:currentPipe.type.name};
  validNextCells = neighbors(r, c);
  checkConnection(); nextPipe(); startTimer();
}

function isValidPlacement(r,c){return validNextCells.some(cell=>cell.row===r&&cell.col===c);}

function neighbors(row, col) {
  return DIRS.map(({dr,dc})=>({row:row+dr,col:col+dc})).filter(({row,col})=>row>=0&&row<ROWS&&col>=0&&col<COLS&&!board[row][col]&&!obstacles.some(o=>o.r===row&&o.c===col));
}

function checkConnection(){
  if(adjacentPipe(start)&&adjacentPipe(finish)){
    fillBucket();
    setTimeout(() => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        if ((r === start.row && c === start.col) || (r === finish.row && c === finish.col)) continue;
        board[r][c] = null;
        const cell = boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
        if (cell && cell.classList.contains('placed')) {
          cell.classList.remove('placed');
          while (cell.firstChild) cell.removeChild(cell.firstChild);
        }
      }
      validNextCells = neighbors(start.row, start.col);
      nextPipe();
      startTimer();
      updateValidCellHighlights();
    }, 1500);
  }
}

function adjacentPipe(pos){return DIRS.some(({dr,dc})=>{const r=pos.row+dr,c=pos.col+dc;return r>=0&&r<ROWS&&c>=0&&c<COLS&&board[r][c];});}

function fillBucket(){
  bucket+=BUCKET_STEP;
  bucketFill.style.height=`${bucket}%`;
  if(bucket>=100){addJerryCan();bucket=0;setTimeout(()=>{bucketFill.style.height='0%';},1000);}
}

function addJerryCan(){
  jerryCans++;
  const can=document.createElement('div');
  can.className='jerrycan';
  can.title=`Jerry Can ${jerryCans}`;
  can.onclick=()=>{const s=CHARITY_STORIES[(jerryCans-1)%CHARITY_STORIES.length];window.open(s.url,'_blank');};
  cans.appendChild(can);
}

function updateValidCellHighlights(){
  boardEl.querySelectorAll('.cell').forEach(cell=>{
    cell.classList.remove('valid-placement');
    if(!cell.classList.contains('placed')&&!cell.classList.contains('start')&&!cell.classList.contains('finish')){
      cell.style.opacity='0.6'; cell.style.cursor='default';
    }
  });
  validNextCells.forEach(({row,col})=>{
    const cell=boardEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if(cell&&!cell.classList.contains('obstacle')){
      cell.classList.add('valid-placement');
      cell.style.opacity='1'; cell.style.cursor='pointer';
    }
  });
}

window.addEventListener('load',init);

function pathExists(start, finish, obsArr) {
  const queue = [{row: start.row, col: start.col}];
  const visited = Array.from({length: ROWS}, () => Array(COLS).fill(false));
  obsArr.forEach(o => visited[o.r][o.c] = true);
  visited[start.row][start.col] = true;
  const dirs = [
    {dr: -1, dc: 0},
    {dr: 1, dc: 0},
    {dr: 0, dc: -1},
    {dr: 0, dc: 1}
  ];
  while (queue.length) {
    const {row, col} = queue.shift();
    if (row === finish.row && col === finish.col) return true;
    for (const {dr, dc} of dirs) {
      const nr = row + dr, nc = col + dc;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc]) {
        visited[nr][nc] = true;
        queue.push({row: nr, col: nc});
      }
    }
  }
  return false;
}