import React from 'react';
import "@/styles/managerDash.css"
 
const Card = ({ children }: { children: React.ReactNode }) => {
  const cardStyle: React.CSSProperties = {
    
    background: "linear-gradient(145deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.2))",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    

    padding: "2px", 
    // margin: "15px",  
    width: "100%", 
    height: "100%", 
    display: "flex",
    flexDirection: 'column',  
    // justifyContent: "space-between",  
    
 
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
    borderRadius: "16px", 
    color: "#054116",  

   

  };

  return (
    <div style={cardStyle} className='dashCard'>
      {children}
    </div>
  );
}

export default Card;
