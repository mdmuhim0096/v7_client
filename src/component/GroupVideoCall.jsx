import React, { useRef, useState } from "react";
import {
  startMedia,
  joinCall,
  hangUp,
  toggleMute,
} from "../utils/groupVideoCallUtils";
import RemoteVideoTile from "./RemoteVideoTile";
import { Mic, MicOff, PhoneOff, Video } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const GroupVideoCall = () => {
  const { callId, isCaller } = useLocation()?.state || {};
  const userId = localStorage.getItem("myId");
  const localVideoRef = useRef(null);
  const [remoteVideos, setRemoteVideos] = useState([]);
  const [inCall, setInCall] = useState(false);
  const [muted, setMuted] = useState(false);
  const navigate = useNavigate();

  const handleRemoteStream = (stream, peerId) => {
    setRemoteVideos((prev) => {
      const exists = prev.find((vid) => vid.id === peerId);
      if (exists) return prev;
      return [...prev, { id: peerId, stream }];
    });
  };

  const handleStart = async () => {
    await startMedia(localVideoRef.current);
    await joinCall(callId, userId, handleRemoteStream, isCaller);
    setInCall(true);
  };

  const handleLeave = async () => {
    await hangUp(callId, userId);
    setRemoteVideos([]);
    setInCall(false);
    navigate("/chatroom");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Group Video Call</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-6xl">
        <div className="relative bg-black min-h-[16rem] rounded">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">You</span>
        </div>
        {remoteVideos.map((vid) => (
          <RemoteVideoTile key={`${vid.id}-${vid.stream.id}`} stream={vid.stream} peerId={vid.id} />
        ))}
      </div>
      <div className="flex gap-4 mt-6">
        {!inCall ? (
          <button onClick={handleStart} className="bg-green-600 px-4 py-2 rounded">
            <Video className="inline mr-2" /> Start Call
          </button>
        ) : (
          <>
            <button onClick={() => setMuted(toggleMute())} className="bg-yellow-500 px-4 py-2 rounded">
              {muted ? <MicOff className="inline mr-2" /> : <Mic className="inline mr-2" />}
              {muted ? "Unmute" : "Mute"}
            </button>
            <button onClick={handleLeave} className="bg-red-600 px-4 py-2 rounded">
              <PhoneOff className="inline mr-2" /> Hang Up
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GroupVideoCall;
