import { db } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class CourseService {
  private collection = db.collection('courses');

  async createCourse(data: any, user: AuthenticatedRequest['user']) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    const courseRef = this.collection.doc();
    const courseData = {
      ...data,
      teacherId: user.uid,
      institutionId: user.institutionId,
      isPublished: false,
      createdAt: new Date().toISOString(),
    };
    await courseRef.set(courseData);
    return { id: courseRef.id, ...courseData };
  }

  async getAllCourses(user: AuthenticatedRequest['user'], filter: any) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.collection;

    // Apply role-based filters
    if (user.role === 'Teacher') {
      query = query.where('teacherId', '==', user.uid);
    } else if (user.role === 'InstitutionAdmin') {
      query = query.where('institutionId', '==', user.institutionId);
    }

    if (filter.isPublished !== undefined) {
      query = query.where('isPublished', '==', filter.isPublished);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getCourseById(id: string, user: AuthenticatedRequest['user']) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const course = doc.data()!;
    const isOwnerOrAdmin = course.teacherId === user.uid || ['InstitutionAdmin', 'SuperAdmin'].includes(user.role);

    if (!course.isPublished && !isOwnerOrAdmin) {
      throw new Error('Unauthorized');
    }

    return { id: doc.id, ...course };
  }

  async updateCourse(id: string, updates: any, user: AuthenticatedRequest['user']) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    const ref = this.collection.doc(id);
    const doc = await ref.get();
    const course = doc.data();

    if (!course || (course.teacherId !== user.uid && !['InstitutionAdmin', 'SuperAdmin'].includes(user.role))) {
      throw new Error('Not authorized to update this course');
    }

    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await ref.update(updated);
    return { id: doc.id, ...course, ...updated };
  }

  async deleteCourse(id: string, user: AuthenticatedRequest['user']) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    const ref = this.collection.doc(id);
    const doc = await ref.get();
    const course = doc.data();

    if (!course || (course.teacherId !== user.uid && !['InstitutionAdmin', 'SuperAdmin'].includes(user.role))) {
      throw new Error('Not authorized to delete this course');
    }

    await ref.delete();
  }

  async togglePublishStatus(id: string, user: AuthenticatedRequest['user']) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    const ref = this.collection.doc(id);
    const doc = await ref.get();
    const course = doc.data();

    if (!course || (course.teacherId !== user.uid && !['InstitutionAdmin', 'SuperAdmin'].includes(user.role))) {
      throw new Error('Not authorized to publish/unpublish');
    }

    const updated = { isPublished: !course.isPublished, updatedAt: new Date().toISOString() };
    await ref.update(updated);
    return { id: doc.id, ...course, ...updated };
  }

  async getCourseStats(id: string, user: AuthenticatedRequest['user']) {
    if (!user) throw new Error('Unauthorized'); // Ensure user is defined

    const doc = await this.collection.doc(id).get();
    const course = doc.data();
    if (!course || course.teacherId !== user.uid) {
      throw new Error('Not authorized to view stats');
    }

    // Simulated stats
    return {
      enrolled: Math.floor(Math.random() * 100),
      averageProgress: Math.floor(Math.random() * 100),
    };
  }
}
