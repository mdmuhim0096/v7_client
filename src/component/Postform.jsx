import React, { useState } from 'react'
import axios from 'axios'
import { createPost_api } from "./api";
import { Link, useNavigate } from 'react-router-dom';
import Navbar from "./Navbar";
import LoaderContainer from "./LoaderContainer";

const Postform = () => {
    const [media, setMedia] = useState(null);
    const [caption, setCaption] = useState("");
    const [loadEnd, setLoadEnd] = useState(true);
    const navigate = useNavigate();
    const handelPost = (e) => {
        e.preventDefault();
        setLoadEnd(false);
        const fd = new FormData();
        fd.append("media", media);
        fd.append("caption", caption);
        axios.post(createPost_api, fd, { withCredentials: true }).then(res => {
            setLoadEnd(true);
            navigate("/")
        })
    }

    return (
        <div className="flex flex-col items-center gap-20 p-6 h-screen">
            <Navbar />
            <LoaderContainer type={"upload"} loadEnd={loadEnd} />
            <div className="md:w-7/12 w-full md:p-0 px-4 overflow-hidden relative flex justify-center items-center h-auto mt-32" >
                <form onSubmit={handelPost}>
                    <textarea required placeholder='write your cation' onChange={(e) => { setCaption(e.target.value) }} value={caption}></textarea>
                    <input type="file" required id="file" onChange={(e) => { setMedia(e.target.files[0]) }} />
                    <button type="submit" id="clickBtn">post</button>
                    <Link className='underline mx-5' to={"/"}>back</Link>
                </form>
            </div>
        </div>
    )
}

export default Postform;