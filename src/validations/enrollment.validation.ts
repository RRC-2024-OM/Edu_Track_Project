
import Joi from 'joi';

export const enrollStudentSchema = Joi.object({
  studentId: Joi.string().required().label('Student ID'),
  courseId: Joi.string().required().label('Course ID'),
});

export const updateProgressSchema = Joi.object({
  progress: Joi.number()
    .min(0)
    .max(100)
    .required()
    .label('Progress')
    .messages({
      'number.base': 'Progress must be a number.',
      'number.min': 'Progress must be at least 0.',
      'number.max': 'Progress must be at most 100.',
    }),
});
