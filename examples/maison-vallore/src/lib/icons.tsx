import React from 'react';

type P = {size?: number; color?: string; fill?: string; stroke?: number; style?: React.CSSProperties};

const Svg: React.FC<P & {children: React.ReactNode; vb?: string}> = ({size = 48, style, children, vb = '0 0 24 24'}) => (
  <svg width={size} height={size} viewBox={vb} style={{display: 'block', overflow: 'visible', ...style}}>
    {children}
  </svg>
);

export const IconSearch: React.FC<P> = ({color = '#fff', stroke = 2.2, ...p}) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M15.5 15.5L21 21" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconBack: React.FC<P> = ({color = '#fff', stroke = 2.4, ...p}) => (
  <Svg {...p}>
    <path d="M15 4L7 12l8 8" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconArrowUpLeft: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <path d="M18 18L7 7M7 7v8M7 7h8" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconHeart: React.FC<P> = ({color = '#fff', fill, stroke = 0, ...p}) => (
  <Svg {...p}>
    <path
      d="M12 21s-7.5-4.6-9.6-9.3C1 8.4 3 4.5 6.8 4.5c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3 3.8 0 5.8 3.9 4.4 7.2C19.5 16.4 12 21 12 21z"
      fill={fill ?? color}
      stroke={stroke ? color : 'none'}
      strokeWidth={stroke}
    />
  </Svg>
);

export const IconComment: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path
      d="M12 3.5c5 0 9 3.4 9 7.8s-4 7.8-9 7.8c-.9 0-1.8-.1-2.6-.3L4.6 21l1.2-4.1C4 15.5 3 13.5 3 11.3 3 6.9 7 3.5 12 3.5z"
      fill={color}
    />
    <circle cx="8" cy="11.3" r="1.2" fill="#000" opacity="0.55" />
    <circle cx="12" cy="11.3" r="1.2" fill="#000" opacity="0.55" />
    <circle cx="16" cy="11.3" r="1.2" fill="#000" opacity="0.55" />
  </Svg>
);

export const IconBookmark: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M6 3h12a1 1 0 011 1v17l-7-4.5L5 21V4a1 1 0 011-1z" fill={color} />
  </Svg>
);

export const IconShare: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M13 4l9 8-9 8v-5c-5.5 0-8.8 1.6-11 5 .8-5.6 3.8-10.5 11-11.3V4z" fill={color} />
  </Svg>
);

export const IconMusic: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M9 18V5l11-2v13" fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    <circle cx="6.5" cy="18" r="2.6" fill={color} />
    <circle cx="17.5" cy="16" r="2.6" fill={color} />
  </Svg>
);

export const IconPlus: React.FC<P> = ({color = '#fff', stroke = 2.6, ...p}) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconCheck: React.FC<P> = ({color = '#fff', stroke = 2.8, ...p}) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconClose: React.FC<P> = ({color = '#fff', stroke = 2.4, ...p}) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconMore: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <circle cx="5" cy="12" r="2" fill={color} />
    <circle cx="12" cy="12" r="2" fill={color} />
    <circle cx="19" cy="12" r="2" fill={color} />
  </Svg>
);

export const IconBell: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <path d="M6 17V11a6 6 0 0112 0v6l1.5 2h-15L6 17z" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
    <path d="M10 21h4" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconHome: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M3 11l9-7.5L21 11v9.5a.5.5 0 01-.5.5H15v-6H9v6H3.5a.5.5 0 01-.5-.5V11z" fill={color} />
  </Svg>
);

export const IconCompass: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" fill={color} />
  </Svg>
);

export const IconInbox: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <path d="M4 5h16v11H14l-2 3-2-3H4V5z" fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" />
  </Svg>
);

export const IconUser: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="4" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M4 21c.8-4 4-6 8-6s7.2 2 8 6" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconGrid: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    {[3, 10, 17].map((x) => [3, 10, 17].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1" fill={color} />))}
  </Svg>
);

export const IconLock: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M8 10.5V8a4 4 0 018 0v2.5" fill="none" stroke={color} strokeWidth={stroke} />
  </Svg>
);

export const IconPlay: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M7 4.5v15l12.5-7.5L7 4.5z" fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
  </Svg>
);

export const IconSend: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M3 11.5L21 3l-6.5 18-3-7.5L3 11.5z" fill={color} />
  </Svg>
);

export const IconLink: React.FC<P> = ({color = '#fff', stroke = 2.2, ...p}) => (
  <Svg {...p}>
    <path d="M10 14a4.5 4.5 0 006.4 0l3-3a4.5 4.5 0 00-6.4-6.4l-1 1" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
    <path d="M14 10a4.5 4.5 0 00-6.4 0l-3 3a4.5 4.5 0 006.4 6.4l1-1" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconMail: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M3.5 6l8.5 7 8.5-7" fill="none" stroke={color} strokeWidth={stroke} />
  </Svg>
);

export const IconBubble: React.FC<P> = ({color = '#fff', ...p}) => (
  <Svg {...p}>
    <path d="M12 4c5 0 9 3.2 9 7.3s-4 7.2-9 7.2c-1 0-2-.1-2.9-.4L4.5 20l1.3-3.7C4 15 3 13.2 3 11.3 3 7.2 7 4 12 4z" fill={color} />
  </Svg>
);

export const IconStory: React.FC<P> = ({color = '#fff', stroke = 2.2, ...p}) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke={color} strokeWidth={stroke} strokeDasharray="3 2.4" />
    <path d="M12 8v8M8 12h8" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconDownload: React.FC<P> = ({color = '#fff', stroke = 2.2, ...p}) => (
  <Svg {...p}>
    <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const IconEmoji: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth={stroke} />
    <circle cx="9" cy="10" r="1.2" fill={color} />
    <circle cx="15" cy="10" r="1.2" fill={color} />
    <path d="M8 14.5c1 1.5 2.3 2.2 4 2.2s3-.7 4-2.2" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
  </Svg>
);

export const IconCamera: React.FC<P> = ({color = '#fff', stroke = 2, ...p}) => (
  <Svg {...p}>
    <rect x="3" y="7" width="18" height="13" rx="3" fill="none" stroke={color} strokeWidth={stroke} />
    <path d="M8.5 7l1.5-3h4l1.5 3" fill="none" stroke={color} strokeWidth={stroke} />
    <circle cx="12" cy="13.5" r="3.5" fill="none" stroke={color} strokeWidth={stroke} />
  </Svg>
);

export const IconVerified: React.FC<P> = ({color = '#25F4EE', ...p}) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="10" fill={color} />
    <path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#000" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
