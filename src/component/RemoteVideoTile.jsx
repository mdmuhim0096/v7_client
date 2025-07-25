import React, { useEffect, useRef } from "react";

const RemoteVideoTile = ({ stream, peerId }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative rounded overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-64 object-cover"
      />
      <span className="absolute top-1 left-2 text-xs bg-gray-800 px-2 py-1 rounded">
        {peerId}
      </span>
    </div>
  );
};

export default RemoteVideoTile;
