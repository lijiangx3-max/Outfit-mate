import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata = {
  title: "衣橱管家 - AI 智能穿搭管理",
  description: "您的私人 AI 时尚管家，轻量录入，智能管理。",
  manifest: "/manifest.json",
  icons: {
    apple: "/app_icon_logo.svg",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4f7942",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh">
      <body>
        <main className="main-content">
          {children}
        </main>
        <BottomNav />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for(let registration of registrations) {
                    registration.unregister();
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
