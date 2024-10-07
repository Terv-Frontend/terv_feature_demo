import React, { useState } from 'react'
import logo from '../assets/terv-logo.png';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Button, Icon } from '@mui/material';
import VoiceToText from './voiceToText';
import AudioPlayer from './AudioPlayer';
import { TextareaAutosize } from '@mui/base/TextareaAutosize';


function AssessmentNav() {
    const [qno , setQno] = useState(1);


    const questions = {
        1 : "Hear the Audio and try to speak out the content in the audio",
        2 : "Read the Text and try to speak out the content in audio",
    }

  return (
    <div>
        <div className='w-[95%] m-2 mx-auto p-5 shadow-sm rounded-lg bg-white'>
            <div className='flex w-full justify-between'>
                <div className='w-1/3 flex justify-start'>
                    <img src={logo} alt="terv-logo" height="40px" className='w-[100px]'/>
                </div>
                <div className='w-1/3 flex justify-center'>
                    <h2 className='font-[400] text-[#495057]'>Audio Based Assessment</h2>
                </div>
                <div className='w-1/3 flex justify-end'>
                    <button className='text-white bg-[#794DF5] p-2 rounded-lg' onClick={() => window.location.href = "/result"}>
                        {"Submit Test"}
                    </button>
                </div>
            </div>
            <div className='w-full mx-auto flex justify-center hover:cursor-pointer'>
                <div className='w-1/4 flex justify-between align-middle items-center'>
                    <KeyboardArrowLeftIcon />
                    <div className='w-1/2 flex mx-auto'>
                    {[1,2].map((item)=>{
                        return(
                            <div 
                                className={`text-gray-800 p-3 ${qno === item ? 'bg-[#eff2f7]' : ''}`} key={item}
                                onClick={() => setQno(item)}
                            >
                                {item}
                            </div>
                        )
                    })
                    }
                    </div>
                    <KeyboardArrowRightIcon />
                </div>
            </div>

        </div>
        <div className='w-[95%] mt-5 mx-auto  flex gap-4 h-[70vh]'>
            <div className='w-1/2 p-5 shadow-sm rounded-lg bg-white'>
                <div className='w-full'>
                    <h2 className='font-[500] text-[#495057]'>Questionss {qno}
                    <hr className='mt-3'></hr></h2>
                </div>
                <div className='w-full m-5'>
                    <h2 className='font-[500] text-[#495057]'>{questions[qno]}</h2>
                    <AudioPlayer />
                </div>
                <div className='border-t  border-[#d3d3d3] p-2 mt-[300px]'>
                    <div className='flex justify-end gap-5 text-black'>
                        <Button variant="none" style={{fontWeight : 500 , border : "1px solid #495057"}}
                            onClick={() => {
                                if(qno !== 1){
                                setQno(qno - 1)
                                }}
                            }
                        >
                            <KeyboardArrowLeftIcon />
                            {"Previous"}
                        </Button>
                        <Button variant="none"  style={{fontWeight : 500 , border : "1px solid #495057"}}
                            onClick={() => {
                                if(qno !== 2){
                                setQno(qno + 1)
                                }}
                            }   
                        >
                            {"Next"}
                            <KeyboardArrowRightIcon />
                        </Button>
                    </div>
                </div>
            </div>
            <div className='w-1/2 p-5 shadow-sm rounded-lg bg-white'>
                <div className='w-full'>
                    {qno === 1 &&
                        <h2 className='font-[500] text-[#4d5749] ml-5'>
                        {"Press the below button to start recording the Answer"}
                        </h2>
                    }
                    {qno === 2 &&
                        <h2 className='font-[500] text-[#4d5749] ml-5'>
                        {"Type the Answer in the box"}
                        </h2>
                    }  
                </div>
                <div className='w-full m-5'>
                    {(qno === 1) &&
                        <VoiceToText />
                    }
                    {(qno === 2) &&
                        <TextareaAutosize
                            style={{border : "1px solid #b7b7b7" , width : "80%" , height : "400px" , padding: "20px" , borderRadius : "10px" , resize : "both"}}
                        />
                    }
                    <div className='w-full flex justify-end px-5 mt-2'>
                    <Button 
                        variant="contained"
                        color='success'
                        style={{fontWeight : 500 , border : "1px solid #495057" , backgroundColor : "#6db752"}}
                        onClick={() => {
                            if(qno !== 2)
                            setQno(qno + 1)
                            else
                            window.location.href = "/result"
                            }
                        }
                    >
                        {"Confirm"}
                    </Button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default AssessmentNav