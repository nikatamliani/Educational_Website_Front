import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
    const location = useLocation();
    const { isAuthenticated, logout } = useAuth();

    const getLinkClass = (path: string) => {
        return location.pathname === path ? 'nav-link nav-link-active' : 'nav-link';
    };

    const getLinkClassStartsWith = (path: string) => {
        return location.pathname.startsWith(path) ? 'nav-link nav-link-active' : 'nav-link';
    };

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
                        <Link to="/calendar" className={getLinkClass('/calendar')}>
                            Calendar
                        </Link>
                    </>
                )}
                {isAuthenticated ? (
                    <button
                        className="nav-link"
                        onClick={logout}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit' }}
                    >
                        Logout
                    </button>
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
