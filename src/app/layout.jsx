import { AppProviders } from '@app/providers';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/app.css" />
      </head>
      <body data-transition-phase="idle" data-theme="dark">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}