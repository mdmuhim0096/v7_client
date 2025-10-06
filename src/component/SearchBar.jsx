import { useState, useEffect } from "react";
import axios from "axios";
import { server_port } from "./api";
import Seemore from "./Seemore";
import { useNavigate } from "react-router-dom";

const SearchBar = ({ isMobile = false }) => {
    const [isShow, setIsShow] = useState(false);
    const searchTypes = ["people", "group", "post"];
    const [type, setType] = useState("");
    const [value, setValue] = useState(" ");
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!type || !value.trim()) {
                setData([]);
                return;
            }

            try {
                const res = await axios.get(`${server_port}/api/${type}/${value}`);
                setData(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        const timer = setTimeout(fetchData, 400);
        return () => clearTimeout(timer);
    }, [type, value]);

    return (
        <div
            className={`justify-between items-center gap-2 sm:flex backdrop-blur-lg  ${isMobile === true && isShow === true ? "absolute left-0 top-0 z-10" : ""} w-full`}
        >
            <span className="relative">
                <input
                    type="search"
                    placeholder="search here"
                    className={`p-[5.5px] placeholder:text-[16px] ${isMobile ? "w-full" : ""}`}
                    onFocus={() => setIsShow(true)}
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value);
                    }}
                />
                <span
                    className={`w-6 h-6 absolute right-0 top-0 transform -translate-y-[10%] sm:hidden ${!value.trim() ? "hidden" : ""}`}
                    onClick={() => { setIsShow(false); setValue("") }}
                ></span>
            </span>

            <div className={`${isShow ? "flex gap-2" : "hidden"}`}>
                {searchTypes.map((item) => (
                    <span
                        key={item}
                        onClick={() => setType(item)}
                        className={`cursor-pointer px-2 py-1 rounded 
              ${type === item ? "bg-gray-200 font-bold text-black" : ""}`}
                    >
                        {item}
                    </span>
                ))}
            </div>

            {/* search result box */}
            {data.length > 0 && (
                <div
                    className={`flex flex-col w-full p-2 h-[90vh] top-12 absolute overflow-y-auto ${isMobile === true ? "bg-zinc-900" : "backdrop-blur-md"}`}
                >
                    {data.map((item, index) => (
                        type == "post" ?
                            <PostCard item={item} index={index} key={index} /> :
                            type == "people" ?
                                <People item={item} key={index} /> :
                                <Group item={item} key={index} />
                    ))}
                </div>
            )}
        </div>
    );
};


function PostCard({ item }) {
    const navigate = useNavigate();
    function showDetails(postId) {
        navigate("/get_post_by_notification", { state: { postId } })
    }
    return (<div
        className="w-full h-auto border rounded-lg my-3 cursor-pointer"
        onClick={() => { showDetails(item?._id) }}
    >
        <div className="flex items-center p-2 gap-3">
            <img src={item?.postOwner?.image} className="w-10 h-10 rounded-full" />
            <h4>{item?.postOwner?.name}</h4>
        </div>

        <h4 className="mb-3 px-2">
            <Seemore text={item?.caption} range={100} />
        </h4>
        {
            item?.video === true ?
                <video
                    src={item?.media}
                    autoPlay
                    muted
                    loop
                    className="w-full h-52 object-fill rounded-lg"
                ></video>
                :
                <img
                    src={item?.media}
                    className="w-full h-52 object-fill rounded-lg"
                />
        }
    </div>)
}

function People({ item }) {
    const navigate = useNavigate();

    function showDetails(id) {
        navigate("/publicprofile", { state: { id } })
    }

    return (
        <div
            className="flex items-center gap-3 cursor-pointer w-full h-auto p-2"
            onClick={() => { showDetails(item?._id) }}
        >
            <img src={item?.image} className="w-12 h-12 rounded-full" />
            <h4>{item?.name}</h4>
        </div>
    )
}

function Group({ item }) {
    const navigate = useNavigate();
    function showDetails(id) {
        navigate("/", { state: {} });
    }
    return (
        <div
            className="flex items-center gap-3 cursor-pointer w-full h-auto p-2"
            onClick={() => { showDetails(item?._id) }}
        >
            <img src={item?.groupImage} className="w-12 h-12 rounded-full" />
            <h4>{item?.name}</h4>
        </div>
    )
}

export default SearchBar;
