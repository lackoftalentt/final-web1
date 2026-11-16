import { useId } from "react";

// Original vector artwork: stylised model-inspired illustrations, not photographs.
export default function CarArt({ car, hero = false }) {
  const id = useId().replace(/:/g, "");
  const round = ["supra", "rx7"].includes(car.id);
  const sedan = ["evo", "sti"].includes(car.id);
  const body = round
    ? "M91 272Q102 246 166 231L258 217Q315 144 405 142L499 148Q557 160 610 208L749 239Q783 249 794 275L785 315 725 327Q722 257 672 257T610 333L291 333Q285 263 234 263T173 325L104 310Z"
    : "M85 266 126 234 250 216 324 148 496 148 601 211 749 230 789 259 793 309 727 326Q726 260 672 260T611 332L294 332Q288 263 234 263T172 325L96 309Z";
  return (
    <svg
      className={`car-art ${hero ? "car-art-hero" : ""}`}
      viewBox="0 0 880 460"
      role="img"
      aria-label={`Original stylised illustration of ${car.maker} ${car.name}`}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.3" y2="1">
          <stop stopColor={car.color} />
          <stop offset=".45" stopColor={car.color} />
          <stop offset="1" stopColor="#151e26" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8caaa9" />
          <stop offset=".4" stopColor="#273c45" />
          <stop offset="1" stopColor="#10191f" />
        </linearGradient>
        <radialGradient id={`${id}-rim`}>
          <stop stopColor="#d2d6d4" />
          <stop offset=".22" stopColor="#828d91" />
          <stop offset=".8" stopColor="#323b42" />
          <stop offset="1" stopColor="#b2b8ba" />
        </radialGradient>
        <filter id={`${id}-blur`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>
      <ellipse
        cx="447"
        cy="353"
        rx="339"
        ry="21"
        fill="#000"
        opacity=".3"
        filter={`url(#${id}-blur)`}
      />
      <path d="M132 225v-38h95v8h-80v31" fill="#161f26" />
      <path d="m110 185 127-4 3 13-130 4Z" fill={car.color} />
      <path
        d={body}
        fill={`url(#${id}-body)`}
        stroke="#14222e"
        strokeWidth="2"
      />
      <path
        d="m270 216 63-58 75 1-10 57Z"
        fill={`url(#${id}-glass)`}
        stroke="#172933"
        strokeWidth="4"
      />
      <path
        d="m416 159 73 1 90 53-172 3Z"
        fill={`url(#${id}-glass)`}
        stroke="#172933"
        strokeWidth="4"
      />
      <path d="m491 164 64 48-112-11Z" fill="#b5ccd0" opacity=".13" />
      <path
        d="m131 239 119-14 350-1 140 19"
        fill="none"
        stroke="#e7f8ff"
        strokeOpacity=".5"
        strokeWidth="2"
      />
      <path d="m587 227 135 16 42 19-138-9Z" fill="#b8d7e4" opacity=".22" />
      <path
        d="m418 222-3 94M270 233l26 69M583 226l23 79"
        fill="none"
        stroke="#132530"
        strokeOpacity=".7"
        strokeWidth="2"
      />
      {sedan && (
        <path d="m320 227-7 82" fill="none" stroke="#132530" strokeWidth="2" />
      )}
      <path
        d="m100 279 65 8m135 18 306 1m125-20 54-9"
        fill="none"
        stroke="#c1dce5"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <path
        d="m106 302 65 12m131 9h304m127-8 51-15"
        fill="none"
        stroke="#10191e"
        strokeWidth="10"
      />
      <path d="m746 252 38 9-2 15-43-9Z" fill="#e3edf0" />
      <path d="m748 254 17 4m-18 1 17 4" stroke="#fff" strokeWidth="2" />
      <path d="m95 263 26-9v20l-28 6Z" fill="#e13930" />
      <path d="m103 263 13-4" stroke="#ffc1ac" strokeWidth="2" />
      <path d="m751 289 30-7v13l-32 8Z" fill="#111c24" />
      <path d="m753 289 25-5m-25 10 25-5" stroke="#52636a" />
      <path
        d="m569 216 21-10 17 7-10 10h-26Z"
        fill={car.color}
        stroke="#20343f"
        strokeWidth="2"
      />
      <rect x="365" y="232" width="23" height="5" rx="2.5" fill="#182a35" />
      <path
        d="m324 151 173-1"
        stroke="#c1d9e0"
        strokeOpacity=".65"
        strokeWidth="2"
      />
      {[
        { x: 234, y: 314 },
        { x: 672, y: 314 },
      ].map(({ x, y }) => (
        <g key={x}>
          <circle cx={x} cy={y} r="52" fill="#101214" />
          <circle
            cx={x}
            cy={y}
            r="46"
            fill="#1c2024"
            stroke="#343b3f"
            strokeWidth="2"
          />
          <circle cx={x} cy={y} r="36" fill={`url(#${id}-rim)`} />
          <circle cx={x} cy={y} r="29" fill="#1c252d" />
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <path
              key={angle}
              d={`M${x - 4} ${y - 6} ${x - 7} ${y - 34} ${x + 3} ${y - 34} ${x + 5} ${y - 6}Z`}
              transform={`rotate(${angle} ${x} ${y})`}
              fill="#b1bcc2"
              stroke="#5e6d76"
              strokeWidth="1"
            />
          ))}
          <circle
            cx={x}
            cy={y}
            r="9"
            fill="#26343d"
            stroke="#c5d0d4"
            strokeWidth="2"
          />
          <circle cx={x} cy={y} r="3" fill="#9aafb8" />
          <path
            d={`M${x - 41} ${y - 12}a43 43 0 0 1 75-13`}
            fill="none"
            stroke="#5d676a"
            strokeWidth="1"
          />
        </g>
      ))}
      <path d="m310 313 287 1" stroke="#d3e7ec" strokeOpacity=".3" />
      <text
        x="461"
        y="293"
        fontFamily="Arial,sans-serif"
        fontWeight="700"
        fontSize="10"
        letterSpacing="3"
        fill="#d9e5e8"
        opacity=".6"
      >
        {car.generation.toUpperCase()}
      </text>
    </svg>
  );
}
