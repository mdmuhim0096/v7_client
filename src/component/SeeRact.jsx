import axios from 'axios';
import { useEffect, useState, useMemo } from 'react';
import { server_port } from './api';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatNumber } from '../utils/formatenumber';

const SeeRact = () => {
    const postId = useLocation()?.state?.postId || {};
    const [reacts, setReacts] = useState([]);
    const [reactDetails, setReactDetails] = useState([]);
    const navigate = useNavigate();
    const [userId, setUserId] = useState();

    // ✅ compute grouped reactions only when reacts changes
    const readyForShow = useMemo(() => {
        const groups = [
            reacts.filter(item => item?.type === 'like'),
            reacts.filter(item => item?.type === 'love'),
            reacts.filter(item => item?.type === 'haha'),
            reacts.filter(item => item?.type === 'wow'),
            reacts.filter(item => item?.type === 'sad'),
            reacts.filter(item => item?.type === 'angry'),
            reacts.filter(item => item?.type === 'care'),
        ];
        // sort descending by count
        return groups.sort((x, y) => y.length - x.length);
    }, [reacts]);

    useEffect(() => {
        const getReact = async () => {
            try {
                const res = await axios.get(
                    server_port + '/api/post/get_react/' + postId
                );
                setReacts(res.data);
            } catch (error) {
                console.log(error.message);
            }
        };
        getReact();
    }, [postId]);

    useEffect(() => {
        if (readyForShow.length > 0) {
            setReactDetails(readyForShow[0]);
        }
    }, [readyForShow]);

    function seeProfile(id) {
        navigate("/publicprofile", { state: { id } })
    }

    return (
        <div className='w-full min-h-screen max-h-auto'>
            <div className='flex mx-auto h-auto gap-3 p-2 w-full sticky top-0'>
                {readyForShow.map((item, index) => {
                    const type = item[0]?.type || null;
                    return (
                        <h6
                            key={index}
                            className='w-20 h-auto flex justify-center items-center cursor-pointer rounded-xl transition-all duration-200 hover:bg-slate-800 gap-3'
                            onClick={() => {
                                setReactDetails(item);
                            }}
                        >
                            {type && (
                                <>
                                    <img
                                        src={`./assets/react_icons/${type === 'love' ? 'heart' : type
                                            }.png`}
                                        className='w-7 h-7'
                                        alt=''
                                    />
                                    <span>{formatNumber(item.length)}</span>
                                </>
                            )}
                        </h6>
                    );
                })}
            </div>

            <div
                className='w-full h-full p-2'
                onClick={() => { seeProfile(userId) }}>
                {reactDetails.map((data, index) => (
                    <div
                        key={index}
                        className='flex w-full h-auto items-center justify-start gap-4 hover:bg-zinc-800 cursor-pointer'
                        onMouseEnter={() => { setUserId(data?.user._id) }}
                    >
                        <img
                            src={data?.user?.image}
                            alt=''
                            className='w-10 h-10 rounded-full'
                        />
                        <h4>{data?.user?.name}</h4>
                        <img
                            src={`./assets/react_icons/${data?.type === 'love' ? 'heart' : data?.type
                                }.png`}
                            alt=''
                            className='w-7 h-7'
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SeeRact;
