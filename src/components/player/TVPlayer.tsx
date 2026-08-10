'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Maximize, Minimize, Volume2, VolumeX, Play } from 'lucide-react';
import Hls from 'hls.js';

interface TVPlayerProps {
  streamUrl: string;
  channelName?: string;
  channelLogo?: string;
  onError?: () => void;
  className?: string;
}

export function TVPlayer({
  streamUrl,
  channelName,
  channelLogo,
  onError,
  className,
}: TVPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Começar mudo para despausar fácil no mobile
  const [isPaused, setIsPaused] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!streamUrl || !videoRef.current) return;

    const video = videoRef.current;
    setIsLoading(true);
    setError(null);
    setIsPaused(true);
    video.muted = true; // Forçar mudo no carregamento

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const handlePlayState = () => setIsPaused(false);
    const handlePauseState = () => setIsPaused(true);
    video.addEventListener('play', handlePlayState);
    video.addEventListener('pause', handlePauseState);

    // Check if URL is HLS stream
    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('.m3u');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        // Tentar play automático mudo
        video.play().catch(() => {
           setIsPaused(true);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Error:', data);
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('Erro de conexão. Verifique sua internet.');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Erro de mídia. Tentando recuperar...');
              hls.recoverMediaError();
              break;
            default:
              setError('Canal indisponível no momento.');
              onError?.();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPaused(true));
      });
    } else {
      // Try direct video playback
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        video.play().catch(() => setIsPaused(true));
      });
      video.addEventListener('error', () => {
        setError('Formato de stream não suportado.');
        onError?.();
      });
    }

    return () => {
      video.removeEventListener('play', handlePlayState);
      video.removeEventListener('pause', handlePauseState);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  const togglePlay = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      // Tentar play direto (como é live, forçamos o início)
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Se falhar (bloqueio de autoplay), tenta mudo
          videoRef.current!.muted = true;
          setIsMuted(true);
          videoRef.current!.play().catch(console.error);
        });
      }
    } else {
      videoRef.current.pause();
    }
  };

  const toggleFullscreen = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(err => console.error(err));
      } else {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => console.error(err));
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  const toggleMute = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (videoRef.current) {
      const newState = !isMuted;
      videoRef.current.muted = newState;
      setIsMuted(newState);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative bg-black aspect-video w-full group overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-contain cursor-pointer z-10"
        autoPlay
        playsInline
        muted={isMuted}
        aria-hidden="true"
        onClick={togglePlay}
      />

      {/* Play/Pause Interaction Layer (Ghost layer to catch clicks on mobile) */}
      <div 
        className="absolute inset-0 z-20 cursor-pointer" 
        onClick={togglePlay}
        onTouchEnd={togglePlay}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-[60] text-center">
           <div>
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-sm font-bold uppercase tracking-widest">Conectando...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-[70] text-center px-6">
          <div>
            <AlertCircle className="w-12 h-12 text-[var(--accent-teal)] mx-auto mb-4" />
            <p className="text-white text-sm font-bold uppercase tracking-widest mb-4">{error}</p>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay */}
      {!isLoading && !error && isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[40] cursor-pointer pointer-events-none">
           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
              <Play size={40} fill="#040714" className="text-[#040714] ml-1.5" />
           </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-[50] pointer-events-none",
        isPaused && "opacity-100"
      )}>
        {/* Top Bar - Channel Info */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-3">
            {channelLogo && (
              <img
                src={channelLogo}
                alt={channelName}
                className="w-10 h-10 rounded-lg object-contain bg-white shadow-xl"
              />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] text-[var(--accent-teal)] font-bold uppercase tracking-widest leading-none mb-1">Assistindo agora</span>
              <h2 className="text-white font-black uppercase tracking-tighter text-base md:text-xl">{channelName || "Canal ao vivo"}</h2>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Controls */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="live-badge">AO VIVO</span>
            </div>

            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={toggleMute}
                className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/5 active:scale-90"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/5 active:scale-90"
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
