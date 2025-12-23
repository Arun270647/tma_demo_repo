import React, { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { HashLink } from 'react-router-hash-link'; 

// Utility helper
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <div className={cn("block md:hidden", mobileClassName)}>
        {/* Mobile implementation omitted */}
      </div>
    </>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden md:flex h-16 gap-4 items-center justify-center rounded-2xl",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
}) {
  let ref = useRef(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  // 1. RESTORED PHYSICAL SIZE SCALING (for spacing/push effect)
  // Base width: auto/flexible based on text. 
  // We use a scale transform instead of hard pixel width to allow text to reflow naturally or just zoom.
  // But for the "dock" effect, we need to animate a numeric value.
  // Let's animate fontsize and padding/margin to create the "space" growth.

  // Mapping distance to a scale factor (1 -> 1.5)
  let scaleTransform = useTransform(distance, [-150, 0, 150], [1, 1.5, 1]);
  
  let scale = useSpring(scaleTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  // Mapping distance to Font Size (Base 16px -> Max 24px)
  // This ensures the text itself gets larger, "zooming in"
  let fontSizeTransform = useTransform(distance, [-150, 0, 150], [16, 28, 16]);
  
  let fontSize = useSpring(fontSizeTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  // Mapping distance to margin (Base 0px -> Max 10px) to add breathing room
  let marginTransform = useTransform(distance, [-150, 0, 150], [0, 12, 0]);
  let margin = useSpring(marginTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  return (
    <HashLink to={href} smooth>
      <motion.div
        ref={ref}
        // Apply dynamic margin to push neighbors apart
        style={{ marginLeft: margin, marginRight: margin }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center justify-center relative px-2 py-2"
      >
        <motion.div
          // Apply dynamic font size for the zoom effect
          style={{ fontSize }} 
          className="flex items-center justify-center w-full h-full text-gray-400 hover:text-white font-medium whitespace-nowrap transition-colors duration-200"
        >
          {/* Icon Prop is the Text Label */}
          {icon}
        </motion.div>
      </motion.div>
    </HashLink>
  );
}