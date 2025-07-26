// ✅ groupVideoCallUtils.js
import { database, ref, set, onValue, remove, push, onChildAdded } from "../firebase";
import socket from "../component/socket";

let localStream = null;
let peerConnections = {}; // peerId => RTCPeerConnection
let remoteStreams = {};   // peerId => MediaStream

export const startMedia = async (videoRef) => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  if (videoRef) videoRef.srcObject = localStream;
  return localStream;
};

const createPeerConnection = (peerId, onRemoteStream, callId) => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    remoteStreams[peerId] = remoteStream;
    if (onRemoteStream) onRemoteStream(remoteStream, peerId);
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
  socket.emit("join_room", null);
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
    });

    onValue(ref(database, `calls/${callId}/answers/${peerId}_to_${userId}`), async (snapshot) => {
      const data = snapshot.val();
      if (data && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      }
    });

    onChildAdded(ref(database, `calls/${callId}/candidates/${peerId}`), async (snapshot) => {
      const candidate = new RTCIceCandidate(snapshot.val());
      await pc.addIceCandidate(candidate);
    });
  });
};

export const hangUp = async (callId, userId) => {
  Object.values(peerConnections).forEach(pc => pc.close());
  peerConnections = {};
  remoteStreams = {};
  await remove(ref(database, `calls/${callId}/users/${userId}`));
};

export const toggleMute = () => {
  if (!localStream) return false;
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  return !audioTrack.enabled;
};
