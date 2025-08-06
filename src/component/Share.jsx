import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from "react-router-dom";
import { server_port } from './api';
import axios from 'axios';
import ShortText from "./ShortText";
import { MoveLeft } from 'lucide-react';
import {tone} from "../utils/soundprovider";
import { isMatchGroup } from '../utils/utils';
import socket from "./socket";

const Share = () => {
    const {callTone} = tone;
    const friends = useLocation().state?.friends, postId = useLocation().state?.post;
    const [Groups, setGroup] = useState([]);

    useEffect(() => {
        const get_my_groups = async () => {
            try {
                const res = await axios.get(server_port + "/api/group/myGroup/" + localStorage.getItem("myId"));
                setGroup(res.data.groups.groups)
            } catch (error) {
                console.log(error);
            }
        }
        get_my_groups();

    }, []);

    const navigate = useNavigate();

    const getTime = () => {
        const time = new Date();
        const actual_time = time.toLocaleTimeString();
        const date = time.toDateString();
        return { actual_time, date };
    }

    const createChatShare = (recevireId, shareId) => {
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        const myId = localStorage.getItem("myId");
        axios.post(server_port + "/api/share/sharechat", { senderId: myId, shareId, recevireId, user: myId, realTime });
    }

    const createGroupShare = (shareId, group) => {
        const dateTime = getTime();
        const realTime = dateTime.date + " " + dateTime.actual_time;
        const myId = localStorage.getItem("myId");
        axios.post(server_port + "/api/share/sharegroup", { sender: myId, realTime, shareId, group, messageType: "share" });
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
    
    return (
        <div className='h-screen overflow-y-auto scroll-smooth p-2'>
            <h1 className='my-1 mb-2'>Friends</h1>
            <div className='flex items-center flex-wrap gap-2 mb-5'>
                {
                    friends.map((data, index) => (
                        <div key={index} className='w-full sm:w-[32%] h-12 flex items-center justify-between py-1 px-2 rounded-md hover:shadow-sm hover:shadow-blue-500 hover:gap-4 bg-zinc-900'>
                            <div className='flex items-center justify-between gap-3'>
                                <img src={data?.image} className='w-12 h-12 rounded-full' />
                                <h5>
                                    <ShortText text={data?.name} width={window.innerWidth} range={4} dot={3} />
                                </h5>
                            </div>
                            <div className='w-[20%] border-s border-zinc-800 cursor-pointer text-center hover:border-blue-500 duration-150' onClick={() => { createChatShare(data?._id, postId) }}>send</div>
                        </div>
                    ))
                }
            </div>
            <hr />
            <h1 className='my-1'>Groups</h1>

            <div className='flex items-center flex-wrap gap-2 mt-5'>
                {
                    Groups.map((data, index) => (
                        <div key={index} className='w-full sm:w-[32%] h-12 flex items-center justify-between py-1 px-2 rounded-md hover:shadow-sm hover:shadow-teal-500 hover:gap-4 bg-zinc-900'>
                            <div className='flex items-center justify-between gap-3'>
                                <img src={data?.groupImage} className='w-12 h-12 rounded-full' />
                                <h4>
                                    <ShortText text={data?.name} width={window.innerWidth} range={4} dot={3} />
                                </h4>
                            </div>
                            <div className='w-[20%] border-s border-zinc-800 cursor-pointer text-center hover:border-teal-500 duration-150' onClick={() => { createGroupShare(postId, data?._id) }}>send</div>
                        </div>
                    ))
                }
            </div>

            <div onClick={() => { navigate("/") }} className='fixed bottom-1 w-10 flex justify-center items-start bg-zinc-800 rounded-md px-2 py-1 hover:bg-zinc-700 cursor-pointer'>
                <MoveLeft />
            </div>
        </div>
    )
}

export default Share;