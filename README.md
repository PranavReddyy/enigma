<div align="center">
  <img src="logo.png" width="60" alt="Enigma Logo">
  <h1>Enigma</h1>
  <p>Official website for Enigma, the Computer Science Club of Mahindra University</p>
  <p>
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" alt="Framer Motion">
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
    <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  </p>
</div>

![Enigma Website](enigma.png)

<a href="https://mu-enigma.org" target="_blank">Visit the website</a>

## Contents

- [How to install](#how-to-install)
- [How to contribute](#how-to-contribute)
- [Features](#features)

## Features

- **Interactive Landing Page**: Modern design with smooth animations
- **Events Management**: Dynamic events calendar with filtering and search
- **Committee Showcase**: Five specialized committees (AI/ML, WebDev, SysCom, GameDev, Cyber)
- **Real-time Updates**: Live leaderboards and statistics
- **Responsive Design**: Optimized for all devices

## How to install

1. Clone this repository:

```bash
git clone https://github.com/PranavReddyy/enigma.git
```

2. Go into project directory:

```bash
cd enigma
```

3. Install dependencies:

```bash
npm install
```

4. Set up environment variables:

Create a `.env.local` file in the root directory and add your environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GITHUB_TOKEN=your_github_token
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to contribute

1. Fork the repository

2. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes and commit them:

```bash
git add .
git commit -m "Add your descriptive commit message"
```

4. Push to your fork:

```bash
git push origin feature/your-feature-name
```

5. Submit a pull request to the main branch

Please ensure your code follows the existing style and includes appropriate documentation. Here's a resource on how to write a <a href="https://github.blog/developer-skills/github/how-to-write-the-perfect-pull-request/" target="_blank">perfect pull request</a>.

**Note**: If you wish to add new pages, please add them as new routes under the `app` directory following Next.js 13+ app router conventions.

## Project Structure

```
enigma/
├── app/                   # Next.js app router pages
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── public/                # Static assets
└── README.md
```

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom components
- **Database**: Supabase for events and data management
- **Animations**: Framer Motion for smooth interactions
- **Deployment**: Vercel for hosting and CI/CD
