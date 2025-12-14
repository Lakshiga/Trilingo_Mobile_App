import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

type AudioFocusHandle = () => void;

interface BackgroundAudioContextValue {
  requestAudioFocus: () => AudioFocusHandle;
  pauseBackground: () => Promise<void>;
  resumeBackground: () => Promise<void>;
  enableBackground: () => Promise<void>;
  disableBackground: () => Promise<void>;
  isBackgroundEnabled: boolean;
}

const BackgroundAudioContext = createContext<BackgroundAudioContextValue | undefined>(undefined);

export const BackgroundAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [locks, setLocks] = useState(0);
  const [ready, setReady] = useState(false);
  const [userEnabled, setUserEnabled] = useState(false); // music starts paused until enabled

  // Load background music (start paused)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          require('../../assets/sounds/background.mp3'),
          { isLooping: true, volume: 0.5, shouldPlay: false },
          undefined,
          true
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        setReady(true);
      } catch (e) {
        console.warn('Background audio load failed', e);
      }
    })();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => null);
      }
    };
  }, []);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound || !ready) return;
    (async () => {
      try {
        const status = (await sound.getStatusAsync()) as AVPlaybackStatus;
        if (locks > 0 || !userEnabled) {
          if (status.isLoaded && status.isPlaying) {
            await sound.pauseAsync();
          }
        } else if (status.isLoaded && !status.isPlaying) {
          await sound.playAsync();
        }
      } catch (e) {
        console.warn('Background audio state update failed', e);
      }
    })();
  }, [locks, ready, userEnabled]);

  const pauseBackground = async () => {
    const sound = soundRef.current;
    if (sound) {
      try {
        const status = (await sound.getStatusAsync()) as AVPlaybackStatus;
        if (status.isLoaded && status.isPlaying) {
          await sound.pauseAsync();
        }
      } catch (e) {
        console.warn('Pause background failed', e);
      }
    }
  };

  const resumeBackground = async () => {
    const sound = soundRef.current;
    if (sound) {
      try {
        const status = (await sound.getStatusAsync()) as AVPlaybackStatus;
        if (status.isLoaded && !status.isPlaying && locks === 0 && userEnabled) {
          await sound.playAsync();
        }
      } catch (e) {
        console.warn('Resume background failed', e);
      }
    }
  };

  const enableBackground = async () => {
    setUserEnabled(true);
    await resumeBackground();
  };

  const disableBackground = async () => {
    setUserEnabled(false);
    await pauseBackground();
  };

  const requestAudioFocus = () => {
    setLocks((v) => v + 1);
    return () => setLocks((v) => Math.max(0, v - 1));
  };

  return (
    <BackgroundAudioContext.Provider
      value={{
        requestAudioFocus,
        pauseBackground,
        resumeBackground,
        enableBackground,
        disableBackground,
        isBackgroundEnabled: userEnabled,
      }}
    >
      {children}
    </BackgroundAudioContext.Provider>
  );
};

export const useBackgroundAudio = () => {
  const ctx = useContext(BackgroundAudioContext);
  if (!ctx) {
    throw new Error('useBackgroundAudio must be used within BackgroundAudioProvider');
  }
  return ctx;
};

