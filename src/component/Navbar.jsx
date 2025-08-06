import React, { useState, useEffect } from 'react'
import { BookOpen, AppWindow, Send, Bell, Users, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";
import socket from "./socket";
import { server_port } from './api';

const Navbar = () => {
    const [numberofreq, setNumberOfReq] = useState(0);
    const [numberofnoti, setNumberOfNoti] = useState([]);
    const myId = localStorage.getItem("myId");

    const getnumber = async () => {
        const res = axios.get(server_port + "/api/friend/counter_req", { withCredentials: true });
        setNumberOfReq((await res).data.totalreq.length);

        const res_ = await axios.get(server_port+`/api/noti/noti_number/${myId}`);
        const _res_ = await axios.get(server_port +`/api/noti/noti_number_/${myId}`);
        setNumberOfNoti([...res_.data.mynumber, ..._res_.data.mynumber]);
    };

    useEffect(() => {
        getnumber();
        const loadData = (e) => { getnumber()};
        socket.on("comment", loadData);
        return () => {
            socket.off("comment", loadData);
        };
    }, []);

    const reset = (_type) => {
        axios.post(server_port + "/api/friend/reset_counter_req", { _type }, { withCredentials: true });
    }

    return (
        <div className='text-white w-full sm:w-6/12 flex justify-between items-center p-2 rounded-md bg-zinc-900 border-b-2 border-teal-700'>
            <Link to={"/"}><BookOpen /></Link>
            <Link to={"/publicVideo"}><AppWindow /></Link>
            <Link to={"/chatroom"}><Send/></Link>
            <Link className='relative' to={"/notification"} onClick={(() => {
                reset("notifications");
            })}>
                <Bell />
                <div className={`absolute top-0 z-10 p-1 rounded-full bg-green-800 w-5 h-5 justify-center items-center text-xs left-1/3 ${numberofnoti.length > 0 ? "flex" : "hidden"}`}>{numberofnoti.length}</div>
            </Link>
            <Link to={"/friends"}>
                <Users />
            </Link>
            <Link to={"/accepts"} className='relative' onClick={(() => {
                reset("friendrequest");
            })}>
                <UserPlus />
                <div className={`absolute top-0 z-10 p-1 rounded-full bg-green-800 w-5 h-5 flex justify-center items-center text-xs left-1/3 ${numberofreq > 0 ? "flex" : "hidden"}`}>{numberofreq}</div>
            </Link>
        </div>
    );
};

export default Navbar