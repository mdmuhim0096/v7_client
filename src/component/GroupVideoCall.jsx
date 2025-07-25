import React, { useEffect, useRef, useState } from "react";
import {
  startMedia,
  joinCall,
  hangUp,
  toggleMute,
} from "../utils/groupVideoCallUtils"; // adjust path
import { Mic, MicOff, PhoneOff, Video } from "lucide-react";
import { useLocation } from "react-router-dom";

const GroupVideoCall = () => {
  const { callId, isCaller } = useLocation()?.state || {};
  const userId = localStorage.getItem("myId");
  const localVideoRef = useRef(null);
  const [remoteVideos, setRemoteVideos] = useState([]); // { id, stream }
  const [muted, setMuted] = useState(false);
  const [inCall, setInCall] = useState(false);

  const handleRemoteStream = (stream, peerId) => {
    setRemoteVideos((prev) => {
      if (prev.find((vid) => vid.id === peerId)) return prev;
      return [...prev, { id: peerId, stream }];
    });
  };

  const handleStartCall = async () => {
    await startMedia(localVideoRef.current);
    await joinCall(callId, userId, handleRemoteStream, isCaller);
    setInCall(true);
  };

  const handleHangUp = async () => {
    await hangUp(callId, userId);
    setRemoteVideos([]);
    setInCall(false);
  };

  const handleMuteToggle = () => {
    const isMuted = toggleMute();
    setMuted(isMuted);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <h1 className="text-2xl font-bold mb-4">Group Video Call</h1>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl">
        {/* Local Video */}
        <div className="relative rounded overflow-hidden bg-black">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-64 object-cover" />
          <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">You</span>
        </div>

        {/* Remote Videos */}
        {remoteVideos.map((vid) => (
          <div key={vid.id} className="relative rounded overflow-hidden bg-black">
            <video
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
              ref={(el) => el && (el.srcObject = vid.stream)}
            />
            <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">
              {vid.id}
            </span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        {!inCall ? (
          <button
            onClick={handleStartCall}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold"
          >
            <Video className="inline mr-2" /> Start Call
          </button>
        ) : (
          <>
            <button
              onClick={handleMuteToggle}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-semibold"
            >
              {muted ? <MicOff className="inline mr-2" /> : <Mic className="inline mr-2" />}
              {muted ? "Unmute" : "Mute"}
            </button>
            <button
              onClick={handleHangUp}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold"
            >
              <PhoneOff className="inline mr-2" /> Hang Up
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupVideoCall;
