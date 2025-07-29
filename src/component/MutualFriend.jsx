import React from 'react';
import { useLocation, Link, useNavigate } from "react-router-dom";
import { MoveLeft } from "lucide-react";

const MutualFriend = () => {
    const location = useLocation();
    const { friends, id } = location?.state || {};
    const navigate = useNavigate();

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