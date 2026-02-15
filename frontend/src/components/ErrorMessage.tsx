import React from 'react';
import './ErrorMessage.css';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
    title?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message,
    onRetry,
    title = "Something went wrong"
}) => {
    return (
        <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-content">
                <h3 className="error-title">{title}</h3>
                <p className="error-message">{message}</p>
                {onRetry && (
                    <button className="retry-button" onClick={onRetry}>
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
