# Audio Files for Voice Input Feedback

This directory contains sound files used to provide gentle, whisper-soft audio feedback for voice recognition in the BEPO Insulin Calculator.

Instead of using physical audio files, we're now generating these sounds in real-time using the Web Audio API, which provides better control over volume and allows for more subtle effects that are appropriate for a medical application.

The sounds are deliberately designed to be non-intrusive while still providing clear feedback about:

1. When voice input listening starts
2. When voice input listening stops
3. When a command or number is recognized

All audio feedback is kept at low volume levels (0.1-0.2 on a scale of 0-1) to ensure they don't disturb others if used in a public setting.
