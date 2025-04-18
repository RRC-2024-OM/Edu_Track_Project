import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const sendPdfResponse = (
  res: Response,
  title: string,
  headers: string[],
  data: any[],
  filename: string
): void => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.fontSize(20).text(title, { align: 'center' }).moveDown();

  doc.fontSize(12);
  doc.text(headers.join(' | '));
  doc.moveDown();

  data.forEach(row => {
    const line = headers.map(header => row[header] ?? '').join(' | ');
    doc.text(line);
  });

  doc.end();
};
