type SfxKey = 'click' | 'pickup' | 'error' | 'complete';

const AUDIO_BASES = ['audio/', 'public/audio/', 'Main/public/audio/'];

class SoundEngine {
  private bgm: HTMLAudioElement;
  private sfxMap: Record<SfxKey, HTMLAudioElement>;
  private muted = false;
  private bgmStarted = false;
  private unlockBound = false;

  constructor() {
    this.bgm = this.createAudio(['background_music.mp3', 'backgroundmusic.mp3', 'background-music.mp3'], 0.45, true);
    this.sfxMap = {
      click: this.createAudio(['click.wav', 'click.mp3'], 0.55, false),
      pickup: this.createAudio(['pickup.wav', 'pickup.mp3'], 0.6, false),
      error: this.createAudio(['error.wav', 'error.mp3'], 0.6, false),
      complete: this.createAudio(['complete.wav', 'complete.mp3'], 0.65, false),
    };
  }

  private createAudio(names: string[], volume: number, loop: boolean): HTMLAudioElement {
    const candidates: string[] = [];
    AUDIO_BASES.forEach((base) => {
      names.forEach((name) => candidates.push(`${base}${name}`));
    });

    const audio = new Audio();
    audio.volume = volume;
    audio.loop = loop;
    let idx = 0;

    audio.addEventListener('error', () => {
      idx += 1;
      if (idx < candidates.length) {
        audio.src = candidates[idx];
      }
    });

    audio.src = candidates[0];
    return audio;
  }

  public startMusic(): void {
    this.bgmStarted = true;
    this.bgm.volume = 0.45;
    if (this.muted) return;

    const p = this.bgm.play();
    if (p) {
      p.catch(() => {
        if (!this.unlockBound) {
          this.unlockBound = true;
          window.addEventListener(
            'pointerdown',
            () => {
              this.unlockBound = false;
              if (!this.muted && this.bgmStarted && this.bgm.paused) {
                this.bgm.play().catch(() => {});
              }
            },
            { once: true }
          );
        }
      });
    }
  }

  public softenMusic(): void {
    this.bgm.volume = 0.22;
  }

  public playSfx(key: SfxKey): void {
    if (this.muted) return;
    try {
      const audio = this.sfxMap[key];
      audio.currentTime = 0;
      const p = audio.play();
      if (p) p.catch(() => {});
    } catch {
      // Ignore playback errors in restricted browser contexts
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.bgm.muted = muted;
    if (!muted && this.bgmStarted) {
      this.startMusic();
    }
  }

  public handleVisibilityChange(hidden: boolean): void {
    if (hidden) {
      this.bgm.pause();
    } else if (this.bgmStarted && !this.muted) {
      this.startMusic();
    }
  }
}

export const soundEngine = new SoundEngine();
