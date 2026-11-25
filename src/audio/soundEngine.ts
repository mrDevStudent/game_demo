type SfxKey = 'click' | 'pickup' | 'error' | 'complete';

const AUDIO_BASES = ['audio/', 'public/audio/', 'Main/public/audio/'];
const BGM_VOLUME_ACTIVE = 0.45;
const BGM_VOLUME_SOFT = 0.22;

class SoundEngine {
  private bgmTracks: HTMLAudioElement[];
  private activeTrackIdx = 0;
  private bgmVolume = BGM_VOLUME_ACTIVE;
  private sfxMap: Record<SfxKey, HTMLAudioElement>;
  private muted = false;
  private bgmStarted = false;
  private unlockBound = false;

  constructor() {
    const bgmPrimaryCandidates = this.buildBaseCandidates([
      'background_music.mp3',
      'backgroundmusic.mp3',
      'background-music.mp3',
    ]);
    const bgmRelaxedCandidates = [
      '/assets/aistudio/Relaxed_Groove_4095832c.mp3',
      'assets/aistudio/Relaxed_Groove_4095832c.mp3',
      'public/assets/aistudio/Relaxed_Groove_4095832c.mp3',
    ];

    this.bgmTracks = [bgmPrimaryCandidates, bgmRelaxedCandidates].map((candidates, trackIdx) => {
      const track = this.createAudioFromCandidates(candidates, this.bgmVolume, false);
      track.preload = 'auto';
      track.addEventListener('ended', () => {
        if (this.bgmStarted && this.activeTrackIdx === trackIdx) {
          this.advanceTrack();
        }
      });
      return track;
    });

    this.sfxMap = {
      click: this.createAudio(['click.wav', 'click.mp3'], 0.55, false),
      pickup: this.createAudio(['pickup.wav', 'pickup.mp3'], 0.6, false),
      error: this.createAudio(['error.wav', 'error.mp3'], 0.6, false),
      complete: this.createAudio(['complete.wav', 'complete.mp3'], 0.65, false),
    };
  }

  private get currentBgm(): HTMLAudioElement {
    return this.bgmTracks[this.activeTrackIdx];
  }

  private buildBaseCandidates(names: string[]): string[] {
    const candidates: string[] = [];
    AUDIO_BASES.forEach((base) => {
      names.forEach((name) => candidates.push(`${base}${name}`));
    });
    return candidates;
  }

  private createAudio(names: string[], volume: number, loop: boolean): HTMLAudioElement {
    return this.createAudioFromCandidates(this.buildBaseCandidates(names), volume, loop);
  }

  private createAudioFromCandidates(
    candidates: string[],
    volume: number,
    loop: boolean
  ): HTMLAudioElement {
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

  private advanceTrack(): void {
    const prev = this.currentBgm;
    prev.pause();
    prev.currentTime = 0;

    this.activeTrackIdx = (this.activeTrackIdx + 1) % this.bgmTracks.length;
    const next = this.currentBgm;
    next.currentTime = 0;
    next.volume = this.bgmVolume;
    next.muted = this.muted;

    if (!this.muted && this.bgmStarted) {
      this.playTrack(next);
    }
  }

  private playTrack(track: HTMLAudioElement): void {
    const p = track.play();
    if (p) {
      p.catch(() => {
        if (!this.unlockBound) {
          this.unlockBound = true;
          window.addEventListener(
            'pointerdown',
            () => {
              this.unlockBound = false;
              const active = this.currentBgm;
              if (!this.muted && this.bgmStarted && active.paused) {
                active.play().catch(() => {});
              }
            },
            { once: true }
          );
        }
      });
    }
  }

  public startMusic(): void {
    this.bgmStarted = true;
    this.bgmVolume = BGM_VOLUME_ACTIVE;
    this.bgmTracks.forEach((track) => {
      track.volume = this.bgmVolume;
      track.muted = this.muted;
    });
    if (this.muted) return;

    this.playTrack(this.currentBgm);
  }

  public softenMusic(): void {
    this.bgmVolume = BGM_VOLUME_SOFT;
    this.bgmTracks.forEach((track) => {
      track.volume = this.bgmVolume;
    });
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
    this.bgmTracks.forEach((track) => {
      track.muted = muted;
    });
    if (!muted && this.bgmStarted) {
      this.startMusic();
    }
  }

  public handleVisibilityChange(hidden: boolean): void {
    if (hidden) {
      this.currentBgm.pause();
    } else if (this.bgmStarted && !this.muted) {
      this.playTrack(this.currentBgm);
    }
  }
}

export const soundEngine = new SoundEngine();
