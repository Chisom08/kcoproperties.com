import React, { useState, useEffect, useRef } from "react";

/**
 * Omia badge - the teal "Omia" label shown next to bot messages
 */
export function OmiaBadge() {
  return (
    <span className="omia-badge" aria-label="Omia bot message">
      Omia
    </span>
  );
}

/**
 * A single bot message row with the Omia badge and message text.
 * When `children` changes, the text fades out then fades in with the new content.
 */
interface BotMessageProps {
  children: React.ReactNode;
  className?: string;
  /** Pass a unique key string that changes when the message changes to trigger the animation */
  animationKey?: string;
}

export function BotMessage({ children, className = "", animationKey }: BotMessageProps) {
  const [displayedContent, setDisplayedContent] = useState(children);
  const [visible, setVisible] = useState(true);
  const prevKey = useRef(animationKey);

  useEffect(() => {
    // Only animate when the animationKey actually changes (message changed)
    if (animationKey !== undefined && animationKey !== prevKey.current) {
      prevKey.current = animationKey;
      // Fade out
      setVisible(false);
      const timer = setTimeout(() => {
        setDisplayedContent(children);
        setVisible(true);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      // First render or no key — just show immediately
      setDisplayedContent(children);
    }
  }, [animationKey, children]);

  return (
    <div className={`bot-message ${className}`} role="status" aria-live="polite">
      <OmiaBadge />
      <span
        className="bot-message-text"
        style={{
          transition: "opacity 0.2s ease",
          opacity: visible ? 1 : 0,
        }}
      >
        {displayedContent}
      </span>
    </div>
  );
}

/**
 * Omia avatar/icon for the floating chatbot widget
 */
export function OmiaAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "linear-gradient(135deg, #0099CC 0%, #007BA3 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,153,204,0.3)",
      }}
      aria-hidden="true"
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="white" opacity="0.9" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="white" opacity="0.7" />
        <circle cx="9" cy="8" r="1" fill="#0099CC" />
        <circle cx="15" cy="8" r="1" fill="#0099CC" />
        <path d="M9 11 Q12 13 15 11" stroke="#0099CC" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
