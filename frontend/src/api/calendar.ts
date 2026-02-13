import { fetchMyCourses, fetchTeacherCourses, type Course } from './courses'
import { fetchLessonsByCourse } from './lessons'
import { fetchQuizzesByCourseId } from './quizzes'

export interface CalendarEvent {
    id: number
    type: 'lesson' | 'quiz'
    title: string
    courseTitle: string
    courseId: number
    startDate: string | null
    endDate: string | null
}

/**
 * Fetch all calendar events (lessons + quizzes) for the current user.
 * - Students: from enrolled courses
 * - Teachers: from created courses
 */
export async function fetchCalendarEvents(role: 'student' | 'teacher'): Promise<CalendarEvent[]> {
    const courses: Course[] =
        role === 'teacher' ? await fetchTeacherCourses() : await fetchMyCourses()

    const events: CalendarEvent[] = []

    await Promise.all(
        courses.map(async (course) => {
            // Fetch lessons
            try {
                const lessons = await fetchLessonsByCourse(course.id)
                for (const lesson of lessons) {
                    events.push({
                        id: lesson.id,
                        type: 'lesson',
                        title: lesson.title,
                        courseTitle: course.title,
                        courseId: course.id,
                        startDate: lesson.startDate,
                        endDate: lesson.endDate,
                    })
                }
            } catch (e) {
                console.error(`Failed to fetch lessons for course ${course.id}`, e)
            }

            // Fetch quizzes
            try {
                const quizzes = await fetchQuizzesByCourseId(course.id)
                for (const quiz of quizzes) {
                    events.push({
                        id: quiz.id,
                        type: 'quiz',
                        title: quiz.title,
                        courseTitle: course.title,
                        courseId: course.id,
                        startDate: quiz.startDate,
                        endDate: quiz.endDate,
                    })
                }
            } catch (e) {
                console.error(`Failed to fetch quizzes for course ${course.id}`, e)
            }
        })
    )

    return events
}
