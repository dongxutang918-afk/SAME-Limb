import {assetUrl} from './asset-path';
import type { Metadata } from 'next';
import './globals.css';
import './academic.css';
import './refinements.css';
export const metadata: Metadata = {
  alternates: {canonical:'https://dongxutang918-afk.github.io/SAME-Limb/'},
  icons: { icon: assetUrl('/favicon.svg') },
  title: 'SAME-Limb | Synchronized AMG and EMG Dataset of Lower-limb Muscle Activities in Everyday Training',
  description: 'SAME-Limb: Synchronized AMG and EMG Dataset of Lower-limb Muscle Activities in Everyday Training. Explore 30 subjects, 1,918 trials, 16 task conditions and reproducible benchmarks.',
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}

