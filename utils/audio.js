/**
 * Audio utilities for the Flip7 card game
 * Handles sound initialization, playback, and user preferences
 */
class AudioManager {
    constructor() {
        this.soundEnabled = localStorage.getItem('flip7-sound') !== 'false';
        this.sounds = {};
        this.initializeSounds();
    }

    initializeSounds() {
        try {
            this.sounds = {
                cardFlip: new Audio('assets/card-flip.mp3'),
                cardPlace: new Audio('assets/card-place.mp3'),
                bust: new Audio('assets/bust.mp3'),
                action: new Audio('assets/action.mp3'),
                roundEnd: new Audio('assets/round-end.mp3'),
                win: new Audio('assets/win.mp3'),
                lose: new Audio('assets/lose.mp3')
            };

            // Set volume for all sounds
            Object.values(this.sounds).forEach(audio => {
                audio.volume = 0.5;
                audio.preload = 'auto';
            });
        } catch (e) {
            console.log('Audio initialization error:', e);
        }
    }

    playSound(soundName) {
        if (!this.soundEnabled || !this.sounds[soundName]) return;
        
        try {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(e => {
                console.log('Audio playback error:', e);
            });
        } catch (e) {
            console.log('Audio error:', e);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('flip7-sound', this.soundEnabled);
        this.updateSoundToggleUI();
    }

    updateSoundToggleUI() {
        const soundButtons = ['#sound-toggle', '#sound-toggle-desktop'];
        soundButtons.forEach(selector => {
            const button = $(selector);
            if (button.length) {
                const icon = button.find('i');
                if (this.soundEnabled) {
                    icon.removeClass('fa-volume-mute').addClass('fa-volume-up');
                    button.attr('title', 'Disable sound');
                } else {
                    icon.removeClass('fa-volume-up').addClass('fa-volume-mute');
                    button.attr('title', 'Enable sound');
                }
            }
        });
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('flip7-sound', enabled);
        this.updateSoundToggleUI();
    }

    isSoundEnabled() {
        return this.soundEnabled;
    }
}

// Export for use in game.js
window.AudioManager = AudioManager;