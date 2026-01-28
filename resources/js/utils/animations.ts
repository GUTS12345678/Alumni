/**
 * Animation Configuration
 * Centralized animation variants for consistent UI animations across the application
 */

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
    if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
};

// Sidebar animations
export const sidebarVariants = {
    closed: {
        x: -280,
        opacity: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    open: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

// Menu item animations
export const menuItemVariants = {
    closed: {
        x: -20,
        opacity: 0
    },
    open: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

// Page entry animations
export const pageVariants = {
    initial: {
        opacity: 0,
        y: 20
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.3
        }
    }
};

// Card container animations (for staggered children)
export const containerVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

// Individual card animations
export const cardVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

// Button hover/tap animations
export const buttonVariants = {
    hover: {
        scale: 1.05,
        transition: {
            type: "spring",
            stiffness: 400,
            damping: 10
        }
    },
    tap: {
        scale: 0.95,
        transition: {
            duration: 0.1
        }
    }
};

// Modal animations
export const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: -50
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 25
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 50,
        transition: {
            duration: 0.2
        }
    }
};

// Modal backdrop animations
export const backdropVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.2
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2
        }
    }
};

// Dropdown animations
export const dropdownVariants = {
    closed: {
        opacity: 0,
        height: 0,
        transition: {
            duration: 0.2
        }
    },
    open: {
        opacity: 1,
        height: "auto",
        transition: {
            duration: 0.3,
            staggerChildren: 0.05
        }
    }
};

// Loading skeleton pulse
export const skeletonVariants = {
    initial: {
        opacity: 0.6
    },
    animate: {
        opacity: 1,
        transition: {
            repeat: Infinity,
            repeatType: "reverse" as const,
            duration: 1
        }
    }
};

// Notification slide in from right
export const notificationVariants = {
    initial: {
        x: 400,
        opacity: 0
    },
    animate: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    exit: {
        x: 400,
        opacity: 0,
        transition: {
            duration: 0.2
        }
    }
};

// Fade in/out
export const fadeVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            duration: 0.3
        }
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2
        }
    }
};

// Slide up
export const slideUpVariants = {
    hidden: {
        y: 50,
        opacity: 0
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

// Scale pop
export const scaleVariants = {
    hidden: {
        scale: 0.8,
        opacity: 0
    },
    visible: {
        scale: 1,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};

// Success checkmark animation
export const checkmarkVariants = {
    hidden: {
        pathLength: 0,
        opacity: 0
    },
    visible: {
        pathLength: 1,
        opacity: 1,
        transition: {
            pathLength: {
                type: "spring",
                duration: 0.6,
                bounce: 0
            },
            opacity: {
                duration: 0.01
            }
        }
    }
};

// List stagger
export const listContainerVariants = {
    hidden: {
        opacity: 0
    },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08
        }
    }
};

export const listItemVariants = {
    hidden: {
        x: -20,
        opacity: 0
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    }
};
