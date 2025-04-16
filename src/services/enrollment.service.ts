
import { db } from '../config/firebase';
import { EnrollmentData, UserWithRole } from '../types/enrollment.types';
import { v4 as uuidv4 } from 'uuid';
import { sendEmail } from '../utils/email.util';

export default class EnrollmentService {
  private collection = db.collection('enrollments');

  async enrollStudent(data: EnrollmentData, user: UserWithRole) {
    if (!['Teacher', 'InstitutionAdmin', 'SuperAdmin'].includes(user.role)) {
      throw { status: 403, message: 'Unauthorized to enroll students' };
    }

    const id = uuidv4();
    const enrollment = {
      id,
      courseId: data.courseId,
      studentId: data.studentId,
      teacherId: user.uid,
      institutionId: user.institutionId,
      progress: 0,
      status: 'active',
      enrolledAt: new Date(),
    };

    await this.collection.doc(id).set(enrollment);
    return enrollment;
  }

  async getEnrollments(query: any, user: UserWithRole) {
    let ref = this.collection.where('status', '==', 'active');

    if (user.role === 'Teacher') {
      ref = ref.where('teacherId', '==', user.uid);
    } else if (user.role === 'InstitutionAdmin') {
      ref = ref.where('institutionId', '==', user.institutionId);
    }

    if (query.courseId) {
      ref = ref.where('courseId', '==', query.courseId);
    }

    const snapshot = await ref.get();
    return snapshot.docs.map(doc => doc.data());
  }

  async unenrollStudent(id: string, user: UserWithRole) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) throw { status: 404, message: 'Enrollment not found' };

    const data = doc.data()!;
    if (
      user.role === 'Teacher' &&
      data.teacherId !== user.uid
    ) {
      throw { status: 403, message: 'Unauthorized to remove this enrollment' };
    }

    await this.collection.doc(id).update({ status: 'removed' });
  }

  async updateProgress(id: string, progress: number, user: UserWithRole) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) throw { status: 404, message: 'Enrollment not found' };

    const data = doc.data()!;
    if (user.role !== 'Teacher' || data.teacherId !== user.uid) {
      throw { status: 403, message: 'Unauthorized to update progress' };
    }

    await this.collection.doc(id).update({ progress });

    // Send notification to parent (if email available)
    const studentSnapshot = await db.collection('users')
      .where('uid', '==', data.studentId)
      .get();

    if (!studentSnapshot.empty) {
      const student = studentSnapshot.docs[0].data();

      if (student.parentEmail) {
        await sendEmail({
          to: student.parentEmail,
          subject: `Progress Update for ${student.fullName || 'your child'}`,
          html: `
            <p>Dear Parent,</p>
            <p>Your child <strong>${student.fullName || student.uid}</strong> has new course progress in <strong>${data.courseId}</strong>.</p>
            <p>Updated progress: <strong>${progress}%</strong></p>
            <p>Regards,<br>EduTrack Team</p>
          `,
        });
      }
    }

    return { ...data, progress };
  }

  async getStudentEnrollments(studentId: string, user: UserWithRole) {
    if (user.role === 'Parent' && user.childId !== studentId) {
      throw { status: 403, message: 'Unauthorized to view this student' };
    }

    let ref = this.collection
      .where('studentId', '==', studentId)
      .where('status', '==', 'active');

    const snapshot = await ref.get();
    return snapshot.docs.map(doc => doc.data());
  }
}
