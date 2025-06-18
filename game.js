class Flip7Game {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.dealerIndex = 0;
        this.round = 1;
        this.targetScore = 200;
        this.deck = [];
        this.discardPile = [];
        this.gameState = 'setup'; // setup, playing, roundEnd, gameEnd
        this.roundState = 'dealing'; // dealing, playing, ended
        this.flipThreeActive = null; // {playerId, cardsLeft, deferredActions: []}
        this.extraActionCards = []; // Cards that need redistribution
        this.waitingForActionCardResolution = false; // Waiting for player to select action card target
        this.currentGameStats = {
            startTime: null,
            endTime: null,
            winner: null,
            rounds: 0,
            flip7Achieved: false
        };
        
        this.initializeTheme();
        this.initializeEventListeners();
        this.updatePlayerCountInputs();
    }

    createDeck() {
        this.deck = [];
        
        // Number cards
        const numberCards = [
            {value: 0, count: 1},
            {value: 1, count: 1},
            {value: 2, count: 2},
            {value: 3, count: 3},
            {value: 4, count: 4},
            {value: 5, count: 5},
            {value: 6, count: 6},
            {value: 7, count: 7},
            {value: 8, count: 8},
            {value: 9, count: 9},
            {value: 10, count: 10},
            {value: 11, count: 11},
            {value: 12, count: 12}
        ];
        
        numberCards.forEach(card => {
            for (let i = 0; i < card.count; i++) {
                this.deck.push({
                    type: 'number',
                    value: card.value,
                    id: `num_${card.value}_${i}`
                });
            }
        });
        
        // Action cards
        const actionCards = ['freeze', 'flip_three', 'second_chance'];
        actionCards.forEach(action => {
            for (let i = 0; i < 3; i++) {
                this.deck.push({
                    type: 'action',
                    value: action,
                    id: `action_${action}_${i}`
                });
            }
        });
        
        // Modifier cards
        const modifierCards = [
            {value: '+2', count: 1},
            {value: '+4', count: 1},
            {value: '+6', count: 1},
            {value: '+8', count: 1},
            {value: '+10', count: 1},
            {value: 'x2', count: 1}
        ];
        
        modifierCards.forEach(card => {
            for (let i = 0; i < card.count; i++) {
                this.deck.push({
                    type: 'modifier',
                    value: card.value,
                    id: `mod_${card.value}_${i}`
                });
            }
        });
        
        this.shuffleDeck();
        this.updateCardsRemaining();
    }
    
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    
    drawCard() {
        if (this.deck.length === 0) {
            // Reshuffle discarded cards
            this.deck = [...this.discardPile];
            this.discardPile = [];
            this.shuffleDeck();
        }
        
        const card = this.deck.pop();
        this.updateCardsRemaining();
        return card;
    }
    
    updateCardsRemaining() {
        $('#cards-remaining').text(this.deck.length);
        $('#deck-count, #deck-count-mobile').text(this.deck.length);
        $('#discard-count, #discard-count-mobile').text(this.discardPile.length);
    }
    
    initializeTheme() {
        const savedTheme = localStorage.getItem('flip7-theme') || 'light';
        document.body.classList.toggle('dark', savedTheme === 'dark');
    }
    
    initializeEventListeners() {
        $('#player-count').on('change', () => this.updatePlayerCountInputs());
        $('#start-game').on('click', () => this.startGame());
        $('#hit-button').on('click', () => this.hitPlayer());
        $('#stay-button').on('click', () => this.stayPlayer());
        $('#new-round').on('click', () => this.startNewRound());
        $('#new-game').on('click', () => this.resetGame());
        $('#play-again').on('click', () => this.resetGame());
        $('#close-modal').on('click', () => this.closeActionModal());
        $('#close-tracker').on('click', () => this.closeCardTracker());
        $('#close-stats').on('click', () => this.closeStatsModal());
        $('#reset-stats').on('click', () => this.resetStatistics());
        $('#theme-toggle').on('click', () => this.toggleTheme());
        $('#stats-button').on('click', () => this.showStatistics());
        $('#rules-button').on('click', () => this.showRules());
        $('#close-rules').on('click', () => this.closeRulesModal());
        
        // Deck click handlers for both desktop and mobile
        $('#deck, #deck-mobile').on('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.showCardTracker('deck');
            } else {
                this.dealCard();
            }
        });
        $('#discard-pile, #discard-pile-mobile').on('click', () => this.showCardTracker('discard'));
    }
    
    toggleTheme() {
        const isDark = document.body.classList.contains('dark');
        document.body.classList.toggle('dark', !isDark);
        localStorage.setItem('flip7-theme', isDark ? 'light' : 'dark');
    }
    
    getStats() {
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalRounds: 0,
            averageRounds: 0,
            flip7Achievements: 0,
            highestScore: 0,
            longestGame: 0,
            shortestGame: 0,
            lastPlayed: null
        };
        
        try {
            const saved = localStorage.getItem('flip7-stats');
            return saved ? {...defaultStats, ...JSON.parse(saved)} : defaultStats;
        } catch (e) {
            return defaultStats;
        }
    }
    
    saveStats(stats) {
        try {
            localStorage.setItem('flip7-stats', JSON.stringify(stats));
        } catch (e) {
            console.warn('Could not save statistics to localStorage');
        }
    }
    
    updateStatistics(gameData) {
        const stats = this.getStats();
        
        stats.gamesPlayed++;
        stats.totalRounds += gameData.rounds;
        stats.averageRounds = Math.round(stats.totalRounds / stats.gamesPlayed * 100) / 100;
        stats.lastPlayed = Date.now();
        
        if (gameData.winner) {
            stats.gamesWon++;
            const winnerScore = this.players.find(p => p.id === gameData.winner).totalScore;
            if (winnerScore > stats.highestScore) {
                stats.highestScore = winnerScore;
            }
        }
        
        if (gameData.flip7Achieved) {
            stats.flip7Achievements++;
        }
        
        const gameDuration = gameData.endTime - gameData.startTime;
        if (stats.longestGame === 0 || gameDuration > stats.longestGame) {
            stats.longestGame = gameDuration;
        }
        if (stats.shortestGame === 0 || gameDuration < stats.shortestGame) {
            stats.shortestGame = gameDuration;
        }
        
        this.saveStats(stats);
    }
    
    updatePlayerCountInputs() {
        const count = parseInt($('#player-count').val());
        const container = $('#player-names');
        container.empty();
        
        // Fancy default player names
        const fancyNames = [
            'Lady Luck 🍀',
            'Card Shark 🦈', 
            'Lucky Seven 🎰',
            'Ace Detective 🕵️',
            'Fortune Hunter 💎',
            'Risk Taker 🎲',
            'Card Master 👑'
        ];
        
        container.append('<label class="block text-sm font-medium text-gray-700 mb-2">Player Configuration:</label>');
        
        for (let i = 1; i <= count; i++) {
            const defaultName = fancyNames[i - 1] || `Player ${i}`;
            container.append(`
                <div class="mb-3 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <div class="mb-2">
                        <input type="text" id="player-name-${i}" placeholder="${defaultName}" value="${defaultName}"
                               class="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex items-center space-x-4">
                        <label class="flex items-center">
                            <input type="radio" name="player-type-${i}" value="human" checked
                                   class="mr-2 text-blue-500 focus:ring-blue-500">
                            <span class="text-sm">Human</span>
                        </label>
                        <label class="flex items-center">
                            <input type="radio" name="player-type-${i}" value="ai"
                                   class="mr-2 text-blue-500 focus:ring-blue-500">
                            <span class="text-sm">AI</span>
                        </label>
                        <select id="ai-difficulty-${i}" class="ml-2 p-1 text-xs border border-gray-300 rounded hidden">
                            <option value="easy">Easy</option>
                            <option value="medium" selected>Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                </div>
            `);
            
            // Show/hide AI difficulty when AI is selected
            $(`input[name="player-type-${i}"]`).on('change', function() {
                const difficultySelect = $(`#ai-difficulty-${i}`);
                if ($(this).val() === 'ai') {
                    difficultySelect.removeClass('hidden');
                } else {
                    difficultySelect.addClass('hidden');
                }
            });
        }
    }
    
    startGame() {
        const playerCount = parseInt($('#player-count').val());
        this.targetScore = parseInt($('#target-score').val());
        
        this.players = [];
        for (let i = 1; i <= playerCount; i++) {
            const name = $(`#player-name-${i}`).val() || `Player ${i}`;
            const isAI = $(`input[name="player-type-${i}"]:checked`).val() === 'ai';
            const aiDifficulty = $(`#ai-difficulty-${i}`).val();
            
            this.players.push({
                id: i,
                name: isAI ? `🤖 ${name}` : name,
                cards: [],
                score: 0,
                totalScore: 0,
                status: 'active', // active, busted, stayed
                isAI: isAI,
                aiDifficulty: aiDifficulty || 'medium'
            });
        }
        
        this.gameState = 'playing';
        this.round = 1;
        this.dealerIndex = 0;
        this.currentPlayerIndex = 0;
        
        // Initialize game statistics
        this.currentGameStats = {
            startTime: Date.now(),
            endTime: null,
            winner: null,
            rounds: 0,
            flip7Achieved: false
        };
        
        $('#setup-screen').addClass('hidden');
        $('#game-screen').removeClass('hidden');
        $('#display-target-score').text(this.targetScore);
        
        this.createDeck();
        this.setupPlayersDisplay();
        this.updateCardsRemaining(); // Initialize counters
        this.startNewRound();
    }
    
    setupPlayersDisplay() {
        const container = $('#players-container');
        container.empty();
        
        this.players.forEach((player, index) => {
            const playerDiv = $(`
                <div id="player-${player.id}" class="player-area">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="font-bold text-lg">${player.name}</h4>
                        <div class="text-right">
                            <div class="text-sm text-gray-600">Round Score: <span id="score-${player.id}">0</span></div>
                            <div class="text-sm text-gray-600">Total: <span id="total-${player.id}">0</span></div>
                        </div>
                    </div>
                    
                    <!-- Modifier Cards Row -->
                    <div class="modifier-row">
                        <div class="card-row-label">Modifiers & Actions</div>
                        <div id="modifier-cards-${player.id}" class="card-row"></div>
                    </div>
                    
                    <!-- Number Cards Row -->
                    <div class="number-row">
                        <div class="card-row-label">Number Cards</div>
                        <div id="number-cards-${player.id}" class="card-row"></div>
                    </div>
                    
                    <div id="status-${player.id}" class="mt-2 text-sm font-medium"></div>
                </div>
            `);
            container.append(playerDiv);
        });
    }
    
    startNewRound() {
        // Move all cards from players to discard pile before starting new round
        this.players.forEach(player => {
            player.cards.forEach(card => {
                this.discardPile.push(card);
            });
        });
        
        // Handle any extra action cards that need redistribution
        if (this.extraActionCards && this.extraActionCards.length > 0) {
            this.extraActionCards.forEach(extra => {
                if (extra.type === 'flip_three') {
                    // Find an active player to give the flip three card to
                    const activePlayers = this.players.filter(p => p.status === 'active');
                    if (activePlayers.length > 0) {
                        const randomPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
                        randomPlayer.cards.push(extra.card);
                        this.handleActionCard(randomPlayer.id, extra.card);
                    } else {
                        // No active players, discard it
                        this.discardPile.push(extra.card);
                    }
                }
            });
            this.extraActionCards = [];
        }
        
        // Reset player states
        this.players.forEach(player => {
            player.cards = [];
            player.score = 0;
            player.status = 'active';
        });
        
        // Restore card opacity for all players
        this.players.forEach(player => {
            $(`#modifier-cards-${player.id} .card, #number-cards-${player.id} .card`).css('opacity', '1');
        });
        
        this.currentPlayerIndex = this.dealerIndex;
        this.roundState = 'dealing';
        this.flipThreeActive = null;
        this.waitingForActionCardResolution = false;
        
        $('#current-round').text(this.round);
        $('#current-dealer, #current-dealer-mobile').text(this.players[this.dealerIndex].name);
        
        // Update counters to reflect discarded cards
        this.updateCardsRemaining();
        this.updateDisplay();
        this.initialDeal();
    }
    
    initialDeal() {
        // Deal one card to each player
        let dealIndex = this.dealerIndex;
        
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[dealIndex];
            if (player.status === 'active') {
                const card = this.drawCard();
                this.dealCardToPlayer(player.id, card);
                
                // Handle action cards during initial deal
                if (card.type === 'action') {
                    this.handleActionCard(player.id, card);
                }
            }
            
            dealIndex = (dealIndex + 1) % this.players.length;
        }
        
        this.roundState = 'playing';
        this.findNextActivePlayer();
        this.updateDisplay();
        this.checkAITurn();
    }
    
    checkAITurn() {
        if (this.roundState !== 'playing') return;
        
        // Don't make AI decisions if waiting for action card resolution
        if (this.waitingForActionCardResolution) return;
        
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer && currentPlayer.isAI && currentPlayer.status === 'active') {
            // Add delay for AI decision to make it feel more natural
            setTimeout(() => {
                // Double-check we're still not waiting for action card resolution
                if (this.waitingForActionCardResolution) return;
                
                if (this.flipThreeActive && this.flipThreeActive.playerId === currentPlayer.id) {
                    // AI must hit during Flip Three
                    this.hitPlayer();
                } else {
                    const decision = this.makeAIDecision(currentPlayer);
                    if (decision === 'hit') {
                        this.hitPlayer();
                    } else {
                        this.stayPlayer();
                    }
                }
            }, 1000 + Math.random() * 1000); // 1-2 second delay
        }
    }
    
    makeAIDecision(player) {
        const numberCards = player.cards.filter(c => c.type === 'number');
        const uniqueNumbers = [...new Set(numberCards.map(c => c.value))];
        const currentScore = player.score;
        const cardsLeft = this.deck.length;
        
        // AI decision based on difficulty and game state
        const riskTolerance = this.getAIRiskTolerance(player);
        const bustProbability = this.calculateBustProbability(player);
        
        // AI is more likely to stay if:
        // - High bust probability
        // - Good current score
        // - Close to Flip 7 but risky
        // - Low risk tolerance
        
        if (bustProbability > riskTolerance) {
            return 'stay';
        }
        
        if (uniqueNumbers.length >= 6) {
            // Close to Flip 7 - more conservative
            if (bustProbability > riskTolerance * 0.7) {
                return 'stay';
            }
        }
        
        if (currentScore >= 30 && bustProbability > riskTolerance * 0.8) {
            return 'stay';
        }
        
        return 'hit';
    }
    
    getAIRiskTolerance(player) {
        switch (player.aiDifficulty) {
            case 'easy':
                return 0.3; // Very conservative
            case 'medium':
                return 0.5; // Balanced
            case 'hard':
                return 0.7; // More aggressive
            default:
                return 0.5;
        }
    }
    
    calculateBustProbability(player) {
        const numberCards = player.cards.filter(c => c.type === 'number');
        const usedNumbers = numberCards.map(c => c.value);
        const availableNumbers = [];
        
        // Calculate which numbers are still available in deck
        for (let i = 0; i <= 12; i++) {
            if (!usedNumbers.includes(i)) {
                // Count how many of this number are still in deck
                let countInDeck = 0;
                if (i === 0 || i === 1) countInDeck = 1;
                else countInDeck = i;
                
                // Subtract any that might be in discard or other players' hands
                availableNumbers.push({number: i, count: countInDeck});
            }
        }
        
        // Simplified bust probability calculation
        const totalAvailableCards = this.deck.length;
        const bustCards = usedNumbers.length; // Cards that would cause bust
        
        if (totalAvailableCards === 0) return 1;
        
        // Rough estimate - this could be more sophisticated
        return Math.min(bustCards / 13, 0.9);
    }
    
    dealCardToPlayer(playerId, card) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        // Check for duplicate modifier cards
        if (card.type === 'modifier') {
            const existingModifiers = player.cards.filter(c => c.type === 'modifier');
            const hasDuplicate = existingModifiers.some(c => c.value === card.value);
            
            if (hasDuplicate) {
                // Player busted due to duplicate modifier card
                player.status = 'busted';
                this.updatePlayerStatus(playerId, 'BUSTED! Duplicate modifier card! 💥');
                // Still add the card to show what caused the bust
                player.cards.push(card);
                this.animateCardToDealerArea(playerId, card, () => {
                    this.renderPlayerCards(playerId, true);
                    this.calculatePlayerScore(playerId);
                });
                return;
            }
        }
        
        player.cards.push(card);
        this.animateCardToDealerArea(playerId, card, () => {
            this.renderPlayerCards(playerId, true); // Skip animation since we just did the flying effect
            this.calculatePlayerScore(playerId);
            this.processCardEffects(playerId, card);
        });
    }
    
    animateCardToDealerArea(playerId, card, callback) {
        // Get deck position
        const deckElement = $('#deck');
        const deckRect = deckElement[0].getBoundingClientRect();
        
        // Get target position for the new card based on card type
        const player = this.players.find(p => p.id === playerId);
        let targetContainer, targetRect;
        
        if (card.type === 'modifier' || card.type === 'action') {
            targetContainer = $(`#modifier-cards-${playerId}`);
        } else {
            targetContainer = $(`#number-cards-${playerId}`);
        }
        
        targetRect = targetContainer[0].getBoundingClientRect();
        
        // Calculate where the next card should be positioned
        const existingCards = targetContainer.children('.card');
        const cardWidth = 80; // Card width from CSS
        const cardGap = 8; // Gap between cards from CSS
        
        let targetX, targetY;
        
        if (existingCards.length === 0) {
            // First card in this row - position at start of container
            targetX = targetRect.left;
            targetY = targetRect.top;
        } else {
            // Position after the last card in this row
            const lastCard = existingCards.last();
            const lastCardRect = lastCard[0].getBoundingClientRect();
            targetX = lastCardRect.right + cardGap;
            targetY = lastCardRect.top;
            
            // Check if we need to wrap within the row
            if (targetX + cardWidth > targetRect.right) {
                targetX = targetRect.left;
                targetY = lastCardRect.bottom + cardGap;
            }
        }
        
        // Create flying card element (face down initially)
        const flyingCard = $('<div class="card card-flying"></div>');
        flyingCard.css({
            left: deckRect.left + 'px',
            top: deckRect.top + 'px',
            width: deckRect.width + 'px',
            height: deckRect.height + 'px',
            'background-image': 'url("assets/backside.png")',
            'background-size': 'cover',
            'background-position': 'center',
            'border': '2px solid #333',
            'transform': 'rotate(' + (Math.random() * 10 - 5) + 'deg)'
        });
        
        $('body').append(flyingCard);
        
        // Animate to player area
        setTimeout(() => {
            
            flyingCard.css({
                left: targetX + 'px',
                top: targetY + 'px',
                transform: 'rotate(' + (Math.random() * 20 - 10) + 'deg) scale(1.1)'
            });
            
            // Flip card to reveal face after it reaches destination
            setTimeout(() => {
                // Update card to show actual card image
                let imagePath;
                if (card.type === 'number') {
                    imagePath = `assets/${card.value}.png`;
                } else if (card.type === 'action') {
                    const actionImages = {
                        'freeze': 'freeze.png',
                        'flip_three': 'flip_three.png',
                        'second_chance': 'second_chance.png'
                    };
                    imagePath = `assets/${actionImages[card.value]}`;
                } else if (card.type === 'modifier') {
                    imagePath = `assets/${card.value}.png`;
                }
                
                flyingCard.addClass('card-flip-animation');
                flyingCard.css({
                    'background-image': `url("${imagePath}")`,
                    'transform': 'rotate(0deg) scale(1)'
                });
                
                // Remove flying card and show in player area
                setTimeout(() => {
                    flyingCard.remove();
                    if (callback) callback();
                }, 600);
                
            }, 200);
        }, 50);
    }
    
    processCardEffects(playerId, card) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        // Check for bust condition with number cards
        if (card.type === 'number') {
            const numberCards = player.cards.filter(c => c.type === 'number');
            const values = numberCards.map(c => c.value);
            const uniqueValues = [...new Set(values)];
            
            // Check if player has a Second Chance card
            const hasSecondChance = player.cards.some(c => c.type === 'action' && c.value === 'second_chance');
            
            if (values.length !== uniqueValues.length && !hasSecondChance) {
                // Player busted
                player.status = 'busted';
                this.updatePlayerStatus(playerId, 'BUSTED! Duplicate number card! 💥');
            } else if (values.length !== uniqueValues.length && hasSecondChance) {
                // Use Second Chance
                // Remove the duplicate card and second chance card
                const duplicateValue = values.find((val, index) => values.indexOf(val) !== index);
                const duplicateCardIndex = player.cards.findIndex(c => c.type === 'number' && c.value === duplicateValue);
                const secondChanceIndex = player.cards.findIndex(c => c.type === 'action' && c.value === 'second_chance');
                
                if (duplicateCardIndex !== -1) {
                    this.discardPile.push(player.cards.splice(duplicateCardIndex, 1)[0]);
                }
                if (secondChanceIndex !== -1) {
                    this.discardPile.push(player.cards.splice(secondChanceIndex, 1)[0]);
                }
                
                this.updatePlayerStatus(playerId, 'Second Chance Used! 🛡️');
                this.renderPlayerCards(playerId);
                this.calculatePlayerScore(playerId);
                this.updateCardsRemaining();
            }
            
            // Check for Flip 7 bonus (only outside of Flip Three - handled separately during Flip Three)
            if (uniqueValues.length === 7 && player.status === 'active' && 
                !(this.flipThreeActive && this.flipThreeActive.playerId === playerId)) {
                player.status = 'flip7';
                this.currentGameStats.flip7Achieved = true;
                this.updatePlayerStatus(playerId, 'FLIP 7! +15 Bonus! 🎉');
                this.endRound();
                return;
            }
        }
        
        // Handle action cards
        if (card.type === 'action') {
            this.handleActionCard(playerId, card);
        }
    }
    
    renderPlayerCards(playerId, skipAnimation = false) {
        const player = this.players.find(p => p.id === playerId);
        const modifierContainer = $(`#modifier-cards-${playerId}`);
        const numberContainer = $(`#number-cards-${playerId}`);
        
        // Clear both containers
        modifierContainer.empty();
        numberContainer.empty();
        
        // Separate cards into modifier/action and number cards
        const modifierCards = player.cards.filter(card => card.type === 'modifier' || card.type === 'action');
        const numberCards = player.cards.filter(card => card.type === 'number');
        
        // Render modifier and action cards in top row
        modifierCards.forEach((card, index) => {
            const cardDiv = this.createCardElement(card);
            if (!skipAnimation) {
                cardDiv.addClass('card-appear');
            }
            modifierContainer.append(cardDiv);
        });
        
        // Render number cards in bottom row
        numberCards.forEach((card, index) => {
            const cardDiv = this.createCardElement(card);
            if (!skipAnimation) {
                cardDiv.addClass('card-appear');
            }
            numberContainer.append(cardDiv);
        });
    }
    
    createCardElement(card) {
        const cardDiv = $('<div class="card"></div>');
        const img = $('<img>');
        
        // Set image source based on card type and value
        let imagePath;
        if (card.type === 'number') {
            cardDiv.addClass('number-card');
            imagePath = `assets/${card.value}.png`;
        } else if (card.type === 'action') {
            cardDiv.addClass('action-card');
            const actionImages = {
                'freeze': 'freeze.png',
                'flip_three': 'flip_three.png',
                'second_chance': 'second_chance.png'
            };
            imagePath = `assets/${actionImages[card.value]}`;
        } else if (card.type === 'modifier') {
            cardDiv.addClass('modifier-card');
            imagePath = `assets/${card.value}.png`;
        }
        
        img.attr('src', imagePath);
        img.attr('alt', card.value);
        img.css({
            'width': '100%',
            'height': '100%',
            'object-fit': 'contain',
            'border-radius': '6px'
        });
        
        cardDiv.append(img);
        return cardDiv;
    }
    
    calculatePlayerScore(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) return;
        
        let score = 0;
        let multiplier = 1;
        let bonus = 0;
        
        // Calculate base score from number cards
        const numberCards = player.cards.filter(c => c.type === 'number');
        const baseScore = numberCards.reduce((sum, card) => sum + card.value, 0);
        
        // Apply modifiers
        const modifierCards = player.cards.filter(c => c.type === 'modifier');
        modifierCards.forEach(card => {
            if (card.value === 'x2') {
                multiplier *= 2;
            } else {
                const bonusValue = parseInt(card.value.replace('+', ''));
                bonus += bonusValue;
            }
        });
        
        score = (baseScore * multiplier) + bonus;
        
        // Add Flip 7 bonus if applicable
        if (player.status === 'flip7') {
            score += 15;
        }
        
        player.score = score;
        $(`#score-${playerId}`).text(score);
    }
    
    updatePlayerStatus(playerId, status) {
        $(`#status-${playerId}`).text(status);
        this.updatePlayerAreaVisuals();
    }
    
    updatePlayerAreaVisuals() {
        // Update all player areas based on their current status and turn
        this.players.forEach(player => {
            const playerArea = $(`#player-${player.id}`);
            
            // Remove all status classes
            playerArea.removeClass('active busted stayed frozen disabled current-turn');
            
            // Add status-based classes
            if (player.status === 'busted') {
                playerArea.addClass('busted disabled');
            } else if (player.status === 'stayed') {
                // Check if player was frozen (stayed due to freeze card)
                const statusText = $(`#status-${player.id}`).text();
                if (statusText.includes('FROZEN')) {
                    playerArea.addClass('frozen disabled');
                } else {
                    playerArea.addClass('stayed disabled');
                }
            } else if (player.status === 'flip7') {
                playerArea.addClass('stayed'); // Flip 7 players are essentially stayed
            } else if (player.status === 'active') {
                // Add current-turn glow if it's their turn AND they need to take action
                const isCurrentPlayer = this.roundState === 'playing' && this.currentPlayerIndex === player.id;
                const needsAction = isCurrentPlayer && !player.isAI && 
                                   (this.waitingForActionCardResolution || 
                                    (!this.waitingForActionCardResolution && !this.flipThreeActive));
                
                if (needsAction) {
                    playerArea.addClass('active current-turn');
                } else {
                    // Active but either not current turn, AI player, or no action needed
                    playerArea.addClass('active');
                }
            }
        });
    }
    
    handleActionCard(playerId, card) {
        const player = this.players.find(p => p.id === playerId);
        
        // First, render the card on the player's board (it's now in their hand)
        this.renderPlayerCards(playerId);
        this.calculatePlayerScore(playerId);
        
        switch (card.value) {
            case 'freeze':
            case 'flip_three':
                // Check if only one active player first
                const activePlayerIds = this.players.filter(p => p.status === 'active').map(p => p.id);
                if (activePlayerIds.length === 1) {
                    // Must play on themselves - resolve immediately
                    this.applyActionCardToTarget(playerId, playerId, card);
                } else {
                    // Show target selection
                    this.showActionCardTargetSelection(playerId, card);
                }
                break;
                
            case 'second_chance':
                // Second Chance stays with the player who drew it (or gets redistributed)
                // Check if player already has a Second Chance card
                const hasSecondChance = player.cards.some(c => c.type === 'action' && c.value === 'second_chance' && c.id !== card.id);
                
                if (hasSecondChance) {
                    // Player already has one, give to another active player
                    this.redistributeSecondChance(playerId, card);
                } else {
                    this.updatePlayerStatus(playerId, 'Second Chance Ready! 🛡️');
                    // Clear waiting state and progress turn for Second Chance kept
                    this.waitingForActionCardResolution = false;
                    setTimeout(() => {
                        if (!this.checkRoundEnd()) {
                            this.progressTurn();
                        }
                    }, 500);
                }
                break;
        }
    }
    
    showActionCardTargetSelection(playerId, card) {
        const activePlayerIds = this.players.filter(p => p.status === 'active').map(p => p.id);
        const sourcePlayer = this.players.find(p => p.id === playerId);
        
        // If AI player, automatically select target
        if (sourcePlayer.isAI) {
            this.selectAIActionTarget(playerId, card, activePlayerIds);
            return;
        }
        
        // Show modal for human player selection
        const modal = $('#action-modal');
        const title = $('#action-title');
        const content = $('#action-content');
        const buttonsContainer = $('#action-buttons-modal');
        
        const cardNames = {
            'freeze': 'Freeze',
            'flip_three': 'Flip Three'
        };
        
        title.text(`Play ${cardNames[card.value]} Card`);
        content.html(`
            <p class="mb-4 text-center">Choose which player to target with this action card:</p>
            <div class="space-y-2" id="target-selection">
                ${activePlayerIds.map(targetId => {
                    const targetPlayer = this.players.find(p => p.id === targetId);
                    return `
                        <button class="w-full p-3 bg-blue-100 hover:bg-blue-200 rounded-lg border border-blue-300 target-select-btn" 
                                data-target-id="${targetId}" data-card-value="${card.value}" data-player-id="${playerId}">
                            <div class="flex justify-between items-center">
                                <span class="font-semibold">${targetPlayer.name}</span>
                                <span class="text-sm text-gray-600">Score: ${targetPlayer.score}</span>
                            </div>
                        </button>
                    `;
                }).join('')}
            </div>
        `);
        
        buttonsContainer.html('');
        modal.removeClass('hidden');
        
        // Handle target selection
        $('.target-select-btn').on('click', (e) => {
            const targetId = parseInt($(e.currentTarget).data('target-id'));
            const cardValue = $(e.currentTarget).data('card-value');
            const sourcePlayerId = parseInt($(e.currentTarget).data('player-id'));
            
            this.applyActionCardToTarget(sourcePlayerId, targetId, card);
            modal.addClass('hidden');
        });
    }
    
    applyActionCardToTarget(sourcePlayerId, targetId, card) {
        const targetPlayer = this.players.find(p => p.id === targetId);
        const sourcePlayer = this.players.find(p => p.id === sourcePlayerId);
        
        switch (card.value) {
            case 'freeze':
                targetPlayer.status = 'stayed';
                if (sourcePlayerId === targetId) {
                    this.updatePlayerStatus(targetId, 'FROZEN! ❄️');
                } else {
                    this.updatePlayerStatus(sourcePlayerId, `Froze ${targetPlayer.name}! ❄️`);
                    this.updatePlayerStatus(targetId, `FROZEN by ${sourcePlayer.name}! ❄️`);
                }
                break;
                
            case 'flip_three':
                // Check if target is already in flip three
                if (this.flipThreeActive && this.flipThreeActive.playerId === targetId) {
                    this.updatePlayerStatus(sourcePlayerId, `${targetPlayer.name} already flipping three! Card will be redistributed.`);
                    // Store the extra flip three card for redistribution
                    this.extraActionCards = this.extraActionCards || [];
                    this.extraActionCards.push({type: 'flip_three', card: card});
                } else {
                    this.flipThreeActive = {playerId: targetId, cardsLeft: 3, deferredActions: []};
                    if (sourcePlayerId === targetId) {
                        this.updatePlayerStatus(targetId, 'FLIP THREE! Must take 3 cards 🎲');
                    } else {
                        this.updatePlayerStatus(sourcePlayerId, `Made ${targetPlayer.name} flip three! 🎲`);
                        this.updatePlayerStatus(targetId, `FLIP THREE by ${sourcePlayer.name}! Must take 3 cards 🎲`);
                    }
                    const playerArea = $(`#player-${targetId}`);
                    playerArea.addClass('flip-three-active');
                }
                break;
        }
        
        // Clear waiting state and update display
        this.waitingForActionCardResolution = false;
        this.updateDisplay();
        
        // Check if round should end immediately (e.g., Freeze made last active player inactive)
        if (this.checkRoundEnd()) {
            this.endRound();
            return;
        }
        
        // Progress to next player after action is resolved
        setTimeout(() => {
            if (!this.checkRoundEnd()) {
                this.progressTurn();
            }
        }, 500);
    }
    
    
    selectAIActionTarget(playerId, card, activePlayerIds) {
        const sourcePlayer = this.players.find(p => p.id === playerId);
        let targetId;
        
        switch (card.value) {
            case 'freeze':
                // AI strategy for Freeze: target player with highest score (unless it's themselves and they have a good score)
                const otherPlayerIds = activePlayerIds.filter(id => id !== playerId);
                if (otherPlayerIds.length > 0) {
                    // Find highest scoring opponent
                    const targetPlayer = otherPlayerIds.map(id => this.players.find(p => p.id === id))
                        .sort((a, b) => b.score - a.score)[0];
                    targetId = targetPlayer.id;
                } else {
                    targetId = playerId; // Must target self if only active player
                }
                break;
                
            case 'flip_three':
                // AI strategy for Flip Three: target opponent with lowest risk of busting
                const otherActiveIds = activePlayerIds.filter(id => id !== playerId);
                if (otherActiveIds.length > 0) {
                    // Target opponent with fewest unique number cards (higher chance of busting)
                    const targetPlayer = otherActiveIds.map(id => this.players.find(p => p.id === id))
                        .sort((a, b) => {
                            const aUniqueNumbers = [...new Set(a.cards.filter(c => c.type === 'number').map(c => c.value))].length;
                            const bUniqueNumbers = [...new Set(b.cards.filter(c => c.type === 'number').map(c => c.value))].length;
                            return aUniqueNumbers - bUniqueNumbers;
                        })[0];
                    targetId = targetPlayer.id;
                } else {
                    targetId = playerId; // Must target self if only active player
                }
                break;
        }
        
        // Add a small delay to make AI decision feel more natural
        setTimeout(() => {
            this.applyActionCardToTarget(playerId, targetId, card);
        }, 1000);
    }
    
    redistributeSecondChance(currentPlayerId, card) {
        // Find active players who don't have Second Chance
        const eligiblePlayers = this.players.filter(p => 
            p.id !== currentPlayerId && 
            p.status === 'active' && 
            !p.cards.some(c => c.type === 'action' && c.value === 'second_chance')
        );
        
        if (eligiblePlayers.length > 0) {
            // Give to a random eligible player
            const targetPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
            
            // Animate card moving from current player to target player
            this.animateCardRedistribution(currentPlayerId, targetPlayer.id, card, () => {
                // After animation completes, update status messages
                this.updatePlayerStatus(currentPlayerId, `Second Chance given to ${targetPlayer.name}! 🎁`);
                this.updatePlayerStatus(targetPlayer.id, 'Received Second Chance! 🛡️');
                
                // Clear waiting state and progress turn
                this.waitingForActionCardResolution = false;
                setTimeout(() => {
                    if (!this.checkRoundEnd()) {
                        this.progressTurn();
                    }
                }, 500);
            });
        } else {
            // No eligible players, discard the card
            const cardIndex = this.players.find(p => p.id === currentPlayerId).cards.findIndex(c => c.id === card.id);
            if (cardIndex !== -1) {
                this.players.find(p => p.id === currentPlayerId).cards.splice(cardIndex, 1);
            }
            this.discardPile.push(card);
            this.updatePlayerStatus(currentPlayerId, 'Second Chance discarded - no eligible players! 🗑️');
            this.renderPlayerCards(currentPlayerId, true);
            this.calculatePlayerScore(currentPlayerId);
            this.updateCardsRemaining();
            
            // Clear waiting state and progress turn
            this.waitingForActionCardResolution = false;
            setTimeout(() => {
                if (!this.checkRoundEnd()) {
                    this.progressTurn();
                }
            }, 500);
        }
    }
    
    animateCardRedistribution(sourcePlayerId, targetPlayerId, card, onComplete) {
        const sourcePlayer = this.players.find(p => p.id === sourcePlayerId);
        const targetPlayer = this.players.find(p => p.id === targetPlayerId);
        
        // Find the card element in source player's board
        const sourceCardElement = $(`#modifier-cards-${sourcePlayerId} .card`).filter(function() {
            return $(this).find('img').attr('alt') === card.value;
        }).last();
        
        if (sourceCardElement.length === 0) {
            // Fallback if card element not found - just do the data transfer
            this.transferCard(sourcePlayerId, targetPlayerId, card);
            if (onComplete) onComplete();
            return;
        }
        
        // Get positions
        const sourceRect = sourceCardElement[0].getBoundingClientRect();
        const targetContainer = $(`#modifier-cards-${targetPlayerId}`);
        const targetRect = targetContainer[0].getBoundingClientRect();
        
        // Create flying card
        const flyingCard = sourceCardElement.clone();
        flyingCard.addClass('card-flying');
        flyingCard.css({
            position: 'fixed',
            left: sourceRect.left + 'px',
            top: sourceRect.top + 'px',
            width: sourceRect.width + 'px',
            height: sourceRect.height + 'px',
            zIndex: 1000,
            pointerEvents: 'none',
            border: '3px solid #10b981',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)'
        });
        
        $('body').append(flyingCard);
        
        // Hide original card
        sourceCardElement.css('opacity', '0');
        
        // Calculate target position
        const targetLeft = targetRect.left + (targetContainer.children().length * 90); // Approximate card spacing
        const targetTop = targetRect.top;
        
        // Animate to target
        setTimeout(() => {
            flyingCard.css({
                left: targetLeft + 'px',
                top: targetTop + 'px',
                transform: 'rotate(5deg) scale(1.1)',
                transition: 'all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });
        }, 50);
        
        // Complete animation and transfer card data
        setTimeout(() => {
            flyingCard.remove();
            
            // Transfer the card in game data
            this.transferCard(sourcePlayerId, targetPlayerId, card);
            
            // Call completion callback
            if (onComplete) onComplete();
        }, 1100);
    }
    
    transferCard(sourcePlayerId, targetPlayerId, card) {
        const sourcePlayer = this.players.find(p => p.id === sourcePlayerId);
        const targetPlayer = this.players.find(p => p.id === targetPlayerId);
        
        // Remove the card from source player
        const cardIndex = sourcePlayer.cards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
            sourcePlayer.cards.splice(cardIndex, 1);
        }
        
        // Add card to target player
        targetPlayer.cards.push(card);
        
        // Re-render both players' cards
        this.renderPlayerCards(sourcePlayerId, true);
        this.renderPlayerCards(targetPlayerId, false); // Show animation for target
        this.calculatePlayerScore(sourcePlayerId);
        this.calculatePlayerScore(targetPlayerId);
    }
    
    hitPlayer() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.status !== 'active') {
            this.findNextActivePlayer();
            return;
        }
        
        const card = this.drawCard();
        this.dealCardToPlayer(currentPlayer.id, card);
        
        // Handle Flip Three progression first
        const wasFlipThreeActive = this.flipThreeActive && this.flipThreeActive.playerId === currentPlayer.id;
        
        if (wasFlipThreeActive) {
            this.handleFlipThreeCard(currentPlayer.id, card);
        } else if (card.type === 'action') {
            // Normal action card handling when not in Flip Three
            this.waitingForActionCardResolution = true;
            this.handleActionCard(currentPlayer.id, card);
            // Don't progress turn yet - wait for action card resolution
            this.updateDisplay();
            return;
        }
        
        // Check if round should end
        if (this.checkRoundEnd()) {
            this.endRound();
            return;
        }
        
        // Progress to next player (only if not waiting for action card resolution)
        this.progressTurn();
    }
    
    progressTurn() {
        // Determine next action based on flip three state
        if (this.flipThreeActive && this.flipThreeActive.playerId === this.players[this.currentPlayerIndex].id) {
            // Player must continue flipping - don't change turns
            this.checkAITurn();
        } else {
            // Normal turn progression - move to next player
            this.findNextActivePlayer();
            this.checkAITurn();
        }
        
        this.updateDisplay();
    }
    
    handleFlipThreeCard(playerId, card) {
        const player = this.players.find(p => p.id === playerId);
        
        // Decrement cards left (all cards count toward the 3)
        this.flipThreeActive.cardsLeft--;
        
        // Handle Second Chance specially - it can be set aside and used
        if (card.type === 'action' && card.value === 'second_chance') {
            const hasSecondChance = player.cards.some(c => c.type === 'action' && c.value === 'second_chance' && c.id !== card.id);
            
            if (hasSecondChance) {
                // Player already has one, defer redistribution
                this.flipThreeActive.deferredActions.push({type: 'redistribute_second_chance', card: card, playerId: playerId});
                this.updatePlayerStatus(playerId, `Second Chance set aside - already have one! Card ${4 - this.flipThreeActive.cardsLeft}/3`);
            } else {
                this.updatePlayerStatus(playerId, `Second Chance set aside and ready! Card ${4 - this.flipThreeActive.cardsLeft}/3`);
            }
        }
        // Defer other action cards until after all 3 cards are drawn
        else if (card.type === 'action' && (card.value === 'freeze' || card.value === 'flip_three')) {
            this.flipThreeActive.deferredActions.push({type: 'action_card', card: card, playerId: playerId});
            this.updatePlayerStatus(playerId, `${card.value === 'freeze' ? 'Freeze' : 'Flip Three'} card deferred until after Flip Three! Card ${4 - this.flipThreeActive.cardsLeft}/3`);
        }
        // Process number and modifier cards immediately
        else {
            this.updatePlayerStatus(playerId, `Drew ${card.type} card! Card ${4 - this.flipThreeActive.cardsLeft}/3`);
        }
        
        // Check if Flip Three should end
        const shouldEnd = this.flipThreeActive.cardsLeft <= 0 || 
                         player.status !== 'active' ||
                         this.checkFlip7(playerId) ||
                         this.checkRoundEnd();
        
        if (shouldEnd) {
            this.endFlipThree(playerId);
        }
    }
    
    endFlipThree(playerId) {
        const player = this.players.find(p => p.id === playerId);
        const deferredActions = this.flipThreeActive.deferredActions;
        
        // Clear flip three state
        this.flipThreeActive = null;
        $(`#player-${playerId}`).removeClass('flip-three-active');
        
        // Process deferred actions only if player hasn't busted and round hasn't ended
        if (player.status === 'active' && !this.checkRoundEnd()) {
            deferredActions.forEach(action => {
                if (action.type === 'action_card') {
                    this.updatePlayerStatus(playerId, `Processing deferred ${action.card.value === 'freeze' ? 'Freeze' : 'Flip Three'} card...`);
                    setTimeout(() => {
                        this.handleActionCard(action.playerId, action.card);
                    }, 500);
                } else if (action.type === 'redistribute_second_chance') {
                    this.redistributeSecondChance(action.playerId, action.card);
                }
            });
        } else if (deferredActions.length > 0) {
            // If player busted or round ended, discard deferred action cards
            deferredActions.forEach(action => {
                if (action.type === 'action_card') {
                    this.discardPile.push(action.card);
                    // Remove the card from player's hand
                    const cardIndex = player.cards.findIndex(c => c.id === action.card.id);
                    if (cardIndex !== -1) {
                        player.cards.splice(cardIndex, 1);
                    }
                }
            });
            this.updateCardsRemaining();
            this.renderPlayerCards(playerId);
            this.updatePlayerStatus(playerId, 'Deferred action cards discarded due to bust/round end');
        }
    }
    
    checkFlip7(playerId) {
        const player = this.players.find(p => p.id === playerId);
        const numberCards = player.cards.filter(c => c.type === 'number');
        const uniqueValues = [...new Set(numberCards.map(c => c.value))];
        
        if (uniqueValues.length === 7 && player.status === 'active') {
            player.status = 'flip7';
            this.currentGameStats.flip7Achieved = true;
            this.updatePlayerStatus(playerId, 'FLIP 7! +15 Bonus! 🎉');
            return true;
        }
        return false;
    }
    
    stayPlayer() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        if (currentPlayer.status === 'active') {
            currentPlayer.status = 'stayed';
            this.updatePlayerStatus(currentPlayer.id, 'STAYED 🛑');
        }
        
        if (this.checkRoundEnd()) {
            this.endRound();
        } else {
            this.findNextActivePlayer();
            this.checkAITurn();
        }
        
        this.updateDisplay();
    }
    
    findNextActivePlayer() {
        let attempts = 0;
        while (attempts < this.players.length) {
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            const player = this.players[this.currentPlayerIndex];
            
            if (player.status === 'active') {
                break;
            }
            attempts++;
        }
        
        // If no active players found, end round
        if (attempts >= this.players.length) {
            this.endRound();
        }
    }
    
    checkRoundEnd() {
        const activePlayers = this.players.filter(p => p.status === 'active');
        const flip7Player = this.players.find(p => p.status === 'flip7');
        
        return activePlayers.length === 0 || flip7Player !== undefined;
    }
    
    endRound() {
        this.roundState = 'ended';
        
        // Calculate final scores for the round
        this.players.forEach(player => {
            if (player.status === 'busted') {
                player.score = 0;
            }
            player.totalScore += player.score;
            $(`#total-${player.id}`).text(player.totalScore);
        });
        
        // Start the round-end animation
        this.animateRoundEnd(() => {
            // Check if game should end after animation
            const winner = this.players.find(p => p.totalScore >= this.targetScore);
            if (winner) {
                this.endGame();
            } else {
                this.prepareNextRound();
            }
        });
        
        this.updateDisplay();
    }
    
    animateRoundEnd(callback) {
        // Hide action buttons during animation
        $('#action-buttons').html('<p class="text-blue-600 font-medium">Round ending...</p>');
        
        // Animate cards and points for each player
        let animationPromises = [];
        
        this.players.forEach((player, playerIndex) => {
            if (player.cards.length === 0) return;
            
            const playerPromise = new Promise((resolve) => {
                // Get player's card containers
                const modifierContainer = $(`#modifier-cards-${player.id}`);
                const numberContainer = $(`#number-cards-${player.id}`);
                
                // Animate cards flying away
                setTimeout(() => {
                    // Animate modifier cards
                    modifierContainer.children('.card').each((index, cardElement) => {
                        this.animateCardFlyAway(cardElement, index * 100);
                    });
                    
                    // Animate number cards
                    numberContainer.children('.card').each((index, cardElement) => {
                        this.animateCardFlyAway(cardElement, (index + modifierContainer.children().length) * 100);
                    });
                    
                    // Show flying points after a short delay
                    setTimeout(() => {
                        this.showFlyingPoints(player);
                        resolve();
                    }, 800);
                    
                }, playerIndex * 300); // Stagger players
            });
            
            animationPromises.push(playerPromise);
        });
        
        // Wait for all animations to complete, then execute callback
        Promise.all(animationPromises).then(() => {
            setTimeout(() => {
                if (callback) callback();
            }, 1000);
        });
    }
    
    animateCardFlyAway(cardElement, delay) {
        const card = $(cardElement);
        const cardRect = cardElement.getBoundingClientRect();
        
        // Create a flying copy of the card
        const flyingCard = card.clone();
        flyingCard.removeClass('card-appear');
        flyingCard.addClass('card-round-end');
        flyingCard.css({
            position: 'fixed',
            left: cardRect.left + 'px',
            top: cardRect.top + 'px',
            width: cardRect.width + 'px',
            height: cardRect.height + 'px',
            zIndex: 999
        });
        
        $('body').append(flyingCard);
        
        // Animate to center and fade out
        setTimeout(() => {
            const centerX = window.innerWidth / 2 - cardRect.width / 2;
            const centerY = window.innerHeight / 2 - cardRect.height / 2;
            
            flyingCard.css({
                left: centerX + 'px',
                top: centerY + 'px'
            });
            
            // Remove the flying card after animation
            setTimeout(() => {
                flyingCard.remove();
            }, 1500);
            
        }, delay);
        
        // Hide original card
        setTimeout(() => {
            card.css('opacity', '0.3');
        }, delay);
    }
    
    showFlyingPoints(player) {
        if (player.score === 0) return; // Don't show points for busted players
        
        // Get player area position
        const playerArea = $(`#player-${player.id}`);
        const playerRect = playerArea[0].getBoundingClientRect();
        
        // Create flying points element
        const pointsElement = $(`
            <div class="points-flying">
                +${player.score} points!
            </div>
        `);
        
        // Position at player area
        pointsElement.css({
            left: (playerRect.left + playerRect.width / 2 - 50) + 'px',
            top: (playerRect.top + playerRect.height / 2) + 'px'
        });
        
        $('body').append(pointsElement);
        
        // Remove after animation
        setTimeout(() => {
            pointsElement.remove();
        }, 2000);
    }
    
    prepareNextRound() {
        this.dealerIndex = (this.dealerIndex + 1) % this.players.length;
        this.round++;
        this.currentGameStats.rounds++;
        
        $('#turn-indicator').html(`
            <p class="font-medium text-green-600">
                <i class="fas fa-check-circle mr-2"></i>
                Round ${this.round - 1} Complete!
            </p>
            <button id="continue-round" class="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
                <i class="fas fa-arrow-right mr-2"></i>
                Start Round ${this.round}
            </button>
        `);
        
        $('#continue-round').on('click', () => this.startNewRound());
    }
    
    endGame() {
        this.gameState = 'gameEnd';
        
        // Finalize game statistics
        this.currentGameStats.endTime = Date.now();
        this.currentGameStats.rounds = this.round - 1;
        
        // Sort players by total score
        const sortedPlayers = [...this.players].sort((a, b) => b.totalScore - a.totalScore);
        if (sortedPlayers.length > 0) {
            this.currentGameStats.winner = sortedPlayers[0].id;
        }
        
        // Update statistics
        this.updateStatistics(this.currentGameStats);
        
        $('#game-screen').addClass('hidden');
        $('#score-screen').removeClass('hidden');
        
        const scoresContainer = $('#final-scores');
        scoresContainer.empty();
        
        sortedPlayers.forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
            scoresContainer.append(`
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span class="font-medium">${medal} ${player.name}</span>
                    <span class="font-bold text-lg">${player.totalScore} points</span>
                </div>
            `);
        });
    }
    
    updateDisplay() {
        // Update current turn indicator
        if (this.roundState === 'playing') {
            const currentPlayer = this.players[this.currentPlayerIndex];
            $('#current-turn-player, #current-turn-player-mobile').text(currentPlayer.name);
            
            // Ensure action-buttons container exists (it might have been replaced by round complete screen)
            if ($('#action-buttons').length === 0) {
                $('#turn-indicator').html('<div id="action-buttons" class="space-x-2"></div>');
            }
            
            if (currentPlayer.isAI) {
                // AI player - show thinking message
                if (this.flipThreeActive && this.flipThreeActive.playerId === currentPlayer.id) {
                    $('#action-buttons').html(`
                        <p class="text-red-600 font-medium">🤖 AI must flip ${this.flipThreeActive.cardsLeft} more cards</p>
                        <p class="text-sm text-gray-600 mt-1">AI is thinking...</p>
                    `);
                } else if (currentPlayer.status === 'active') {
                    $('#action-buttons').html(`
                        <p class="text-blue-600 font-medium">
                            <i class="fas fa-robot mr-2"></i>
                            AI is deciding...
                        </p>
                        <div class="mt-2 flex justify-center">
                            <div class="animate-pulse bg-blue-500 rounded-full h-2 w-2 mr-1"></div>
                            <div class="animate-pulse bg-blue-500 rounded-full h-2 w-2 mr-1 delay-75"></div>
                            <div class="animate-pulse bg-blue-500 rounded-full h-2 w-2 delay-150"></div>
                        </div>
                    `);
                }
            } else {
                // Human player - show action buttons
                if (this.flipThreeActive && this.flipThreeActive.playerId === currentPlayer.id) {
                    $('#action-buttons').html(`
                        <p class="text-red-600 font-medium">
                            <i class="fas fa-exclamation-triangle mr-2"></i>
                            Must flip ${this.flipThreeActive.cardsLeft} more cards
                        </p>
                        <button id="flip-three-continue" class="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors">
                            <i class="fas fa-arrow-down mr-2"></i>
                            Draw Card
                        </button>
                    `);
                    $('#flip-three-continue').on('click', () => this.hitPlayer());
                } else if (currentPlayer.status === 'active') {
                    $('#action-buttons').html(`
                        <button id="hit-button" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
                            <i class="fas fa-hand-point-up mr-2"></i>
                            Hit
                        </button>
                        <button id="stay-button" class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md font-medium transition-colors">
                            <i class="fas fa-hand-paper mr-2"></i>
                            Stay
                        </button>
                    `);
                    $('#hit-button').on('click', () => this.hitPlayer());
                    $('#stay-button').on('click', () => this.stayPlayer());
                }
            }
        }
        
        // Update player areas
        this.players.forEach(player => {
            this.updatePlayerStatus(player.id, this.getPlayerStatusText(player));
        });
        
        // Update visual states for all player areas
        this.updatePlayerAreaVisuals();
    }
    
    getPlayerStatusText(player) {
        switch (player.status) {
            case 'active':
                return 'Active 🎮';
            case 'busted':
                return 'BUSTED! 💥';
            case 'stayed':
                return 'STAYED 🛑';
            case 'flip7':
                return 'FLIP 7! +15 Bonus! 🎉';
            default:
                return '';
        }
    }
    
    dealCard() {
        if (this.roundState === 'playing') {
            this.hitPlayer();
        }
    }
    
    closeActionModal() {
        $('#action-modal').addClass('hidden');
    }
    
    closeCardTracker() {
        $('#card-tracker-modal').addClass('hidden');
    }
    
    showCardTracker(type) {
        const modal = $('#card-tracker-modal');
        const title = $('#tracker-title');
        const content = $('#tracker-content');
        
        if (type === 'deck') {
            title.text('Cards Remaining in Deck');
            content.html(this.generateDeckBreakdown());
        } else if (type === 'discard') {
            title.text('Used Cards in Discard Pile');
            content.html(this.generateDiscardBreakdown());
        }
        
        modal.removeClass('hidden');
    }
    
    generateDeckBreakdown() {
        const cardCounts = {};
        
        // Count each card type in deck
        this.deck.forEach(card => {
            const key = `${card.type}_${card.value}`;
            cardCounts[key] = (cardCounts[key] || 0) + 1;
        });
        
        // Generate HTML breakdown
        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        
        // Number Cards
        html += '<div><h4 class="font-bold text-green-600 mb-2">Number Cards</h4><div class="space-y-1">';
        for (let i = 0; i <= 12; i++) {
            const count = cardCounts[`number_${i}`] || 0;
            const total = i === 0 || i === 1 ? 1 : i;
            html += `<div class="flex justify-between text-sm">
                <span>${i}:</span>
                <span class="${count === 0 ? 'text-red-500' : ''}">${count}/${total}</span>
            </div>`;
        }
        html += '</div></div>';
        
        // Action Cards
        html += '<div><h4 class="font-bold text-orange-600 mb-2">Action Cards</h4><div class="space-y-1">';
        const actionCards = ['freeze', 'flip_three', 'second_chance'];
        const actionNames = {
            'freeze': 'Freeze',
            'flip_three': 'Flip Three',
            'second_chance': 'Second Chance'
        };
        actionCards.forEach(action => {
            const count = cardCounts[`action_${action}`] || 0;
            html += `<div class="flex justify-between text-sm">
                <span>${actionNames[action]}:</span>
                <span class="${count === 0 ? 'text-red-500' : ''}">${count}/3</span>
            </div>`;
        });
        html += '</div></div>';
        
        // Modifier Cards
        html += '<div><h4 class="font-bold text-blue-600 mb-2">Modifier Cards</h4><div class="space-y-1">';
        const modifiers = ['+2', '+4', '+6', '+8', '+10', 'x2'];
        modifiers.forEach(mod => {
            const count = cardCounts[`modifier_${mod}`] || 0;
            html += `<div class="flex justify-between text-sm">
                <span>${mod}:</span>
                <span class="${count === 0 ? 'text-red-500' : ''}">${count}/1</span>
            </div>`;
        });
        html += '</div></div>';
        
        html += '</div>';
        html += `<div class="mt-4 text-center text-lg font-bold">Total: ${this.deck.length} cards</div>`;
        
        return html;
    }
    
    generateDiscardBreakdown() {
        if (this.discardPile.length === 0) {
            return '<p class="text-center text-gray-500">No cards have been discarded yet.</p>';
        }
        
        const cardCounts = {};
        
        // Count each card type in discard pile
        this.discardPile.forEach(card => {
            const key = `${card.type}_${card.value}`;
            cardCounts[key] = (cardCounts[key] || 0) + 1;
        });
        
        // Generate HTML breakdown
        let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
        
        // Number Cards
        html += '<div><h4 class="font-bold text-green-600 mb-2">Number Cards</h4><div class="space-y-1">';
        for (let i = 0; i <= 12; i++) {
            const count = cardCounts[`number_${i}`] || 0;
            if (count > 0) {
                html += `<div class="flex justify-between text-sm">
                    <span>${i}:</span>
                    <span>${count}</span>
                </div>`;
            }
        }
        html += '</div></div>';
        
        // Action Cards
        html += '<div><h4 class="font-bold text-orange-600 mb-2">Action Cards</h4><div class="space-y-1">';
        const actionCards = ['freeze', 'flip_three', 'second_chance'];
        const actionNames = {
            'freeze': 'Freeze',
            'flip_three': 'Flip Three',
            'second_chance': 'Second Chance'
        };
        actionCards.forEach(action => {
            const count = cardCounts[`action_${action}`] || 0;
            if (count > 0) {
                html += `<div class="flex justify-between text-sm">
                    <span>${actionNames[action]}:</span>
                    <span>${count}</span>
                </div>`;
            }
        });
        html += '</div></div>';
        
        // Modifier Cards
        html += '<div><h4 class="font-bold text-blue-600 mb-2">Modifier Cards</h4><div class="space-y-1">';
        const modifiers = ['+2', '+4', '+6', '+8', '+10', 'x2'];
        modifiers.forEach(mod => {
            const count = cardCounts[`modifier_${mod}`] || 0;
            if (count > 0) {
                html += `<div class="flex justify-between text-sm">
                    <span>${mod}:</span>
                    <span>${count}</span>
                </div>`;
            }
        });
        html += '</div></div>';
        
        html += '</div>';
        html += `<div class="mt-4 text-center text-lg font-bold">Total: ${this.discardPile.length} cards</div>`;
        
        return html;
    }
    
    showStatistics() {
        const stats = this.getStats();
        const content = $('#stats-content');
        
        const formatTime = (ms) => {
            if (!ms) return 'N/A';
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        };
        
        const formatDate = (timestamp) => {
            return timestamp ? new Date(timestamp).toLocaleDateString() : 'Never';
        };
        
        content.html(`
            <div class="space-y-4 text-base">
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-gamepad mr-2 text-blue-500"></i>
                        Games Played:
                    </span>
                    <span class="font-bold text-lg">${stats.gamesPlayed}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-trophy mr-2 text-yellow-500"></i>
                        Games Won:
                    </span>
                    <span class="font-bold text-lg">${stats.gamesWon}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-percentage mr-2 text-green-500"></i>
                        Win Rate:
                    </span>
                    <span class="font-bold text-lg">${stats.gamesPlayed > 0 ? Math.round(stats.gamesWon / stats.gamesPlayed * 100) : 0}%</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-circle-notch mr-2 text-purple-500"></i>
                        Average Rounds:
                    </span>
                    <span class="font-bold text-lg">${stats.averageRounds}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-magic mr-2 text-pink-500"></i>
                        Flip 7 Achievements:
                    </span>
                    <span class="font-bold text-lg">${stats.flip7Achievements}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-star mr-2 text-orange-500"></i>
                        Highest Score:
                    </span>
                    <span class="font-bold text-lg">${stats.highestScore}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-clock mr-2 text-red-500"></i>
                        Longest Game:
                    </span>
                    <span class="font-bold text-lg">${formatTime(stats.longestGame)}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-gray-200">
                    <span class="text-gray-600">
                        <i class="fas fa-stopwatch mr-2 text-teal-500"></i>
                        Shortest Game:
                    </span>
                    <span class="font-bold text-lg">${formatTime(stats.shortestGame)}</span>
                </div>
                <div class="flex justify-between items-center py-2">
                    <span class="text-gray-600">
                        <i class="fas fa-calendar mr-2 text-indigo-500"></i>
                        Last Played:
                    </span>
                    <span class="font-bold text-lg">${formatDate(stats.lastPlayed)}</span>
                </div>
            </div>
        `);
        
        $('#stats-modal').removeClass('hidden');
    }
    
    closeStatsModal() {
        $('#stats-modal').addClass('hidden');
    }
    
    resetStatistics() {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            localStorage.removeItem('flip7-stats');
            this.closeStatsModal();
            alert('Statistics have been reset.');
        }
    }
    
    showRules() {
        $('#rules-modal').removeClass('hidden');
    }
    
    closeRulesModal() {
        $('#rules-modal').addClass('hidden');
    }
    
    resetGame() {
        this.gameState = 'setup';
        $('#game-screen').addClass('hidden');
        $('#score-screen').addClass('hidden');
        $('#setup-screen').removeClass('hidden');
        
        // Reset all game state
        this.players = [];
        this.currentPlayerIndex = 0;
        this.dealerIndex = 0;
        this.round = 1;
        this.deck = [];
        this.discardPile = [];
        this.flipThreeActive = null;
        this.extraActionCards = [];
        this.currentGameStats = {
            startTime: null,
            endTime: null,
            winner: null,
            rounds: 0,
            flip7Achieved: false
        };
    }
}

// Initialize the game when the page loads
$(document).ready(() => {
    window.game = new Flip7Game();
});