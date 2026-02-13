import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../api/courses';
import './CourseCard.css';

interface CourseCardProps {
    course: Course;
    basePath?: string;
    onEdit?: (course: Course) => void;
    onDelete?: (courseId: number) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, basePath = '/course/', onEdit, onDelete }) => {

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit?.(course);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete?.(course.id);
    };

    return (
        <Link to={`${basePath}${course.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            <article className="course-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h2 className="course-title">{course.title}</h2>
                    {(onEdit || onDelete) && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {onEdit && (
                                <button
                                    onClick={handleEdit}
                                    style={{
                                        background: 'none',
                                        border: '1px solid rgba(251, 191, 36, 0.4)',
                                        color: '#fbbf24',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '0.3rem',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={handleDelete}
                                    style={{
                                        background: 'none',
                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                        color: '#ef4444',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '0.3rem',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="course-meta">
                    {course.price != null && (
                        <span className="course-pill">
                            {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
                        </span>
                    )}
                    {course.duration != null && (
                        <span className="course-pill">
                            Duration: {course.duration} weeks
                        </span>
                    )}
                    {course.startDate && (
                        <span className="course-pill">
                            Starts{' '}
                            {new Date(course.startDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })}
                        </span>
                    )}
                </div>
            </article>
        </Link>
    );
};
