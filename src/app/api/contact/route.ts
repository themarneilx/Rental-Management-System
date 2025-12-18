import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { name, email, message, type } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configure transporter
    // In production, these should be environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || 'marneilx@proton.me'; // Default per context

    const subject = type === 'account_recovery' 
      ? `[Account Recovery] Request from ${name}` 
      : `[Contact] Message from ${name}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #2563eb;">New ${type === 'account_recovery' ? 'Account Recovery Request' : 'Contact Message'}</h2>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="margin-top: 20px;">
          <h3 style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Message Details:</h3>
          <p style="white-space: pre-wrap; background-color: #fff; padding: 15px; border: 1px solid #e2e8f0; border-radius: 4px;">${message}</p>
        </div>
        <div style="margin-top: 30px; font-size: 12px; color: #64748b;">
          This email was sent from the Nicarjon Rental Management System.
        </div>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: `"Nicarjon System" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: adminEmail,
      replyTo: email,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact API Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later or contact support directly.' }, 
      { status: 500 }
    );
  }
}
