import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Add contact to Resend audience
    const audienceId = process.env.RESEND_AUDIENCE_ID;

    if (audienceId) {
      // If you have an audience set up, add the contact
      await resend.contacts.create({
        email: email,
        audienceId: audienceId,
      });
    } else {
      // Fallback: Send yourself an email notification of the signup
      const notificationEmail = process.env.NOTIFICATION_EMAIL || 'you@example.com';

      await resend.emails.send({
        from: 'TendLife <onboarding@resend.dev>',
        to: notificationEmail,
        subject: 'New TendLife Waitlist Signup',
        html: `
          <h2>New Waitlist Signup</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Signed up:</strong> ${new Date().toLocaleString()}</p>
        `,
      });
    }

    return NextResponse.json(
      { message: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Subscription error:', error);

    // Handle duplicate email
    if (error?.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'Email already subscribed' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
