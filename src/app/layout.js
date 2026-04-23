// src/app/layout.js
import './globals.css';
export const dynamic = "force-dynamic";
export const metadata = {
  title: 'GolfGive — Play. Win. Give.',
  description: 'Golf performance tracking with charity giving and monthly prize draws.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
