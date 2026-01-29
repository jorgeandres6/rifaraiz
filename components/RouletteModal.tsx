import React, { useState, useMemo, useRef } from 'react';
import { Raffle, ExtraPrize } from '../types';
import { XIcon } from './icons';

// --- Audio Generation ---
const useAudioContext = () => {
    const audioCtxRef = useRef<AudioContext | null>(null);
    if (typeof window !== 'undefined' && !audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtxRef.current;
};

const playTickSound = (ctx: AudioContext, time: number, freq: number) => {
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime); // Increased from 0.2
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    oscillator.start(time);
    oscillator.stop(time + 0.1);
};

const playWinSound = (ctx: AudioContext) => {
    if (!ctx) return;
    const notes = [392, 494, 587, 784]; // G4, B4, D5, G5
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.6, ctx.currentTime + i * 0.1); // Increased from 0.2
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
};

const playLoseSound = (ctx: AudioContext) => {
    if (!ctx) return;
    const notes = [220, 164]; // A3, E3
    notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.15); // Increased from 0.15
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.2);
    });
};

interface RouletteModalProps {
  raffle: Raffle;
  onClose: () => void;
  onPrizeWon: (prize: ExtraPrize, raffleId: string) => Promise<void>;

}

interface Segment {
  text: string;
  type: 'win' | 'loss';
  color: string;
}

interface Result {
    type: 'win' | 'loss';
    prize?: ExtraPrize;
}

const shuffle = <T,>(array: T[]): T[] => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
};

const WIN_COLOR = '#22c55e'; // tailwind green-500
const LOSS_COLOR = '#ef4444'; // tailwind red-500

const RouletteModal: React.FC<RouletteModalProps> = ({ raffle, onClose, onPrizeWon }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [result, setResult] = useState<Result | null>(null);
    const audioCtx = useAudioContext();

    const segments = useMemo((): Segment[] => {
        const winSegments: Omit<Segment, 'color'>[] = Array(6).fill({ text: 'Ganaste un premio', type: 'win' });
        const lossSegments: Omit<Segment, 'color'>[] = Array(4).fill({ text: 'Sigue intentando', type: 'loss' });
        
        const combined = shuffle([...winSegments, ...lossSegments]);

        return combined.map((segment) => ({
            ...segment,
            color: segment.type === 'win' ? WIN_COLOR : LOSS_COLOR,
        }));
    }, []);

    const segmentAngle = 360 / segments.length;

    const conicGradient = segments.map((seg, i) =>
        `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
    ).join(', ');
    
    const handleSpin = () => {
        if (isSpinning || (raffle.extraPrizes || []).length === 0 || !audioCtx) return;

        setIsSpinning(true);
        setResult(null);

        const spinDuration = 5.8;
        const numTicks = segments.length * 7;
        for (let i = 0; i < numTicks; i++) {
            const time = Math.pow(i / numTicks, 2) * spinDuration; 
            const freq = 800 - (time / spinDuration) * 500;
            playTickSound(audioCtx, audioCtx.currentTime + time, freq);
        }

        const winningSegmentIndex = Math.floor(Math.random() * segments.length);
        const winningSegment = segments[winningSegmentIndex];
        
        const randomOffset = (Math.random() * 0.8 + 0.1) * segmentAngle;
        const baseRotation = 360 * 7;
        const prizeRotation = winningSegmentIndex * segmentAngle;
        
        const targetRotation = baseRotation - prizeRotation - randomOffset;

        setRotation(prev => prev + targetRotation);

        setTimeout(() => {
            setIsSpinning(false);
            if (winningSegment.type === 'win' && (raffle.extraPrizes || []).length > 0) {
                // Get only prizes with available quantity
                const availablePrizes = (raffle.extraPrizes || []).filter(p => p.quantity > 0);
                
                if (availablePrizes.length === 0) {
                    // No prizes available, treat as loss
                    setResult({ type: 'loss' });
                    playLoseSound(audioCtx);
                } else {
                    const randomActualPrize = availablePrizes[Math.floor(Math.random() * availablePrizes.length)];
                    setResult({ type: 'win', prize: randomActualPrize });
                    playWinSound(audioCtx);
                }
            } else {
                setResult({ type: 'loss' });
                playLoseSound(audioCtx);
            }
        }, 7000); 
    };

    const handleClaim = async () => {
        if (result?.type === 'win' && result.prize) {
            await onPrizeWon(result.prize, raffle.id);
        }
        onClose();
    }
    
    const highestPrizeText = useMemo(() => {
      const prizes = raffle.extraPrizes || [];
      if (prizes.length === 0) return 'un premio';
      
      let maxAmount = 0;
      let prizeText = prizes[0].name;

      prizes.forEach(prize => {
        const match = prize.name.match(/(\$|€)\s*(\d+)/);
        if (match) {
          const amount = parseInt(match[2], 10);
          if (amount > maxAmount) {
            maxAmount = amount;
            prizeText = `${match[1]}${amount}`;
          }
        }
      });
      
      return maxAmount > 0 ? prizeText : 'un premio';
    }, [raffle.extraPrizes]);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4 animate-fade-in overflow-hidden" onClick={onClose}>
            <div className="relative w-full max-w-md text-center max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-10 right-0 text-white/50 hover:text-white transition-colors z-20">
                    <XIcon className="h-8 w-8" />
                </button>
                
                <div className="min-h-[8rem] flex flex-col justify-center items-center mb-4">
                    {!result ? (
                        <h2 className="text-3xl font-bold text-white drop-shadow-lg animate-fade-in">
                            Gira para ganar {highestPrizeText}
                        </h2>
                    ) : (
                        <div className="animate-fade-in">
                            {result.type === 'win' && result.prize ? (
                                <>
                                    <h2 className="text-2xl font-bold text-yellow-300">¡Felicidades!</h2>
                                    <p className="text-4xl font-bold text-white mt-2 px-4">{result.prize.name}</p>
                                </>
                            ) : (
                                <h2 className="text-4xl font-bold text-white">Sigue intentando</h2>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative inline-flex items-center justify-center my-4">
                    {/* Pointer */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
                        <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 0L35.3205 15.75L0.679492 15.75L18 0Z" fill="#FFD700"/>
                            <path d="M18 48L35.3205 24H0.679492L18 48Z" fill="#FDB813"/>
                            <path d="M18 15.75L35.3205 24H0.679492L18 15.75Z" fill="url(#pointer-gradient)"/>
                            <defs>
                                <linearGradient id="pointer-gradient" x1="18" y1="15.75" x2="18" y2="24" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#FDB813"/>
                                <stop offset="1" stopColor="#FFD700"/>
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>

                    {/* Center Button */}
                    <button 
                        onClick={!isSpinning && !result ? handleSpin : undefined}
                        disabled={isSpinning || !!result || (raffle.extraPrizes || []).filter(p => p.quantity > 0).length === 0}
                        title={(raffle.extraPrizes || []).filter(p => p.quantity > 0).length === 0 ? 'No hay premios disponibles' : ''}
                        className="absolute z-10 w-24 h-24 bg-black rounded-full border-4 border-gray-800 shadow-inner flex items-center justify-center text-white text-2xl font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Girar
                    </button>

                    {/* Roulette Wheel */}
                    <div
                        className="relative w-80 h-80 rounded-full border-8 border-gray-600 shadow-2xl bg-gray-800"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: 'transform 6s cubic-bezier(0.25, 1, 0.5, 1)',
                        }}
                    >
                       <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${conicGradient})` }}/>
                       <div className="absolute inset-2 bg-gray-800 rounded-full"/>
                    </div>
                </div>

                <div className="mt-6">
                    {!result ? (
                         <>
                            <button
                                onClick={handleSpin}
                                disabled={isSpinning}
                                className="w-full max-w-xs mx-auto bg-gradient-to-b from-orange-500 to-orange-600 text-white font-bold py-3 px-6 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-xl shadow-lg border-2 border-white/50"
                            >
                                {isSpinning ? 'Girando...' : 'Girar'}
                            </button>
                            <div className="flex justify-center items-center space-x-6 mt-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: WIN_COLOR }}></div>
                                    <span className="text-sm text-gray-300">Ganaste un premio</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: LOSS_COLOR }}></div>
                                    <span className="text-sm text-gray-300">Sigue intentando</span>
                                </div>
                            </div>
                         </>
                    ) : (
                         <button
                            onClick={handleClaim}
                            className="w-full max-w-xs mx-auto bg-gradient-to-b from-orange-500 to-orange-600 text-white font-bold py-3 px-6 rounded-full hover:from-orange-600 hover:to-orange-700 transition-all duration-300 text-xl shadow-lg border-2 border-white/50 animate-fade-in"
                         >
                            {result.type === 'win' ? 'Reclamar Premio' : 'Cerrar'}
                         </button>
                    )}
                   
                </div>
            </div>
        </div>
    );
};

export default RouletteModal;