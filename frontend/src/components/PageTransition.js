import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import '../styles/page-transition.css';

const PageTransition = ({ children, isActive }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      gsap.to(overlayRef.current, {
        opacity: 0.15,
        duration: 0.3,
        ease: 'power2.inOut'
      });
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        delay: 0.1
      });
    }
  }, [isActive]);

  return (
    <div className="page-transition-wrapper">
      <div ref={overlayRef} className="transition-overlay"></div>
      {children}
    </div>
  );
};

export default PageTransition;
