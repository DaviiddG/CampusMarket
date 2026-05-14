import { useEffect, useState, useRef } from 'react';
import { useTour } from '@/contexts/TourContext';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, X, Compass, Home, Search, Bell, Send, Plus, User, Rocket, CheckCircle, Settings, Bookmark, Heart, MoveRight } from 'lucide-react';

export default function AppTour() {
  const {
    isActive,
    steps,
    currentStepIndex,
    nextStep,
    prevStep,
    stopTour
  } = useTour();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top?: number; left?: number; transform?: string }>({});
  
  const currentStep = steps[currentStepIndex];
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Calculate target element coordinates
  useEffect(() => {
    if (!isActive || !currentStep) return;

    const updatePosition = () => {
      if (!currentStep.targetSelector) {
        setTargetRect(null);
        return;
      }

      const element = document.querySelector(currentStep.targetSelector);
      if (element) {
        // Scroll to element if not in view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Allow time for smooth scrolling to finish before updating rect
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);
        }, 100);
        
        // Immediate update for current position
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();

    // Re-calculate on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    // Periodical re-check to catch dynamic UI shifts (like lazy loaders)
    const interval = setInterval(updatePosition, 500);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      clearInterval(interval);
    };
  }, [currentStep, isActive]);

  // Position the floating tooltip card
  useEffect(() => {
    if (!isActive) return;
    
    const padding = 16; // distance between spotlight and card
    const cardPadding = 12; // distance from viewport edges
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Default Center Placement (when no target)
    if (!targetRect || !currentStep?.targetSelector) {
      setTooltipPosition({
        top: windowHeight / 2,
        left: windowWidth / 2,
        transform: 'translate(-50%, -50%)'
      });
      return;
    }

    const placement = currentStep.placement || 'top';
    const tooltipHeight = tooltipRef.current?.offsetHeight || 180;
    const tooltipWidth = Math.min(tooltipRef.current?.offsetWidth || 320, windowWidth - cardPadding * 2);

    let top = 0;
    let left = 0;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    
    // Horizontal Alignment: Try to center horizontally around the target
    left = targetCenterX - tooltipWidth / 2;
    // Prevent bleeding off horizontal edges
    left = Math.max(cardPadding, Math.min(left, windowWidth - tooltipWidth - cardPadding));

    if (placement === 'top') {
      top = targetRect.top - tooltipHeight - padding;
      // If bleeding off top, flip to bottom
      if (top < cardPadding) {
        top = targetRect.bottom + padding;
      }
    } else if (placement === 'bottom') {
      top = targetRect.bottom + padding;
      // If bleeding off bottom, flip to top
      if (top + tooltipHeight > windowHeight - cardPadding) {
        top = targetRect.top - tooltipHeight - padding;
      }
    } else {
      // Fallback: top
      top = targetRect.top - tooltipHeight - padding;
    }

    // Absolute safety constraints
    top = Math.max(cardPadding, Math.min(top, windowHeight - tooltipHeight - cardPadding));

    setTooltipPosition({
      top,
      left,
      transform: 'none'
    });
  }, [targetRect, currentStep, isActive, steps.length]);

  if (!isActive || !currentStep) return null;

  const isLastStep = currentStepIndex === steps.length - 1;
  const hasTarget = !!currentStep.targetSelector && targetRect;

  // Calculate spotlight coordinates with extra padding
  const spotPadding = 8;
  const spotX = hasTarget ? targetRect.left - spotPadding : 0;
  const spotY = hasTarget ? targetRect.top - spotPadding : 0;
  const spotW = hasTarget ? targetRect.width + spotPadding * 2 : 0;
  const spotH = hasTarget ? targetRect.height + spotPadding * 2 : 0;
  const spotRadius = hasTarget ? 12 : 0;
  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden pointer-events-none">
      {/* Robust SVG Mask system covering the viewport */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[99998]">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* Everything else (white) will show the overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* The spotlight area (black) will be perfectly clear */}
            <motion.rect
              animate={{
                x: spotX,
                y: spotY,
                width: spotW,
                height: spotH,
                rx: spotRadius
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              fill="black"
            />
          </mask>
        </defs>
        {/* The foreignObject allows us to put HTML (with backdrop-filter) inside SVG, respecting the mask */}
        <foreignObject 
          x="0" 
          y="0" 
          width="100%" 
          height="100%" 
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto"
        >
          <div className="w-full h-full bg-[#0B172D]/65 backdrop-blur-[3px] transition-all duration-300" />
        </foreignObject>
      </svg>

      {/* Interactive element highlighting */}
      <AnimatePresence>
        {hasTarget && (
          <>
            {/* Pulsing Accent Border */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.02, 1]
              }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute z-[100001] border-2 border-[#5BB6F4] pointer-events-none"
              style={{
                left: spotX - 2,
                top: spotY - 2,
                width: spotW + 4,
                height: spotH + 4,
                borderRadius: spotRadius + 2,
              }}
            />

            {/* Subtle Inner Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                left: spotX,
                top: spotY,
                width: spotW,
                height: spotH,
                borderRadius: spotRadius,
                opacity: 1
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="absolute z-[100001] bg-transparent pointer-events-none shadow-[inset_0_0_0_1px_rgba(255,255,255,0.2)]"
            />
          </>
        )}
      </AnimatePresence>

      {/* Step Dialog Card */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.93, y: 8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            ...tooltipPosition
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute z-[100000] pointer-events-auto w-full max-w-[340px] xs:max-w-[380px] bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 rounded-3xl p-6 overflow-hidden flex flex-col"
        >
          {/* Subtle Corner Accent */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center border border-black shadow-lg shadow-black/10">
                {currentStep.icon === 'home' && <Home className="text-white" size={20} />}
                {currentStep.icon === 'search' && <Search className="text-white" size={20} />}
                {currentStep.icon === 'explore' && <Compass className="text-white" size={20} />}
                {currentStep.icon === 'bell' && <Bell className="text-white" size={20} />}
                {currentStep.icon === 'send' && <Send className="text-white" size={20} />}
                {currentStep.icon === 'plus' && <Plus className="text-white" size={20} />}
                {currentStep.icon === 'user' && <User className="text-white" size={20} />}
                {currentStep.icon === 'rocket' && <Rocket className="text-white" size={20} />}
                {currentStep.icon === 'check-circle' && <CheckCircle className="text-white" size={20} />}
                {currentStep.icon === 'settings' && <Settings className="text-white" size={20} />}
                {currentStep.icon === 'bookmark' && <Bookmark className="text-white" size={20} />}
                {currentStep.icon === 'heart' && <Heart className="text-white" size={20} />}
                {!currentStep.icon && (
                  <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
              <span className="font-roboto font-bold text-[18px] tracking-tight leading-tight text-black">
                {currentStep.title}
              </span>
            </div>
            <button 
              onClick={stopTour}
              className="p-1.5 rounded-full hover:bg-slate-50 text-slate-400 hover:text-black transition-all flex-shrink-0"
            >
              <X size={18} />
            </button>
          </div>
 
          {/* Content Text */}
          <p className="font-roboto font-normal text-[15px] leading-relaxed text-slate-800 mb-8">
            {currentStep.description}
          </p>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between mt-auto px-4 pb-2">
            {/* Progress Stepper Dots - Minimalist */}
            <div className="flex gap-1.5 items-center">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentStepIndex ? 'w-5 bg-black' : 'w-1.5 bg-slate-200'
                  }`} 
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={prevStep}
                  className="flex items-center justify-center h-10 px-3 text-slate-400 hover:text-black transition-colors font-roboto text-[13px] font-medium"
                >
                  Atrás
                </button>
              )}
              
              <button
                onClick={nextStep}
                className="flex items-center gap-1 px-6 py-2.5 border-2 border-black text-black font-roboto font-medium text-[14px] hover:bg-black hover:text-white transition-all duration-300 active:scale-95"
              >
                <span>{isLastStep ? '¡Empezar!' : 'Siguiente'}</span>
                {!isLastStep && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
