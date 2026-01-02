import "./globals.css";
import MenuBar from "../components/MenuBar";
import FloatingMenuWrapper from "../app/FloatingMenuWrapper";
import SessionWrapper from "../components/SessionWrapper";
import { UserDataProvider } from "../components/UserDataProvider";


export const metadata = {
  title: "LMRK",
  description: "List Manager and Recipe Keeper",
  icons: {
    icon: "/LMRK-protologo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  // Hide FloatingMenu on meal planner page
  // const hideFloatingMenu = pathname.startsWith("/meal-planner");
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bree+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
  <body className="font-sans min-h-screen flex flex-col" style={{ background: "var(--theme-pageBg)" }}>
        <SessionWrapper>
          <UserDataProvider>
            <MenuBar />
            <main className="flex-1">{children}</main>
            {/* FloatingMenu positioned above the footer with whitespace */}
            <FloatingMenuWrapper />
            <footer
              className="w-full text-center py-4 text-xs border-t-0"
              style={{ fontFamily: "'Bree Serif', serif", background: "var(--theme-menuBarBg)", color: "var(--theme-menuBarText)" }}
            >
              © Copyright Alex DK Courter
            </footer>
          </UserDataProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
