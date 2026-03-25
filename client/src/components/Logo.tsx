export default function Logo({ size = 32, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="#0f172a" />
            {/* < */}
            <path d="M14 10L8 16L14 22" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            {/* / */}
            <path d="M18 10L14 22" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            {/* > */}
            <path d="M18 10L24 16L18 22" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    );
}
