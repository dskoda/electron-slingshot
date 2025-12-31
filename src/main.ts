/**
 * Main entry point - initializes the game and connects UI
 */

import { Game } from './engine/Game';
import { GameState, LevelDefinition } from './types';
import { DEBUG_MODE } from './config';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  // Initialize game
  const game = new Game(canvas);

  // Get UI elements
  const levelNumberEl = document.getElementById('level-number') as HTMLElement;
  const levelTitleEl = document.getElementById('level-title') as HTMLElement;
  const levelSelectorEl = document.getElementById('level-selector') as HTMLSelectElement;
  const aimInfoEl = document.getElementById('aim-info') as HTMLElement;
  const triesCountEl = document.getElementById('tries-count') as HTMLElement;
  const messageOverlay = document.getElementById('message-overlay') as HTMLElement;
  const messageText = document.getElementById('message-text') as HTMLElement;
  const messageSubtext = document.getElementById('message-subtext') as HTMLElement;
  const messageBtn = document.getElementById('message-btn') as HTMLButtonElement;
  const screenshotBtn = document.getElementById('screenshot-btn') as HTMLButtonElement;
  const toggleFieldBtn = document.getElementById('toggle-field') as HTMLButtonElement;
  const togglePreviewBtn = document.getElementById('toggle-preview') as HTMLButtonElement;
  const hintBtn = document.getElementById('hint-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('reset-btn') as HTMLButtonElement;

  // Hide helper buttons initially (unless DEBUG_MODE is on)
  if (!DEBUG_MODE) {
    toggleFieldBtn.style.display = 'none';
    togglePreviewBtn.style.display = 'none';
  }

  // Update button visibility based on tries
  function updateHelperButtonVisibility(tries: number): void {
    if (DEBUG_MODE) {
      // Always show buttons in debug mode
      toggleFieldBtn.style.display = '';
      togglePreviewBtn.style.display = '';
    } else {
      toggleFieldBtn.style.display = tries >= 5 ? '' : 'none';
      togglePreviewBtn.style.display = tries >= 30 ? '' : 'none';
    }
  }

  // Update UI when level changes
  game.onLevelChanged((level: LevelDefinition) => {
    levelNumberEl.textContent = String(level.id);
    levelTitleEl.textContent = level.name;
    levelSelectorEl.value = String(level.id);
    
    // Hide message overlay
    messageOverlay.classList.remove('visible', 'win', 'fail');
    
    // Reset tries display and hide helper buttons
    triesCountEl.textContent = '0';
    updateHelperButtonVisibility(0);
  });

  // Update UI when aiming
  game.onAimChanged((speedPercent: number, angleDegrees: number) => {
    if (speedPercent > 0) {
      aimInfoEl.textContent = `Speed: ${speedPercent}% | Angle: ${angleDegrees}°`;
    } else {
      aimInfoEl.textContent = `Speed: --% | Angle: --°`;
    }
  });

  // Update UI when tries change
  game.onTriesChanged((tries: number) => {
    triesCountEl.textContent = String(tries);
    updateHelperButtonVisibility(tries);
  });

  // Update UI when state changes
  game.onStateChanged((state: GameState, message?: string) => {
    if (state === 'win') {
      messageOverlay.classList.add('visible', 'win');
      messageOverlay.classList.remove('fail');
      messageText.textContent = '🎉 Level Complete!';
      
      const currentLevel = game.getCurrentLevelIndex();
      const totalLevels = game.getTotalLevels();
      
      if (currentLevel < totalLevels) {
        messageSubtext.textContent = game.getCurrentLevel().learningObjective;
        messageBtn.textContent = 'Next Level →';
        messageBtn.onclick = () => {
          game.nextLevel();
        };
      } else {
        messageSubtext.textContent = 'Congratulations! You\'ve mastered electrostatics!';
        messageBtn.textContent = 'Play Again';
        messageBtn.onclick = () => {
          game.loadLevel(1);
        };
      }
    } else if (state === 'fail') {
      messageOverlay.classList.add('visible', 'fail');
      messageOverlay.classList.remove('win');
      messageText.textContent = '💥 Out of Shots!';
      messageSubtext.textContent = message || 'Try again!';
      messageBtn.textContent = 'Retry Level';
      messageBtn.onclick = () => {
        game.resetLevel();
      };
    } else {
      messageOverlay.classList.remove('visible', 'win', 'fail');
    }
  });

  // Toggle field visualization
  toggleFieldBtn.addEventListener('click', () => {
    const isOn = game.toggleFieldVectors();
    toggleFieldBtn.classList.toggle('active', isOn);
  });

  // Toggle trajectory preview
  togglePreviewBtn.addEventListener('click', () => {
    const isOn = game.toggleTrajectoryPreview();
    togglePreviewBtn.classList.toggle('active', isOn);
  });

  // Screenshot button
  screenshotBtn.addEventListener('click', () => {
    // Hide the message overlay temporarily for a clean screenshot
    messageOverlay.style.display = 'none';
    
    // Wait a frame for the overlay to hide, then capture
    requestAnimationFrame(() => {
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a download link
      const link = document.createElement('a');
      const level = game.getCurrentLevel();
      link.download = `electron-slingshot-level-${level.id}-${level.name.replace(/\s+/g, '-')}.png`;
      link.href = dataUrl;
      link.click();
      
      // Show the overlay again
      messageOverlay.style.display = '';
    });
  });

  // Hint button
  hintBtn.addEventListener('click', () => {
    const level = game.getCurrentLevel();
    alert(`💡 Hint for "${level.name}":\n\n${level.hint}\n\n📚 Learning: ${level.learningObjective}`);
  });

  // Reset button
  resetBtn.addEventListener('click', () => {
    game.resetLevel();
  });

  // Level selector
  levelSelectorEl.addEventListener('change', () => {
    const levelId = parseInt(levelSelectorEl.value, 10);
    game.loadLevel(levelId);
  });

  // Initialize UI with first level
  const initialLevel = game.getCurrentLevel();
  levelNumberEl.textContent = String(initialLevel.id);
  levelTitleEl.textContent = initialLevel.name;

  // Start the game
  game.start();

  console.log('Electron Slingshot initialized!');
  console.log('Click and drag anywhere to shoot.');
});
