'use client';

import React from 'react';
import type { ShapeName } from '@/constants/subway';

interface ShapeProps {
  cx: number;
  cy: number;
  color: string;
  active?: boolean;
  dimmed?: boolean;
}

const Circle: React.FC<ShapeProps> = ({ cx, cy, color, active, dimmed }) => (
  <circle
    cx={cx}
    cy={cy}
    r={active ? 14 : 10}
    fill={color}
    stroke="currentColor"
    strokeWidth="2"
    className={`transition-all ${dimmed ? 'opacity-20' : 'opacity-100'}`}
  />
);

const SmallCircle: React.FC<ShapeProps> = ({ cx, cy, color, active, dimmed }) => (
  <circle
    cx={cx}
    cy={cy}
    r={active ? 9 : 6}
    fill={color}
    stroke="currentColor"
    strokeWidth="2"
    className={`transition-all ${dimmed ? 'opacity-20' : 'opacity-100'}`}
  />
);

const Diamond: React.FC<ShapeProps> = ({ cx, cy, color, active, dimmed }) => {
  const s = active ? 12 : 8;
  return (
    <rect
      x={cx - s}
      y={cy - s}
      width={s * 2}
      height={s * 2}
      fill={color}
      stroke="currentColor"
      strokeWidth="2"
      transform={`rotate(45 ${cx} ${cy})`}
      className={`transition-all ${dimmed ? 'opacity-20' : 'opacity-100'}`}
    />
  );
};

const Square: React.FC<ShapeProps> = ({ cx, cy, color, active, dimmed }) => {
  const s = active ? 10 : 8;
  return (
    <rect
      x={cx - s}
      y={cy - s}
      width={s * 2}
      height={s * 2}
      fill={color}
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-all ${dimmed ? 'opacity-20' : 'opacity-100'}`}
    />
  );
};

const Person: React.FC<ShapeProps> = ({ cx, cy, color, active, dimmed }) => {
  const s = active ? 12 : 9;
  return (
    <g
      transform={`translate(${cx - s}, ${cy - s}) scale(${s / 12})`}
      className={`transition-all ${dimmed ? 'opacity-20' : 'opacity-100'}`}
    >
      <path
        d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 12c-5.33 0-10 3.67-10 9h20c0-5.33-4.67-9-10-9z"
        fill={color}
        stroke="currentColor"
        strokeWidth="2"
      />
    </g>
  );
};

const Star: React.FC<ShapeProps> = ({ cx, cy, color, active, dimmed }) => {
  const points = '12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9';
  const s = active ? 1.3 : 1.0;
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${s}) translate(-12, -12)`}
      className={`transition-all ${dimmed ? 'opacity-20' : 'opacity-100'}`}
    >
      <polygon points={points} fill={color} stroke="currentColor" strokeWidth="2" />
    </g>
  );
};

export const ShapeComponents: Record<ShapeName, React.FC<ShapeProps>> = {
  Circle,
  SmallCircle,
  Diamond,
  Square,
  Person,
  Star,
};

export type { ShapeProps };
export default ShapeComponents;
