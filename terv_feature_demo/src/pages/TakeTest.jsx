import React, { useEffect, useState } from 'react';
import test from '../assets/taketest.png';
import AssessmentNavBar from '../components/AssessmentNav';

function TakeTest() {
    const [initial, setInitial] = useState(false);
    
    useEffect(() => {
        const enterFullscreen = async () => {
            const elem = document.documentElement; // Fullscreen the entire document
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.mozRequestFullScreen) { // Firefox
                await elem.mozRequestFullScreen();
            } else if (elem.webkitRequestFullscreen) { // Chrome, Safari and Opera
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { // IE/Edge
                await elem.msRequestFullscreen();
            }
        };

        // Enter fullscreen mode when the component mounts
        enterFullscreen();

        // Cleanup function to exit fullscreen when the component unmounts
        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        };
    }, []);

    return !initial ? (
        <div className='w-full'>
            <img 
                src={test} 
                alt="terv-home-screen" 
                className="w-[80%] mx-auto hover:cursor-pointer" 
                onClick={() => setInitial(true)} 
            />
        </div>
    ) : (
        <div>
            <AssessmentNavBar />
        </div>
    );
}

export default TakeTest;
