
import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Configure the transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,     
    pass: process.env.GMAIL_PASS,     
  },
});

// Send email
export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: `"EduTrack" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to:', to);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw new Error('Failed to send email notification.');
  }
};
