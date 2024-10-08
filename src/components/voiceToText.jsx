import React, { useState, useEffect } from 'react';
import Lottie from 'react-lottie-player';
import recording from '../assets/recording.json';
import recordingImg from '../assets/recording.png';

const VoiceToText = () => {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Your browser does not support speech recognition.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Allow interim results for faster feedback
    recognition.lang = 'en-US'; // Set the language, can be customized

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const currentResult = event.results[i];
        if (currentResult.isFinal) {
          finalTranscript += currentResult[0].transcript + ' '; // Append final transcript
        }
      }

      setTranscript((prev) => prev + finalTranscript);
    };

    recognition.onerror = (event) => {
      setError(`Error occurred in recognition: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => {
      recognition.stop();
    };
  }, [isListening]);

  return (
    <div className=' w-full flex flex-wrap p-5 mx-auto justify-center mt-5'>
      <div className='w-full flex justify-center mb-10'>
        <button onClick={() => setIsListening((prev) => !prev)}>
          {isListening ? (
            <Lottie
              loop
              animationData={recording}
              play
              style={{ width: 150, height: 150 }}
            />
          ) : (
            <div className='w-[150px] h-[150px]'>
              <img src={recordingImg} alt='mic' />
            </div>
          )}
        </button>
      </div>
      <p className='w-full h-[150px] overflow-y-scroll border-gray-300 shadow-lg p-2 rounded-lg'>
        {transcript}
      </p>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default VoiceToText;
