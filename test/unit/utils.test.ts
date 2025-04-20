import { sendCsvResponse } from '../../src/utils/csv.util';
import { sendPdfResponse } from '../../src/utils/pdf.util';
import { sendEmail } from '../../src/utils/email.util';
import { Response } from 'express';
import PDFDocument from 'pdfkit';

const sendMailMock = jest.fn();

// Suppress logs before imports that use them
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

jest.mock('nodemailer');
import nodemailer from 'nodemailer';
(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: sendMailMock });

describe('Utils – CSV, PDF, Email', () => {
  describe('sendCsvResponse', () => {
    it('should set headers and send CSV data', () => {
      const res = {
        setHeader: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      const data = [
        { name: 'Alice', score: 95 },
        { name: 'Bob', score: 88 },
      ];

      sendCsvResponse(res, data, 'report.csv');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('report.csv')
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('Alice'));
    });
  });

  describe('sendPdfResponse', () => {
    it('should create a PDF and pipe to response', () => {
      const pipeMock = jest.fn();
      const endMock = jest.fn();
      const textMock = jest.fn().mockReturnThis();
      const moveDownMock = jest.fn().mockReturnThis();

      jest.spyOn(PDFDocument.prototype, 'pipe').mockImplementation(pipeMock);
      jest.spyOn(PDFDocument.prototype, 'end').mockImplementation(endMock);
      jest.spyOn(PDFDocument.prototype, 'text').mockImplementation(textMock);
      jest.spyOn(PDFDocument.prototype, 'moveDown').mockImplementation(moveDownMock);

      const res = {
        setHeader: jest.fn(),
      } as unknown as Response;

      const headers = ['name', 'score'];
      const data = [
        { name: 'Alice', score: 90 },
        { name: 'Bob', score: 85 },
      ];

      sendPdfResponse(res, 'Test PDF', headers, data, 'test.pdf');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('test.pdf')
      );
      expect(pipeMock).toHaveBeenCalledWith(res);
      expect(textMock).toHaveBeenCalledWith(expect.stringContaining('name'));
      expect(endMock).toHaveBeenCalled();
    });
  });

  describe('sendEmail', () => {
    beforeEach(() => {
      sendMailMock.mockClear();
    });

    it('should send an email using nodemailer', async () => {
      await sendEmail({
        to: 'test@example.com',
        subject: 'Hello',
        html: '<p>Test email</p>',
      });

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Hello',
          html: '<p>Test email</p>',
        })
      );
    });

    it('should throw if email sending fails', async () => {
      sendMailMock.mockRejectedValueOnce(new Error('Send failed'));

      await expect(
        sendEmail({
          to: 'fail@example.com',
          subject: 'Fail',
          html: '<p>Failure</p>',
        })
      ).rejects.toThrow('Failed to send email notification.');
    });
  });
});
