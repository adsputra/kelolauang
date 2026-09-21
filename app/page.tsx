"use client";

import dynamic from 'next/dynamic';

// Next.js needs dynamic import for App because it uses React context and client-side features heavily
const App = dynamic(() => import('@/src/App'), { ssr: false });

export default function Page() {
  return <App />;
}
