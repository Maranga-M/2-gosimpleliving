
import React from 'react';
import { ThemeColor } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  themeColor?: ThemeColor;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  themeColor = 'amber',
  className = '',
  children,
  ...props
}) => {
  // Added active:scale-95 for tactile feedback
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  // Color mappings for Primary variant
  const primaryColors: Record<ThemeColor, string> = {
      amber: "bg-amber-500 hover:bg-amber-600 text-slate-900 focus:ring-amber-500",
      blue: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600",
      rose: "bg-rose-500 hover:bg-rose-600 text-white focus:ring-rose-500",
      emerald: "bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500",
      indigo: "bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-600",
      default: "bg-slate-600 hover:bg-slate-700 text-white focus:ring-slate-600",
      orange: "bg-orange-500 hover:bg-orange-600 text-white focus:ring-orange-500",
      red: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-600",
      green: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-600",
      purple: "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-600"
  };

  const variants = {
    primary: `${primaryColors[themeColor]} shadow-md hover:shadow-lg border border-transparent`,
    secondary: "bg-slate-900 hover:bg-slate-800 text-white shadow-md focus:ring-slate-900 border border-transparent",
    outline: "border-2 border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
