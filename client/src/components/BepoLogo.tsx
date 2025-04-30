import { useEffect, useState } from "react";

export function BepoLogo() {
  const [blink, setBlink] = useState(false);
  const [armPosition, setArmPosition] = useState(0);
  
  // Blinking animation for the character's eyes
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  // Arm movement animation
  useEffect(() => {
    const armInterval = setInterval(() => {
      setArmPosition(prev => (prev + 1) % 3);
    }, 1500);
    
    return () => clearInterval(armInterval);
  }, []);

  // Calculate arm path based on position
  const getArmPath = () => {
    switch(armPosition) {
      case 0:
        return "M70,55 L90,40";
      case 1:
        return "M70,55 L95,45";
      case 2:
        return "M70,55 L92,35";
      default:
        return "M70,55 L90,40";
    }
  };

  return (
    <div className="w-20 h-20 md:w-36 md:h-36 relative">
      <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
        {/* Cap */}
        <path 
          d="M20,40 C20,25 45,18 60,18 C75,18 100,25 100,40 L100,42 C100,42 100,46 85,46 L35,46 C20,46 20,42 20,42 Z" 
          fill="#E94FC3" 
          stroke="#D43AAE" 
          strokeWidth="1"
        />
        <path 
          d="M20,40 C20,40 35,44 60,44 C85,44 100,40 100,40" 
          fill="none" 
          stroke="#D43AAE" 
          strokeWidth="1"
        />
        <path 
          d="M50,18 L50,25 C50,25 55,29 70,29 C85,29 90,25 90,25 L90,18" 
          fill="#FFFFFF" 
          stroke="#EEEEEE" 
          strokeWidth="1"
        />
        
        {/* Hair */}
        <path 
          d="M35,46 L35,50 C35,50 45,55 50,60 L50,64 C45,64 40,62 40,62 L40,65 C40,65 35,67 30,70 L35,75 C35,75 45,73 55,73 L55,67 C55,67 65,67 70,67 L70,60 C70,60 75,55 85,50 L85,46" 
          fill="#8B4513" 
          stroke="#6B3E26" 
          strokeWidth="1"
        />
        
        {/* Face */}
        <ellipse 
          cx="60" 
          cy="60" 
          rx="25" 
          ry="23" 
          fill="#FFA07A" 
          stroke="#E8937A" 
          strokeWidth="1"
        />
        
        {/* Eyes */}
        <ellipse 
          cx="50" 
          cy="55" 
          rx="4" 
          ry={blink ? "0.5" : "5"} 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="0.5"
        />
        <ellipse 
          cx="70" 
          cy="55" 
          rx="4" 
          ry={blink ? "0.5" : "5"} 
          fill="#FFFFFF" 
          stroke="#DDDDDD" 
          strokeWidth="0.5"
        />
        
        {/* Pupils */}
        <ellipse 
          cx="50" 
          cy="55" 
          rx="2.5" 
          ry={blink ? "0.3" : "3"} 
          fill="#33CC33" 
          stroke="#009900" 
          strokeWidth="0.5"
        />
        <ellipse 
          cx="70" 
          cy="55" 
          rx="2.5" 
          ry={blink ? "0.3" : "3"} 
          fill="#33CC33" 
          stroke="#009900" 
          strokeWidth="0.5"
        />
        
        {/* Eyebrows */}
        <path 
          d="M45,48 C47,46 53,46 55,48" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path 
          d="M65,48 C67,46 73,46 75,48" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Nose */}
        <path 
          d="M60,60 C63,62 63,65 60,67 C57,65 57,62 60,60" 
          fill="#E89070" 
          stroke="#D48060" 
          strokeWidth="0.5"
        />
        
        {/* Mouth - Smile */}
        <path 
          d="M50,73 C55,78 65,78 70,73" 
          fill="none" 
          stroke="#D48060" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Ears */}
        <ellipse 
          cx="35" 
          cy="60" 
          rx="5" 
          ry="8" 
          fill="#FFA07A" 
          stroke="#E8937A" 
          strokeWidth="1"
        />
        <ellipse 
          cx="85" 
          cy="60" 
          rx="5" 
          ry="8" 
          fill="#FFA07A" 
          stroke="#E8937A" 
          strokeWidth="1"
        />
        
        {/* Neck/Shoulders */}
        <path 
          d="M50,83 L70,83" 
          stroke="#FFA07A" 
          strokeWidth="10" 
          strokeLinecap="round"
        />
        
        {/* Shirt */}
        <path 
          d="M45,90 L75,90" 
          stroke="#CCCC33" 
          strokeWidth="15" 
          strokeLinecap="round"
        />
        
        {/* Arm */}
        <path 
          d={getArmPath()}
          stroke="#FFA07A" 
          strokeWidth="8" 
          strokeLinecap="round"
        />
        
        {/* Hand */}
        <circle 
          cx={armPosition === 0 ? "90" : armPosition === 1 ? "95" : "92"} 
          cy={armPosition === 0 ? "40" : armPosition === 1 ? "45" : "35"} 
          r="5" 
          fill="#FFA07A" 
          stroke="#E8937A" 
          strokeWidth="1"
        />
        
        {/* Pants */}
        <path 
          d="M50,100 L50,110" 
          stroke="#66CCFF" 
          strokeWidth="10" 
          strokeLinecap="round"
        />
        <path 
          d="M70,100 L70,110" 
          stroke="#66CCFF" 
          strokeWidth="10" 
          strokeLinecap="round"
        />
        
        {/* Shoes */}
        <ellipse 
          cx="50" 
          cy="115" 
          rx="6" 
          ry="4" 
          fill="#E94FC3" 
          stroke="#D43AAE" 
          strokeWidth="1"
        />
        <ellipse 
          cx="70" 
          cy="115" 
          rx="6" 
          ry="4" 
          fill="#E94FC3" 
          stroke="#D43AAE" 
          strokeWidth="1"
        />
      </svg>
      
      {/* Add animated waves effect around the logo */}
      <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-green-200 opacity-50"></div>
      <div className="absolute inset-0 -z-20 animate-pulse delay-300 rounded-full bg-blue-200 opacity-30"></div>
    </div>
  );
}