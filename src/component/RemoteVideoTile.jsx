// RemoteVideoTile.jsx
import React, { useEffect, useRef } from "react";

const RemoteVideoTile = ({ stream, peerId }) => {
  const videoRef = useRef(null);
  console.log("✅ RemoteVideoTile mounted:", {
  peerId,
  stream,
  tracks: stream?.getTracks(),
  videoTracks: stream?.getVideoTracks()
});

  useEffect(() => {
    if (!videoRef.current || !stream) return;

    console.log("📺 Attaching stream to", peerId);
    videoRef.current.srcObject = null;
    videoRef.current.srcObject = stream;

    const tryPlay = async () => {
      try {
        await videoRef.current.play();
        console.log("▶️ Remote video playing for", peerId);
      } catch (err) {
        console.warn("🚫 Remote video failed to play", peerId, err);
      }
    };

    tryPlay();
  }, [stream]);

  return (
    <div className="relative bg-black rounded overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64"
        muted={false} // don't mute remote
        key={peerId}  // force rerender
      />
      <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">
        {peerId}
      </span>
    </div>
  );
};

export default RemoteVideoTile;
