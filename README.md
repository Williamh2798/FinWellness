# TendLife - Financial Wellness for Hospitality Workers

A modern landing page built with Next.js, featuring interactive 3D effects powered by Three.js.

## Features

- Interactive pixel blast animation background
- Gradient text animations
- Typing text effect
- Responsive design
- Email waitlist signup with Resend integration
- Real-time email validation and error handling

## Tech Stack

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Three.js** - 3D graphics
- **Resend** - Email collection and newsletters

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Resend API key:
```
RESEND_API_KEY=your_resend_api_key_here
```

Get your API key from [resend.com/api-keys](https://resend.com/api-keys)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Deploying to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure settings
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

### Option 3: Connect GitHub for Automatic Deployments

1. Push to your GitHub repository
2. Link the repository in Vercel dashboard
3. Every push to main will automatically deploy

## Environment Variables

### Required for Email Collection

Create a `.env.local` file (see `.env.example`):

```bash
# Required: Resend API Key
RESEND_API_KEY=your_api_key_here
```

### Optional Environment Variables

```bash
# Optional: Resend Audience ID for organized email list
# Create an audience at https://resend.com/audiences
RESEND_AUDIENCE_ID=your_audience_id_here

# Optional: Notification email (if no audience is set up)
NOTIFICATION_EMAIL=your-email@example.com
```

### Setting Up Resend

1. **Sign up at [resend.com](https://resend.com)** - Free tier includes 3,000 emails/month

2. **Get your API key:**
   - Go to [API Keys](https://resend.com/api-keys)
   - Create a new API key
   - Copy the key to your `.env.local` file

3. **Create an Audience (Recommended):**
   - Go to [Audiences](https://resend.com/audiences)
   - Click "Create Audience"
   - Name it (e.g., "TendLife Waitlist")
   - Copy the Audience ID to your `.env.local` file

4. **Add to Vercel:**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add `RESEND_API_KEY` with your API key
   - Optionally add `RESEND_AUDIENCE_ID`
   - Redeploy your app

### How Email Collection Works

- User submits email via the landing page form
- Next.js API route (`/api/subscribe`) validates the email
- If `RESEND_AUDIENCE_ID` is set: Contact is added to your Resend audience
- If not set: You receive a notification email about the signup
- User sees success/error message based on the result

### Sending Newsletters

Once you've collected emails in your Resend audience:

1. Go to [Resend Broadcasts](https://resend.com/broadcasts)
2. Create a new broadcast
3. Select your audience
4. Compose your newsletter
5. Send or schedule

## Project Structure

```
FinWellness/
├── app/
│   ├── api/
│   │   └── subscribe/
│   │       └── route.ts     # Email subscription API endpoint
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/
│   └── TendLifeLanding.tsx  # Main landing page component
├── public/                  # Static assets
├── .env.local               # Environment variables (not in git)
├── .env.example             # Environment variables template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── next.config.js           # Next.js config
```

## License

MIT
