import { Howl } from "howler";

class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.3;
    this.initializeSounds();
  }

  initializeSounds() {
    // Simple beep sounds for arcade feel
    this.sounds.dot = new Howl({
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocBTOGzvLZiTYIG2m98OScTgwOUarm8LRjHgU2jdXzzn0vBSF8xOzfkUEJFWS24eqsWRALTKHi8r5sHAU2hMn112kzBR+ByPDYiTcIGGi77eeeTgwNUKjj8LNjHgU3kNbyzHksBiR2xu/ekkAKFF2z6eyrVxQKRZ/g8r5rHAU0hM7y2Ik3CBhpvO3nnE4MDlGp4+y0Yx4FNo3V8859LwUgfMTs35BBCRVktuHqrVkQC0yh4vK+axwFNoTK8ddpMgU=",
      ],
      volume: this.volume,
      rate: 1.5,
    });

    this.sounds.powerDot = new Howl({
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocBTOGzvLZiTYIG2m98OScTgwOUarm8LRjHgU2jdXzzn0vBSF8xOzfkUEJFWS24eqsWRALTKHi8r5sHAU2hMn112kzBR+ByPDYiTcIGGi77eeeTgwNUKjj8LNjHgU3kNbyzHksBiR2xu/ekkAKFF2z6eyrVxQKRZ/g8r5rHAU0hM7y2Ik3CBhpvO3nnE4MDlGp4+y0Yx4FNo3V8859LwUgfMTs35BBCRVktuHqrVkQC0yh4vK+axwFNoTK8ddpMgU=",
      ],
      volume: this.volume,
      rate: 0.8,
    });

    this.sounds.move = new Howl({
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocBTOGzvLZiTYIG2m98OScTgwOUarm8LRjHgU2jdXzzn0vBSF8xOzfkUEJFWS24eqsWRALTKHi8r5sHAU2hMn112kzBR+ByPDYiTcIGGi77eeeTgwNUKjj8LNjHgU3kNbyzHksBiR2xu/ekkAKFF2z6eyrVxQKRZ/g8r5rHAU0hM7y2Ik3CBhpvO3nnE4MDlGp4+y0Yx4FNo3V8859LwUgfMTs35BBCRVktuHqrVkQC0yh4vK+axwFNoTK8ddpMgU=",
      ],
      volume: this.volume * 0.3,
      rate: 2.0,
    });

    this.sounds.death = new Howl({
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocBTOGzvLZiTYIG2m98OScTgwOUarm8LRjHgU2jdXzzn0vBSF8xOzfkUEJFWS24eqsWRALTKHi8r5sHAU2hMn112kzBR+ByPDYiTcIGGi77eeeTgwNUKjj8LNjHgU3kNbyzHksBiR2xu/ekkAKFF2z6eyrVxQKRZ/g8r5rHAU0hM7y2Ik3CBhpvO3nnE4MDlGp4+y0Yx4FNo3V8859LwUgfMTs35BBCRVktuHqrVkQC0yh4vK+axwFNoTK8ddpMgU=",
      ],
      volume: this.volume,
      rate: 0.5,
    });

    this.sounds.levelComplete = new Howl({
      src: [
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmocBTOGzvLZiTYIG2m98OScTgwOUarm8LRjHgU2jdXzzn0vBSF8xOzfkUEJFWS24eqsWRALTKHi8r5sHAU2hMn112kzBR+ByPDYiTcIGGi77eeeTgwNUKjj8LNjHgU3kNbyzHksBiR2xu/ekkAKFF2z6eyrVxQKRZ/g8r5rHAU0hM7y2Ik3CBhpvO3nnE4MDlGp4+y0Yx4FNo3V8859LwUgfMTs35BBCRVktuHqrVkQC0yh4vK+axwFNoTK8ddpMgU=",
      ],
      volume: this.volume,
      rate: 1.2,
    });
  }

  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;
    try {
      this.sounds[soundName].play();
    } catch (error) {
      console.warn(`Failed to play sound: ${soundName}`, error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach((sound) => {
      sound.volume(this.volume);
    });
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  playDotCollect() {
    this.play("dot");
  }
  playPowerDotCollect() {
    this.play("powerDot");
  }
  playPlayerDeath() {
    this.play("death");
  }
  playLevelComplete() {
    this.play("levelComplete");
  }
  playMove() {
    this.play("move");
  }
  playGameStart() {
    this.play("levelComplete");
  }
}

export const soundManager = new SoundManager();
