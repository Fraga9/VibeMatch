'use client';

import { ReactNode } from 'react';

interface StepCardProps {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}

export default function StepCard({ number, icon, title, description, children }: StepCardProps) {
  return (
    <div className="step-card">
      <span className="step-number">{number}</span>
      <div className="step-icon">
        {icon}
      </div>
      <h3 className="step-title">{title}</h3>
      <p className="step-description">{description}</p>
      {children}
    </div>
  );
}
