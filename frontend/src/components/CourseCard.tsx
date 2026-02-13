import React from 'react';
import { Link } from 'react-router-dom';
import { Course } from '../api/courses';
import './CourseCard.css';

interface CourseCardProps {
    course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
    return (
        <Link to={`/course/${course.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <article className="course-card">
                <h2 className="course-title">{course.title}</h2>

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
