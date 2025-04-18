import { db } from '../config/firebase';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { isAuthenticated } from '../utils/auth.helpers'; 

export class CourseService {
  private collection = db.collection('courses');

  // Create a new course
  async createCourse(data: any, user: AuthenticatedRequest['user']) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized'); 

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

  // Get all courses with role-based access and pagination
  async getAllCourses(user: AuthenticatedRequest['user'], filter: any, pageSize: number, lastDoc: FirebaseFirestore.DocumentSnapshot | null) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized');

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = this.collection;

    // Apply role-based filters
    if (user.role === 'Teacher') {
      query = query.where('teacherId', '==', user.uid);
    } else if (user.role === 'InstitutionAdmin') {
      query = query.where('institutionId', '==', user.institutionId);
    }

    // Apply additional filters (e.g., isPublished)
    if (filter.isPublished !== undefined) {
      query = query.where('isPublished', '==', filter.isPublished);
    }

    // Apply pagination (start after last document)
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    // Apply page size (pagination)
    query = query.limit(pageSize);

    const snapshot = await query.get();
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return { courses, lastVisible }; 
  }

  // Get a course by ID
  async getCourseById(id: string, user: AuthenticatedRequest['user']) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized'); 

    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;

    const course = doc.data()!;
    const isOwnerOrAdmin = course.teacherId === user.uid || ['InstitutionAdmin', 'SuperAdmin'].includes(user.role);

    if (!course.isPublished && !isOwnerOrAdmin) {
      throw new Error('Unauthorized to view unpublished course');
    }

    return { id: doc.id, ...course };
  }

  // Update course metadata (e.g., title, description)
  async updateCourse(id: string, updates: any, user: AuthenticatedRequest['user']) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized'); 

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

  // Delete (archive) a course by ID
  async deleteCourse(id: string, user: AuthenticatedRequest['user']) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized'); // Type guard to ensure user is defined

    const ref = this.collection.doc(id);
    const doc = await ref.get();
    const course = doc.data();

    if (!course || (course.teacherId !== user.uid && !['InstitutionAdmin', 'SuperAdmin'].includes(user.role))) {
      throw new Error('Not authorized to delete this course');
    }

    await ref.delete();
  }

  // Toggle publish status for a course (draft/published)
  async togglePublishStatus(id: string, user: AuthenticatedRequest['user']) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized'); 

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

  // Get course stats (enrollment, progress)
  async getCourseStats(id: string, user: AuthenticatedRequest['user']) {
    if (!isAuthenticated(user)) throw new Error('Unauthorized');

    const doc = await this.collection.doc(id).get();
    const course = doc.data();
    if (!course || course.teacherId !== user.uid) {
      throw new Error('Not authorized to view stats');
    }

    // Simulated stats (random data for the demo)
    return {
      enrolled: Math.floor(Math.random() * 100),
      averageProgress: Math.floor(Math.random() * 100),
    };
  }
}
