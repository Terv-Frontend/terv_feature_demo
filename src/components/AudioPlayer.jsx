import React from 'react';
import ReactAudioPlayer from 'react-audio-player';
import audio from "../assets/audio.mp3";

const AudioPlayer = () => {
  return (
    <div className='mt-10 flex justify-start mr-10'>
      <ReactAudioPlayer
        src={audio}// Adjust the path to your audio file
        autoPlay={false}
        controls
      />
    </div>
  );
};

export default AudioPlayer;
