import React from 'react';
import Navbar from '../components/Navbar';
import homeScreen from '../assets/terv.pro_assessment .png';
import { Link } from 'react-router-dom';

function Assessment() {
    console.log("inside the assessment bro")
  return (
    <div>
        <Navbar />
        <div className='w-full'>
            <Link to="/takeTest" >
                <img src={homeScreen} alt="terv-home-screen" className="w-[80%] mx-auto hover:cursor-pointer"/>
            </Link>
        </div>
    </div>
  )
}

export default Assessment