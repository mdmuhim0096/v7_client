import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from "react-router-dom";
import { MoveLeft } from "lucide-react";
import { tone } from "../utils/soundprovider";
import { isMatchGroup } from '../utils/utils';
import socket from "./socket";

const MutualFriend = () => {
    const location = useLocation();
    const { friends, id } = location?.state || {};
    const navigate = useNavigate();
    const { callTone } = tone;

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

    return (<div>
        <div className='w-full h-screen py-5 px-2 gap-3'>
            <div className='flex flex-wrap gap-2'>
                {Array.isArray(friends) && friends.map((data, index) => (
                    <Link
                        to={"/publicprofile"}
                        state={{ id: data._id }} key={index}
                        className='w-full sm:w-[32%] h-12 flex items-center justify-between py-1 px-2 rounded-md hover:shadow-sm hover:shadow-blue-500 hover:gap-4 bg-zinc-900' title='go and send friend requiest'
                        onClick={() => { localStorage.setItem("back_page_", location.pathname) }}
                    >
                        <img src={data?.image} className='w-10 h-10 rounded-full' />
                        <h4>{data?.name}</h4>
                    </Link>
                ))}
            </div>
        </div>
        <h1 className='mx-auto'>{friends?.length <= 0 ? "user not fund" : null}</h1>
        <MoveLeft onClick={() => { navigate(localStorage.getItem("back_page_"), { state: { id } }) }} className='sticky bottom-2 left-2 cursor-pointer' />
    </div>);
}

export default MutualFriend;