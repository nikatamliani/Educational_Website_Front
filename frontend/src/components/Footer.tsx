import React from 'react';
import './Footer.css';

export const Footer: React.FC = () => {
    return (
        <footer className="app-footer">
            <span>© {new Date().getFullYear()} Educational Website (v{__APP_VERSION__})</span>
        </footer>
    );
};
