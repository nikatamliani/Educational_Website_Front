import React, { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || props.name || Math.random().toString(36).substr(2, 9);

    return (
        <div className={`form-field ${className}`}>
            <label htmlFor={inputId} className="form-label">
                {label}
            </label>
            <input
                id={inputId}
                className={`form-input ${error ? 'form-input-error' : ''}`}
                {...props}
            />
            {error && <span className="form-error-text">{error}</span>}
        </div>
    );
};
