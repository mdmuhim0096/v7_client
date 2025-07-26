import React, { useEffect, useRef } from "react";

const RemoteVideoTile = ({ stream, peerId }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !stream) return;
    videoRef.current.srcObject = null;
    videoRef.current.srcObject = stream;
    videoRef.current.play().catch(console.warn);
  }, [stream]);

  return (
    <div className="relative bg-black rounded overflow-hidden min-h-[16rem]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">
        {peerId}
      </span>
    </div>
  );
};

export default RemoteVideoTile;
