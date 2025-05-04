import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Viewport } from "next";
import { getSEOTags } from "@/libs/seo";
import ClientLayout from "@/components/LayoutClient";
import config from "@/config";
import "./globals.css";
import Script from "next/script";

const font = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
	// Will use the primary color of your theme to show a nice theme color in the URL bar of supported browsers
	themeColor: config.colors.main,
	width: "device-width",
	initialScale: 1,
};

// This adds default SEO tags to all pages in our app.
// You can override them in each page passing params to getSOTags() function.
export const metadata = getSEOTags();

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			data-theme={config.colors.theme}
			className={font.className}
		>
			<body>
				{/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
				<ClientLayout>{children}</ClientLayout>
				<Script
        id="varify-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,pid){
              var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s);
              j.async=true;
              j.src='https://varify-sepia.vercel.app/public/embed.js';
              j.setAttribute('data-project-id','b2590be2-cb8a-4631-b45f-93b59b62d419');
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','b2590be2-cb8a-4631-b45f-93b59b62d419');
          `,
        }}
      />
			</body>
		</html>
	);
}
