import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Seemore from './Seemore';
import { server_port, send_request_api, myfriends_api } from './api';
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Ellipsis, X, Share2, MessageSquareIcon, ThumbsUp, Copy, CopyCheck, MoveLeft, MoveRight } from "lucide-react";
import { formatNumber } from '../utils/formatenumber';
import socket from "./socket";
import {tone} from "../utils/soundprovider";

const Publicprofile = () => {
    const navigate = useNavigate();
    const {callTone} = tone;
    const location_ = useLocation();
    const userId = location_.state?.id;
    const [load, setLoad] = useState(0);
    const [posts, setPost] = useState([]);
    const [user, setUser] = useState("");
    const [requsetStatus, setStatus] = useState("");
    const [friends, setFriends] = useState(null);

    if (!localStorage.getItem("isForword")) {
        localStorage.setItem("isForword", false);
    }

    
            useEffect(() => {
                const handleIncomingCall = (data) => {
                    if (data.userId === localStorage.getItem("myId")) {
                        navigate("/audiocall", { state: { callId: data.callId, userId: data.userId, role: "receiver", info: data.info } });
                        try {
                            if (callTone) {
                                callTone?.play();
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
        
                socket.on("incoming_call_a", handleIncomingCall);
                return () => {
                    socket.off("incoming_call_a", handleIncomingCall);
                }
            }, []);
        
            useEffect(() => {
                const handleIncomingCall = (data) => {
        
                    if (data.userId === localStorage.getItem("myId")) {
                        navigate("/v", { state: { callId: data.callId } });
                        try {
                            if (callTone) {
                                callTone?.play();
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    };
                }
        
                socket.on("____incoming_call____", handleIncomingCall);
                return () => {
                    socket.off("____incoming_call____", handleIncomingCall);
                };
        
            }, []);
      
          useEffect(() => {
              const handelRoom = async (data) => {
      
                  const isMatch = await isMatchGroup(data);
                  if (isMatch) {
                      navigate("/groupvideocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                      try {
                          if (callTone) {
                              callTone?.play();
                          }
                      } catch (error) {
                          console.log(error);
                      }
                  }
              }
      
              socket.on("join_room", handelRoom);
              return () => {
                  socket.off("join_room", handelRoom);
              }
          }, [])
      
          useEffect(() => {
              const handelRoom = async (data) => {
      
                  const isMatch = await isMatchGroup(data);
                  if (isMatch) {
                      navigate("/groupaudiocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                      try {
                          if (callTone) {
                              callTone?.play();
                          }
                      } catch (error) {
                          console.log(error);
                      }
                  }
              }
      
              socket.on("join_audio_room", handelRoom);
              return () => {
                  socket.off("join_audio_room", handelRoom);
              }
          }, []);
        

    const isForWord = localStorage.getItem("isForword") === true || localStorage.getItem("isForword") === "true";

    const [isCopy, setIsCopy] = useState(false);
    const notify = (m) => { toast.success(m) };

    async function get_all_information() {
        const res_ = await axios.get(server_port + `/api/post/randompost/${userId}`);
        const _res = await axios.get(server_port + `/api/people/randomuser/${userId}`);
        setUser(_res.data.user);
        setPost(res_.data.posts);
        const ___res = await axios.get(server_port + `/api/friend/checkIsFriend/${localStorage.getItem("myId")}/${userId}`);
        setStatus(___res.data.status);
    }

    useEffect(() => {
        get_all_information();
        const get_my_friends = async () => {
            const res = await axios.get(myfriends_api, { withCredentials: true });
            setFriends(res.data.data);
        }
        get_my_friends()
    }, []);

    async function sendFriendRquest(receiverId) {
        const res = await axios.post(send_request_api, { receiverId }, { withCredentials: true });
        setStatus(res.data.status);
        setLoad(load + 1)
    }

    function addLike() {
        axios.post(server_port + "/api/people/profileLike", { userId })
        setLoad(load + 1)
    }

    async function getPublicPost() {
        try {
            const res = await axios.get(server_port + "/api/post/publicpost", { withCredentials: true });
            setPost(res.data.posts);
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getPublicPost();
    }, []);

    function doLike(postId) {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    }

    return (
        <div>
            <div className='w-full h-auto flex justify-between items-center sticky top-0 z-40 px-2 bg-zinc-900'>
                <MoveLeft onClick={() => { navigate(localStorage.getItem("back_page")); localStorage.setItem("isForword", false); }} />
                {isForWord ? <MoveRight onClick={() => { navigate("/mutualfriends", { state: { id: user._id, friends: user?.friends } }); localStorage.setItem("back_page_", "/publicprofile") }} /> : null}
            </div>
            <div className='text-white p-2'>

                <div className='w-full h-full overflow-hidden flex justify-center items-center '>
                    <img src={user?.image} className='absolute z-50 mt-10 w-96 h-96 rounded-full' />
                    <div className="h-screen w-full"></div>
                </div>
                <div className='h-auto flex justify-between items-center'>
                    <div className=''>
                        <h4 className='text-5xl font-semibold'>{user?.name}</h4>
                    </div>
                    <div>
                        <div className=''>
                            <button className={requsetStatus === "accepted" ? "hidden" : ""} onClick={() => {
                                sendFriendRquest(userId);
                            }}>{requsetStatus}</button>
                        </div>
                    </div>
                    <div>
                        <h1 className='cursor-pointer' onClick={() => { addLike() }}>Likes: {user?.like}</h1>
                    </div>
                </div>
                <hr className='w-full h-[2px] bg-indigo-900 my-5 border-none' />
                <div className='grid md:grid-cols-2 lg:grid-cols-3 my-5 gap-5'>
                    <div className='p-[3px] border w-full h-[87.5px] rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
                        <div className='bg-slate-800 h-auto w-full rounded-md p-1'>
                            <span className='flex items-center justify-start gap-3'>
                                <h1>Email:- <span className='italic text-indigo-600'>{user?.email}</span></h1>
                                <span className='scale-75 cursor-pointer' onClick={() => {
                                    navigator.clipboard.writeText(user?.email);
                                    setIsCopy(true);
                                    notify(`copied  ${user?.email}`);
                                    setTimeout(() => { setIsCopy(false) }, 1000);
                                }}>{!isCopy ? <Copy /> : <CopyCheck />}</span>
                            </span>
                            <h4 className=''>Age:- {user?.age}</h4>
                            <h4 className=''>Gender:- {user?.gender}</h4>
                        </div>
                    </div>
                    <div className='p-[3px] border w-full h-[87.5px] rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center'>
                        <div className='bg-slate-800 h-full w-full rounded-md p-1'>
                            <h1>Friends</h1>
                            <Link
                                to={"/mutualfriends"}
                                state={{ friends: user?.friends, id: userId }}
                                className='my-3 flex justify-start items-center'
                                onClick={() => { localStorage.setItem("back_page_", location_.pathname); localStorage.setItem("isForword", true); }}
                            >{user?.friends?.map((data, index) => (
                                <img key={index} className={`w-5 h-5 rounded-full ${index > 0 ? "-ml-2" : ""}`} src={data?.image} />
                            ))}</Link>
                        </div>
                    </div>
                    <div className='p-[3px] border w-full rounded-lg bg-gradient-to-r from-green-400 to-blue-500 flex justify-center items-center max-h-auto'>
                        <div className='bg-slate-800 h-full w-full rounded-md p-1 max-h-auto'>
                            <h1>Bio</h1>
                            <p></p>
                        </div>
                    </div>
                </div>
                <div className='relative'>
                    <h1 className='text-xl capitalize'>{user?.gender === "male" ? "his" : "shis"} posts</h1>
                    <div>{posts?.length === 0 ? <span className='text-3xl text-gray-600 text-center block capitalize font-bold my-5'>no posts</span> : <div className='w-full md:w-7/12'>
                        {
                            posts.map((data, index) => (
                                <div key={index} className='mx-auto w-full h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>
                                    <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                                        <div className='flex justify-between items-center gap-2'>
                                            <img className='w-10 h-10 rounded-full' src={data?.postOwner?.image} />
                                            <h4>{data?.postOwner?.name}</h4>
                                        </div>
                                        <div className='flex justify-between items-center gap-2'>
                                            <span>
                                                <Ellipsis size={48} strokeWidth={1.5} absoluteStrokeWidth />
                                            </span>
                                            <span className='hover:text-red-500'>
                                                <X />
                                            </span>
                                        </div>
                                    </div>
                                    <div className='my-2'>
                                        <Seemore text={data.caption} range={200} />
                                    </div>
                                    {data.image && !data.video ? <img src={data?.media} className='w-full h-full rounded-md' /> : <video src={data?.media} controls loop ></video>}
                                    <footer className='flex w-full justify-between items-end h-10'>
                                        <span onClick={() => {
                                            doLike(data?._id)
                                            setLoad(load + 1);
                                        }} className='post_footer w-4/12'>
                                            <ThumbsUp />
                                            <span>{data?.likes?.length}</span>
                                        </span>
                                        <Link
                                            to={"/commentplate"}
                                            state={{ post_id: data?._id, id: userId }}
                                            className='post_footer w-4/12 justify-center'
                                            onClick={() => { localStorage.setItem("back_page", location_.pathname) }}
                                        >
                                            <MessageSquareIcon />
                                            <span>{formatNumber(data?.comments?.length)}</span>
                                        </Link>
                                        <Link
                                            to={"/share"} state={{ friends, post: data?._id }}
                                            className='w-4/12 flex justify-end'
                                        >
                                            <Share2 />
                                        </Link>
                                    </footer>
                                </div>
                            ))
                        }
                    </div>}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Publicprofile;