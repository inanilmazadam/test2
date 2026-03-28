import React, { useRef, useEffect, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { ShotType } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Camera, CameraOff, Loader2, X, CheckCircle2, XCircle, Circle, Activity } from "lucide-react";
import { cn } from "../lib/utils";

interface CameraViewProps {
  shotType: ShotType;
  onShotDetected: (made: boolean) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ shotType, onShotDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Initializing Free AI Engine...");
  const [lastResult, setLastResult] = useState<{ made: boolean; timestamp: number } | null>(null);
  const [sessionLog, setSessionLog] = useState<{ made: boolean; timestamp: number }[]>([]);
  const isAnalyzingRef = useRef(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isActive = true;

    const setupCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment", 
            width: { ideal: 1280 }, 
            height: { ideal: 720 },
            frameRate: { ideal: 30 } 
          },
          audio: false,
        });
        if (videoRef.current && isActive) {
          videoRef.current.srcObject = stream;
          setIsReady(true);
          setStatus("AI Active • Monitoring Hoop (Free Mode)");
          startAnalysisLoop();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setStatus("Camera access denied. Please check permissions.");
      }
    };

    const startAnalysisLoop = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const analyzeFrame = async () => {
        if (!isActive || isAnalyzingRef.current || !videoRef.current || !canvasRef.current) return;
        
        isAnalyzingRef.current = true;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64Data = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
          
          try {
            const response = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: {
                parts: [
                  { text: `Analyze this frame of a basketball hoop. 
                  If a shot was JUST taken and went in, respond "BASKET". 
                  If it missed, respond "MISS". 
                  If no shot is currently crossing the hoop, respond "NONE".
                  Current practice: ${shotType}.` },
                  { inlineData: { data: base64Data, mimeType: "image/jpeg" } }
                ]
              }
            });

            const text = response.text?.toUpperCase() || "";
            if (text.includes("BASKET") || text.includes("MISS")) {
              const made = text.includes("BASKET");
              onShotDetected(made);
              const result = { made, timestamp: Date.now() };
              setLastResult(result);
              setSessionLog(prev => [result, ...prev].slice(0, 5));
              setTimeout(() => setLastResult(null), 2000);
            }
          } catch (err) {
            console.error("Analysis error:", err);
          }
        }
        
        isAnalyzingRef.current = false;
        // Small delay to prevent hitting rate limits on free tier
        if (isActive) setTimeout(analyzeFrame, 500); 
      };

      analyzeFrame();
    };

    setupCamera();

    return () => {
      isActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [shotType]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        <canvas ref={canvasRef} width={640} height={360} className="hidden" />
        
        {/* Recording Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
          {/* Top Bar */}
          <div className="flex justify-between items-start pointer-events-auto">
            <div className="flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/20 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                  <span className="text-white text-xs font-black uppercase tracking-widest">FREE AI</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <p className="text-white text-xs font-bold uppercase tracking-widest">
                  {shotType}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                <p className="text-white/90 text-[10px] font-bold uppercase tracking-tighter flex items-center gap-2">
                  <Activity className="w-3 h-3 text-blue-400" />
                  Status: {status}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-2xl transition-all border border-white/10"
            >
              <X className="text-white w-6 h-6" />
            </button>
          </div>

          {/* Center Result */}
          <div className="flex flex-col items-center gap-6">
            <AnimatePresence mode="wait">
              {lastResult && (
                <motion.div
                  key={lastResult.timestamp}
                  initial={{ scale: 0.8, opacity: 0, y: 40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.2, opacity: 0, y: -40 }}
                  className={cn(
                    "px-10 py-5 rounded-[2rem] text-5xl font-black uppercase tracking-tighter shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 border-4",
                    lastResult.made 
                      ? "bg-green-500 text-white border-green-400" 
                      : "bg-red-600 text-white border-red-500"
                  )}
                >
                  {lastResult.made ? (
                    <>
                      <CheckCircle2 className="w-12 h-12" />
                      <span>Basket!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12" />
                      <span>Miss</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Bar: Session Log */}
          <div className="flex justify-between items-end">
            <div className="space-y-2 pointer-events-auto">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] ml-2">Session Log</p>
              <div className="flex flex-col gap-1.5">
                <AnimatePresence initial={false}>
                  {sessionLog.map((log, i) => (
                    <motion.div
                      key={log.timestamp}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border",
                        log.made 
                          ? "bg-green-500/20 text-green-400 border-green-500/30" 
                          : "bg-red-500/20 text-red-400 border-red-500/30",
                        i === 0 ? "scale-110 origin-left" : "opacity-50"
                      )}
                    >
                      {log.made ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {log.made ? "Basket" : "Miss"}
                      <span className="text-white/30 ml-auto">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sessionLog.length === 0 && (
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    Waiting for shots...
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/10 text-right">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Live Feed</p>
              <p className="text-white text-xs font-bold">720p Analysis</p>
            </div>
          </div>
        </div>

        {/* Viewfinder Corners */}
        <div className="absolute inset-10 border-2 border-white/20 rounded-[3rem] pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />
        </div>
      </div>
    </div>
  );
};
