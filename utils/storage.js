/**
 * Storage utilities for the Flip7 card game
 * Handles localStorage operations for game configuration, statistics, and user preferences
 */
class StorageManager {
    constructor() {
        this.statsKey = 'flip7-stats';
        this.configKey = 'flip7-config';
        this.themeKey = 'flip7-theme';
        this.soundKey = 'flip7-sound';
    }

    // Statistics management
    getStats() {
        try {
            const saved = localStorage.getItem(this.statsKey);
            if (!saved) return this.getDefaultStats();
            
            const stats = JSON.parse(saved);
            // Ensure all required properties exist with defaults
            return {
                ...this.getDefaultStats(),
                ...stats
            };
        } catch (e) {
            console.log('Error loading stats:', e);
            return this.getDefaultStats();
        }
    }

    saveStats(stats) {
        try {
            localStorage.setItem(this.statsKey, JSON.stringify(stats));
        } catch (e) {
            console.log('Error saving stats:', e);
        }
    }

    getDefaultStats() {
        return {
            gamesPlayed: 0,
            gamesWon: 0,
            totalPoints: 0,
            highestScore: 0,
            roundsPlayed: 0,
            cardsBusted: 0,
            flip7Count: 0,
            averageScore: 0,
            longestWinStreak: 0,
            currentWinStreak: 0,
            totalPlayTime: 0,
            averageGameTime: 0,
            favoriteTarget: 200,
            lastPlayed: null
        };
    }

    resetStats() {
        try {
            localStorage.removeItem(this.statsKey);
            return this.getDefaultStats();
        } catch (e) {
            console.log('Error resetting stats:', e);
            return this.getDefaultStats();
        }
    }

    // Game configuration management
    getGameConfig() {
        try {
            const saved = localStorage.getItem(this.configKey);
            if (!saved) return this.getDefaultConfig();
            
            const config = JSON.parse(saved);
            return {
                ...this.getDefaultConfig(),
                ...config
            };
        } catch (e) {
            console.log('Error loading config:', e);
            return this.getDefaultConfig();
        }
    }

    saveGameConfig(config) {
        try {
            localStorage.setItem(this.configKey, JSON.stringify(config));
        } catch (e) {
            console.log('Error saving config:', e);
        }
    }

    getDefaultConfig() {
        return {
            playerCount: 2,
            targetScore: 200,
            playerNames: ['Player 1', 'Player 2', 'AI Bot 1', 'AI Bot 2'],
            soundEnabled: true,
            theme: 'light'
        };
    }

    // Theme management
    getTheme() {
        try {
            return localStorage.getItem(this.themeKey) || 'light';
        } catch (e) {
            console.log('Error loading theme:', e);
            return 'light';
        }
    }

    saveTheme(theme) {
        try {
            localStorage.setItem(this.themeKey, theme);
        } catch (e) {
            console.log('Error saving theme:', e);
        }
    }

    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.saveTheme(newTheme);
        this.applyTheme(newTheme);
        return newTheme;
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }

    initializeTheme() {
        const savedTheme = this.getTheme();
        this.applyTheme(savedTheme);
        return savedTheme;
    }

    // Sound preference management
    getSoundEnabled() {
        try {
            const saved = localStorage.getItem(this.soundKey);
            return saved !== 'false'; // Default to true
        } catch (e) {
            console.log('Error loading sound preference:', e);
            return true;
        }
    }

    setSoundEnabled(enabled) {
        try {
            localStorage.setItem(this.soundKey, enabled.toString());
        } catch (e) {
            console.log('Error saving sound preference:', e);
        }
    }

    // Utility methods
    clearAllData() {
        try {
            localStorage.removeItem(this.statsKey);
            localStorage.removeItem(this.configKey);
            localStorage.removeItem(this.themeKey);
            localStorage.removeItem(this.soundKey);
        } catch (e) {
            console.log('Error clearing data:', e);
        }
    }

    exportData() {
        try {
            const data = {
                stats: this.getStats(),
                config: this.getGameConfig(),
                theme: this.getTheme(),
                soundEnabled: this.getSoundEnabled(),
                exportDate: new Date().toISOString()
            };
            return JSON.stringify(data, null, 2);
        } catch (e) {
            console.log('Error exporting data:', e);
            return null;
        }
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.stats) this.saveStats(data.stats);
            if (data.config) this.saveGameConfig(data.config);
            if (data.theme) this.saveTheme(data.theme);
            if (typeof data.soundEnabled === 'boolean') this.setSoundEnabled(data.soundEnabled);
            
            return true;
        } catch (e) {
            console.log('Error importing data:', e);
            return false;
        }
    }
}

// Export for use in game.js
window.StorageManager = StorageManager;