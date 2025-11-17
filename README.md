# TendLife - Financial Wellness for Hospitality Workers

A modern landing page built with Next.js, featuring interactive 3D effects powered by Three.js.

## Features

- Interactive pixel blast animation background
- Gradient text animations
- Typing text effect
- Responsive design
- Email waitlist signup

## Tech Stack

- **Next.js 14** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Three.js** - 3D graphics

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

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

No environment variables required for basic deployment.

## Project Structure

```
FinWellness/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Home page
│   └── globals.css      # Global styles
├── components/
│   └── TendLifeLanding.tsx  # Main landing page component
├── public/              # Static assets
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── next.config.js       # Next.js config
```

## License

MIT
