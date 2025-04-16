import { Response } from 'express';
import { Parser } from 'json2csv';

export const sendCsvResponse = (
  res: Response,
  data: any[],
  filename: string
): void => {
  const parser = new Parser();
  const csv = parser.parse(data);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
};
