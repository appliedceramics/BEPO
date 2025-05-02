/**
 * This file contains functions to generate audio feedback for voice recognition
 * It uses the Web Audio API to create gentle, whisper-soft sounds
 */

// Create audio context
let audioContext: AudioContext | null = null;

// Initialize audio context
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Generate a soft confirmation sound
 * @param volume Volume level (0.0 to 1.0)
 * @param saveToFile Whether to save the generated sound to a file
 */
export const generateConfirmSound = (volume: number = 0.2, saveToFile: boolean = false): HTMLAudioElement | null => {
  try {
    const ctx = getAudioContext();
    const duration = 0.3; // seconds
    
    // Create an oscillator for the confirmation sound
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
    oscillator.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + duration); // E6
    
    // Create a gain node to control volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start and stop the oscillator
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
    if (saveToFile) {
      // This would typically be done server-side
      console.warn('Saving audio to file is not implemented in the browser');
    }
    
    return null; // We're playing directly, not returning an audio element
  } catch (err) {
    console.error('Error generating confirm sound:', err);
    return null;
  }
};

/**
 * Generate a soft start listening sound
 * @param volume Volume level (0.0 to 1.0)
 * @param saveToFile Whether to save the generated sound to a file
 */
export const generateStartListeningSound = (volume: number = 0.2, saveToFile: boolean = false): HTMLAudioElement | null => {
  try {
    const ctx = getAudioContext();
    const duration = 0.4; // seconds
    
    // Create oscillators for a gentle chord
    const oscillator1 = ctx.createOscillator();
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    
    const oscillator2 = ctx.createOscillator();
    oscillator2.type = 'sine';
    oscillator2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    
    // Create a gain node to control volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    // Connect nodes
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start and stop the oscillators
    oscillator1.start(ctx.currentTime);
    oscillator2.start(ctx.currentTime);
    oscillator1.stop(ctx.currentTime + duration);
    oscillator2.stop(ctx.currentTime + duration);
    
    if (saveToFile) {
      // This would typically be done server-side
      console.warn('Saving audio to file is not implemented in the browser');
    }
    
    return null; // We're playing directly, not returning an audio element
  } catch (err) {
    console.error('Error generating start listening sound:', err);
    return null;
  }
};

/**
 * Generate a soft stop listening sound
 * @param volume Volume level (0.0 to 1.0)
 * @param saveToFile Whether to save the generated sound to a file
 */
export const generateStopListeningSound = (volume: number = 0.2, saveToFile: boolean = false): HTMLAudioElement | null => {
  try {
    const ctx = getAudioContext();
    const duration = 0.4; // seconds
    
    // Create oscillators for a gentle descending tone
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + duration); // A4
    
    // Create a gain node to control volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start and stop the oscillator
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
    
    if (saveToFile) {
      // This would typically be done server-side
      console.warn('Saving audio to file is not implemented in the browser');
    }
    
    return null; // We're playing directly, not returning an audio element
  } catch (err) {
    console.error('Error generating stop listening sound:', err);
    return null;
  }
};

/**
 * Play a gentle notification sound for errors
 */
export const playErrorSound = (volume: number = 0.15): void => {
  try {
    const ctx = getAudioContext();
    const duration = 0.3; // seconds
    
    // Create oscillator for error sound
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(330, ctx.currentTime); // E4
    oscillator.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + duration); // A3
    
    // Create a gain node to control volume
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Start and stop the oscillator
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error('Error playing error sound:', err);
  }
};
