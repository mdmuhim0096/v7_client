import React, { useEffect, useState } from "react";
import { server_port, myfriends_api } from "./api";
import { X, Share2, MessageSquareIcon, ThumbsUp } from "lucide-react";
import Seemore from "./Seemore";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import socket from "./socket";
import { tone } from "../utils/soundprovider";
import { isMatchGroup } from "../utils/utils";
import axios from "axios";
import Navbar from "./Navbar";
import { formatNumber } from "../utils/formatenumber";
import ReactPlate from "./ReactPlate";

const Save = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { callTone } = tone;

  const [saves, setSaves] = useState([]);
  const [friends, setFriends] = useState([]);
  const _id_ = localStorage.getItem("myId");
  const [loadData, setLoadData] = useState("");


  // ─── Fetch Saved Posts + Friends ──────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const myId = localStorage.getItem("myId");
        const saveRes = await axios.get(`${server_port}/api/save/save/${myId}`);
        setSaves(saveRes.data.save || []);

        const friendsRes = await axios.get(myfriends_api, {
          withCredentials: true,
        });
        setFriends(friendsRes.data.data || []);
      } catch (err) {
        console.error("Error fetching saves/friends:", err);
      }
    };

    fetchData();
  }, [loadData]);

  // ─── Remove Post From Saves ───────────────────────────────────
  const handleRemoveSave = async (postId) => {
    try {
      await axios.post(
        `${server_port}/api/people/remove_post`,
        { postId },
        { withCredentials: true }
      );
      toast.success("Removed from saved posts");
      setSaves((prev) => prev.filter((s) => s._id !== postId));
    } catch (err) {
      console.error("Error removing save:", err);
      toast.error("Failed to remove");
    }
  };

  // ─── Incoming Call Handlers ───────────────────────────────────
  useEffect(() => {
    const myId = localStorage.getItem("myId");

    const handleAudioCall = (data) => {
      if (data.userId === myId) {
        navigate("/audiocall", {
          state: {
            callId: data.callId,
            userId: data.userId,
            role: "receiver",
            info: data.info,
          },
        });
        callTone?.play();
      }
    };

    const handleVideoCall = (data) => {
      if (data.userId === myId) {
        navigate("/v", { state: { callId: data.callId } });
        callTone?.play();
      }
    };

    socket.on("incoming_call_a", handleAudioCall);
    socket.on("____incoming_call____", handleVideoCall);

    return () => {
      socket.off("incoming_call_a", handleAudioCall);
      socket.off("____incoming_call____", handleVideoCall);
    };
  }, [navigate, callTone]);

  // ─── Group Calls ──────────────────────────────────────────────
  useEffect(() => {
    const handleGroupVideo = async (data) => {
      if (await isMatchGroup(data)) {
        navigate("/groupvideocall", {
          state: {
            callId: data,
            isCaller: false,
            image: localStorage.getItem("myImage"),
            name: localStorage.getItem("myName"),
          },
        });
        callTone?.play();
      }
    };

    const handleGroupAudio = async (data) => {
      if (await isMatchGroup(data)) {
        navigate("/groupaudiocall", {
          state: {
            callId: data,
            isCaller: false,
            image: localStorage.getItem("myImage"),
            name: localStorage.getItem("myName"),
          },
        });
        callTone?.play();
      }
    };

    socket.on("join_room", handleGroupVideo);
    socket.on("join_audio_room", handleGroupAudio);

    return () => {
      socket.off("join_room", handleGroupVideo);
      socket.off("join_audio_room", handleGroupAudio);
    };
  }, [navigate, callTone]);


  /** 🔹 Show/hide React Plate */
  function showPlate(e, index) {
    const Plate = document.getElementById(`react_plate_${index}`);
    if (!Plate) return;
    if (e) {
      Plate.classList.remove("hidden");
      Plate.classList.add("flex");
    } else {
      Plate.classList.remove("flex");
      Plate.classList.add("hidden");
    }
  }

  /** 🔹 Get Top 3 React types */
  function getTop3React(reactArray = []) {
    const reactObject = {};
    reactArray.forEach((item) => {
      const type = item.type;
      reactObject[type] = (reactObject[type] || 0) + 1;
    });
    const sortedArray = Object.entries(reactObject).sort((a, b) => b[1] - a[1]);
    return sortedArray.slice(0, 3);
  }

  async function alertLike(receiverId, senderId, postId, reactType) {
    try {
      const res = await axios.post(`${server_port}/api/noti/likeAlert`, {
        receiverId,
        senderId,
        postId,
        reactType,
      });
      toast.success(res.data.message);
    } catch (err) {
      console.log(err);
    }
  }

  function reloadData(t = "c") {
    for (let i = 0; i <= 3; i++) {
      setLoadData(t + i);
    }
  }

  return (
    <div className="w-full h-screen overflow-y-auto">
      <div className="sticky top-0 z-40">
        <Navbar />
      </div>
      <ToastContainer />
      <div className="flex flex-wrap px-2 gap-2">
        {saves?.map((item, index) => {
          const post = item?.postId;
          const myLike = post?.likes?.find((like) => like.user === _id_);
          const topReacts = getTop3React(post?.likes);
          if (!post) return null;

          return (
            <div
              key={item._id || index}
              className="w-full md:w-[48%] mx-auto h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b-2 border-cyan-700 mb-3">
                <div className="flex items-center gap-2">
                  <img
                    className="w-10 h-10 rounded-full"
                    src={post?.postOwner?.image}
                    alt="owner"
                  />
                  <h4>{post?.postOwner?.name}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hover:text-red-500" onClick={() => handleRemoveSave(item._id)}>
                    <X />
                  </span>
                </div>
              </div>

              {/* Caption */}
              <div className="my-2">
                <Seemore text={post.caption} range={200} />
              </div>

              {/* Media */}
              {post?.image && !post?.video ? (
                <img
                  className="rounded-md w-full h-96 object-fill"
                  src={post?.media}
                  alt="post"
                />
              ) : (
                <video
                  src={post?.media}
                  controls
                  loop
                  className="w-full rounded-md object-fill h-96"
                />
              )}

              <footer className="h-auto">
                <div className="w-full h-auto flex justify-between items-center">
                  <span className={`flex items-center my-1 rounded-md px-1 cursor-pointer shadow-md`}
                    onClick={() => { navigate("/allreacts", { state: { postId: item?.postId?._id } }) }}
                  >
                    {topReacts.map(([type], i) => (
                      <img
                        key={i}
                        src={`./assets/react_icons/${type === "love" ? "heart" : type}.png`}
                        className="w-5 h-5"
                        alt={type}
                      />
                    ))}
                    <span className="mx-2">{formatNumber(post?.likes?.length)}</span>
                  </span>
                  <span>
                  </span>
                  <span>
                    <span className="mx-2">share</span>
                    {formatNumber(post?.share.length)}
                  </span>
                </div>

                <div className="flex">
                  {/* LIKE */}
                  <div className="post_footer w-4/12">
                    <div
                      onMouseEnter={() =>
                        setTimeout(() => showPlate(true, index + "$" + post?._id), 100)
                      }
                      onMouseLeave={() => showPlate(false, index + "$" + post?._id)}
                    >
                      <ReactPlate
                        index={index + "$" + post?._id}
                        postId={post?._id}
                        type="post"
                        onReturn={async (t) => {
                          await alertLike(
                            post?.postOwner?._id,
                            _id_,
                            post?._id,
                            t
                          );
                          reloadData(t);
                        }}
                        color={"bg-zinc-800"}
                      />

                      {myLike ? (
                        <img
                          src={`./assets/react_icons/${myLike.type === "love" ? "heart" : myLike.type
                            }.png`}
                          className="w-8 h-8"
                          alt="my-like"
                        />
                      ) : (
                        <ThumbsUp />
                      )}
                    </div>
                  </div>

                  {/* COMMENT */}
                  <Link
                    to="/commentplate"
                    state={{ post_id: post?._id }}
                    className="post_footer w-4/12 justify-center"
                    onClick={() =>
                      localStorage.setItem("back_page", location.pathname)
                    }
                  >
                    <MessageSquareIcon />
                    {formatNumber(post?.comments?.length)}
                  </Link>

                  {/* SHARE */}
                  <span className="post_footer w-4/12 justify-end">
                    <Link to="/share" state={{ friends, post: post?._id }}>
                      <Share2 />
                    </Link>
                  </span>
                </div>
              </footer>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(Save);
