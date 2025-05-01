import { useEffect, useState } from "react";

interface BepoLogoProps {
  className?: string;
}

export function BepoLogo({ className = '' }: BepoLogoProps) {
  const [smile, setSmile] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  
  // Subtle smile animation
  useEffect(() => {
    const smileInterval = setInterval(() => {
      setSmile(true);
      setTimeout(() => setSmile(false), 300);
    }, 3000);
    
    return () => clearInterval(smileInterval);
  }, []);

  // Thumbs up subtle animation
  useEffect(() => {
    const thumbsInterval = setInterval(() => {
      setThumbsUp(prev => !prev);
    }, 2000);
    
    return () => clearInterval(thumbsInterval);
  }, []);

  return (
    <div className={`w-24 h-24 md:w-40 md:h-40 relative ${className}`}>
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        {/* White background outline for sticker effect */}
        <path
          d="M100,190 C45,190 30,150 30,120 C30,90 30,40 100,40 C170,40 170,90 170,120 C170,150 155,190 100,190 Z"
          fill="white"
          stroke="white"
          strokeWidth="8"
        />
      
        {/* Face */}
        <ellipse 
          cx="100" 
          cy="100" 
          rx="60" 
          ry="65" 
          fill="#FFE0BD" 
          stroke="black" 
          strokeWidth="4"
        />
        
        {/* Cap */}
        <path
          d="M40,60 C40,40 70,20 100,20 C130,20 160,40 160,60 
             L160,70 C160,70 140,65 130,70 
             C130,70 120,65 110,70
             C110,70 90,65 80,70
             C80,70 60,65 40,70 L40,60 Z"
          fill="#A0C4FF"
          stroke="black"
          strokeWidth="4"
        />
        
        {/* Cap band */}
        <path
          d="M40,65 C60,60 140,60 160,65"
          stroke="black"
          strokeWidth="4"
          fill="none"
        />
        
        {/* Cap insignia */}
        <ellipse
          cx="100"
          cy="42"
          rx="12"
          ry="8"
          fill="#9BF6FF"
          stroke="black"
          strokeWidth="2"
        />
        
        <path
          d="M100,35 C105,40 105,45 100,50 C95,45 95,40 100,35"
          fill="black"
          stroke="black"
          strokeWidth="1"
        />
        
        {/* Eyes - Both closed and smiling */}
        <path 
          d="M70,85 C80,75 90,80 100,85" 
          stroke="black"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        <path 
          d="M100,85 C110,80 120,75 130,85" 
          stroke="black"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Big smile with teeth */}
        <path 
          d={smile ? 
            "M65,120 C85,140 115,140 135,120" : 
            "M65,115 C85,135 115,135 135,115"}
          fill="black" 
          stroke="black" 
          strokeWidth="4" 
          strokeLinecap="round"
        />
        
        {/* Teeth */}
        <path 
          d={smile ?
            "M78,125 L122,125" :
            "M78,122 L122,122"} 
          stroke="white" 
          strokeWidth="6" 
          strokeLinecap="round"
        />
        
        {/* Thumbs up hand */}
        <g transform={thumbsUp ? "translate(0, -2)" : "translate(0, 0)"}>
          {/* Thumb */}
          <path
            d="M30,120 C20,100 25,85 40,85 C50,85 55,90 55,100 L55,120 C55,130 45,135 40,125 L30,120 Z"
            fill="#FFE0BD"
            stroke="black"
            strokeWidth="4"
          />
          
          {/* Hand */}
          <path
            d="M55,120 L75,120 L75,150 L55,150 Z"
            fill="#FFE0BD"
            stroke="black"
            strokeWidth="4"
          />
        </g>
        
      </svg>
      
      {/* Add animated waves effect around the logo - updated colors */}
      <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-[#FFC6FF] opacity-30"></div>
      <div className="absolute inset-0 -z-20 animate-pulse delay-300 rounded-full bg-[#FDFFB6] opacity-20"></div>
    </div>
  );
}