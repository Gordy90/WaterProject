// Pipeline for Hope - Simplified
const ROWS = 5, COLS = 8, OBSTACLE_CHANCE = 0.2, BUCKET_STEP = 100, TIMER_START = 10;
let started = false, currentPipe = null, bucket = 0, jerryCans = 0, timer = null, time = TIMER_START;
const board = [], obstacles = [], start = {row:0,col:0}, finish = {row:0,col:7};
let validNextCells = [];
const DIR_MAP = {T:{dr:-1,dc:0,op:'B'},R:{dr:0,dc:1,op:'L'},B:{dr:1,dc:0,op:'T'},L:{dr:0,dc:-1,op:'R'}};
const PIPE_TYPES = [
  {name:'straight',img:'images/pipe_straight_LR.png.png',dirs:['L','R'],rot:[0,90]},
  {name:'corner',img:'images/pipe_elbow_TR.png.png',dirs:['T','R'],rot:[0,90,180,270]},
  {name:'t-junction',img:'images/pipe_cross_LRTB.png',dirs:['T','R','B'],rot:[0,90,180,270]}
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
  pipeBox.onclick = () => started ? showMsg('Game already started!') : startGame();
  $('skipPipeBtn').onclick = () => { if (!started) return showMsg('Start the game first!'); nextPipe(); startTimer(); showMsg('Pipe skipped!'); };
  
  // Add debug button to HTML for fixing valid cells
  const debugBtn = document.createElement('button');
  debugBtn.textContent = "Fix Valid Cells";
  debugBtn.style.marginTop = "10px";
  debugBtn.onclick = fixValidCells;
  document.querySelector('.left-panel').appendChild(debugBtn);
}

function createBoard() {
  boardEl.innerHTML = '';
  obstacles.length = 0; // Clear obstacles array
  for (let r=0; r<ROWS; r++) {
    board[r]=[];
    for (let c=0; c<COLS; c++) {
      board[r][c]=null;
      const cell=document.createElement('div');
      cell.className='cell';
      cell.dataset.row=r; cell.dataset.col=c;
      let canPlaceObstacle = Math.random()<OBSTACLE_CHANCE && !(r===start.row&&c===start.col) && !(r===finish.row&&c===finish.col);
      if (canPlaceObstacle) {
        // Tentatively add obstacle
        obstacles.push({r,c});
        cell.classList.add('obstacle');
        // Check if path exists
        if (!pathExists(start, finish, obstacles)) {
          // Remove obstacle if it blocks all paths
          obstacles.pop();
          cell.classList.remove('obstacle');
        }
      }
      cell.onclick=()=>placePipe(r,c,cell);
      boardEl.appendChild(cell);
    }
  }
  setCell(start,'start','Start'); setCell(finish,'finish','Finish');
  validNextCells=[{row:start.row,col:start.col,requiredDirs:[]}];
  updateValidCellHighlights();
}

function setCell(pos,cls,txt) {
  const cell=boardEl.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
  cell.classList.add(cls); cell.textContent=txt;
}

function startGame() {
  started=true; 
  
  // Initialize valid cells as cells adjacent to Start
  initializeValidCellsFromStart();
  
  nextPipe(); 
  startTimer(); 
  showMsg('Game started! Place your pipe near the Start position.'); 
  updateValidCellHighlights();
}

// Helper function to initialize valid cells next to Start
function initializeValidCellsFromStart() {
  validNextCells = [];
  
  // Add all valid cells adjacent to start
  [
    {r: start.row-1, c: start.col}, // Above
    {r: start.row+1, c: start.col}, // Below
    {r: start.row, c: start.col-1}, // Left
    {r: start.row, c: start.col+1}  // Right
  ].forEach(({r, c}) => {
    if(r >= 0 && r < ROWS && c >= 0 && c < COLS && 
       !obstacles.some(o => o.r === r && o.c === c)) {
      validNextCells.push({row: r, col: c, requiredDirs: []});
    }
  });
  
  console.log("Initial valid next cells:", validNextCells);
}

// Debug function to initialize cells around Start
function fixValidCells() {
  console.log("Fixing valid cells");
  validNextCells = [];
  
  // Add all cells adjacent to start
  [
    {r: start.row-1, c: start.col}, // Above
    {r: start.row+1, c: start.col}, // Below
    {r: start.row, c: start.col-1}, // Left
    {r: start.row, c: start.col+1}  // Right
  ].forEach(({r, c}) => {
    if(r >= 0 && r < ROWS && c >= 0 && c < COLS && 
       !obstacles.some(o => o.r === r && o.c === c)) {
      validNextCells.push({row: r, col: c, requiredDirs: []});
    }
  });
  
  console.log("Fixed valid cells:", validNextCells);
  updateValidCellHighlights();
}

// Add a window-level debug function for console access
window.fixGame = fixValidCells;

function nextPipe() {
  // Get a random pipe - simple, no restrictions
  const t = PIPE_TYPES[Math.floor(Math.random()*PIPE_TYPES.length)];
  currentPipe={type:t,rotation:0};
  console.log("Current pipe:", currentPipe);
  pipeBox.innerHTML=`<img src="${t.img}" class="pipe-img appear" alt="${t.name}" style="transform:rotate(0deg)">`;
}

function startTimer() {
  clearInterval(timer); time=TIMER_START; updateTimer();
  timer=setInterval(()=>{time--; updateTimer(); if(time<=0){clearInterval(timer); nextPipe(); startTimer(); showMsg("Time's up! New pipe.");}},1000);
}

function updateTimer() {
  timerEl.textContent=`${time} sec`;
  timerEl.classList.toggle('urgent',time<=3);
}

function placePipe(r,c,cell) {
  console.log("Attempting to place pipe at", r, c);
  console.log("Cell classes:", cell.className);
  console.log("Valid next cells:", validNextCells);
  
  // Force validation to pass for cells adjacent to Start
  const isAdjacentToStart = (
    (r === start.row-1 && c === start.col) || 
    (r === start.row+1 && c === start.col) || 
    (r === start.row && c === start.col-1) || 
    (r === start.row && c === start.col+1)
  );
  
  // Basic validation
  if(!started) {
    showMsg("Game not started!");
    return;
  }
  if(!currentPipe) {
    showMsg("No pipe selected!");
    return;
  }
  if(!isAdjacentToStart && !isValidPlacement(r,c)) {
    showMsg("Not a valid placement cell!");
    return;
  }
  if(cell.classList.contains('placed') || cell.classList.contains('obstacle') || 
     cell.classList.contains('start') || cell.classList.contains('finish')) {
    showMsg("Can't place here - cell already occupied!");
    return;
  }

  // Check connection direction
  const validCell=validNextCells.find(vc=>vc.row===r&&vc.col===c);
  if(validCell && validCell.requiredDirs && validCell.requiredDirs.length>0) {
    console.log("Required directions:", validCell.requiredDirs);
    console.log("Current pipe directions:", currentPipe.type.dirs);
    
    // Skip connection check for first pipe (next to start)
    const isFirstPipe = validNextCells.length === 1 && 
                       validNextCells[0].row === start.row && 
                       validNextCells[0].col === start.col;
                       
    if(!isFirstPipe && !validCell.requiredDirs.some(dir=>currentPipe.type.dirs.includes(dir))) {
      showMsg("This pipe doesn't connect properly!");
      return;
    }
  }
  
  // Place the pipe
  const img=document.createElement('img');
  img.src=currentPipe.type.img;
  img.style.transform=`rotate(${currentPipe.rotation}deg)`;
  cell.appendChild(img); 
  cell.classList.add('placed');
  
  // Store pipe data
  board[r][c]={
    row:r, 
    col:c, 
    name:currentPipe.type.name,
    rotation:currentPipe.rotation,
    directions:[...currentPipe.type.dirs]
  };
  
  console.log("Pipe placed successfully:", board[r][c]);
  
  // Update game state
  updateValidNextCells(r,c,currentPipe.type.dirs);
  checkConnection(); 
  nextPipe(); 
  startTimer();
}

function isValidPlacement(r, c) {
  // Log for debugging
  console.log("Checking if valid placement at:", r, c);
  console.log("Valid cells are:", validNextCells);
  
  // Check if cell coordinates match any valid cell
  const isValid = validNextCells.some(cell => cell.row === r && cell.col === c);
  console.log("Is valid placement:", isValid);
  
  return isValid;
}

function updateValidNextCells(row, col, dirs) {
  validNextCells = [];
  // Always allow all four neighbors if they are not blocked or placed
  [
    {dr: -1, dc: 0}, // Up
    {dr: 1, dc: 0},  // Down
    {dr: 0, dc: -1}, // Left
    {dr: 0, dc: 1}   // Right
  ].forEach(({dr, dc}) => {
    const nr = row + dr, nc = col + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
        !board[nr][nc] && !obstacles.some(o => o.r === nr && o.c === nc)) {
      validNextCells.push({row: nr, col: nc, requiredDirs: []});
    }
  });
  updateValidCellHighlights();
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

function reachedFinish(){return adjacentPipe(finish);}
function checkConnection(){
  if(adjacentPipe(start)&&adjacentPipe(finish)){
    fillBucket();
    showMsg('Connection made! Bucket filling...');
    setTimeout(() => {
      // Clear all placed pipes, keep obstacles, Start, and Finish
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if ((r === start.row && c === start.col) || (r === finish.row && c === finish.col)) continue;
          board[r][c] = null;
          const cell = boardEl.querySelector(`[data-row="${r}"][data-col="${c}"]`);
          if (cell && cell.classList.contains('placed')) {
            cell.classList.remove('placed');
            while (cell.firstChild) cell.removeChild(cell.firstChild);
          }
        }
      }
      // Reset valid cells to be adjacent to Start
      validNextCells = [];
      [
        {r: start.row-1, c: start.col},
        {r: start.row+1, c: start.col},
        {r: start.row, c: start.col-1},
        {r: start.row, c: start.col+1}
      ].forEach(({r, c}) => {
        if(r >= 0 && r < ROWS && c >= 0 && c < COLS && !obstacles.some(o => o.r === r && o.c === c)) {
          validNextCells.push({row: r, col: c, requiredDirs: []});
        }
      });
      nextPipe();
      startTimer();
      updateValidCellHighlights();
      showMsg('Continue building to fill the bucket!');
    }, 1500);
  }
}
function adjacentPipe(pos){return[{r:pos.row-1,c:pos.col},{r:pos.row+1,c:pos.col},{r:pos.row,c:pos.col-1},{r:pos.row,c:pos.col+1}].some(({r,c})=>r>=0&&r<ROWS&&c>=0&&c<COLS&&board[r][c]);}
function fillBucket(){bucket+=BUCKET_STEP;bucketFill.style.height=`${bucket}%`;if(bucket>=100){addJerryCan();bucket=0;setTimeout(()=>{bucketFill.style.height='0%';showMsg('Bucket full! You earned a Jerry Can!');},1000);}}
function addJerryCan(){jerryCans++;const can=document.createElement('div');can.className='jerrycan';can.title=`Jerry Can ${jerryCans} - Click for a Charity Water Story`;can.onclick=()=>{const s=CHARITY_STORIES[(jerryCans-1)%CHARITY_STORIES.length];window.open(s.url,'_blank');};cans.appendChild(can);}
function showMsg(text){msg.textContent=text;msg.classList.remove('show');setTimeout(()=>msg.classList.add('show'),10);setTimeout(()=>msg.classList.remove('show'),3000);}
window.addEventListener('load',init);

// Simple BFS to check if a path exists from Start to Finish
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