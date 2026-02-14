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

    const role = user?.role; // 'student' | 'teacher' | 'admin' | undefined

    const linkCls = (path: string) =>
        location.pathname === path ? 'nav-link nav-link-active' : 'nav-link';

    const linkClsStartsWith = (prefix: string) =>
        location.pathname.startsWith(prefix) ? 'nav-link nav-link-active' : 'nav-link';

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

    /* ─── Determine nav links by role ─── */
    const renderNavLinks = () => {
        if (!isAuthenticated) {
            // Guest
            return (
                <>
                    <Link to="/" className={linkCls('/')}>Home</Link>
                    <Link to="/login" className={linkCls('/login')}>Login</Link>
                    <Link to="/register/student" className={linkClsStartsWith('/register')}>Register</Link>
                </>
            );
        }

        if (role === 'admin') {
            // Admin: Students, Teachers
            return (
                <>
                    <Link to="/students" className={linkClsStartsWith('/students')}>Students</Link>
                    <Link to="/teachers" className={linkClsStartsWith('/teachers')}>Teachers</Link>
                </>
            );
        }

        if (role === 'teacher') {
            // Teacher: Courses, My Courses, Assignments, Quizzes, Calendar
            return (
                <>
                    <Link to="/" className={linkCls('/')}>Courses</Link>
                    <Link to="/my-courses" className={linkClsStartsWith('/my-courses')}>My Courses</Link>
                    <Link to="/assignments" className={linkClsStartsWith('/assignment')}>Assignments</Link>
                    <Link to="/quizzes" className={linkClsStartsWith('/quiz')}>Quizzes</Link>
                    <Link to="/calendar" className={linkCls('/calendar')}>Calendar</Link>
                </>
            );
        }

        // Student: Courses, My Courses, Assignments, Quizzes, Calendar, Grades
        return (
            <>
                <Link to="/" className={linkCls('/')}>Courses</Link>
                <Link to="/my-courses" className={linkClsStartsWith('/my-courses')}>My Courses</Link>
                <Link to="/assignments" className={linkClsStartsWith('/assignment')}>Assignments</Link>
                <Link to="/quizzes" className={linkClsStartsWith('/quiz')}>Quizzes</Link>
                <Link to="/calendar" className={linkCls('/calendar')}>Calendar</Link>
                <Link to="/grades" className={linkClsStartsWith('/grades')}>Grades</Link>
            </>
        );
    };

    /* ─── Avatar dropdown (authenticated only) ─── */
    const renderUserActions = () => {
        if (!isAuthenticated) return null;

        return (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                    className="avatar-pill"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="avatar-circle avatar-circle-img"
                        />
                    ) : (
                        <span className="avatar-circle avatar-circle-initials">
                            {initials}
                        </span>
                    )}
                    <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.username}
                    </span>
                    <span style={{ fontSize: '0.6rem', marginLeft: '0.1rem', opacity: 0.6 }}>
                        {dropdownOpen ? '▲' : '▼'}
                    </span>
                </button>

                {dropdownOpen && (
                    <div className="avatar-dropdown">
                        <button
                            className="dropdown-item"
                            onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                        >
                            <span>👤</span> Personal Information
                        </button>
                        <div className="dropdown-divider" />
                        <button
                            className="dropdown-item dropdown-item-danger"
                            onClick={() => { setDropdownOpen(false); logout(); navigate('/login'); }}
                        >
                            <span>🚪</span> Logout
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <header className="app-header">
            <Link to="/" className="app-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="app-logo-circle">EW</span>
                <div>
                    <div className="app-title">Educational Website</div>
                    <div className="app-subtitle">Learning platform</div>
                </div>
            </Link>

            <nav className="app-nav-center">
                {renderNavLinks()}
            </nav>

            <div className="app-nav-right">
                {renderUserActions()}
            </div>
        </header>
    );
};
