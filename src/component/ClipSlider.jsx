import axios from "axios";
import { useEffect, useState } from "react";
import { server_port } from "./api";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ClipSlider = () => {
    const [clips, setClips] = useState([]);
    const myId = localStorage.getItem("myId");
    const navigate = useNavigate();

    const [start, setStart] = useState(0);
    const width = window.innerWidth;
    const itemsPerView = width < 769 ? 2 : 3;

    useEffect(() => {
        const getClips = async () => {
            try {
                const res = await axios.get(`${server_port}/api/post/getclips/${myId}`);
                setClips(res.data?.clip || []);
            } catch (err) {
                console.error("Error fetching clips:", err);
            }
        };
        getClips();
    }, [myId]);

    const slideRight = () => {
        if (start + itemsPerView < clips.length) {
            setStart((prev) => prev + itemsPerView);
        }
    };

    const slideLeft = () => {
        if (start > 0) {
            setStart((prev) => Math.max(prev - itemsPerView, 0));
        }
    };

    const visibleClips = clips.slice(start, start + itemsPerView);

    const clipEach = (id) => {
        const index = clips.findIndex(clip => clip?._id === id);
        navigate("/clips", {
            state: { index, id }
        })
    };

    return (
        <div className="relative w-full h-52 sm:h-60 md:h-72 flex items-center justify-between overflow-hidden">
            <ChevronLeft
                className="w-7 h-7 ml-3 transition rounded-full duration-150 hover:ml-2 hover:scale-110 cursor-pointer z-10"
                onClick={slideLeft}
            />

            <div className="w-full h-full flex items-center justify-start relative z-0">
                {visibleClips.map((clip, index) => (
                    <video
                        key={clip?._id || index}
                        src={clip?.media}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="h-full w-[50%] md:w-[33.33%] rounded-lg border border-slate-600 bg-black object-cover"
                        onClick={() => { clipEach(clip?._id) }}
                    />
                ))}
            </div>

            <ChevronRight
                className="w-7 h-7 mr-3 transition rounded-full duration-150 hover:mr-2 hover:scale-110 cursor-pointer z-10"
                onClick={slideRight}
            />
        </div>
    );
};

export default ClipSlider;

// import axios from "axios";
// import { useEffect, useState, useMemo } from "react";
// import { server_port } from "./api";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { useNavigate } from "react-router-dom";

// const ClipSlider = () => {
//     const [clips, setClips] = useState([]);
//     const [start, setStart] = useState(0);
//     const [windowWidth, setWindowWidth] = useState(window.innerWidth);
//     const myId = localStorage.getItem("myId");
//     const navigate = useNavigate();

//     // handle window resize
//     useEffect(() => {
//         const handleResize = () => setWindowWidth(window.innerWidth);
//         window.addEventListener("resize", handleResize);
//         return () => window.removeEventListener("resize", handleResize);
//     }, []);

//     const itemsPerView = windowWidth < 769 ? 2 : 3;

//     useEffect(() => {
//         const getClips = async () => {
//             try {
//                 const res = await axios.get(`${server_port}/api/post/getclips/${myId}`);
//                 setClips(res.data?.clip || []);
//             } catch (err) {
//                 console.error("Error fetching clips:", err);
//             }
//         };
//         if (myId) getClips();
//     }, [myId]);

//     const slideRight = () => {
//         if (start + itemsPerView < clips.length) {
//             setStart((prev) => prev + itemsPerView);
//         }
//     };

//     const slideLeft = () => {
//         if (start > 0) {
//             setStart((prev) => Math.max(prev - itemsPerView, 0));
//         }
//     };

//     // memoize visible clips for performance
//     const visibleClips = useMemo(
//         () => clips.slice(start, start + itemsPerView),
//         [clips, start, itemsPerView]
//     );

//     const clipEach = (id) => {
//         const index = clips.findIndex((clip) => clip?._id === id);
//         if (index !== -1) {
//             navigate("/clips", {
//                 state: { index, id },
//             });
//         }
//     };

//     return (
//         <div className="relative w-full h-52 sm:h-60 md:h-72 flex items-center justify-between overflow-hidden">
//             {/* Left arrow */}
//             <ChevronLeft
//                 tabIndex={0}
//                 aria-label="Previous clips"
//                 className="w-7 h-7 ml-3 transition rounded-full duration-150 hover:ml-2 hover:scale-110 cursor-pointer z-10"
//                 onClick={slideLeft}
//             />

//             {/* Clips */}
//             <div className="w-full h-full flex items-center justify-start relative z-0">
//                 {visibleClips.map((clip) => (
//                     <video
//                         key={clip?._id}
//                         src={clip?.media}
//                         autoPlay
//                         loop
//                         muted
//                         playsInline
//                         className={`h-full ${itemsPerView === 2 ? "w-1/2" : "w-1/3"
//                             } rounded-lg border border-slate-600 bg-black object-cover`}
//                         onClick={() => clipEach(clip?._id)}
//                     />
//                 ))}
//             </div>

//             {/* Right arrow */}
//             <ChevronRight
//                 tabIndex={0}
//                 aria-label="Next clips"
//                 className="w-7 h-7 mr-3 transition rounded-full duration-150 hover:mr-2 hover:scale-110 cursor-pointer z-10"
//                 onClick={slideRight}
//             />
//         </div>
//     );
// };

// export default ClipSlider;
