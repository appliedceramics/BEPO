/**
 * Audio feedback generation using Web Audio API
 * Generates gentle, whisper-soft sounds for voice recognition feedback
 */

// Create audio context when needed
let audioContext: AudioContext | null = null;

// Initialize audio context with lazy loading
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Generate a gentle beep sound when starting to listen
 * Uses a sine wave oscillator with gentle fade in/out
 */
export const generateStartListeningSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configure the oscillator
    oscillator.type = 'sine'; 
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    
    // Configure the gain for gentle volume
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05); // Soft fade in
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); // Fade out
    
    // Connect nodes and start sound
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error('Error generating start listening sound:', error);
  }
};

/**
 * Generate a gentle double beep sound when stopping listening
 * Uses a sine wave oscillator with decreasing pitch
 */
export const generateStopListeningSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configure the oscillator with decreasing frequency
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // Start at A5
    oscillator.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.3); // Ramp down to A4
    
    // Configure gain for two soft beeps
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05); // First beep fade in
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15); // First beep fade out
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.2); // Second beep fade in
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); // Second beep fade out
    
    // Connect nodes and start sound
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error('Error generating stop listening sound:', error);
  }
};

/**
 * Generate a gentle confirmation sound for recognized speech
 * Uses a soft rising ping sound
 */
export const generateConfirmSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configure the oscillator with rising pitch
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime); // Start at A4
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2); // Rise to A5
    
    // Configure gain for a single soft ping
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05); // Soft fade in
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2); // Gentle fade out
    
    // Connect nodes and start sound
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.error('Error generating confirmation sound:', error);
  }
};

/**
 * Generate an error sound to indicate voice recognition is not available
 * Uses a short descending tone
 */
export const playErrorSound = (): void => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Configure the oscillator with descending pitch
    oscillator.type = 'sawtooth'; // More noticeable error sound
    oscillator.frequency.setValueAtTime(330, ctx.currentTime); // Start at E4
    oscillator.frequency.linearRampToValueAtTime(220, ctx.currentTime + 0.3); // Drop to A3
    
    // Configure gain for error sound
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.05); // Slightly louder
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3); // Fade out
    
    // Connect nodes and start sound
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  } catch (error) {
    console.error('Error generating error sound:', error);
  }
};
