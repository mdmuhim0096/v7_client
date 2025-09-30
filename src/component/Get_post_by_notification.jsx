// GetPostByNotification.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Share2, MessageSquareIcon } from "lucide-react";
import Navbar from "./Navbar";
import Seemore from './Seemore';
import ReactPlate from './ReactPlate';
import { myfriends_api, server_port } from './api';
import { formatNumber } from '../utils/formatenumber';
import { isMatchGroup } from '../utils/utils';
import { tone } from "../utils/soundprovider";
import socket from "./socket";

/** ---------- SOCKET HOOK OUTSIDE COMPONENT ---------- **/
function useSocketNavigation(eventName, callback) {
  useEffect(() => {
    if (!eventName || !callback) return;
    socket.on(eventName, callback);
    return () => socket.off(eventName, callback);
  }, [eventName, callback]);
}

/** ---------- MAIN COMPONENT ---------- **/
const GetPostByNotification = () => {
  const { callTone } = tone;
  const navigate = useNavigate();
  const { state } = useLocation();
  const postId = state?.postId;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadData, setLoadData] = useState('');
  const [friends, setFriends] = useState([]);

  /** Fetch post by ID */
  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const res = await axios.get(`${server_port}/api/post/getpostbyid/${postId}`);
        const postArray = Array.isArray(res.data.post)
          ? res.data.post
          : [res.data.post];
        setPosts(postArray.filter(Boolean));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, loadData]);

  /** Fetch friends once */
  useEffect(() => {
    const getMyFriends = async () => {
      try {
        const res = await axios.get(myfriends_api, { withCredentials: true });
        setFriends(res.data.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    getMyFriends();
  }, []);

  /** Incoming Call Handlers */
  const handleIncomingCallAudio = useCallback((data) => {
    if (data.userId === localStorage.getItem("myId")) {
      navigate("/audiocall", {
        state: {
          callId: data.callId,
          userId: data.userId,
          role: "receiver",
          info: data.info
        }
      });
      callTone?.play?.();
    }
  }, [navigate, callTone]);

  const handleIncomingCallVideo = useCallback((data) => {
    if (data.userId === localStorage.getItem("myId")) {
      navigate("/v", { state: { callId: data.callId } });
      callTone?.play?.();
    }
  }, [navigate, callTone]);

  const handleGroupVideo = useCallback(async (data) => {
    if (await isMatchGroup(data)) {
      navigate("/groupvideocall", {
        state: {
          callId: data,
          isCaller: false,
          image: localStorage.getItem("myImage"),
          name: localStorage.getItem("myName")
        }
      });
      callTone?.play?.();
    }
  }, [navigate, callTone]);

  const handleGroupAudio = useCallback(async (data) => {
    if (await isMatchGroup(data)) {
      navigate("/groupaudiocall", {
        state: {
          callId: data,
          isCaller: false,
          image: localStorage.getItem("myImage"),
          name: localStorage.getItem("myName")
        }
      });
      callTone?.play?.();
    }
  }, [navigate, callTone]);

  /** Attach socket listeners */
  useSocketNavigation("incoming_call_a", handleIncomingCallAudio);
  useSocketNavigation("incoming_call_v", handleIncomingCallVideo); // changed to cleaner name
  useSocketNavigation("join_room", handleGroupVideo);
  useSocketNavigation("join_audio_room", handleGroupAudio);

  /** Reload data trigger */
  const reloadData = (t = "c") => setLoadData(`${t}_${Date.now()}`);

  if (loading)
    return (
      <div className='w-full h-screen flex justify-center items-center'>
        Loading...
      </div>
    );

  if (!posts.length || !postId)
    return (
      <div className='w-full h-screen flex justify-center items-center'>
        <h1 className='text-4xl'>This post has been deleted</h1>
      </div>
    );

  return (
    <div>
      <Navbar />
      <div className="flex flex-col items-center">
        {posts.map(post => (
          <PostCard
            key={post._id}
            data={post}
            friends={friends}
            onReturn={reloadData}
          />
        ))}
      </div>
    </div>
  );
};

export default GetPostByNotification;

/** ---------- POST CARD COMPONENT ---------- **/
const PostCard = ({ data, friends, onReturn }) => {
  const location = useLocation();
  const _id_ = localStorage.getItem("myId");

  const getTop3React = (reactArray = []) => {
    const reactObject = {};
    reactArray.forEach(item => {
      reactObject[item.type] = (reactObject[item.type] || 0) + 1;
    });
    return Object.entries(reactObject)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const showPlate = (e, index) => {
    const Plate = document.getElementById(`react_plate_${index}`);
    if (!Plate) return;
    if (e) {
      Plate.classList.remove("hidden");
      Plate.classList.add("flex");
    } else {
      Plate.classList.remove("flex");
      Plate.classList.add("hidden");
    }
  };

  const myLike = data?.likes?.find((like) => String(like.user) === String(_id_));

  return (
    <div className="mx-auto w-full sm:w-7/12 md:h-auto rounded-lg border p-2 backdrop-blur-md my-5 bg-slate-900">
      {/* Header */}
      <div className='flex items-center gap-2 border-b-2 border-cyan-700 mb-3 pb-1'>
        <img
          className='w-10 h-10 rounded-full'
          src={data?.postOwner?.image}
          alt='user'
        />
        <h4>{data?.postOwner?.name}</h4>
      </div>

      {/* Caption */}
      <div className='my-2'>
        <Seemore text={data?.caption} range={200} />
      </div>

      {/* Media */}
      {data?.image ? (
        <img
          className='rounded-md w-full max-h-96 object-fill'
          src={data.media}
          alt="post"
        />
      ) : (
        <video
          src={data.media}
          controls
          loop
          className='rounded-md w-full max-h-96 object-fill'
        />
      )}

      {/* Footer */}
      <footer className="mt-2">
        <div className="flex justify-between items-center mb-2">
          {/* Top reactions */}
          <span className='flex items-center gap-1'>
            {getTop3React(data?.likes).map(([type]) => (
              <img
                key={type}
                src={`./assets/react_icons/${type === "love" ? "heart" : type}.png`}
                className="w-5 h-5"
                alt={type}
              />
            ))}
            <span>{formatNumber(data?.likes?.length)}</span>
          </span>
          <span>share {formatNumber(data?.share?.length)}</span>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-1">
          {/* Like */}
          <div className="post_footer w-4/12 cursor-pointer">
            <div
              onMouseEnter={() => showPlate(true, data._id)}
              onMouseLeave={() => showPlate(false, data._id)}
            >
              <ReactPlate
                index={data._id}
                postId={data?._id}
                type="post"
                color={"bg-zinc-900"}
                onReturn={onReturn}
              />
              {myLike ? (
                <img
                  src={`./assets/react_icons/${myLike.type === "love" ? "heart" : myLike.type}.png`}
                  className="w-8 h-8"
                  alt="my-like"
                />
              ) : (
                <img
                  src="./assets/react_icons/beforelike.png"
                  className="w-8 h-8"
                  alt="before-like"
                />
              )}
            </div>
          </div>

          {/* Comment */}
          <Link
            to="/commentplate"
            state={{ post_id: data?._id }}
            className="post_footer w-4/12 flex justify-center items-center"
            onClick={() => localStorage.setItem("back_page", location.pathname)}
          >
            <MessageSquareIcon />
            <span className="ml-1">{formatNumber(data?.comments?.length)}</span>
          </Link>

          {/* Share */}
          <span className="post_footer w-4/12 flex justify-end items-center">
            <Link to="/share" state={{ friends, post: data?._id }}>
              <Share2 />
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
};
