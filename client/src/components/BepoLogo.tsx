import { useEffect, useState } from "react";

export function BepoLogo() {
  const [blink, setBlink] = useState(false);
  const [thumbsUp, setThumbsUp] = useState(false);
  
  // Blinking animation for the character's left eye only (right one is winking)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Thumbs up subtle animation
  useEffect(() => {
    const thumbsInterval = setInterval(() => {
      setThumbsUp(prev => !prev);
    }, 2000);
    
    return () => clearInterval(thumbsInterval);
  }, []);

  return (
    <div className="w-24 h-24 md:w-40 md:h-40 relative">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        {/* Large cartoonish head */}
        <ellipse 
          cx="60" 
          cy="50" 
          rx="40" 
          ry="38" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1.5"
        />
        
        {/* Longer Brown Hair with more styling */}
        <path 
          d="M20,25 C20,15 35,5 60,5 C85,5 100,15 100,25
             L100,35 C100,35 95,30 90,30 C90,30 92,40 90,42
             C90,42 95,45 92,50 C92,50 85,45 80,48
             C80,48 82,50 78,55 C78,55 70,50 65,53
             C65,53 60,50 55,53 C55,53 50,50 42,55
             C42,55 38,50 40,48 C40,48 35,45 28,50
             C28,50 25,45 30,42 C30,42 28,40 30,30
             C30,30 25,35 20,35 L20,25 Z" 
          fill="#663300" 
          stroke="#4B2400" 
          strokeWidth="1.5"
        />
        
        {/* Left Eye - Open normal eye */}
        <ellipse 
          cx="45" 
          cy="45" 
          rx="6" 
          ry={blink ? "0.5" : "7"} 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="0.5"
        />
        
        {/* Left Pupil - Brown eye */}
        <ellipse 
          cx="45" 
          cy="45" 
          rx="3" 
          ry={blink ? "0.3" : "3.5"} 
          fill="#663300" 
          stroke="#4B2400" 
          strokeWidth="0.5"
        />
        
        {/* Left Eye highlight */}
        <ellipse 
          cx="43" 
          cy="43" 
          rx="1.5" 
          ry={blink ? "0" : "1.5"} 
          fill="#FFFFFF" 
          strokeWidth="0"
        />
          
        {/* Right Eye - Winking eye */}
        <path 
          d="M65,45 C70,40 80,40 85,45" 
          stroke="#663300"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Eyebrows */}
        <path 
          d="M35,35 C40,32 50,32 55,35" 
          fill="none" 
          stroke="#663300" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        <path 
          d="M65,35 C70,30 80,32 85,37" 
          fill="none" 
          stroke="#663300" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        
        {/* Nose */}
        <path 
          d="M60,50 C65,55 65,60 60,63 C55,60 55,55 60,50" 
          fill="#FFDABD" 
          stroke="#E8C39E" 
          strokeWidth="0.5"
        />
        
        {/* Mouth - Big cheerful smile */}
        <path 
          d="M40,68 C50,80 70,80 80,68" 
          fill="#FF6B8B" 
          stroke="#CC6666" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        
        {/* Teeth to make the smile more prominent */}
        <path 
          d="M48,72 L72,72" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
          strokeLinecap="round"
        />
        
        {/* Ears */}
        <ellipse 
          cx="20" 
          cy="50" 
          rx="8" 
          ry="10" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        <ellipse 
          cx="100" 
          cy="50" 
          rx="8" 
          ry="10" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Neck */}
        <path
          d="M50,85 L70,85 L70,90 L50,90 Z"
          fill="#FFE0BD"
          stroke="#E8C39E"
          strokeWidth="1"
        />
        
        {/* Shirt - Orange/yellow */}
        <path
          d="M35,90 L85,90 L90,115 L30,115 Z"
          fill="#FF9E00"
          stroke="#E08800"
          strokeWidth="1.5"
        />
        
        {/* Left arm */}
        <path
          d="M35,90 L15,100"
          stroke="#FFE0BD"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Right arm with thumbs up */}
        <path
          d="M85,90 L105,75"
          stroke="#FFE0BD"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        {/* Right hand - Thumbs up */}
        <path
          d={thumbsUp ? 
            "M100,65 L105,50 L110,65 L108,70 L100,72 L95,70 Z" : 
            "M100,66 L105,51 L110,66 L108,71 L100,73 L95,71 Z"}
          fill="#FFE0BD"
          stroke="#E8C39E"
          strokeWidth="1.5"
        />
        
        {/* Thumbs up detail */}
        <path
          d={thumbsUp ? 
            "M105,50 L105,65" : 
            "M105,51 L105,66"}
          stroke="#E8C39E"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Add animated waves effect around the logo */}
      <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-green-200 opacity-50"></div>
      <div className="absolute inset-0 -z-20 animate-pulse delay-300 rounded-full bg-blue-200 opacity-30"></div>
    </div>
  );
}