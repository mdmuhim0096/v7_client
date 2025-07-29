import React, { useEffect, useState } from 'react';
import axios from "axios";
import { respond_request_api, server_port, rejected_api } from './api';
import Navbar from "./Navbar";
import { generateRoomId } from '../utils/roomId';
import LoaderContainer from './LoaderContainer';

const Accepfriends = () => {
    const [load, setLoad] = useState("");
    const [endLoad, setEndLoad] = useState(true)
    const [accepts, setAccept] = useState([]);
    useEffect(() => {
        const get_accept = async () => {
            try {
                setEndLoad(false);
                await axios.get(server_port + "/api/friend/friend_requests", { withCredentials: true }).then(res => {
                    setAccept(res?.data?.data);
                    setEndLoad(true);
                })
            } catch (error) {
                console.log(error);
            }
        }
        get_accept();
    }, [load]);

    const accept = (requestId, status) => {
        axios.post(respond_request_api, { requestId, status });
    };

    const reject = (requestId) => {
        axios.post(rejected_api, { requestId });
    }

    return (
        <div className='text-white h-screen overflow-y-auto'>
            <LoaderContainer type={"load"} loadEnd={endLoad}/>
            <div className='sticky top-0'>
                <Navbar />
            </div>

            {accepts?.length > 0 ?
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>{
                    accepts?.map((data, index) => (
                        <div className='flex justify-between items-center w-full sm:w-6/12 mx-auto rounded-md my-4 p-2 bg-indigo-950' key={index}>
                            <div className='flex justify-around items-center gap-5'>
                                <img className='w-12 h-12  md:w-20 md:h-20 rounded-full' src={data?.sender?.image} />
                                <h4>{data?.sender?.name}</h4>
                            </div>
                            <div className='flex justify-around items-center gap-3 sm:gap-5'>
                                <button onClick={() => {
                                    reject(data?._id);
                                    setLoad(generateRoomId());
                                }}>reject</button>
                                <button onClick={() => {
                                    accept(data?._id, "accepted")
                                    setLoad(generateRoomId());
                                }}>accept</button>
                            </div>
                        </div>
                    ))}
                </div> : <div className='w-full h-[90vh] flex flex-col items-center justify-center gap-2'>
                    <h1 className='font-extrabold text-4xl capitalize'>404</h1>
                    <h3 className='text-xl capitalize font-semibold'>no friend to accept</h3>
                </div>
            }
        </div>
    )
}

export default Accepfriends;