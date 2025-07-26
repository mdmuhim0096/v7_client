// ✅ groupVideoCallUtils.js
import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";
import socket from "../component/socket";

let localStream = null;
let peerConnections = {}; // peerId => RTCPeerConnection
let remoteStreams = {};   // peerId => MediaStream

export const startMedia = async (videoRef) => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: true,
  });

  if (videoRef) videoRef.srcObject = localStream;
  return localStream;
};


const createPeerConnection = (peerId, onRemoteStream, callId) => {

  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  if (!localStream) {
    console.warn("⚠️ No local stream available before creating peer connection!");
    return;
  }

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    console.log("🔊 Received remote stream from", peerId, remoteStream);
    console.log("📽️ Tracks:", remoteStream.getTracks());
    console.log("🎥 Video tracks:", remoteStream.getVideoTracks());

    if (remoteStream) {
      remoteStreams[peerId] = remoteStream;
      if (onRemoteStream) onRemoteStream(remoteStream, peerId);
    }
  };


  pc.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatesRef = ref(database, `calls/${callId}/candidates/${peerId}`);
      push(candidatesRef, event.candidate.toJSON());
    }
  };

  peerConnections[peerId] = pc;
  return pc;
};

export const createCall = async (callId, userId) => {
  await set(ref(database, `calls/${callId}/users/${userId}`), { joinedAt: Date.now() });
};

export const joinCall = async (callId, userId, onRemoteStream, isCaller) => {
  if (isCaller) await createCall(callId, userId);

  console.log(callId, userId, onRemoteStream, isCaller);
  socket.emit("join_room", callId);
  const usersRef = ref(database, `calls/${callId}/users`);
  onChildAdded(usersRef, async (snapshot) => {
    const peerId = snapshot.key;
    if (peerId === userId || peerConnections[peerId]) return;

    const isOfferer = userId > peerId;
    const pc = createPeerConnection(peerId, onRemoteStream, callId);

    if (isOfferer) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await set(ref(database, `calls/${callId}/offers/${userId}_to_${peerId}`), {
        type: offer.type,
        sdp: offer.sdp
      });
    }

    onValue(ref(database, `calls/${callId}/offers/${peerId}_to_${userId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await set(ref(database, `calls/${callId}/answers/${userId}_to_${peerId}`), {
          type: answer.type,
          sdp: answer.sdp
        });
      }
    }, { onlyOnce: true }); // ✅ add onlyOnce to prevent duplicate triggers


    onValue(ref(database, `calls/${callId}/answers/${peerId}_to_${userId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      }
    }, { onlyOnce: true });


    onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}`), async (snapshot) => {
      const candidate = new RTCIceCandidate(snapshot.val());
      await pc.addIceCandidate(candidate);
    });
  });
};

export const hangUp = async (callId, userId) => {
  // Close all peer connections
  Object.values(peerConnections).forEach((pc) => pc.close());
  peerConnections = {};
  remoteStreams = {};

  // Remove the current user
  await remove(ref(database, `calls/${callId}/users/${userId}`));

  // Check if any users remain
  const usersRef = ref(database, `calls/${callId}/users`);
  onValue(usersRef, async (snapshot) => {
    const users = snapshot.val();
    if (!users || Object.keys(users).length === 0) {
      // ✅ No one left, safe to clean the entire call tree
      await remove(ref(database, `calls/${callId}`));
      console.log("🧼 All users left, cleaned up call:", callId);
    } else {
      console.log("👥 Other users still in call, not deleting:", callId);
    }
  }, { onlyOnce: true });
};

export const toggleMute = () => {
  if (!localStream) return false;
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  return !audioTrack.enabled;
};
