// import React, { useEffect, useRef, useState } from "react";
// import { startMedia, joinCall, hangUp } from "../utils/groupVideoCallUtils";
// import { useLocation, useNavigate } from "react-router-dom";
// import {tone} from "../utils/soundprovider";

// const GroupVideoCall = () => {
//   const { callId,isCaller, image, name } = useLocation()?.state || {};
//   const navigate = useNavigate();
//   const localVideoRef = useRef(null);
//   const [remoteStreams, setRemoteStreams] = useState([]);
//   const remoteVideoRefs = useRef({});
//   const [inCall, setInCall] = useState(false);

//   const handleRemoteStream = (stream) => {
//     setRemoteStreams((prev) => {
//       if (prev.find((s) => s.id === stream.id)) return prev;
//       return [...prev, stream];
//     });
//   };

//   const handleStart = async () => {
//     if(tone.callTone)
//       tone.callTone.pause();
//     await startMedia(localVideoRef.current);
//     await joinCall(callId, handleRemoteStream, {
//             name, image, role: isCaller
//         });
//     setInCall(true);
//   };

//   const handleLeave = async () => {
//       if(tone.callTone)
//       tone.callTone.pause();
//     await hangUp(callId);
//     setRemoteStreams([]);
//     setInCall(false);
//     navigate("/chatroom");
//     window.location.reload();
//   };

//   useEffect(() => {
//     remoteStreams.forEach((stream) => {
//       const videoEl = remoteVideoRefs.current[stream.id];
//       if (videoEl && videoEl.srcObject !== stream) {
//         videoEl.srcObject = stream;
//         videoEl.load(); // 👈 forces reload (important for Android devices)
//         videoEl.play().catch((e) => console.warn("Playback error:", e));
//       }
//     });
//   }, [remoteStreams]);

//   return (
//     <div className="min-h-screen bg-gray-900 text-white p-4">
//       <h2 className="text-2xl mb-4">Group Video Call</h2>

//       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//         <div className="bg-black rounded overflow-hidden">
//           <video
//             ref={localVideoRef}
//             autoPlay
//             muted
//             playsInline
//             className="w-full h-48 object-cover"
//           />
//           <div className="text-xs p-1 bg-gray-800 text-white text-center">You</div>
//         </div>

//         {remoteStreams.map((stream) => (
//           <div key={stream.id} className="bg-black rounded overflow-hidden">
//             <video
//               autoPlay
//               playsInline
//               className="w-full h-48 object-cover bg-gray-700"
//               onError={(e) => console.error("Video error", e)}
//               onLoadedMetadata={(e) => {
//                 const vid = e.target;
//                 vid.play().catch((err) => console.warn("Auto-play issue:", err));
//               }}
//               ref={(el) => {
//                 if (el) remoteVideoRefs.current[stream.id] = el;
//               }}
//             />

//             <div className="text-xs p-1 bg-gray-800 text-white text-center">Peer</div>
//           </div>
//         ))}
//       </div>

//       <div className="mt-6 flex gap-4">
//         {!inCall ? (
//           <button onClick={handleStart} className="bg-green-600 px-4 py-2 rounded">
//             Start Call
//           </button>
//         ) : (
//           <button onClick={handleLeave} className="bg-red-600 px-4 py-2 rounded">
//             Leave Call
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GroupVideoCall;


import React, { useEffect, useRef, useState } from "react";
import { startMedia, joinCall, hangUp } from "../utils/groupVideoCallUtils";
import { useLocation, useNavigate } from "react-router-dom";
import { tone } from "../utils/soundprovider";
import { Phone, PhoneOff } from "lucide-react";

const GroupVideoCall = () => {
  const { callId, isCaller, image, name } = useLocation()?.state || {};
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRefs = useRef({});
  const [inCall, setInCall] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [peerInfo, setPeerInfo] = useState({});

  const handleRemoteStream = (stream, peerId, info) => {
    setRemoteStreams((prev) => {
      if (prev.find((s) => s.id === stream.id)) return prev;
      return [...prev, stream];
    });

    if (peerId && info) {
      setPeerInfo((prev) => ({
        ...prev,
        [peerId]: info
      }));
    }
  };

  const handleStart = async () => {
    if (tone.callTone) tone.callTone.pause();
    await startMedia(localVideoRef.current);
    await joinCall(callId, handleRemoteStream, {
      name,
      image,
      role: isCaller ? "caller" : "participant",
    });
    setInCall(true);
  };

  const handleLeave = async () => {
    if (tone.callTone) tone.callTone.pause();
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
        videoEl.load();
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

        {remoteStreams.map((stream) => {
          const peerId = stream.id;
          const peer = peerInfo[peerId] || {};

          return (
            <div key={peerId} className="bg-black rounded overflow-hidden">
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
                  if (el) remoteVideoRefs.current[peerId] = el;
                }}
              />
              <div className="flex items-center gap-2 ">
                {peer.image && (
                  <img
                    src={peer.image}
                    alt={peer.name}
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>{peer.name || "Peer"} {peer.role}</span>
              </div>
            </div>
          );
        })}
      </div>

    <div className="mt-6 flex gap-4 absolute bottom-4 left-[50%] translate-x-[-50%]">
        {isCaller === true || isCaller === "true" ? <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
          <PhoneOff className="text-red-500 " onClick={() => { handleLeave() }} />
        </span> :
          <div className="flex w-28 h-auto items-center justify-between">
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <PhoneOff className="text-red-500 " onClick={() => { handleLeave() }} />
            </span>
            <span className="p-2 hover:bg-zinc-700 duration-100 rounded-full">
              <Phone className="text-green-500" onClick={() => { handleStart() }} />
            </span>
          </div>}
      </div>
    </div>
  );
};

export default GroupVideoCall;
