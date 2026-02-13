import React, { useState, useEffect } from 'react'
import { Button } from './Button'
import { type Course } from '../api/courses'

interface CourseFormProps {
    initialData?: Partial<Course>
    onSubmit: (data: Partial<Course>) => Promise<void>
    onCancel: () => void
    isLoading: boolean
    error: string | null
    submitLabel?: string
}

export const CourseForm: React.FC<CourseFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
    isLoading,
    error,
    submitLabel = 'Create Course'
}) => {
    const [formData, setFormData] = useState<Partial<Course>>({
        title: '',
        description: '',
        price: null,
        duration: null,
        startDate: '',
        syllabus: '',
        ...initialData
    })

    // Reset form when initialData changes (for switching between create/edit)
    useEffect(() => {
        setFormData({
            title: '',
            description: '',
            price: null,
            duration: null,
            startDate: '',
            syllabus: '',
            ...initialData
        })
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    return (
        <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            maxWidth: '600px',
            marginTop: '1rem'
        }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#e5e7eb' }}>
                {submitLabel}
            </h3>

            {error && (
                <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Title *</label>
                    <input
                        type="text"
                        value={formData.title || ''}
                        onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                        required
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Description</label>
                    <textarea
                        value={formData.description || ''}
                        onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                        rows={3}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Price ($)</label>
                        <input
                            type="number"
                            value={formData.price ?? ''}
                            onChange={e => setFormData(p => ({ ...p, price: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Duration (weeks)</label>
                        <input
                            type="number"
                            value={formData.duration ?? ''}
                            onChange={e => setFormData(p => ({ ...p, duration: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                                background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white'
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Start Date</label>
                    <input
                        type="datetime-local"
                        value={formData.startDate || ''}
                        onChange={e => setFormData(p => ({ ...p, startDate: e.target.value }))}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white', colorScheme: 'dark'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <Button type="submit" disabled={isLoading || !formData.title?.trim()}>
                        {isLoading ? 'Saving...' : submitLabel}
                    </Button>
                    <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
