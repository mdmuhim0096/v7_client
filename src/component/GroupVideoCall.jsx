import React, { useEffect, useRef, useState } from "react";
import { startMedia, joinCall, hangUp } from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom";

const GroupVideoCall = () => {
  const { callId } = useLocation()?.state || {};
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const remoteVideoRefs = useRef({});
  const [inCall, setInCall] = useState(false);

  const handleRemoteStream = (stream) => {
    console.log("📥 Received remote stream", stream.id, stream.getTracks());
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.id === stream.id)) return prev;
      return [...prev, stream];
    });
  };

  const handleStart = async () => {
    await startMedia(localVideoRef.current);
    await joinCall(callId, handleRemoteStream);
    setInCall(true);
  };

  const handleLeave = async () => {
    await hangUp(callId);
    setRemoteStreams([]);
    setInCall(false);
    navigate("/chatroom");
    window.location.reload();
  };

  useEffect(() => {
    remoteStreams.forEach((stream) => {
      const videoEl = remoteVideoRefs.current[stream.id];
      if (videoEl && videoEl.srcObject !== stream) {
        videoEl.srcObject = stream;
        videoEl.load(); // 👈 forces reload (important for Android devices)
        videoEl.play().catch((e) => console.warn("Playback error:", e));
      }
    });
  }, [remoteStreams]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h2 className="text-2xl mb-4">Group Video Call</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-black rounded overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-48 object-cover"
          />
          <div className="text-xs p-1 bg-gray-800 text-white text-center">You</div>
        </div>

        {remoteStreams.map((stream) => (
          <div key={stream.id} className="bg-black rounded overflow-hidden">
            <video
              autoPlay
              playsInline
              className="w-full h-48 object-cover bg-gray-700"
              onError={(e) => console.error("Video error", e)}
              onLoadedMetadata={(e) => {
                const vid = e.target;
                vid.play().catch((err) => console.warn("Auto-play issue:", err));
              }}
              ref={(el) => {
                if (el) remoteVideoRefs.current[stream.id] = el;
              }}
            />

            <div className="text-xs p-1 bg-gray-800 text-white text-center">Peer</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex gap-4">
        {!inCall ? (
          <button onClick={handleStart} className="bg-green-600 px-4 py-2 rounded">
            Start Call
          </button>
        ) : (
          <button onClick={handleLeave} className="bg-red-600 px-4 py-2 rounded">
            Leave Call
          </button>
        )}
      </div>
    </div>
  );
};

export default GroupVideoCall;
