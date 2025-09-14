import React, { useState } from 'react'

const Force = () => {
    const _width_ = window.innerWidth;
    const [isClick, setIsClick] = useState(false);
    return (
        <div className={`${_width_ <= 620 && !isClick ? "block" : "hidden"} w-full h-screen z-50 fixed flex justify-center items-center bg-zinc-900 px-4`}>
            <div className='relative w-full h-auto rounded-md border-2 border-emerald-800'>
                <button onClick={() => {setIsClick(goFullscreen())}}>click</button>
            </div>
        </div>
    )
}

export default Force;