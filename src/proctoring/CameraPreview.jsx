import React, { useEffect, useRef } from "react";
import { Camera, CameraOff, Video } from "lucide-react";

/**
 * Floating camera preview box shown during proctored mock tests.
 * Mirrors the video feed for a natural "looking at yourself" feel.
 */
export default function CameraPreview({ stream, error, className = "" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 w-36 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all ${
        stream
          ? "border-emerald-500"
          : "border-red-500"
      } ${className}`}
      style={{ aspectRatio: "4/3", background: "#0a0a0a" }}
    >
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-slate-900">
          <CameraOff className="w-6 h-6 text-red-400" />
          <span className="text-[10px] text-red-300 font-medium text-center px-1 leading-tight">
            {error ? "Camera error" : "No camera"}
          </span>
        </div>
      )}

      {/* Status pill */}
      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
        <span
          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            stream ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"
          }`}
        >
          {stream ? "● LIVE" : "● OFF"}
        </span>
      </div>

      {/* Camera icon badge */}
      <div className="absolute top-1.5 right-1.5">
        <div
          className={`w-5 h-5 rounded-full grid place-items-center ${
            stream ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {stream
            ? <Video className="w-2.5 h-2.5 text-white" />
            : <CameraOff className="w-2.5 h-2.5 text-white" />}
        </div>
      </div>
    </div>
  );
}
