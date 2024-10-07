import React from 'react';
import end from '../assets/result.png';

function Results() {
  return (
    <div>
        <img
        src={end}
        alt='Result Page'
        onClick={() => window.location.href = "/"}
        className='hover:cursor-pointer'
         />
         
    </div>
  )
}

export default Results