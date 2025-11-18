import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Send welcome email to the subscriber
    const { data, error } = await resend.emails.send({
      from: 'TendLife <onboarding@resend.dev>', // Replace with your verified domain
      to: [email],
      subject: 'Welcome to TendLife Waitlist!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #40ffaa; text-align: center;">Welcome to TendLife!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Thanks for joining our waitlist! We're building something special for bartenders,
            servers, and hospitality workers who deserve better financial tools.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            You'll be among the first to know when we launch. Get ready to:
          </p>
          <ul style="font-size: 16px; line-height: 1.6; color: #333;">
            <li>Track your tips effortlessly</li>
            <li>Manage irregular income with confidence</li>
            <li>Plan for your financial future</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Stay tuned!<br/>
            <strong>The TendLife Team</strong>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Also send a notification to yourself (optional)
    await resend.emails.send({
      from: 'TendLife Waitlist <onboarding@resend.dev>',
      to: [process.env.ADMIN_EMAIL || 'admin@example.com'], // Replace with your email
      subject: 'New Waitlist Signup!',
      html: `
        <h2>New waitlist signup:</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      `,
    });

    return NextResponse.json(
      { message: 'Successfully subscribed', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
