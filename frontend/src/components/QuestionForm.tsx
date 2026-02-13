import { useState, useEffect } from 'react'
import { Button } from './Button'
import { type QuizQuestionDto } from '../api/quizzes'

interface QuestionFormProps {
    initialData?: Partial<QuizQuestionDto>
    onSubmit: (data: Partial<QuizQuestionDto>) => Promise<void>
    onCancel: () => void
    isLoading?: boolean
    error?: string | null
}

export function QuestionForm({
    initialData = {},
    onSubmit,
    onCancel,
    isLoading = false,
    error = null
}: QuestionFormProps) {
    const [formData, setFormData] = useState<Partial<QuizQuestionDto>>({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        ...initialData
    })

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }))
        }
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit(formData)
    }

    return (
        <div style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
        }}>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#e5e7eb' }}>
                {initialData.id ? 'Edit Question' : 'Add New Question'}
            </h4>

            {error && (
                <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Question Text *</label>
                    <textarea
                        value={formData.question}
                        onChange={e => setFormData(p => ({ ...p, question: e.target.value }))}
                        required
                        rows={3}
                        style={{
                            width: '100%', padding: '0.75rem', borderRadius: '0.5rem',
                            background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(148, 163, 184, 0.2)', color: 'white', resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {['A', 'B', 'C', 'D'].map((opt) => (
                        <div key={opt}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Option {opt} *</label>
                                <label style={{ fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', color: formData.correctOption === opt ? '#4ade80' : '#9ca3af' }}>
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        value={opt}
                                        checked={formData.correctOption === opt}
                                        onChange={() => setFormData(p => ({ ...p, correctOption: opt }))}
                                        style={{ accentColor: '#4ade80' }}
                                    />
                                    Correct Answer
                                </label>
                            </div>
                            <input
                                type="text"
                                value={formData[`option${opt}` as keyof QuizQuestionDto] as string || ''}
                                onChange={e => setFormData(p => ({ ...p, [`option${opt}`]: e.target.value }))}
                                required
                                style={{
                                    width: '100%', padding: '0.6rem', borderRadius: '0.5rem',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: `1px solid ${formData.correctOption === opt ? 'rgba(74, 222, 128, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
                                    color: 'white'
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <Button type="submit" disabled={isLoading || !formData.question?.trim()}>
                        {isLoading ? 'Saving...' : 'Save Question'}
                    </Button>
                    <Button variant="ghost" type="button" onClick={onCancel} disabled={isLoading}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    )
}
