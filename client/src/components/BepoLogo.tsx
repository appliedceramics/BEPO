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
        {/* Longer Brown Hair - more styled like the image */}
        <path 
          d="M15,42 C15,25 40,10 60,10 C80,10 105,25 105,42 L105,50 
             C105,50 100,47 95,47 L95,60 
             C95,60 100,65 105,63 L105,70
             C105,70 100,68 95,70 L95,75
             C95,75 90,70 85,65 C85,65 90,70 88,75 
             C88,75 85,80 80,77 L80,82
             C80,82 75,80 70,75 L70,80 
             C70,80 65,80 60,75 L60,80 
             C60,80 55,80 50,75 L50,80
             C50,80 45,80 40,75 L40,80
             C40,80 35,77 30,75 L30,82
             C30,82 25,80 23,75 C23,75 20,70 25,65 
             C25,65 20,70 15,70 L15,75
             C15,75 10,68 15,63 L15,47 
             C10,47 5,50 5,50 Z" 
          fill="#663300" 
          stroke="#4B2400" 
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
        
        {/* Pupils - Blue eyes like in the image */}
        <ellipse 
          cx="50" 
          cy="45" 
          rx="2.5" 
          ry={blink ? "0.3" : "3"} 
          fill="#4169E1" 
          stroke="#0047AB" 
          strokeWidth="0.5"
        />
        <ellipse 
          cx="70" 
          cy="45" 
          rx="2.5" 
          ry={blink ? "0.3" : "3"} 
          fill="#4169E1" 
          stroke="#0047AB" 
          strokeWidth="0.5"
        />
        
        {/* Eye highlights to make eyes more vibrant */}
        <ellipse 
          cx="49" 
          cy="44" 
          rx="1" 
          ry={blink ? "0" : "1"} 
          fill="#FFFFFF" 
          strokeWidth="0"
        />
        <ellipse 
          cx="69" 
          cy="44" 
          rx="1" 
          ry={blink ? "0" : "1"} 
          fill="#FFFFFF" 
          strokeWidth="0"
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
        
        {/* Mouth - Big cheerful smile */}
        <path 
          d="M45,63 C50,72 70,72 75,63" 
          fill="#FF6B8B" 
          stroke="#CC6666" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Teeth to make the smile more prominent */}
        <path 
          d="M52,64 L68,64" 
          stroke="#FFFFFF" 
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
        
        {/* Shirt - Yellow orange like in the image */}
        <path 
          d="M40,75 L80,75 L80,95 L40,95 Z" 
          fill="#FF9E00" 
          stroke="#E08800" 
          strokeWidth="1"
        />
        
        {/* Shorts - Blue like in the image */}
        <path 
          d="M45,95 L75,95 L78,110 L42,110 Z" 
          fill="#4284E6" 
          stroke="#3266B3" 
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