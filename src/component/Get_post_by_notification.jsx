import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Share2, MessageSquareIcon, ThumbsUp } from "lucide-react";
import Seemore from './Seemore';
import { server_port } from './api';
import Navbar from "./Navbar";
import { formatNumber } from '../utils/formatenumber';
import { isMatchGroup } from '../utils/utils';
import {tone} from "../utils/soundprovider";
import socket from "./socket";

const Get_post_by_notification = () => {
    const {callTone} = tone;
    const navigate = useNavigate();
    const _location_ = useLocation();
    const postId = _location_.state?.postId;
    const [posts, setPost] = useState([]);

    const [commentSum, setComentSum] = useState(0);
    useEffect(() => {
        try {
            const getPublicPost = async () => {
                const res = await axios.get(server_port + `/api/post/getpostbyid/${postId}`);
                setPost(Array.isArray(res.data.post) ? res.data.post : [res.data.post]);
                await axios.get(server_port + `/api/post/postinfo/${postId}`).then(res => {
                    setComentSum(res?.data?.singlePost?.comments?.length)
                })
            }
            getPublicPost();
        } catch (error) {
            console.log(error);
        }
    }, []);

    
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

    const doLike = (postId) => {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    }

    return (
        <div className=''>
            <Navbar />
            {posts.length === 0 || !postId ? <div className='w-full h-screen flex justify-center items-center'>
                <h1 className='text-4xl'>This post has been deleted</h1>
            </div> :
                <div>
                    {
                        Array.isArray(posts) && posts.map((data, index) => (
                            <div key={index} className={`mx-auto w-full sm:w-7/12 md:h-[88vh] lg:h-[82vh] rounded-lg border p-2 backdrop-blur-md my-5 bg-slate-900 h-[430px]`}>
                                <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3 pb-1'>
                                    <div className='flex justify-between items-center gap-2'>
                                        <img className='w-10 h-10 rounded-full' src={data?.postOwner?.image} />
                                        <h4>{data?.postOwner?.name}</h4>
                                    </div>
                                </div>
                                <div className='my-2'>
                                    <Seemore text={data?.caption} range={200} />
                                </div>
                                {data.image && !data.video ? <img className='rounded-md w-full max-h-96 object-fill h-[280px]  md:h-[58vh]' src={data?.media} /> : <video src={data?.media} controls loop className='h-[280px] w-full object-fill md:h-[58vh]'></video>}
                                <footer className='flex w-full justify-between items-end border-t h-10'>
                                    <span onClick={() => {
                                        doLike(data._id)
                                    }} className='post_footer w-4/12 border-e'>
                                        <ThumbsUp />
                                        <span>Like</span>
                                        <span>{formatNumber(data?.likes?.length)}</span>
                                    </span>

                                    <Link
                                        onClick={() => { localStorage.setItem("back_page", _location_.pathname) }}
                                        to={"/commentplate"}
                                        state={{ post_id: data?._id }}
                                        className='post_footer w-4/12 border-e justify-center'
                                    >
                                        <MessageSquareIcon />
                                        <span>comments</span>
                                        <span>{formatNumber(data?.comments?.length)}</span>
                                    </Link>

                                    <span className='post_footer w-4/12  justify-end'>
                                        <Share2 />
                                        <span>share</span>
                                    </span>
                                </footer>
                            </div>
                        ))
                    }</div>}
        </div>
    )
};

export default Get_post_by_notification;