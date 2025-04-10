import { CourseService } from '../../src/services/course.service';
import { db } from '../../src/config/firebase';  
import { AuthenticatedRequest } from '../../src/middleware/auth.middleware'; 

// Mock Firestore's db.collection method with proper mock implementation
jest.mock('../../src/config/firebase', () => ({
    db: {
      collection: jest.fn((collectionPath: string) => ({
        doc: jest.fn(() => ({
          set: jest.fn(),
          get: jest.fn(() => ({
            exists: true,
            data: jest.fn(() => ({ teacherId: 'teacher1', institutionId: 'institution1', isPublished: false }))
          })),
          update: jest.fn(),
          delete: jest.fn(),
        })),
        get: jest.fn(() => ({
          docs: [
            {
              id: 'course-1',
              data: jest.fn(() => ({ teacherId: 'teacher1', institutionId: 'institution1', isPublished: false }))
            },
          ],
        })),
        where: jest.fn(() => ({
          limit: jest.fn(() => ({
            get: jest.fn(() => ({
              docs: [
                {
                  id: 'course-1',
                  data: jest.fn(() => ({ teacherId: 'teacher1', institutionId: 'institution1', isPublished: false }))
                },
              ],
            }))
          }))
        }))
      })),
    },
  }));
  
  describe('CourseService', () => {
    let courseService: CourseService;
    const mockUser: AuthenticatedRequest['user'] = { uid: 'teacher1', email: 'teacher@example.com', role: 'Teacher', institutionId: 'institution1' };
  
    beforeEach(() => {
      courseService = new CourseService();
    });
  
    it('should create a course', async () => {
      const newCourseData = {
        title: 'Course 1',
        description: 'Course Description',
        institutionId: 'institution1',
      };
  
      const course = await courseService.createCourse(newCourseData, mockUser);
  
      expect(course).toHaveProperty('id');
      expect(course).toHaveProperty('teacherId', mockUser.uid);
      expect(course).toHaveProperty('isPublished', false); // Default value
    });
  
    it('should get all courses for a teacher', async () => {
      const courses = await courseService.getAllCourses(mockUser, {}, 10, null);
  
      expect(courses.courses).toHaveLength(1); // Should return 1 course
      expect(courses.courses[0]).toHaveProperty('id', 'course-1');
    });
  
  
    it('should throw error if user is not authorized to update a course', async () => {
      const mockUser2: AuthenticatedRequest['user'] = { uid: 'teacher2', email: 'teacher2@example.com', role: 'Teacher', institutionId: 'institution1' };
  
      try {
        await courseService.updateCourse('course-1', { title: 'Updated Course' }, mockUser2);
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toBe('Not authorized to update this course');
        } else {
          throw error; // If it's not an instance of Error, rethrow the error
        }
      }
    });
  
    it('should update course metadata', async () => {
      const updatedCourse = await courseService.updateCourse('course-1', { title: 'Updated Course Title' }, mockUser);
  
      expect(updatedCourse).toHaveProperty('title', 'Updated Course Title');
      expect(updatedCourse).toHaveProperty('updatedAt');
    });
  
  
    it('should toggle publish status of a course', async () => {
      const updatedCourse = await courseService.togglePublishStatus('course-1', mockUser);
  
      expect(updatedCourse).toHaveProperty('isPublished', true);
    });
  
    it('should throw error if not authorized to delete course', async () => {
      const mockUser2: AuthenticatedRequest['user'] = { uid: 'teacher2', email: 'teacher2@example.com', role: 'Teacher', institutionId: 'institution2' };
  
      try {
        await courseService.deleteCourse('course-1', mockUser2);
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toBe('Not authorized to delete this course');
        } else {
          throw error;
        }
      }
    });
  
    it('should return simulated stats', async () => {
      const stats = await courseService.getCourseStats('course-1', mockUser);
  
      expect(stats).toHaveProperty('enrolled');
      expect(stats).toHaveProperty('averageProgress');
    });
  });
  
  
  
  
  
  