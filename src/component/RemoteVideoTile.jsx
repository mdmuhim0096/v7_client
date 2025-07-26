// ✅ RemoteVideoTile.jsx
import React, { useLayoutEffect, useRef } from "react";

const RemoteVideoTile = ({ stream, peerId }) => {
  const videoRef = useRef(null);

  useLayoutEffect(() => {
    if (videoRef.current && stream) {
      console.log("📺 [RemoteVideoTile] Attaching stream to video for peer:", peerId, stream);
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
    }
  }, [stream]);


  return (
    <div className="relative rounded overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-64"
      />
      <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">
        {peerId}
      </span>
    </div>
  );
};

export default RemoteVideoTile;
