import React, { useEffect, useState } from 'react';
import axios from "axios";
import { friendlist_api, send_request_api, remove_friend } from './api';
import socket from './socket';
import Navbar from "./Navbar";
import { Link } from "react-router-dom";
import ShortText from './ShortText';
import { Plus } from 'lucide-react';
import LoaderContainer from './LoaderContainer';

const Friendlist = () => {
    const [friends, setFriends] = useState([]);
    const [endLoad, setEndLoad] = useState(true);

    useEffect(() => {
        const getAll_friend = async () => {
            try {
                setEndLoad(false);
                await axios.get(friendlist_api, { withCredentials: true }).then(res => {
                    setFriends(res.data.data);
                    setEndLoad(true);
                })
            } catch (error) {
                console.log(error)
            }
        }
        getAll_friend();
    }, [])

    const sendFriendRquest = async (receiverId) => {
        await axios.post(send_request_api, { receiverId }, { withCredentials: true });
    }

    const remove_user = (userId) => {
        axios.post(remove_friend, { userId }, { withCredentials: true })
    }

    return (
        <div className='text-white text-sm h-screen p-1 overflow-y-auto'>
            <LoaderContainer type={"load"} loadEnd={endLoad} />
            <div className='sticky top-0'>
                <Navbar />
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                {friends.map((data, index) => (
                    <div className='flex justify-between items-center w-full mx-auto rounded-md p-2 bg-indigo-950' key={index}>
                        <Link to={"/publicprofile"} state={{ id: data?._id }} className='flex justify-around items-center gap-5'>
                            <img className='w-12 h-12  md:w-20 md:h-20 rounded-full' src={data?.image} />
                            <ShortText text={data?.name} width={window.innerWidth} dot={3} range={3} />
                        </Link>

                        <div className='flex justify-around items-center gap-2 sm:gap-4'>
                            <button className='capitalize' onClick={(() => {
                                remove_user(data?._id)
                            })}>remove</button>
                            <button className='capitalize flex items-center justify-between' onClick={() => {
                                sendFriendRquest(data?._id)
                                socket.emit("__load_data__");
                            }}><span>friend</span> <Plus className='mx-1 w-4 h-4 inline' /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Friendlist;