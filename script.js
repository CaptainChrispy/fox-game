class FoxGame {
    constructor() {
        this.config = {
            gridSize: 5,
            letters: ['F', 'O', 'X'],
            autoPlacementDelay: 200,
            targetWord: 'FOX',
            animationSpeed: 1
        };

        this.elements = {
            grid: document.getElementById('grid'),
            tilesContainer: document.getElementById('tiles-container'),
            message: document.getElementById('message'),
            autoButton: document.getElementById('auto-button'),
            restartButton: document.getElementById('restart-button'),
            statsDisplay: document.getElementById('stats'),
            themeToggle: document.getElementById('theme-toggle'),
            speedupButton: document.getElementById('speedup-button')
        };

        this.stats = this.loadStats();

        this.state = {
            placedTiles: Array(this.config.gridSize * this.config.gridSize).fill(null),
            tileLetters: [],
            currentTileIndex: 0,
            gameEnded: false,
            isAutoPlaying: false
        };

        this.init();
    }

    init() {
        this.generateGrid();
        this.setupEventListeners();
        this.createRandomTiles();
        this.updateStatsDisplay();
        this.initTheme();
    }

    loadStats() {
        const saved = localStorage.getItem('foxGameStats');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            attempts: 0,
            wins: 0,
            losses: 0
        };
    }

    saveStats() {
        localStorage.setItem('foxGameStats', JSON.stringify(this.stats));
    }

    updateStatsDisplay() {
        if (this.elements.statsDisplay) {
            const winRate = this.stats.attempts > 0 ? Math.round((this.stats.wins / this.stats.attempts) * 100) : 0;
            this.elements.statsDisplay.textContent = 
                `Games: ${this.stats.attempts} | Wins: ${this.stats.wins} | Losses: ${this.stats.losses} | Win Rate: ${winRate}%`;
        }
    }

    generateGrid() {
        this.elements.grid.innerHTML = '';
        
        const totalCells = this.config.gridSize * this.config.gridSize;
        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.setAttribute('id', `cell-${i}`);
            cell.setAttribute('data-index', i);
            cell.setAttribute('role', 'button');
            cell.setAttribute('tabindex', '0');
            cell.setAttribute('aria-label', `Grid cell ${i + 1}`);
            this.elements.grid.appendChild(cell);
        }
    }

    setupEventListeners() {
        this.elements.restartButton.addEventListener('click', () => this.restartGame());
        this.elements.autoButton.addEventListener('click', () => this.autoPlay());
        this.elements.grid.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.grid.addEventListener('drop', (e) => this.handleDrop(e));
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.speedupButton.addEventListener('click', () => this.speedUpAutoPlay());
    }

    createRandomTiles() {
        this.elements.tilesContainer.innerHTML = '';
        this.state.tileLetters = [];
        
        const totalTiles = this.config.gridSize * this.config.gridSize;
        
        for (let i = 0; i < totalTiles; i++) {
            const randomLetter = this.getRandomLetter();
            const tile = this.createTileElement(randomLetter);
            this.elements.tilesContainer.appendChild(tile);
            this.state.tileLetters.push(tile);
        }
    }

    createTileElement(letter) {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.setAttribute('data-letter', letter);
        tile.setAttribute('draggable', 'true');

        tile.addEventListener('dragstart', (e) => this.handleDragStart(e));
        tile.addEventListener('click', (e) => this.handleTileClick(e));
        
        return tile;
    }

    getRandomLetter() {
        return this.config.letters[Math.floor(Math.random() * this.config.letters.length)];
    }

    handleDragStart(e) {
        if (this.state.gameEnded) return;
        
        e.dataTransfer.setData('text', e.target.dataset.letter);
        e.target.classList.add('dragging');
        
        e.target.setAttribute('data-dragging', 'true');
        setTimeout(() => {
            e.target.removeAttribute('data-dragging');
        }, 100);
    }

    handleDragOver(e) {
        e.preventDefault();
    }

    handleDrop(e) {
        e.preventDefault();
        
        if (this.state.gameEnded) return;
        
        const target = e.target;
        if (!target.classList.contains('grid-cell')) return;
        
        const letter = e.dataTransfer.getData('text');
        const cellIndex = Array.from(this.elements.grid.children).indexOf(target);
        const draggingTile = document.querySelector('.dragging');
        
        if (this.state.placedTiles[cellIndex] === null) {
            this.placeTile(cellIndex, letter, draggingTile);
        }

        if (draggingTile) {
            draggingTile.classList.remove('dragging');
        }
    }

    handleTileClick(e) {
        if (this.state.gameEnded) return;
        
        if (e.target.hasAttribute('data-dragging')) return;
        if (e.target.classList.contains('dragging')) return;
        e.preventDefault();
        e.stopPropagation();
        
        const letter = e.target.getAttribute('data-letter');
        const firstAvailableIndex = this.findFirstAvailableCell();
        
        if (firstAvailableIndex !== -1) {
            this.placeTile(firstAvailableIndex, letter, e.target);
        }
    }

    findFirstAvailableCell() {
        for (let i = 0; i < this.state.placedTiles.length; i++) {
            if (this.state.placedTiles[i] === null) {
                return i;
            }
        }
        return -1;
    }

    placeTile(cellIndex, letter, tileElement, animated = false) {
        if (animated && tileElement) {
            return this.placeTileAnimated(cellIndex, letter, tileElement);
        }

        const cell = this.elements.grid.children[cellIndex];
        cell.textContent = letter;
        this.state.placedTiles[cellIndex] = letter;

        if (tileElement) {
            tileElement.remove();
        }

        this.checkGameState();
    }

    async placeTileAnimated(cellIndex, letter, tileElement) {
        const cell = this.elements.grid.children[cellIndex];
        
        const tileRect = tileElement.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();
        
        const deltaX = cellRect.left - tileRect.left;
        const deltaY = cellRect.top - tileRect.top;
        
        const flyingTile = tileElement.cloneNode(true);
        flyingTile.classList.add('tile-flying');
        flyingTile.style.left = tileRect.left + 'px';
        flyingTile.style.top = tileRect.top + 'px';
        flyingTile.style.width = tileRect.width + 'px';
        flyingTile.style.height = tileRect.height + 'px';
        flyingTile.style.setProperty('--target-x', deltaX + 'px');
        flyingTile.style.setProperty('--target-y', deltaY + 'px');
        
        document.body.appendChild(flyingTile);
        
        tileElement.remove();
        
        const flightTime = Math.max(40, 400 / this.config.animationSpeed);
        const flipTime = Math.max(40, 400 / this.config.animationSpeed);
        
        // Dynamically set animation duration
        flyingTile.style.animationDuration = flightTime + 'ms';
        
        await new Promise(resolve => setTimeout(resolve, flightTime));
        
        flyingTile.remove();
        
        cell.classList.add('tile-flipping');
        cell.style.animationDuration = flipTime + 'ms';
        
        setTimeout(() => {
            cell.textContent = letter;
            this.state.placedTiles[cellIndex] = letter;
        }, flipTime / 2);
        
        await new Promise(resolve => setTimeout(resolve, flipTime));

        cell.classList.remove('tile-flipping');
        
        this.checkGameState();
    }

    checkGameState() {
        const foxPattern = this.checkForFOX();
        if (foxPattern) {
            this.highlightFoxPattern(foxPattern);
            this.endGame(false, 'You lose! FOX was formed!');
        } else if (this.state.placedTiles.every(tile => tile !== null)) {
            this.endGame(true, 'Congratulations! You won!');
        }
    }

    highlightFoxPattern(pattern) {
        pattern.forEach(cellIndex => {
            const cell = this.elements.grid.children[cellIndex];
            cell.classList.add('fox-pattern');
        });
    }

    async autoPlay() {
        if (this.state.isAutoPlaying || this.state.gameEnded) return;
        
        this.state.isAutoPlaying = true;
        this.elements.autoButton.disabled = true;
        this.elements.autoButton.textContent = 'Auto Playing...';
        this.elements.restartButton.disabled = true;
        this.elements.speedupButton.style.display = 'inline-block';
        this.elements.speedupButton.disabled = false;
        this.elements.speedupButton.textContent = 'Speed Up';
        
        const totalTiles = this.config.gridSize * this.config.gridSize;
        
        while (this.state.currentTileIndex < totalTiles && !this.state.gameEnded) {
            const remainingTiles = document.querySelectorAll('.tile');
            if (remainingTiles.length === 0) break;
            
            const tile = remainingTiles[0];
            const letter = tile.getAttribute('data-letter');
            
            let cellIndex = this.state.currentTileIndex;
            while (cellIndex < totalTiles && this.state.placedTiles[cellIndex] !== null) {
                cellIndex++;
            }
            
            if (cellIndex < totalTiles) {
                await this.placeTile(cellIndex, letter, tile, true);
                this.state.currentTileIndex = cellIndex + 1;
            } else {
                break;
            }

            if (this.state.gameEnded) break;

            await new Promise(resolve => setTimeout(resolve, this.config.autoPlacementDelay));
        }
        
        this.state.isAutoPlaying = false;
        this.elements.restartButton.disabled = false;
        this.elements.speedupButton.style.display = 'none';
        this.config.autoPlacementDelay = 200;
        this.config.animationSpeed = 1;
        if (!this.state.gameEnded) {
            this.elements.autoButton.disabled = false;
            this.elements.autoButton.textContent = 'Automatic';
        }
    }

    checkForFOX() {
        const gridSize = this.config.gridSize;
        const target = this.config.targetWord;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const directions = [
                    [0, 1],   // Right
                    [0, -1],  // Left
                    [1, 0],   // Down
                    [-1, 0],  // Up
                    [1, 1],   // Down-Right
                    [1, -1],  // Down-Left
                    [-1, 1],  // Up-Right
                    [-1, -1]  // Up-Left
                ];
                
                for (const [rowDir, colDir] of directions) {
                    const pattern = this.checkWordInDirection(row, col, rowDir, colDir, target);
                    if (pattern) {
                        return pattern;
                    }
                }
            }
        }
        
        return null; // No FOX pattern found
    }

    checkWordInDirection(startRow, startCol, rowDir, colDir, word) {
        const gridSize = this.config.gridSize;
        const pattern = [];
        
        for (let i = 0; i < word.length; i++) {
            const row = startRow + i * rowDir;
            const col = startCol + i * colDir;
            
            if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
                return null;
            }
            
            const index = row * gridSize + col;
            if (this.state.placedTiles[index] !== word[i]) {
                return null;
            }
            
            pattern.push(index);
        }
        
        return pattern;
    }

    restartGame() {
        if (this.state.isAutoPlaying) return;
        
        this.state.placedTiles = Array(this.config.gridSize * this.config.gridSize).fill(null);
        this.state.currentTileIndex = 0;
        this.state.gameEnded = false;
        this.state.isAutoPlaying = false;

        Array.from(this.elements.grid.children).forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('fox-pattern');
        });

        this.elements.message.textContent = '';
        this.elements.message.className = '';
        this.elements.autoButton.disabled = false;
        this.elements.autoButton.textContent = 'Automatic';

        this.createRandomTiles();
    }

    endGame(won = false, message = '') {
        this.state.gameEnded = true;
        this.state.isAutoPlaying = false;
        
        // Update statistics
        this.stats.attempts++;
        if (won) {
            this.stats.wins++;
        } else {
            this.stats.losses++;
        }
        this.saveStats();
        this.updateStatsDisplay();
        
        this.elements.message.textContent = message;
        this.elements.message.className = won ? 'win-message' : 'lose-message';

        this.disableInteractions();
        
        this.elements.autoButton.disabled = true;
        this.elements.autoButton.textContent = 'Game Over';
        this.elements.restartButton.disabled = false;
    }

    disableInteractions() {
        document.querySelectorAll('.tile').forEach(tile => {
            tile.setAttribute('draggable', 'false');
            tile.style.cursor = 'not-allowed';
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('foxGameTheme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        this.updateThemeToggleIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('foxGameTheme', newTheme);
        this.updateThemeToggleIcon(newTheme);
    }

    updateThemeToggleIcon(theme) {
        this.elements.themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
        this.elements.themeToggle.setAttribute('aria-label', 
            theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
        );
    }

    speedUpAutoPlay() {
        if (this.state.isAutoPlaying && this.config.autoPlacementDelay > 10) {
            this.config.autoPlacementDelay = 10;
            this.config.animationSpeed = 10;
            this.elements.speedupButton.disabled = true;
            this.elements.speedupButton.textContent = 'Max Speed!';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new FoxGame();
});
