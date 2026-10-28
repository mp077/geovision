import { useState, useRef, useCallback, useEffect } from 'react';

export type CameraStatus = 
  | 'idle' 
  | 'requesting' 
  | 'active' 
  | 'unavailable' 
  | 'permission-denied' 
  | 'error';

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  errorMessage: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
  facingMode: 'environment' | 'user';
  toggleFacingMode: () => void;
  hasMultipleCameras: boolean;
}

export function useCamera(): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);

  // Check available devices
  useEffect(() => {
    if (navigator?.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setHasMultipleCameras(videoInputs.length > 1);
      }).catch(() => {
        // ignore device listing errors
      });
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  const startCamera = useCallback(async () => {
    // If stream is active, stop it first
    if (streamRef.current) {
      stopCamera();
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      setErrorMessage('Camera access is not supported by this browser environment or insecure context.');
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {
          // Handle autoplay policy
        }
      }

      setStatus('active');
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatus('permission-denied');
        setErrorMessage('Camera permission was denied in your browser settings. Please grant video access to capture specimens.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setErrorMessage('No optical video capture devices or webcams were found on this system.');
      } else {
        setStatus('error');
        setErrorMessage(error.message || 'Unable to initialize optical video stream.');
      }
    }
  }, [facingMode, stopCamera]);

  const toggleFacingMode = useCallback(() => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (status === 'active') {
      stopCamera();
      // small delay to re-open with new facing mode
      setTimeout(() => {
        startCamera();
      }, 150);
    }
  }, [facingMode, status, stopCamera, startCamera]);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  }, []);

  // Guarantee cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop();
          } catch {
            // ignore
          }
        });
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    startCamera,
    stopCamera,
    captureFrame,
    facingMode,
    toggleFacingMode,
    hasMultipleCameras
  };
}
