import { db } from '../config/firebase';
import { UserWithRole } from '../../src/types/user.types';

export default class AnalyticsService {
    async institutionReport(user: UserWithRole) {
        let coursesSnap: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('courses');
        let enrollmentsSnap: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('enrollments');
      
        if (user.role === 'InstitutionAdmin') {
          coursesSnap = coursesSnap.where('institutionId', '==', user.institutionId);
          enrollmentsSnap = enrollmentsSnap.where('institutionId', '==', user.institutionId);
        }
      
        const [courses, enrollments] = await Promise.all([
          coursesSnap.get(),
          enrollmentsSnap.get()
        ]);
      
        return {
          totalCourses: courses.size,
          totalEnrollments: enrollments.size,
          avgProgress: enrollments.docs.length
            ? enrollments.docs.reduce((acc, doc) => acc + (doc.data().progress || 0), 0) / enrollments.docs.length
            : 0
        };
      }
      

  async teacherPerformance(user: UserWithRole) {
    const ref = db.collection('enrollments');
    const query = user.role === 'InstitutionAdmin'
      ? ref.where('institutionId', '==', user.institutionId)
      : ref;

    const snapshot = await query.get();
    const teacherStats: Record<string, { total: number; progress: number }> = {};

    snapshot.docs.forEach(doc => {
      const { teacherId, progress } = doc.data();
      if (!teacherStats[teacherId]) teacherStats[teacherId] = { total: 0, progress: 0 };
      teacherStats[teacherId].total += 1;
      teacherStats[teacherId].progress += progress;
    });

    const results = Object.entries(teacherStats).map(([teacherId, data]) => ({
      teacherId,
      avgProgress: data.progress / data.total,
      totalEnrollments: data.total
    }));

    return results;
  }

  async studentReport(studentId: string, user: UserWithRole) {
    if (user.role === 'Parent' && user.childId !== studentId) {
      throw { status: 403, message: 'Unauthorized' };
    }

    const snapshot = await db.collection('enrollments')
      .where('studentId', '==', studentId)
      .where('status', '==', 'active')
      .get();

    return snapshot.docs.map(doc => doc.data());
  }

  async courseEngagement(courseId: string, user: UserWithRole) {
    const ref = db.collection('enrollments').where('courseId', '==', courseId).where('status', '==', 'active');
    const snapshot = await ref.get();
    const total = snapshot.size;
    const progressTotal = snapshot.docs.reduce((sum, doc) => sum + (doc.data().progress || 0), 0);

    return {
      courseId,
      totalEnrolled: total,
      avgProgress: total ? progressTotal / total : 0
    };
  }
}