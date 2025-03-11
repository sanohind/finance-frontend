import React from 'react';
import { IconType } from 'react-icons';

interface ButtonProps {
    title: string;
    onClick?: () => void;
    icon?: IconType;
    className?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    color?: string;
    iconClassName?: string;
}

const Button: React.FC<ButtonProps> = ({
    title,
    onClick,
    icon: Icon,
    className = '',
    type = 'button',
    disabled = false,
    color = 'bg-purple-900',
    iconClassName = '',
}) => {
    return (
        <button
            type={type}
            disabled={disabled}
            className={`flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-center text-white ${color} rounded-lg focus:ring-4 hover:ring-4 focus:outline-none focus:ring-blue-300 ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${className}`}
            onClick={onClick}
        >
            {Icon && <Icon className={`w-4 h-4 ${iconClassName}`} />}
            {title}
        </button>
    );
};

export default Button;
