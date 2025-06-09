import "./globals.css";
import MenuBar from "../components/MenuBar";
import FloatingMenu from "../components/FloatingMenu";
import SessionWrapper from "../components/SessionWrapper";

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
  return (
    <html lang="en">
      <head>
        {/* Font link moved to _document.js */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bree+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans min-h-screen flex flex-col">
        <SessionWrapper>
          <MenuBar />
          <main className="flex-1">{children}</main>
          {/* FloatingMenu positioned above the footer with whitespace */}
          <div className="relative z-10 flex justify-center">
            <FloatingMenu />
          </div>
          <footer
            className="w-full text-center py-4 text-xs bg-purple-700 text-white border-t-0"
            style={{ fontFamily: "'Bree Serif', serif" }}
          >
            © Copyright Alex DK Courter
          </footer>
        </SessionWrapper>
      </body>
    </html>
  );
}
