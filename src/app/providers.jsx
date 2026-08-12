"use client";
import { LenisProvider } from '@providers/LenisProvider';
import { PreloaderProvider } from '@providers/PreloaderProvider';
import { PageTransitionProvider } from '@providers/PageTransitionProvider';
import { FooterProvider } from '@providers/FooterProvider';

export function AppProviders({ children }) {
  return (
    <LenisProvider>
      <PreloaderProvider>
        <PageTransitionProvider>
          <FooterProvider>
            {children}
          </FooterProvider>
        </PageTransitionProvider>
      </PreloaderProvider>
    </LenisProvider>
  );
}