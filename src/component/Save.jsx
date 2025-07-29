import React, { useEffect, useState, useRef } from 'react'
import { server_port } from './api';
import { Ellipsis, X, Share2, MessageSquareIcon, ThumbsUp, Rocket } from "lucide-react";
import Seemore from './Seemore';
import { Link, useLocation } from "react-router-dom";
import { ToastContainer } from 'react-toastify';

import axios from "axios";
import Navbar from "./Navbar";
import { formatNumber } from '../utils/formatenumber';

const Save = () => {
    const location = useLocation();
    const [saves, setSave] = useState([]);

    useEffect(() => {
        const getSave = async () => {
            const myId = localStorage.getItem("myId");
            const res = await axios.get(server_port + "/api/save/save/" + myId);
            setSave(res.data.save);
        }
        getSave();
    }, []);

    const doLike = (postId) => {
        axios.post(server_port + "/api/post/addlike", { postId }, { withCredentials: true })
    }

    const remove_post = (postId) => {
        axios.post(server_port + "/api/people/remove_post", { postId }, { withCredentials: true });
    };

    return (
        <div className='w-full h-screen overflow-y-auto' >
            <div className='sticky top-0 z-40'>
                <Navbar />
            </div>
            <ToastContainer />
            {
                saves?.map((data, index) => (
                    <div key={index} className='sm:w-6/12 mx-auto w-full h-auto rounded-lg p-2 backdrop-blur-md my-5 bg-slate-900'>


                        <div className='flex justify-between items-center border-b-2 border-cyan-700 mb-3'>
                            <div className='flex justify-between items-center gap-2'>
                                <img className='w-10 h-10 rounded-full' src={data?.postId?.postOwner?.image} />
                                <h4>{data.postId.postOwner.name}</h4>
                            </div>
                            <div className='flex justify-between items-center gap-2'>
                                <span onClick={() => { setIdForSave(data?._id) }}>
                                    <Ellipsis size={48} strokeWidth={1.5} absoluteStrokeWidth />
                                </span>
                                <span onClick={() => {
                                    remove_post(data?._id);
                                }} className='hover:text-red-500'>
                                    <X />
                                </span>
                            </div>
                        </div>
                        <div className='my-2'>
                            <Seemore text={data.postId.caption} range={200} />
                        </div>
                        {data?.postId?.image && !data?.postId?.video ? <img className='rounded-md w-full max-h-96 object-fill' src={data?.postId?.media} /> : <video src={data?.postId?.media} controls loop className='object-fill w-full h-[250px] sm:h-[300px] md:h-[350px] rounded-lg' ></video>}
                        <footer className='flex w-full justify-between items-end h-10'>
                            <span onClick={() => {
                                doLike(data._id)
                            }} className='post_footer w-4/12 '>
                                <ThumbsUp />
                                <span>{data?.postId?.likes?.length}</span>
                            </span>
                            <Link
                                to={"/commentplate"}
                                state={{ post_id: data?.postId?._id }}
                                className='post_footer w-4/12 justify-center'
                                onClick={() => { localStorage.setItem("back_page", location.pathname) }}
                            >
                                <MessageSquareIcon />
                                <span>{formatNumber(data?.postId?.comments?.length)}</span>
                            </Link>
                            <span className='post_footer w-4/12 justify-end'>
                                <Share2 />
                            </span>
                        </footer>
                    </div>
                ))
            }
        </div>
    )
}

export default Save;