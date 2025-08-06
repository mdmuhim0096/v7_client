import React, { useState, useEffect } from 'react'
import axios from 'axios';
import { server_port } from './api';
import socket from "./socket";
import {tone} from "../utils/soundprovider";
import { isMatchGroup } from '../utils/utils';
import { useNavigate } from 'react-router-dom';

const Removemember = () => {
    const navigate = useNavigate();
    const {callTone} = tone;
    const [members, setMembers] = useState([]);
    const [load, setLoad] = useState(0);
    useEffect(() => {
        const getMembers = async () => {
            await axios.get(server_port + "/api/group/members/"+localStorage.getItem("groupId")).then(res => {
                setMembers(res.data.members);
            })
        }
        getMembers();

    }, [load]);

    async function remove(userId){
        axios.post(server_port + "/api/group/removemember/" + localStorage.getItem("groupId"), {userId})
        setLoad(load + 1)
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
        <div>{
            members.map((data, index) => (
                <div key={index}>
                   <div>
                    <img src={server_port + data.userId.image} />
                    <h4>{data.userId.name}</h4>
                    </div>
                    <button onClick={() =>{remove(data.userId._id)}}>remove</button>
                </div>
            ))
        }</div>
    )
}

export default Removemember