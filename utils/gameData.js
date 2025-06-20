/**
 * Game data constants and deck composition for Flip7 card game
 * Contains all card definitions, deck composition, and game constants
 */
class GameData {
    constructor() {
        // Card type definitions
        this.CARD_TYPES = {
            NUMBER: 'number',
            ACTION: 'action',
            MODIFIER: 'modifier'
        };

        // Player status constants
        this.PLAYER_STATUS = {
            ACTIVE: 'active',
            BUSTED: 'busted',
            STAYED: 'stayed',
            FLIP7: 'flip7',
            FROZEN: 'frozen'
        };

        // Game state constants
        this.GAME_STATES = {
            SETUP: 'setup',
            PLAYING: 'playing',
            ROUND_END: 'round_end',
            GAME_END: 'game_end'
        };

        // Round state constants
        this.ROUND_STATES = {
            SETUP: 'setup',
            PLAYING: 'playing',
            ENDING: 'ending',
            ENDED: 'ended'
        };

        // Action card types
        this.ACTION_CARDS = {
            FREEZE: 'freeze',
            FLIP_THREE: 'flip_three',
            SECOND_CHANCE: 'second_chance'
        };

        // Modifier card types
        this.MODIFIER_CARDS = {
            PLUS_5: '+5',
            PLUS_10: '+10',
            MULTIPLY_2: 'x2'
        };
    }

    // Deck composition: number cards (value: count)
    getNumberCards() {
        return {
            0: 4,  // 4 cards with value 0
            1: 4,  // 4 cards with value 1
            2: 4,  // 4 cards with value 2
            3: 4,  // 4 cards with value 3
            4: 4,  // 4 cards with value 4
            5: 4,  // 4 cards with value 5
            6: 4,  // 4 cards with value 6
            7: 4,  // 4 cards with value 7
            8: 4,  // 4 cards with value 8
            9: 4,  // 4 cards with value 9
            10: 4, // 4 cards with value 10
            11: 4, // 4 cards with value 11
            12: 4  // 4 cards with value 12
        };
    }

    // Action cards in deck (type: count)
    getActionCards() {
        return {
            [this.ACTION_CARDS.FREEZE]: 4,
            [this.ACTION_CARDS.FLIP_THREE]: 4,
            [this.ACTION_CARDS.SECOND_CHANCE]: 4
        };
    }

    // Modifier cards in deck (type: count)
    getModifierCards() {
        return {
            [this.MODIFIER_CARDS.PLUS_5]: 4,
            [this.MODIFIER_CARDS.PLUS_10]: 4,
            [this.MODIFIER_CARDS.MULTIPLY_2]: 4
        };
    }

    // Action card images mapping
    getActionImages() {
        return {
            [this.ACTION_CARDS.FREEZE]: 'freeze.png',
            [this.ACTION_CARDS.FLIP_THREE]: 'flip_three.png',
            [this.ACTION_CARDS.SECOND_CHANCE]: 'second_chance.png'
        };
    }

    // Default player names
    getFancyNames() {
        return [
            'Alexandra', 'Benjamin', 'Charlotte', 'Dominic',
            'Eleanor', 'Frederick', 'Gabrielle', 'Harrison',
            'Isabella', 'Jonathan', 'Katherine', 'Leonardo',
            'Miranda', 'Nathaniel', 'Ophelia', 'Percival',
            'Quintessa', 'Reginald', 'Seraphina', 'Theodore',
            'Ursula', 'Valentine', 'Wellington', 'Ximena',
            'Yolanda', 'Zachary', 'Arabella', 'Bartholomew',
            'Cordelia', 'Demetrius', 'Evangeline', 'Fitzpatrick'
        ];
    }

    // Game configuration defaults
    getDefaultGameConfig() {
        return {
            minPlayers: 2,
            maxPlayers: 4,
            defaultPlayerCount: 2,
            defaultTargetScore: 200,
            targetScoreOptions: [100, 150, 200, 250, 300, 500],
            maxCardsInHand: 15,
            bustThreshold: 21, // Players bust if they go over this during Flip Three
            flip7Bonus: 15
        };
    }

    // Log entry types and their styling
    getLogTypes() {
        return {
            draw: { color: 'text-blue-600', icon: 'fas fa-arrow-down' },
            action: { color: 'text-orange-600', icon: 'fas fa-bolt' },
            bust: { color: 'text-red-600', icon: 'fas fa-skull-crossbones' },
            stay: { color: 'text-indigo-600', icon: 'fas fa-hand-paper' },
            round: { color: 'text-purple-600', icon: 'fas fa-flag-checkered' },
            flip7: { color: 'text-green-600', icon: 'fas fa-star' },
            score: { color: 'text-gray-600', icon: 'fas fa-calculator' },
            transfer: { color: 'text-yellow-600', icon: 'fas fa-exchange-alt' },
            freeze: { color: 'text-cyan-600', icon: 'fas fa-snowflake' },
            system: { color: 'text-gray-500', icon: 'fas fa-cog' }
        };
    }

    // Card styling classes
    getCardStyles() {
        return {
            [this.CARD_TYPES.NUMBER]: 'number-card',
            [this.CARD_TYPES.ACTION]: 'action-card',
            [this.CARD_TYPES.MODIFIER]: 'modifier-card'
        };
    }

    // Create a complete deck based on composition
    createDeck() {
        const deck = [];
        let cardId = 1;

        // Add number cards
        const numberCards = this.getNumberCards();
        for (const [value, count] of Object.entries(numberCards)) {
            for (let i = 0; i < count; i++) {
                deck.push({
                    id: cardId++,
                    type: this.CARD_TYPES.NUMBER,
                    value: parseInt(value),
                    display: value
                });
            }
        }

        // Add action cards
        const actionCards = this.getActionCards();
        for (const [type, count] of Object.entries(actionCards)) {
            for (let i = 0; i < count; i++) {
                deck.push({
                    id: cardId++,
                    type: this.CARD_TYPES.ACTION,
                    value: type,
                    display: this.formatActionCardDisplay(type)
                });
            }
        }

        // Add modifier cards
        const modifierCards = this.getModifierCards();
        for (const [type, count] of Object.entries(modifierCards)) {
            for (let i = 0; i < count; i++) {
                deck.push({
                    id: cardId++,
                    type: this.CARD_TYPES.MODIFIER,
                    value: type,
                    display: type
                });
            }
        }

        return deck;
    }

    // Format action card display names
    formatActionCardDisplay(actionType) {
        const displayNames = {
            [this.ACTION_CARDS.FREEZE]: 'Freeze',
            [this.ACTION_CARDS.FLIP_THREE]: 'Flip 3',
            [this.ACTION_CARDS.SECOND_CHANCE]: '2nd Chance'
        };
        return displayNames[actionType] || actionType;
    }

    // Get total deck size
    getTotalDeckSize() {
        const numberCount = Object.values(this.getNumberCards()).reduce((sum, count) => sum + count, 0);
        const actionCount = Object.values(this.getActionCards()).reduce((sum, count) => sum + count, 0);
        const modifierCount = Object.values(this.getModifierCards()).reduce((sum, count) => sum + count, 0);
        return numberCount + actionCount + modifierCount;
    }

    // Validate card
    isValidCard(card) {
        if (!card || typeof card !== 'object') return false;
        if (!card.id || !card.type || card.value === undefined) return false;
        
        const validTypes = Object.values(this.CARD_TYPES);
        return validTypes.includes(card.type);
    }

    // Check if card is action card
    isActionCard(card) {
        return card && card.type === this.CARD_TYPES.ACTION;
    }

    // Check if card is modifier card
    isModifierCard(card) {
        return card && card.type === this.CARD_TYPES.MODIFIER;
    }

    // Check if card is number card
    isNumberCard(card) {
        return card && card.type === this.CARD_TYPES.NUMBER;
    }

    // Get card color based on type
    getCardColor(card) {
        const colors = {
            [this.CARD_TYPES.NUMBER]: '#319795',
            [this.CARD_TYPES.ACTION]: '#ed8936',
            [this.CARD_TYPES.MODIFIER]: '#3182ce'
        };
        return colors[card.type] || '#666';
    }
}

// Export for use in game.js
window.GameData = GameData;