import { NextResponse } from 'next/server';
import { db } from '@/db';
import { paymentProofs, tenants, invoices } from '@/db/schema';
import { verifyTenant, unauthorized } from '@/lib/auth';
import { uploadToImgBB } from '@/lib/imgbb';
import nodemailer from 'nodemailer';
import { eq, desc } from 'drizzle-orm';

export async function POST(request: Request) {
  const tenantPayload = await verifyTenant();
  if (!tenantPayload) return unauthorized();

  try {
    const formData = await request.formData();
    const amount = formData.get('amount') as string;
    const message = formData.get('message') as string;
    const file = formData.get('receipt') as File;

    if (!file) {
      return NextResponse.json({ error: 'Receipt image is required' }, { status: 400 });
    }

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Upload to ImgBB
    const receiptUrl = await uploadToImgBB(file);

    // Save to DB
    await db.insert(paymentProofs).values({
      tenantId: tenantPayload.sub as string,
      amount: amount,
      receiptUrl: receiptUrl,
      message: message,
      status: 'Pending',
      submittedAt: new Date(),
    });

    // Send Email via SMTP
    try {
      if (!process.env.SMTP_HOST) {
        console.warn('SMTP_HOST not defined. Skipping email notification.');
      } else {
        // Fetch Tenant Name, Unit, and Building
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantPayload.sub as string),
            columns: { name: true },
            with: {
                room: {
                    columns: { name: true },
                    with: {
                        building: {
                            columns: { name: true }
                        }
                    }
                }
            }
        });

        // Fetch Latest Invoice for Periods
        const latestInvoice = await db.query.invoices.findFirst({
            where: eq(invoices.tenantId, tenantPayload.sub as string),
            orderBy: [desc(invoices.date)]
        });

        const tenantName = tenant?.name || 'Unknown Tenant';
        const unitNumber = tenant?.room?.name || 'N/A';
        const buildingName = tenant?.room?.building?.name || 'N/A';
        const rentPeriod = latestInvoice?.rentPeriod || 'N/A';
        const utilityPeriod = latestInvoice?.utilityPeriod || 'N/A';

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const amountFormatted = Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        const htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2563eb; color: #ffffff; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">New Payment Proof Submitted</h1>
          </div>
          <div style="padding: 20px; background-color: #f8fafc;">
            <p style="margin-top: 0; font-size: 16px;">Hello,</p>
            <p style="font-size: 16px;">A new payment proof has been submitted by a tenant.</p>
            
            <div style="background-color: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Tenant Name:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${tenantName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Unit Number:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${unitNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Building Name:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${buildingName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Rent Period:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${rentPeriod}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Utility Period:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right;">${utilityPeriod}</td>
                </tr>
                <tr style="border-top: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Amount Paid:</td>
                  <td style="padding: 8px 0; font-weight: bold; font-size: 14px; text-align: right; color: #16a34a;">₱${amountFormatted}</td>
                </tr>
                 <tr style="border-top: 1px solid #f1f5f9;">
                  <td style="padding: 8px 0; color: #64748b; font-size: 14px; vertical-align: top;">Message:</td>
                  <td style="padding: 8px 0; font-style: italic; font-size: 14px; text-align: right;">"${message}"</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; color: #64748b; margin-bottom: 5px;">A copy of the receipt is attached to this email.</p>
            <p style="font-size: 12px; color: #94a3b8;"><a href="${receiptUrl}" style="color: #2563eb; text-decoration: none;">View Full Resolution Receipt</a></p>
          </div>
          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            &copy; ${new Date().getFullYear()} Nicarjon Rental System. All rights reserved.
          </div>
        </div>
        `;

        const mailOptions = {
          from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `New Payment: ${tenantName} - Unit ${unitNumber}`,
          html: htmlContent,
          text: `New payment proof submitted by ${tenantName} (Unit ${unitNumber}, Building ${buildingName}). Rent: ${rentPeriod}. Utility: ${utilityPeriod}. Amount: ₱${amountFormatted}. Message: "${message}". Receipt URL: ${receiptUrl}`, // Fallback
          attachments: [
            {
              filename: file.name,
              content: fileBuffer,
            },
          ],
        };

        await transporter.sendMail(mailOptions);
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // We don't fail the request if email fails, as the DB record is already created
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting payment proof:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit payment' }, { status: 500 });
  }
}
