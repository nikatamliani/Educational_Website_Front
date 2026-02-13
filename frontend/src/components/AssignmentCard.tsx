import React from 'react'
import { Assignment } from '../api/assignments'

import { useNavigate } from 'react-router-dom'

interface AssignmentCardProps {
    assignment: Assignment
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment }) => {
    const navigate = useNavigate()

    const getStatusColor = () => {
        switch (assignment.status) {
            case 'upcoming':
                return '#f59e0b' // amber-500
            case 'submitted':
                return '#3b82f6' // blue-500
            case 'returned':
                return '#10b981' // emerald-500
            default:
                return '#9ca3af'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <article
            className="course-card"
            onClick={() => navigate(`/assignment/${assignment.id}`)}
            style={{
                display: 'flex',
                cursor: 'pointer',
                flexDirection: 'column',
                gap: '0.5rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: getStatusColor(),
                }}
            />
            <div style={{ marginLeft: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.2rem' }}>
                    {assignment.courseTitle}
                </p>
                <h3 className="course-title" style={{ fontSize: '1.1rem' }}>
                    {assignment.title}
                </h3>
                <p className="course-description" style={{ fontSize: '0.9rem' }}>
                    {assignment.description}
                </p>

                <div className="course-meta" style={{ marginTop: '0.8rem' }}>
                    {assignment.status === 'upcoming' && (
                        <span className="course-pill" style={{ borderColor: '#f59e0b', color: '#fcd34d' }}>
                            Due: {formatDate(assignment.dueDate)}
                        </span>
                    )}

                    {assignment.status === 'submitted' && (
                        <span className="course-pill" style={{ borderColor: '#3b82f6', color: '#93c5fd' }}>
                            Submitted: {assignment.submittedDate ? formatDate(assignment.submittedDate) : '-'}
                        </span>
                    )}

                    {assignment.status === 'returned' && (
                        <>
                            <span className="course-pill" style={{ borderColor: '#10b981', color: '#6ee7b7' }}>
                                Grade: {assignment.grade}/{assignment.maxGrade}
                            </span>
                            {assignment.feedback && (
                                <p style={{ width: '100%', fontSize: '0.85rem', color: '#d1d5db', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                    "{assignment.feedback}"
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </article>
    )
}
