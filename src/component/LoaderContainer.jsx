import React, { useEffect, useState } from 'react'
import { Loader } from "lucide-react";

const LoaderContainer = ({ type, loadEnd }) => {
    const loadDot = [".", "..", "..."];
    const [loadIndex, setLoadIndex] = useState(0);

    useEffect(() => {
        if (type === "upload" && !loadEnd) {
            const interval = setInterval(() => {
                setLoadIndex((prev) => (prev + 1) % loadDot.length);
            }, 400); // faster bounce
            return () => clearInterval(interval);
        }
    }, [type, loadEnd]);
    return (
        <div className={`${loadEnd === true ? "hidden" : ""} `}>
            {
                type === "load" ? <div className='w-full h-full z-50 absolute top-0 left-0 flex justify-center items-center backdrop-blur-md'>
                    <Loader className="animate-speed text-white w-8 h-8" />
                </div> : type === "upload" ? <div className='w-32 h-7 rounded-md animated-gradient flex items-center justify-evenly'><Loader className='animate-speed'/><span className='w-[70%] capitalize'><span>uploading</span><span className='relative bottom-[3px] left-[3px]'>{loadDot[loadIndex]}</span></span></div> : null
            }
        </div>
    )
}

export default LoaderContainer;