# FinWellness / TendLife

A financial wellness platform built for bartenders, servers, and hospitality workers.

## Features

- Beautiful landing page with interactive pixel art animation
- Email waitlist subscription with Resend integration
- Automated welcome emails for new subscribers
- Admin notifications for new signups

## Setup

### Prerequisites

- Node.js 18+ installed
- A Resend account (sign up at [resend.com](https://resend.com))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Resend API key and admin email:
```env
RESEND_API_KEY=re_your_actual_api_key
ADMIN_EMAIL=your-email@example.com
```

### Getting Your Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key
4. Copy it to your `.env` file

### Configuring Email Sender

In `app/api/subscribe/route.ts`, update the `from` field with your verified domain:

```typescript
from: 'TendLife <onboarding@yourdomain.com>',
```

For testing, you can use `onboarding@resend.dev`.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page.

## Production

Build the application:

```bash
npm run build
npm start
```

## How the Email Subscription Works

1. User enters their email on the landing page
2. Frontend sends POST request to `/api/subscribe`
3. Backend validates the email
4. Resend sends a welcome email to the subscriber
5. Resend sends a notification to the admin email
6. User sees success message

## Deployment

This is a Next.js app and can be easily deployed to:
- [Vercel](https://vercel.com) (recommended)
- [Netlify](https://netlify.com)
- Any platform that supports Next.js

Don't forget to set your environment variables in your deployment platform!

## Customization

### Email Templates

Edit the email HTML in `app/api/subscribe/route.ts` to customize the welcome email.

### Landing Page Design

Edit `app/page.tsx` to customize the landing page design, colors, and animations.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI**: React with TypeScript
- **Animations**: Three.js for WebGL effects
- **Email**: Resend API
- **Styling**: Inline styles with CSS-in-JS

## License

MIT
