import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { server_port } from './api';
import { MoveLeft } from 'lucide-react';
import {tone} from "../utils/soundprovider";
import socket from "./socket";
import { isMatchGroup } from '../utils/utils';

const Report = () => {
    const navigate = useNavigate();
    const {callTone} = tone;
    const { pid, rid } = useLocation()?.state || {};
    const getTime = () => {
        const time = new Date();
        const actual_time = time.toLocaleTimeString();
        const date = time.toDateString();
        return { actual_time, date };
    }

    const date = getTime().actual_time + " " + getTime().date;

    const reports = ["Spam", "Harassment or bullying", "Hate speech", "Nudity or sexual activity", "Violence or threats", "False information", "Scams or fraud", "Suicide or self-injury", "Child exploitation", "Terrorism", "Intellectual property", "Sale of illegal goods", "Other"];

    function submitReport(report, postId, sender, date, toSent) {
        axios.post(server_port + "/api/report/submit", { postId, reportType: report, toSent, sender, date }).then(res => {
            navigate("/");
        })
    };

    
            useEffect(() => {
                const handleIncomingCall = (data) => {
                    if (data.userId === localStorage.getItem("myId")) {
                        navigate("/audiocall", { state: { callId: data.callId, userId: data.userId, role: "receiver", info: data.info } });
                        try {
                            if (callTone) {
                                callTone?.play();
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    }
                }
        
                socket.on("incoming_call_a", handleIncomingCall);
                return () => {
                    socket.off("incoming_call_a", handleIncomingCall);
                }
            }, []);
        
            useEffect(() => {
                const handleIncomingCall = (data) => {
        
                    if (data.userId === localStorage.getItem("myId")) {
                        navigate("/v", { state: { callId: data.callId } });
                        try {
                            if (callTone) {
                                callTone?.play();
                            }
                        } catch (error) {
                            console.log(error);
                        }
                    };
                }
        
                socket.on("____incoming_call____", handleIncomingCall);
                return () => {
                    socket.off("____incoming_call____", handleIncomingCall);
                };
        
            }, []);
      
          useEffect(() => {
              const handelRoom = async (data) => {
      
                  const isMatch = await isMatchGroup(data);
                  if (isMatch) {
                      navigate("/groupvideocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                      try {
                          if (callTone) {
                              callTone?.play();
                          }
                      } catch (error) {
                          console.log(error);
                      }
                  }
              }
      
              socket.on("join_room", handelRoom);
              return () => {
                  socket.off("join_room", handelRoom);
              }
          }, [])
      
          useEffect(() => {
              const handelRoom = async (data) => {
      
                  const isMatch = await isMatchGroup(data);
                  if (isMatch) {
                      navigate("/groupaudiocall", { state: { callId: data, isCaller: false, image: localStorage.getItem("myImage"), name: localStorage.getItem("myName") } });
                      try {
                          if (callTone) {
                              callTone?.play();
                          }
                      } catch (error) {
                          console.log(error);
                      }
                  }
              }
      
              socket.on("join_audio_room", handelRoom);
              return () => {
                  socket.off("join_audio_room", handelRoom);
              }
          }, []);

    return (
        <div className='h-screen'>{
            reports.map((data, index) => (
                <div
                    key={index}
                    className='px-2 py-2 bg-zinc-900 hover:bg-zinc-800 duration-100 cursor-default my-2 flex justify-between items-center hover:shadow-md hover:shadow-blue-700'
                >
                    <span>{data}</span>
                    <span
                        className='w-[20%] border-s border-zinc-700 text-center cursor-pointer hover:border-blue-500 duration-100'
                        onClick={() => { submitReport(data, pid, localStorage.getItem("myId"), date, rid) }}
                    >submit</span>
                </div>
            ))
        }

        <br /><br /><br />
        <div className='fixed bottom-0 left-1 bg-zinc-800 z-20 p-2 cursor-pointer'>
            <MoveLeft onClick={() => {navigate("/")}}/>
        </div>
        </div>
    );
}

export default Report;