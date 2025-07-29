// // ✅ groupVideoCallUtils.js
// import { database, ref, set, remove, onValue, push, onChildAdded } from "../firebase";
// import socket from "../component/socket"
// let localStream = null;
// let peerConnections = {};
// let remoteStreams = {};
// let myId = null;

// export const startMedia = async (videoRef) => {
//   localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
//   console.log("🎤 Local stream tracks:", localStream.getTracks());

//   if (videoRef) videoRef.srcObject = localStream;
//   return localStream;
// };


// const createPeerConnection = (peerId, onRemoteStream, callId) => {
//   const pc = new RTCPeerConnection({
//     iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
//   });

//   localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

//   pc.ontrack = (event) => {
//     const [remoteStream] = event.streams;
//     console.log("📡 Remote track received:", remoteStream?.getTracks());

//     if (remoteStream && !remoteStreams[peerId]) {
//       remoteStreams[peerId] = remoteStream;
//       onRemoteStream(remoteStream);
//     }
//   };


//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       push(ref(database, `calls/${callId}/candidates/${myId}_to_${peerId}`), event.candidate.toJSON());
//     }
//   };

//   peerConnections[peerId] = pc;
//   return pc;
// };


// export const joinCall = async (callId, onRemoteStream) => {
//   myId = crypto.randomUUID();
//   await set(ref(database, `calls/${callId}/users/${myId}`), { joinedAt: Date.now() });
//   socket.emit("join_room", callId);

//   const usersRef = ref(database, `calls/${callId}/users`);

//   onChildAdded(usersRef, async (snapshot) => {
//     const peerId = snapshot.key;
//     console.log("📨 Offer snapshot received:", snapshot.val());
//     if (peerId === myId || peerConnections[peerId]) return;

//     const isOfferer = myId > peerId;
//     const pc = createPeerConnection(peerId, onRemoteStream, callId);
//     const candidateQueue = [];

//     const flushCandidates = async () => {
//       for (const candidate of candidateQueue) {
//         try {
//           await pc.addIceCandidate(candidate);
//         } catch (err) {
//           console.error("🧨 Failed to add queued candidate:", err);
//         }
//       }
//       candidateQueue.length = 0;
//     };

//     // Offerer side
//     if (isOfferer) {
//       const offer = await pc.createOffer();
//       await pc.setLocalDescription(offer);
//       await set(ref(database, `calls/${callId}/offers/${myId}_to_${peerId}`), offer);
//     }

//     // Handle incoming offer
//     onValue(ref(database, `calls/${callId}/offers/${peerId}_to_${myId}`), async (snapshot) => {
//       const data = snapshot.val();
//       if (data && data.type === "offer" && data.sdp && !pc.currentRemoteDescription) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data));
//         const answer = await pc.createAnswer();
//         await pc.setLocalDescription(answer);
//         await set(ref(database, `calls/${callId}/answers/${myId}_to_${peerId}`), answer);
//         await flushCandidates();
//       }
//     }, { onlyOnce: true });

//     // Handle incoming answer
//     onValue(ref(database, `calls/${callId}/answers/${peerId}_to_${myId}`), async (snapshot) => {
//       const data = snapshot.val();
//       if (data && !pc.currentRemoteDescription) {
//         await pc.setRemoteDescription(new RTCSessionDescription(data));
//         await flushCandidates();
//       }
//     }, { onlyOnce: true });

//     // Queue ICE candidates until remoteDescription is set
//     onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}_to_${myId}`), async (snapshot) => {
//       const data = snapshot.val();
//       const candidate = new RTCIceCandidate(data);

//       if (pc.remoteDescription && pc.remoteDescription.type) {
//         try {
//           await pc.addIceCandidate(candidate);
//         } catch (err) {
//           console.error("🧨 Failed to add candidate immediately:", err);
//         }
//       } else {
//         candidateQueue.push(candidate);
//       }
//     });
//   });
// };


// export const hangUp = async (callId) => {
//   Object.values(peerConnections).forEach(pc => pc.close());
//   peerConnections = {};
//   remoteStreams = {};

//   await remove(ref(database, `calls/${callId}/users/${myId}`));

//   const usersRef = ref(database, `calls/${callId}/users`);
//   onValue(usersRef, async (snapshot) => {
//     const users = snapshot.val();
//     if (!users || Object.keys(users).length === 0) {
//       await remove(ref(database, `calls/${callId}`));
//     }
//   }, { onlyOnce: true });
// };


// ✅ groupVideoCallUtils.js
import { database, ref, set, remove, onValue, push, onChildAdded } from "../firebase";
import socket from "../component/socket";

let localStream = null;
let peerConnections = {};
let remoteStreams = {};
let myId = null;

// ✅ Start local media (camera + mic)
export const startMedia = async (videoRef) => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  console.log("🎤 Local stream tracks:", localStream.getTracks());

  if (videoRef) videoRef.srcObject = localStream;
  return localStream;
};

// ✅ Create peer connection to another user
const createPeerConnection = (peerId, onRemoteStream, callId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  // Add local tracks
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // ✅ Handle remote tracks
  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    const trackLabels = remoteStream?.getTracks()?.map(t => t.label) || [];

    console.log("📡 Remote track from", peerId, "Tracks:", trackLabels);

    // ✅ Always update remote stream, even if peer already exists
    if (remoteStream) {
      remoteStreams[peerId] = remoteStream;
      onRemoteStream(remoteStream);
    }
  };

  // ✅ Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      push(ref(database, `calls/${callId}/candidates/${myId}_to_${peerId}`), event.candidate.toJSON());
    }
  };

  peerConnections[peerId] = pc;
  return pc;
};

// ✅ Join call and manage signaling
export const joinCall = async (callId, onRemoteStream) => {
  myId = crypto.randomUUID();
  await set(ref(database, `calls/${callId}/users/${myId}`), { joinedAt: Date.now() });
  socket.emit("join_room", callId);

  const usersRef = ref(database, `calls/${callId}/users`);

  onChildAdded(usersRef, async (snapshot) => {
    const peerId = snapshot.key;
    console.log("📨 Offer snapshot received:", snapshot.val());
    if (peerId === myId || peerConnections[peerId]) return;

    const isOfferer = myId > peerId;
    const pc = createPeerConnection(peerId, onRemoteStream, callId);
    const candidateQueue = [];

    const flushCandidates = async () => {
      for (const candidate of candidateQueue) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("🧨 Failed to add queued candidate:", err);
        }
      }
      candidateQueue.length = 0;
    };

    // ✅ Create and send offer
    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await set(ref(database, `calls/${callId}/offers/${myId}_to_${peerId}`), offer);
    }

    // ✅ Handle incoming offer
    onValue(ref(database, `calls/${callId}/offers/${peerId}_to_${myId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && data.type === "offer" && data.sdp && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await set(ref(database, `calls/${callId}/answers/${myId}_to_${peerId}`), answer);
        await flushCandidates();
      }
    }, { onlyOnce: true });

    // ✅ Handle incoming answer
    onValue(ref(database, `calls/${callId}/answers/${peerId}_to_${myId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        await flushCandidates();
      }
    }, { onlyOnce: true });

    // ✅ Handle incoming ICE candidates
    onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}_to_${myId}`), async (snapshot) => {
      const data = snapshot.val();
      const candidate = new RTCIceCandidate(data);

      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(candidate);
        } catch (err) {
          console.error("🧨 Failed to add candidate immediately:", err);
        }
      } else {
        candidateQueue.push(candidate);
      }
    });
  });
};

// ✅ Hang up and clean everything
export const hangUp = async (callId) => {
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
  remoteStreams = {};

  await remove(ref(database, `calls/${callId}/users/${myId}`));

  const usersRef = ref(database, `calls/${callId}/users`);
  onValue(usersRef, async (snapshot) => {
    const users = snapshot.val();
    if (!users || Object.keys(users).length === 0) {
      await remove(ref(database, `calls/${callId}`));
    }
  }, { onlyOnce: true });
};
