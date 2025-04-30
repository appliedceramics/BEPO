import { useEffect, useState } from "react";

export function BepoLogo() {
  const [blink, setBlink] = useState(false);
  const [celebrateArm, setCelebrateArm] = useState(false);
  
  // Blinking animation for the character's eyes
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Victory pose animation
  useEffect(() => {
    const armInterval = setInterval(() => {
      setCelebrateArm(prev => !prev);
    }, 1500);
    
    return () => clearInterval(armInterval);
  }, []);

  return (
    <div className="w-20 h-20 md:w-36 md:h-36 relative">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        {/* Long Hair */}
        <path 
          d="M20,38 C20,25 40,15 60,15 C80,15 100,25 100,38 L100,45 
             C100,45 95,42 90,42 L90,65 C90,65 85,75 80,80 
             C80,80 75,85 70,83 L70,88
             C70,88 65,83 60,80 L60,85 
             C60,85 55,83 50,80 L50,85
             C50,85 45,83 40,80 L40,83
             C40,83 35,85 30,80 C25,75 20,65 20,65 L20,42 
             C15,42 10,45 10,45 Z" 
          fill="#8B4513" 
          stroke="#6B3E26" 
          strokeWidth="1"
        />
        
        {/* Face */}
        <ellipse 
          cx="60" 
          cy="50" 
          rx="25" 
          ry="23" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Eyes */}
        <ellipse 
          cx="50" 
          cy="45" 
          rx="4" 
          ry={blink ? "0.5" : "5"} 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="0.5"
        />
        <ellipse 
          cx="70" 
          cy="45" 
          rx="4" 
          ry={blink ? "0.5" : "5"} 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="0.5"
        />
        
        {/* Pupils */}
        <ellipse 
          cx="50" 
          cy="45" 
          rx="2.5" 
          ry={blink ? "0.3" : "3"} 
          fill="#663300" 
          stroke="#331A00" 
          strokeWidth="0.5"
        />
        <ellipse 
          cx="70" 
          cy="45" 
          rx="2.5" 
          ry={blink ? "0.3" : "3"} 
          fill="#663300" 
          stroke="#331A00" 
          strokeWidth="0.5"
        />
        
        {/* Eyebrows */}
        <path 
          d="M45,38 C47,36 53,36 55,38" 
          fill="none" 
          stroke="#663300" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path 
          d="M65,38 C67,36 73,36 75,38" 
          fill="none" 
          stroke="#663300" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Nose */}
        <path 
          d="M60,50 C63,53 63,56 60,58 C57,56 57,53 60,50" 
          fill="#FFDABD" 
          stroke="#E8C39E" 
          strokeWidth="0.5"
        />
        
        {/* Mouth - Big smile */}
        <path 
          d="M45,63 C50,70 70,70 75,63" 
          fill="none" 
          stroke="#CC6666" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Ears */}
        <ellipse 
          cx="35" 
          cy="50" 
          rx="5" 
          ry="8" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        <ellipse 
          cx="85" 
          cy="50" 
          rx="5" 
          ry="8" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Victory pose - Left arm up with fist */}
        <path 
          d="M45,75 L25,30" 
          stroke="#FFE0BD" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <circle 
          cx="25" 
          cy="30" 
          r="6" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Right arm - Alternating between two trophy-holding positions */}
        <path 
          d={celebrateArm ? "M75,75 L95,35" : "M75,75 L100,40"}
          stroke="#FFE0BD" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        <circle 
          cx={celebrateArm ? "95" : "100"} 
          cy={celebrateArm ? "35" : "40"} 
          r="6" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Trophy (between hands) */}
        <path 
          d={celebrateArm ? 
            "M60,25 L90,35 M60,25 L30,35 M60,10 L60,25" : 
            "M60,30 L95,40 M60,30 L25,40 M60,15 L60,30"
          }
          stroke="#FFD700" 
          strokeWidth="3" 
          strokeLinecap="round"
        />
        <ellipse 
          cx="60" 
          cy={celebrateArm ? "8" : "13"} 
          rx="8" 
          ry="5" 
          fill="#FFD700" 
          stroke="#CC9900" 
          strokeWidth="1"
        />
        
        {/* Shirt */}
        <path 
          d="M40,75 L80,75 L80,95 L40,95 Z" 
          fill="#4C92D3" 
          stroke="#3A7BBD" 
          strokeWidth="1"
        />
        
        {/* Shorts */}
        <path 
          d="M45,95 L75,95 L78,110 L42,110 Z" 
          fill="#44BD7B" 
          stroke="#38A268" 
          strokeWidth="1"
        />
        
        {/* Sneakers */}
        <path 
          d="M42,110 L35,115 L45,118 L50,110" 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="1"
        />
        <path 
          d="M78,110 L85,115 L75,118 L70,110" 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="1"
        />
        
        {/* Sneaker details */}
        <path 
          d="M35,115 L45,118" 
          fill="none" 
          stroke="#4C92D3" 
          strokeWidth="2"
        />
        <path 
          d="M85,115 L75,118" 
          fill="none" 
          stroke="#4C92D3" 
          strokeWidth="2"
        />
      </svg>
      
      {/* Add animated waves effect around the logo */}
      <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-green-200 opacity-50"></div>
      <div className="absolute inset-0 -z-20 animate-pulse delay-300 rounded-full bg-blue-200 opacity-30"></div>
    </div>
  );
}