function gameStart() {
    BOARD.fill()
    BOARD.render();
    const WordBox = document.getElementById("word-box");
    const ScoreBox = document.getElementById("score-human");
    const ScoreBoxComputer = document.getElementById("score-computer");
    const WordHistory = document.getElementById("word-history");
    //WordHistory.scrollTop = 999;

    BOARD.play(WordBox, ScoreBox, ScoreBoxComputer, WordHistory);
}

// https://en.wikipedia.org/wiki/Scrabble_letter_distributions
const CHARACTERS = 'EEEEEEEEEEEEAAAAAAAAAIIIIIIIIIOOOOOOOONNNNNNRRRRRRTTTTTTLLLLSSSSUUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ';

// (A, E, I, L, N, O, R, S, T, U) are 1 point.
// (D, G) are 2 points.
// (B, C, M, P) are 3 points.
// (F, H, V, W, Y) are 4 points.
// (K) is 5 points.
// (J, X) are 8 points.
// (Q, Z) are 10 points.

const CHAR_INFO = [
    {
	// A
	'adjustX' : 3,
	'points' : 1,
    },
    {
	// B
	'adjustX' : 3,
	'points' : 3,
    },
    {
	// C
	'adjustX' : 2,
	'points' : 3,
    },
    {
	// D
	'adjustX' : 3,
	'points' : 2,
    },
    {
	// E
	'adjustX' : 3,
	'points' : 1,
    },
    {
	// F
	'adjustX' : 3,
	'points' : 4,
    },
    {
	// G
	'adjustX' : 1,
	'points' : 2,
    },
    {
	// H
	'adjustX' : 0,
	'points' : 4,
    },
    {
	// I
	'adjustX' : 8,
	'points' : 1,
    },
    {
	// J
	'adjustX' : 9,
	'points' : 8,
    },
    {
	// K
	'adjustX' : 2,
	'points' : 5,
    },
    {
	// L
	'adjustX' : 4,
	'points' : 1,
    },
    {
	// M
	'adjustX' : -2,
	'points' : 3,
    },
    {
	// N
	'adjustX' : 0,
	'points' : 1,
    },
    {
	// O
	'adjustX' : 1,
	'points' : 1,
    },
    {
	// P
	'adjustX' : 5,
	'points' : 3,
    },
    {
	// Q
	'adjustX' : 1,
	'points' : 10,
    },
    {
	// R
	'adjustX' : 3,
	'points' : 1,
    },
    {
	// S
	'adjustX' : 3,
	'points' : 1,
    },
    {
	// T
	'adjustX' : 3,
	'points' : 1,
    },
    {
	// U
	'adjustX' : 0,
	'points' : 1,
    },
    {
	// V
	'adjustX' : 3,
	'points' : 4,
    },
    {
	// W
	'adjustX' : -3,
	'points' : 4,
    },
    {
	// X
	'adjustX' : 3,
	'points' : 8,
    },
    {
	// Y
	'adjustX' : 3,
	'points' : 4,
    },
    {
	// Z
	'adjustX' : 5,
	'points' : 10,
    },
];



function generateLetter() {
    return CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length));
}

function isInLexicon(word) {
    //console.log("isInLexicon()", word);
    let node = LEXICON['root'];
    for (let i=0; i<word.length; i++) {
	if (!node) {
	    //console.log("isInLexicon() NULL", word);
            return false;
	}
	let ch = word.charAt(i);
	//console.log("LEXICON node", node);
	if (!ch in node["next"]) {
	    //console.log("isInLexicon() FALSE", word);
            return false;
	}
        node = node["next"][ch];
    }
    return (node && Object.hasOwn(node, "isEnd") && node["isEnd"] == true);
}


class Tile {
    constructor(tileSize) {
	this.tileSize = tileSize;
	//this.letterColor = [0, 0, 0];
	this.letter = "?";
	this.x = 0;
	this.y = 0;
	this.selected = false;
   }

    render(context) {
	if (this.selected == true) {return;}
	//console.log("render", this.letter);
	let radius = this.tileSize / 2;
	context.beginPath();
	context.arc(this.x + radius + 1, this.y + radius + 1, radius, 0, 2 * Math.PI, false);
	context.fillStyle = "#cce6ff";
	context.closePath();
	context.fill();
	context.lineWidth = 1;
	context.strokeStyle = '#003300';
	context.stroke();
	//console.log("RENDER", this.x, this.y, this.letter);
	context.fillStyle = '#33334d';
	context.font = '32px san-serif';
	let idx = parseInt(this.letter, 36) - 10; // hack for 'A' -> '0'
	//console.log(this.letter, "idx", idx);
	let adjustX = 8 + CHAR_INFO[idx]['adjustX'];
	let adjustY = 32;
	context.fillText(this.letter, this.x + adjustX, this.y + adjustY);
    }

    select(context) {
	//if (this.selected == true) {return;}
	this.selected = true;
	//context.fillStyle = "blue";
	//context.fillRect(this.x, this.y, tileSize, tileSize);
	context.fillStyle = 'red';
	context.font = '32px san-serif';
	let idx = parseInt(this.letter, 36) - 10;
	//console.log(this.letter, "idx", idx);
	let adjustX = 8 + CHAR_INFO[idx]['adjustX'];
	let adjustY = 32;
	context.fillText(this.letter, this.x + adjustX, this.y + adjustY);
    }
}


class Board {
    constructor(canvas, numRows, numCols, tileSize, margin) {
	//console.log("BOARD INIT");
	this.canvas = canvas;
	this.context = this.canvas.getContext("2d");

	this.maxRows = numRows;  // set starting/max row size
	this.maxCols = numCols;  // set starting/max col size
	this.tileSize = tileSize;
	this.tileMargin = margin;
	
	this.grid = [];  // variable sized
	for (let col = 0; col < this.maxCols; col++) {
	    this.grid[col] = [];
	}
    }

    fill() {
	// fill the board with tiles
	let xx = 0;
	let yy = 0;
	for (let col = 0; col < this.maxCols; col++) {
            for (let row = 0; row < this.maxRows; row++) {
		const tile = new Tile(this.tileSize);
		tile.letter = generateLetter();
		tile.x = xx;
		tile.y = yy;
		//console.log('clientX', mousePos.X, 'i', i, 'LEFT:', left, 'RIGHT:', right);
		let top = row * (this.tileSize + this.tileMargin);
		let bottom = this.tileSize + (row * (this.tileMargin + this.tileSize));
		let left = col * (this.tileSize + this.tileMargin);
		let right = this.tileSize + (col * (this.tileMargin + this.tileSize));

		tile.top = top;
		tile.bottom = bottom;
		tile.left = left;
		tile.right = right;

		this.grid[col][row] = tile;

		yy += this.tileSize + this.tileMargin;
	    }
            xx += this.tileSize + this.tileMargin;
            yy = 0;
	}
    }

    clear() {
	this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }


    resetBoard() {
	for (let col = 0; col < this.grid.length; col++) {
	    for (let tileID = 0; tileID < this.grid[col].length; tileID++) {
		this.grid[col][tileID].selected = false;
	    }
	}
    }

    render() {
	const numCols = this.grid.length;
	for (let col = 0; col < numCols; col++) {
	    const numTiles = this.grid[col].length;
            for (let tileID = 0; tileID < numTiles; tileID++) {
		//console.log("RENDER", col, tileID);
		this.grid[col][tileID].render(this.context);
            }
	}
    }


    removeWordFromBoard() {
	// shift remaining letters in columns
	// then shift by rows, if needed
	
	// create maximum number of empty cols
	const AllCols = [];
	for (let col = 0; col < this.maxCols; col++) {
	    AllCols[col] = [];
	}

	// ------------------------------------
	// VERTICAL (Y axis) adjustmeent of columns
	
	let xx = 0;
	const numCols = this.grid.length;
	for (let col = 0; col < numCols; col++) {
	    // create mininum cols
	    let numTiles = this.grid[col].length;
	    const newCol = [];
	    for (let tileID = 0; tileID < numTiles; tileID++) {
		if (this.grid[col][tileID].selected == true) {
		    //console.log("removeWordFromBoard: selected col / tile", col, tileID);
		    continue;
		}
		const tile = new Tile(this.tileSize);
		tile.letter = this.grid[col][tileID].letter;
		//newCol.unshift(tile);
		newCol.push(tile);
	    }
	    // calculate placement of tiles (build from bottom)
	    numTiles = newCol.length - 1;
	    let yy = this.canvas.height;
	    for (let tileID = numTiles; tileID >= 0; tileID--) {
		const tile = newCol[tileID];
		tile.x = xx;
		tile.y = yy - this.tileSize;
		
		tile.left = tile.x;
		tile.right = xx + this.tileSize;
		tile.top = tile.y
		tile.bottom = yy;
		yy = yy - (this.tileSize + this.tileMargin);
	    }
	    
	    //console.log("removeWordFromBoard: new col", col);
	    //for (let i=0; i<newCol.length; i++)
	    //    {console.log(i, newCol[i].letter)}
	    AllCols[col] = newCol;
	    xx = xx + (this.tileSize + this.tileMargin);
	}
	
	// ------------------------------------
	// HORIZONTAL (X axis) adjustmeent of columns
	
	// look for "hole" of empty colums between filled columns
	let col = 0;
	// skip left-side empty columns (if any)
	while (col < this.maxCols) {
	    if (AllCols[col].length != 0) {
		break;
	    }
	    col += 1;
	}
	// find left-most empty column
	let shiftStart = -1;
	while (col < this.maxCols) {
	    if (AllCols[col].length == 0) {
		shiftStart = col;
		break;
	    }
	    col += 1;
	}
	// count span of empty columns in "hole"
	let shiftCount = 0;
	while (col < this.maxCols) {
	    if (AllCols[col].length == 0) {
		shiftCount += 1;
		col += 1;
	    } else {
		break;
	    }
	}
	if (col == this.maxCols) {
	    // empty columns extend to right edge
	    shiftStart = -1;
	}
	
	//console.log("shiftStart", shiftStart);
	//console.log("shiftCount", shiftCount);

	// TODO? make shift a gradual change for nicer UI?
	
	if (shiftStart > 0) {
	    const widthChange = shiftCount * (this.tileSize + this.tileMargin);
	    if (shiftStart < (AllCols.length / 2)) {
		console.log("shift_columns() POS shifting", shiftStart, shiftCount);
		for (let i=shiftStart-1; i>=0; i--) {
                    for (let j=0; j<AllCols[i].length; j++) {
			AllCols[i][j].x += widthChange;
			AllCols[i][j].left += widthChange;
			AllCols[i][j].right += widthChange;
                    }
		    delete AllCols[i+shiftCount];
		    AllCols[i+shiftCount] = AllCols[i];
		    AllCols[i] = [];
		}
	    } else {
		console.log("shift_columns() NEG shifting", shiftStart, shiftCount);
		for (let i=shiftStart+shiftCount; i<AllCols.length; i++) {
		    console.log("shift_columns() NEG i", i, AllCols.length);
		    for (let j=0; j<AllCols[i].length; j++) {
			AllCols[i][j].x -= widthChange;
			AllCols[i][j].left -= widthChange;
			AllCols[i][j].right -= widthChange;
                    }
		}
		for (let i=0; i<shiftCount; i++) {
		    delete AllCols[shiftStart+i];
		    AllCols[shiftStart+i] = AllCols[shiftStart+shiftCount+i];
		    AllCols[shiftStart+shiftCount+i] = [];
		}
	    }
	}
	this.grid = AllCols;
	this.clear();
	this.render();
    }

	
    computerPlay(wordbox, scoreboxComputer, wordhistory) {
	//console.log("computerPlay()");
	const _board = this;
	const root = LEXICON['root'];

	let findWords = function(words, lexnode, currentWord, currentLetter, col_id, tile_id) {
	    //console.log("findWords() LEXNODE:", lexnode, 'LETTER:', letter, 'COL', col_id, 'TILE_ID',  tile_id);
	    // check lexicon for possible words
	    // there are 3 possible outcomes:
	    // (1) if found a word, add word to list (and continue looking for longer word)
	    // (2) if found a partial match, look at neighboring tiles to continue
	    // (3) if no match, return

	    let lettersWanted = [];
	    for (let key in lexnode["next"]) {
		lettersWanted.push(key);
	    }
	    //console.log("-- looking for:", lettersWanted);
	    
	    let lettersNeighbors = [];
	    const tile = _board.grid[col_id][tile_id];
	    tile.neighborLetters = findNeighboringLetters(col_id, tile_id);
	    for (let idx in tile.neighborLetters) {
		let nl = tile.neighborLetters[idx];
		let ch = nl['letter'];
		lettersNeighbors.push(ch);
	    }
	    //console.log("-- neighbor letters:", lettersNeighbors);

	    const rec = {
		'col' : col_id,
		'tileID' : tile_id,
		'letter' : currentLetter,
	    };
	    currentWord.push(rec);
	    tile.selected = true; // avoid re-use as a neighbor
	    
	    if (Object.hasOwn(lexnode, "isEnd") && lexnode["isEnd"] == true) {
		// found a lexicon word
		words.push(currentWord);
		//console.log("COMPUTER word:", word);
		// but, keep going (eg: "fa", "far", "farm", "farmer", "farmers")
	    }

	    //var lettersIntersected = [];
	    for (let i=0; i < lettersWanted.length; i++) {
		const idx = lettersNeighbors.indexOf(lettersWanted[i]);
		if (idx >= 0) {	    
		    //lettersIntersected.push(lettersWanted[i]);
		    // use structuredClone() method or Array.from() function?
		    const clonedWord = JSON.parse(JSON.stringify(currentWord));
		    const nl = tile.neighborLetters[idx];
		    const ch = lettersWanted[i];
		    const neighbor = _board.grid[nl['col']][nl['tileID']];
		    neighbor.selected = true; // avoid re-use as a neighbor
		    //console.log("  -- LETTER", letter, "RECURSE CH", ch);
		    // recursion with next letter
		    findWords(words, lexnode["next"][ch], clonedWord, ch, nl['col'], nl['tileID']);
		}
	    }
	    //console.log(" ++ intersection letters:", lettersIntersected);
	    _board.resetBoard();
	}
	
	let findNeighboringLetters = function(col, tileID) {
	    //console.log("findNeighboringLetters()", col, tileID);
	    const tile = _board.grid[col][tileID];
	    if (Object.hasOwn(tile, "neighborLetters")) {
		return tile.neighborLetters;
	    }
	    const letters = [];
	    //console.log("findNeighboringLetters() letter=", tile.letter);

	    const neigborDistance = _board.tileSize + _board.tileMargin;
	    for (let col_id = 0; col_id < _board.grid.length; col_id++) {
		for (let tile_id = 0; tile_id < _board.grid[col_id].length; tile_id++) {
		    let neighborTile = _board.grid[col_id][tile_id];
		    let xDiff = Math.abs(tile.x - neighborTile.x);
		    let yDiff = Math.abs(tile.y - neighborTile.y);
		    //console.log("neighbor X", tile.x, neighborTile.x);
		    //console.log("neighbor Y", tile.y, neighborTile.y);
		    //console.log("neighbor", neigborDistance, xDiff, yDiff);
		    if (tile.x == neighborTile.x && tile.y == neighborTile.y) {
			// matched same tile, not a neighbor
			continue;
		    }
		    if (tile.selected) {
			// tile was already selected for the word, no re-use/cycle
			continue;
		    }
		    if (xDiff <= neigborDistance && yDiff <= neigborDistance) {
			//console.log(tile.letter, "neighbor", neighborTile.letter);
			let rec = {
			    'letter' : neighborTile.letter,
			    'col' : col_id,
			    'tileID' : tile_id,
			};
			letters.push(rec);
		    }
		}
	    }
	    return letters;
	}

	// reset all tiles' neighboring letters
	for (let col_id = 0; col_id < this.grid.length; col_id++) {
	    for (let tile_id = 0; tile_id < this.grid[col_id].length; tile_id++) {
		const tile = _board.grid[col_id][tile_id];
		if (! Object.hasOwn(tile, "neighbors")) {
		    // create new element
		    tile.neighbors = [];
		} else if (tile["neighbors"].length > 0) {
		    // reset element
		    delete tile.neighbors;
		    tile.neighbors = [];
		}
	    }
	}

	// find all possible words starting from a tile
	const words = [];
	for (let col_id = 0; col_id < this.grid.length; col_id++) {
	    for (let tile_id = 0; tile_id < this.grid[col_id].length; tile_id++) {
		const tile = _board.grid[col_id][tile_id];
		if (! tile.letter in root["next"]) {
		    // no word can start with this letter
		    continue;
		}
		// build all words starting at tile + following neighbors
		let node = root["next"][tile.letter];
		findWords(words, node, [], tile.letter, col_id, tile_id);
	    }
	}
	let bestWord = "";
	let bestWordScore = -1;
	let bestWordIndex = -1;
	if (words.length > 0) {
	    for (let w=0; w<words.length; w++) {
		let newWord = "";
		let newWordScore = 0;
		for (let i=0; i<words[w].length; i++) {
		    newWord += words[w][i]['letter'];
		    let idx = parseInt(words[w][i]['letter'], 36) - 10;
		    newWordScore += CHAR_INFO[idx]['points'];
		    //console.log("BEST WORD letter =", words[w][i]['letter'], newWord);
		}
		if (newWord.length < 2) {
		    continue;
		}
		//console.log("Computer word =", newWord);
		if (newWordScore > bestWordScore) {
		    bestWord = newWord;
		    bestWordScore = newWordScore;
		    bestWordIndex = w;
		}
	    }

	    //console.log("Computer best word =", bestWord, "score=", bestWordScore);
	    for (let i=0; bestWordIndex>=0 && i<words[bestWordIndex].length; i++) {
		const cell = words[bestWordIndex][i];
		//console.log('  ', cell['letter'], cell['col'], cell['tileID']);
		_board.grid[cell['col']][cell['tileID']].selected = true;
	    }
	    _board.removeWordFromBoard();
	    scoreboxComputer.value = parseInt(scoreboxComputer.value, 10) + bestWordScore;
	    wordhistory.value += '\n## ' + bestWord + ' ' + bestWordScore;
	    wordhistory.scrollTop = wordhistory.scrollHeight;
	    wordbox.value = bestWord;
	    return true;
	} else {
	    wordbox.value = 'NONE';
	    return false;
	}
    }

    
    play(wordbox, scorebox, scoreboxComputer, wordHistory) {
	// Javascript is confused by 'this' in nested functions
	const _board = this;
	wordbox.value = "";
	wordHistory.value = "";
	scorebox.value = "0";
	scoreboxComputer.value = "0";
	let WORD = "";	

	let checkWord = function() {
	    if (WORD.length == 0) {
		wordbox.value = 'DRAG MOUSE TO PICK WORD';
		return false;
	    }
	    if (WORD.length < 2) {
		// let argument start if 'I' is an okay word...
		wordbox.value = 'TOO SHORT: ' + WORD;
		return false;
	    }
	    if (isInLexicon(WORD)) {
		let score = 0;
		//console.log("ORIG", score);
		for (let i=0; i<WORD.length; i++) {
		    let idx = parseInt(WORD.charAt(i), 36) - 10;
		    //console.log(word, i, word.charAt(i), idx);
		    score += CHAR_INFO[idx]['points'];
		}
		//console.log(word, score);
		//WORDBOX.value = word;
		scorebox.value = parseInt(scorebox.value, 10) + score;
		wordHistory.value += '\n' + WORD + ' ' + score;
		wordHistory.scrollTop = wordHistory.scrollHeight;
		wordbox.value = '';
		return true;
	    } else {
		wordbox.value = 'UNKNOWN: ' + WORD;
		return false;
	    }
	}

	
	let mouseMoveHandler = function(evt) {
	    let rect = _board.canvas.getBoundingClientRect();
	    let mousePos = {
		X: evt.clientX - rect.left,
		Y: evt.clientY - rect.top
	    };
	    //console.log('Mouse Pos: ' + mousePos.X + ', ' + mousePos.Y);
	    let col = -1;
	    let tile = -1;
	    const numCols = _board.grid.length;
	    for (let colID=0; colID < numCols; colID++) {
		const numTiles = _board.grid[colID].length;
		if (numTiles < 1) { continue; }
		let left = _board.grid[colID][0].left;
		let right = _board.grid[colID][0].right;
		//console.log('clientX', mousePos.X, 'LEFT:', left, 'RIGHT:', right);
		if (mousePos.X > left && mousePos.X <= right) {
		    col = colID;
		    //console.log('col matched', col);
		    // find tile (if any) matches
		    for (let i=0; i<numTiles; i++) {
			let top = _board.grid[col][i].top;
			let bottom = _board.grid[col][i].bottom;
			//console.log('clientY', mousePos.Y, 'TOP:', top, 'BOTTOM:', bottom);
			if (mousePos.Y > top && mousePos.Y <= bottom) {
			    tile = i;
			    //console.log('Matched col/tile: ' + col + '/' + tile);
			    // can't reuse same tile in word
			    if (_board.grid[col][tile].selected != true) {
				_board.grid[col][tile].select(_board.context);
				WORD += _board.grid[col][tile].letter;
				wordbox.value = WORD;
				return;
			    }
			}
		    }
		}
	    }
	}
	

	let mouseDownHandler = function(evt) {
	    WORD = "";
	    wordbox.value = WORD;
	    _board.canvas.addEventListener('mousemove', mouseMoveHandler, false);
	}
	
	let mouseUpHandler = function(evt) {
	    _board.canvas.removeEventListener('mousemove', mouseMoveHandler, false);
	    if (checkWord()) {
		_board.removeWordFromBoard();
		_board.computerPlay(wordbox, scoreboxComputer, wordHistory);
	    } else {
		_board.resetBoard();
		_board.render();
	    }
	}
	
	_board.canvas.addEventListener('mousedown', mouseDownHandler, false);
	_board.canvas.addEventListener('mouseup', mouseUpHandler, false);
    }

    isMouseInside(mouseX, mouseY) {
	return mouseX > this.x && mouseX < this.x + _board.tileSize && mouseY > this.y && mouseY < this.y + _board.tileSize;
    }
}
