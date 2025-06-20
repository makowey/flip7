/**
 * DOM utilities for the Flip7 card game
 * Handles DOM manipulation, element creation, and UI updates
 */
class DOMUtils {
    constructor(gameData) {
        this.gameData = gameData;
    }

    // Create a card DOM element
    createCardElement(card) {
        const cardClass = this.gameData.getCardStyles()[card.type] || '';
        const cardColor = this.gameData.getCardColor(card);
        
        const cardElement = $(`
            <div class="card ${cardClass} card-appear" 
                 data-card-id="${card.id}"
                 data-card-type="${card.type}"
                 data-card-value="${card.value}"
                 style="border-color: ${cardColor}">
                ${this.getCardContent(card)}
            </div>
        `);

        // Add click handler for action cards
        if (this.gameData.isActionCard(card)) {
            cardElement.addClass('cursor-pointer');
        }

        return cardElement;
    }

    // Get card content HTML based on type
    getCardContent(card) {
        if (card.type === 'action') {
            const actionImages = this.gameData.getActionImages();
            const imageName = actionImages[card.value];
            if (imageName) {
                return `
                    <div class="text-center">
                        <img src="assets/${imageName}" alt="${card.display}" class="w-8 h-8 mx-auto mb-1">
                        <div class="text-xs font-bold">${card.display}</div>
                    </div>
                `;
            }
        }
        
        return `<span class="font-bold text-lg">${card.display}</span>`;
    }

    // Format time duration
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Format date to readable string
    formatDate(timestamp) {
        if (!timestamp) return 'Never';
        
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    // Create player configuration inputs
    createPlayerInputs(playerCount, playerNames = []) {
        const container = $('#player-names');
        container.empty();
        
        for (let i = 0; i < playerCount; i++) {
            const playerDiv = $(`
                <div class="mb-3">
                    <label for="player-${i + 1}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Player ${i + 1} Name:
                    </label>
                    <input type="text" 
                           id="player-${i + 1}" 
                           class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" 
                           value="${playerNames[i] || `Player ${i + 1}`}"
                           placeholder="Enter player name"
                           maxlength="20">
                </div>
            `);
            container.append(playerDiv);
        }
    }

    // Create statistics breakdown HTML
    createStatsBreakdown(stats) {
        const winRate = stats.gamesPlayed > 0 ? ((stats.gamesWon / stats.gamesPlayed) * 100).toFixed(1) : 0;
        const avgScore = stats.gamesPlayed > 0 ? (stats.totalPoints / stats.gamesPlayed).toFixed(1) : 0;
        
        return `
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600 dark:text-blue-300">${stats.gamesPlayed}</div>
                    <div class="text-sm text-blue-800 dark:text-blue-200">Games Played</div>
                </div>
                <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-green-600 dark:text-green-300">${stats.gamesWon}</div>
                    <div class="text-sm text-green-800 dark:text-green-200">Games Won</div>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600 dark:text-purple-300">${winRate}%</div>
                    <div class="text-sm text-purple-800 dark:text-purple-200">Win Rate</div>
                </div>
                <div class="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600 dark:text-orange-300">${stats.highestScore}</div>
                    <div class="text-sm text-orange-800 dark:text-orange-200">Highest Score</div>
                </div>
            </div>
            
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Average Score:</span>
                    <span class="font-semibold">${avgScore}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Points:</span>
                    <span class="font-semibold">${stats.totalPoints.toLocaleString()}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Rounds Played:</span>
                    <span class="font-semibold">${stats.roundsPlayed}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Cards Busted:</span>
                    <span class="font-semibold">${stats.cardsBusted}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Flip 7 Achieved:</span>
                    <span class="font-semibold">${stats.flip7Count}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Longest Win Streak:</span>
                    <span class="font-semibold">${stats.longestWinStreak}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Current Win Streak:</span>
                    <span class="font-semibold">${stats.currentWinStreak}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Play Time:</span>
                    <span class="font-semibold">${this.formatTime(stats.totalPlayTime)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Average Game Time:</span>
                    <span class="font-semibold">${this.formatTime(stats.averageGameTime)}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Last Played:</span>
                    <span class="font-semibold">${this.formatDate(stats.lastPlayed)}</span>
                </div>
            </div>
        `;
    }

    // Create deck breakdown for card tracker
    createDeckBreakdown(cards) {
        const breakdown = { number: {}, action: {}, modifier: {} };
        
        cards.forEach(card => {
            if (card.type === 'number') {
                breakdown.number[card.value] = (breakdown.number[card.value] || 0) + 1;
            } else if (card.type === 'action') {
                breakdown.action[card.value] = (breakdown.action[card.value] || 0) + 1;
            } else if (card.type === 'modifier') {
                breakdown.modifier[card.value] = (breakdown.modifier[card.value] || 0) + 1;
            }
        });

        return `
            <div class="space-y-4">
                ${this.createCardTypeSection('Number Cards', breakdown.number, 'text-teal-600')}
                ${this.createCardTypeSection('Action Cards', breakdown.action, 'text-orange-600')}
                ${this.createCardTypeSection('Modifier Cards', breakdown.modifier, 'text-blue-600')}
            </div>
        `;
    }

    // Create card type section for breakdown
    createCardTypeSection(title, cards, colorClass) {
        if (Object.keys(cards).length === 0) {
            return `
                <div>
                    <h4 class="font-semibold ${colorClass} mb-2">${title}</h4>
                    <p class="text-gray-500 text-sm">None remaining</p>
                </div>
            `;
        }

        const cardItems = Object.entries(cards)
            .sort((a, b) => {
                // Sort numbers numerically, others alphabetically
                if (!isNaN(a[0]) && !isNaN(b[0])) {
                    return parseInt(a[0]) - parseInt(b[0]);
                }
                return a[0].localeCompare(b[0]);
            })
            .map(([value, count]) => `
                <span class="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-sm mr-2 mb-1">
                    ${value} (${count})
                </span>
            `).join('');

        return `
            <div>
                <h4 class="font-semibold ${colorClass} mb-2">${title}</h4>
                <div class="flex flex-wrap">${cardItems}</div>
            </div>
        `;
    }

    // Update cards remaining counter
    updateCardsRemaining(deckSize, discardSize) {
        $('#deck-count').text(deckSize);
        $('#discard-count').text(discardSize);
        $('#cards-remaining').text(deckSize);
    }

    // Show/hide loading indicator
    showLoading(message = 'Loading...') {
        const loader = $(`
            <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center space-x-3">
                    <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span class="text-gray-700 dark:text-gray-300">${message}</span>
                </div>
            </div>
        `);
        $('body').append(loader);
    }

    hideLoading() {
        $('#loading-overlay').remove();
    }

    // Show toast notification
    showToast(message, type = 'info', duration = 3000) {
        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500'
        };

        const toast = $(`
            <div class="fixed top-4 right-4 ${colors[type]} text-white px-4 py-2 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300">
                ${message}
            </div>
        `);

        $('body').append(toast);
        
        // Animate in
        setTimeout(() => toast.removeClass('translate-x-full'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.addClass('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for performance
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Smooth scroll to element
    scrollToElement(selector, offset = 0) {
        const element = $(selector);
        if (element.length) {
            $('html, body').animate({
                scrollTop: element.offset().top + offset
            }, 500);
        }
    }

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            console.log('Clipboard copy failed:', err);
            this.showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }
}

// Export for use in game.js
window.DOMUtils = DOMUtils;