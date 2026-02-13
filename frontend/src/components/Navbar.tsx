import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchMyProfile } from '../api/profile';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getLinkClass = (path: string) => {
        return location.pathname === path ? 'nav-link nav-link-active' : 'nav-link';
    };

    const getLinkClassStartsWith = (path: string) => {
        return location.pathname.startsWith(path) ? 'nav-link nav-link-active' : 'nav-link';
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Fetch avatar image
    useEffect(() => {
        if (!isAuthenticated) { setAvatarUrl(null); return; }
        fetchMyProfile()
            .then((p) => setAvatarUrl(p.image || null))
            .catch(() => setAvatarUrl(null));
    }, [isAuthenticated]);

    const initials = user?.username?.slice(0, 2).toUpperCase() ?? '?';

    return (
        <header className="app-header">
            <div className="app-brand">
                <span className="app-logo-circle">EW</span>
                <div>
                    <div className="app-title">Educational Website</div>
                    <div className="app-subtitle">Learning platform</div>
                </div>
            </div>
            <nav className="app-nav">
                <Link to="/" className={getLinkClass('/')}>
                    Courses
                </Link>
                {isAuthenticated && (
                    <>
                        <Link to="/my-courses" className={getLinkClass('/my-courses')}>
                            My Courses
                        </Link>
                        <Link to="/assignments" className={getLinkClass('/assignments')}>
                            Assignments
                        </Link>
                        <Link to="/quizzes" className={getLinkClass('/quizzes')}>
                            Quizzes
                        </Link>
                        <Link to="/grades" className={getLinkClassStartsWith('/grades')}>
                            Grades
                        </Link>
                    </>
                )}
                {isAuthenticated ? (
                    <div ref={dropdownRef} style={{ position: 'relative', marginLeft: '0.25rem' }}>
                        <button
                            onClick={() => setDropdownOpen((prev) => !prev)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'none',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '9999px',
                                padding: '0.3rem 0.75rem 0.3rem 0.3rem',
                                cursor: 'pointer',
                                color: '#e5e7eb',
                                fontSize: '0.9rem',
                                transition: 'border-color 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'}
                            onMouseLeave={(e) => {
                                if (!dropdownOpen) e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)';
                            }}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar"
                                    style={{
                                        width: '2rem', height: '2rem', borderRadius: '50%',
                                        objectFit: 'cover', flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <span style={{
                                    width: '2rem', height: '2rem', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 700, color: '#fff',
                                    flexShrink: 0,
                                }}>
                                    {initials}
                                </span>
                            )}
                            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.username}
                            </span>
                            <span style={{ fontSize: '0.65rem', marginLeft: '0.15rem' }}>
                                {dropdownOpen ? '▲' : '▼'}
                            </span>
                        </button>

                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: 'calc(100% + 0.5rem)',
                                minWidth: '180px',
                                background: 'rgba(15, 23, 42, 0.95)',
                                border: '1px solid rgba(148, 163, 184, 0.2)',
                                borderRadius: '0.75rem',
                                padding: '0.4rem',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                zIndex: 999,
                                backdropFilter: 'blur(12px)',
                            }}>
                                <button
                                    onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        width: '100%', padding: '0.6rem 0.85rem', borderRadius: '0.5rem',
                                        border: 'none', background: 'transparent',
                                        color: '#e5e7eb', fontSize: '0.9rem', cursor: 'pointer',
                                        textAlign: 'left', transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span style={{ fontSize: '1rem' }}>👤</span>
                                    Personal Information
                                </button>
                                <div style={{ height: '1px', background: 'rgba(148, 163, 184, 0.1)', margin: '0.25rem 0.5rem' }} />
                                <button
                                    onClick={() => { setDropdownOpen(false); logout(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                                        width: '100%', padding: '0.6rem 0.85rem', borderRadius: '0.5rem',
                                        border: 'none', background: 'transparent',
                                        color: '#fca5a5', fontSize: '0.9rem', cursor: 'pointer',
                                        textAlign: 'left', transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span style={{ fontSize: '1rem' }}>🚪</span>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Link to="/login" className={getLinkClass('/login')}>
                            Login
                        </Link>
                        <Link
                            to="/register/student"
                            className={getLinkClassStartsWith('/register/student')}
                        >
                            Student sign up
                        </Link>
                        <Link
                            to="/register/teacher"
                            className={getLinkClassStartsWith('/register/teacher')}
                        >
                            Teacher sign up
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
};
