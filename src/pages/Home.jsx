import React from 'react'
import Navbar from '../components/Navbar';
import homeScreen from '../assets/landing.png';

function Home() {
  return (
    <div>
        <Navbar />
        <div className='w-full'>
            <img src={homeScreen} alt="terv-home-screen" className="w-[80%] mx-auto hover:cursor-pointer" onClick={() => window.location.href = "/assessment"}/>
        </div>
    </div>
  )
}

export default Home