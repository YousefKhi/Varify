"use client";

import Link from "next/link";
import ButtonSignin from "@/components/ButtonSignin";
import Image from "next/image";
import RotatingText from "@/components/RotatingText";
import { FormEvent, SetStateAction, useState } from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [email2, setEmail2] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitting2, setIsSubmitting2] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: "", isError: false });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>, formEmail: string, setFormEmail: { (value: SetStateAction<string>): void; (value: SetStateAction<string>): void; (arg0: string): void; }, setFormSubmitting: { (value: SetStateAction<boolean>): void; (value: SetStateAction<boolean>): void; (arg0: boolean): void; }) => {
    e.preventDefault();
    
    // Validate email
    if (!formEmail || !/^\S+@\S+\.\S+$/.test(formEmail)) {
      setSubmitStatus({ message: "Please enter a valid email address", isError: true });
      return;
    }
    
    setFormSubmitting(true);
    setSubmitStatus({ message: "", isError: false });
    
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: formEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist");
      }
      
      setSubmitStatus({ message: "You've successfully joined the waitlist!", isError: false });
      setFormEmail("");
    } catch (error) {
      console.error("Error joining waitlist:", error);
      setSubmitStatus({ message: error.message || "Failed to join waitlist. Please try again.", isError: true });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-br from-[#111111] to-[#0A0A0A] text-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      <script
  async
  src="https://varify-sepia.vercel.app/embed.js"
  data-project-id="b2590be2-cb8a-4631-b45f-93b59b62d419"
  data-disable-highlight="true">
</script>

      {/* Background graphics - simplified for better performance */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-20 left-20 w-[200px] h-[200px] rounded-full bg-[#3ECF8E] blur-[80px] transform-gpu"></div>
        <div className="absolute bottom-10 right-20 w-[150px] h-[150px] rounded-full bg-[#2CB67D] blur-[80px] transform-gpu"></div>
      </div>
      
      {/* Simplified mesh pattern */}
      <div className="absolute inset-0 bg-[url('/mesh-grid.png')] bg-repeat opacity-5 z-0"></div>
      
      

      <main className="max-w-4xl mx-auto w-full flex flex-col items-center justify-center text-center gap-4 relative z-10 transform-gpu">
        {/* Logo */}
        <div className="mb-0">
          <div className="relative inline-block transform-gpu">
            <img 
              src="/icon.png" 
              alt="Varify Logo" 
              width={80} 
              height={80}
              className="transform-gpu"
              loading="eager"
            />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-center flex flex-col items-center gap-3 transform-gpu">
          <span className="font-inter text-white">
            It&apos;s not your product,
          </span>
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span data-varify-test-id="test-1" className="font-inter text-white">
              It&apos;s your
            </span>
            <RotatingText
              texts={['CTA', 'PRICING', 'CONVERSION %', 'ONBOARDING']}
              mainClassName="px-2 sm:px-3 md:px-4 bg-[#3ECF8E] text-black overflow-hidden py-0.5 sm:py-1 md:py-2 justify-center rounded-lg"
              staggerFrom="last"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-120%" }}
              staggerDuration={0.02}
              splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
              transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
              rotationInterval={3000}
            />
          </div>
        </h1>

        <p className="text-lg text-gray-300 max-w-2xl transform-gpu">
        Join the waitlist and be the first to try effortless, no-code A/B testing.
        </p>
        
        <div className="w-full max-w-md mt-6 relative transform-gpu">
          <form 
            className="relative flex flex-col sm:flex-row gap-3 w-full bg-[#151515] p-1 rounded-lg"
            onSubmit={(e) => handleSubmit(e, email, setEmail, setIsSubmitting)}
          >
            <input 
              type="email" 
              placeholder="Enter your email"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow px-4 py-3 rounded-lg bg-[#1A1A1A] border border-[#333333] focus:border-[#3ECF8E] focus:outline-none text-white placeholder-gray-500"
              required
            />
            <button 
              type="submit" 
              className="bg-[#3ECF8E] hover:bg-[#34B97C] text-black font-medium px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : "Join Waitlist"}
            </button>
          </form>
          
          {submitStatus.message && (
            <div className={`mt-2 text-sm ${submitStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
              {submitStatus.message}
            </div>
          )}
        </div>
        
        {/* Feature cards with hover effects */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
          <div className="group flex flex-col items-center p-6 bg-[#151515] rounded-xl border border-gray-800 hover:border-[#3ECF8E]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#3ECF8E]/10">
            <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3ECF8E" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Early Access</h2>
            <p className="text-gray-400 text-center">Be the first to try our platform before public launch</p>
          </div>
          
          <div className="group flex flex-col items-center p-6 bg-[#151515] rounded-xl border border-gray-800 hover:border-[#3ECF8E]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#3ECF8E]/10">
            <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3ECF8E" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Premium Features</h2>
            <p className="text-gray-400 text-center">Enjoy special pricing and premium features for early supporters</p>
          </div>
          
          <div className="group flex flex-col items-center p-6 bg-[#151515] rounded-xl border border-gray-800 hover:border-[#3ECF8E]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#3ECF8E]/10">
            <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3ECF8E" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Priority Support</h2>
            <p className="text-gray-400 text-center">Get dedicated help and influence product development</p>
          </div>
        </div>
        
        {/* Visual editor showcase */}
        <div className="mt-16 w-full">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Visual A/B Testing Made Simple</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#151515] rounded-xl overflow-hidden border border-gray-800 shadow-lg shadow-black/30 hover:border-[#3ECF8E]/20 transition-all duration-300">
              <div className="p-5 border-b border-gray-800">
                <h3 className="text-xl font-bold text-white">Intuitive Visual Editor</h3>
                <p className="text-gray-400 mt-2">Select any element on your page and create variations without coding</p>
              </div>
              <div className="relative">
                <img 
                  src="/100.png" 
                  alt="Visual A/B Test Editor"
                  className="w-full"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent"></div>
              </div>
            </div>
            
            <div className="bg-[#151515] rounded-xl overflow-hidden border border-gray-800 shadow-lg shadow-black/30 hover:border-[#3ECF8E]/20 transition-all duration-300">
              <div className="p-5 border-b border-gray-800">
                <h3 className="text-xl font-bold text-white">GitHub Integration</h3>
                <p className="text-gray-400 mt-2">Connect directly to your codebase for seamless testing and deployment</p>
              </div>
              <div className="relative">
                <img 
                  src="/200.png" 
                  alt="GitHub Integration Interface"
                  className="w-full"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming features section */}
        <div className="mt-16 w-full bg-[#151515] rounded-xl border border-gray-800 p-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Coming Soon</h2>
          <p className="text-gray-300 mb-8 max-w-3xl mx-auto">
            Join our waitlist today and be the first to experience these game-changing features as soon as they're released:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-gray-800">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3ECF8E" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Automatic Script Installer from GitHub</h3>
              <p className="text-gray-400 text-sm">
                One-click installation directly from your GitHub repository. No manual script copying required.
              </p>
            </div>
            
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-gray-800">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3ECF8E" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Automatic Variant Split Optimization</h3>
              <p className="text-gray-400 text-sm">
                AI-powered traffic allocation that automatically favors winning variants to maximize conversions.
              </p>
            </div>
            
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-gray-800">
              <div className="w-10 h-10 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3ECF8E" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced Analytics Dashboard</h3>
              <p className="text-gray-400 text-sm">
                Detailed insights with statistical confidence scoring and user segment analysis.
              </p>
            </div>
          </div>
        </div>
        
        {/* Join waitlist CTA */}
        <div className="mt-16 w-full bg-gradient-to-r from-[#1A1A1A] to-[#151515] rounded-xl border border-gray-800 p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Don't Miss Out</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Early access members get lifetime discounts, priority support, and input on future features.
            Our waitlist is filling up fast - secure your spot today.
          </p>
          
          <form 
            className="max-w-md mx-auto flex flex-col sm:flex-row gap-3"
            onSubmit={(e) => handleSubmit(e, email2, setEmail2, setIsSubmitting2)}
          >
            <input 
              type="email" 
              placeholder="Your email address"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              className="flex-grow px-4 py-3 rounded-lg bg-[#1A1A1A] border border-[#333333] focus:border-[#3ECF8E] focus:outline-none text-white placeholder-gray-500"
              required
            />
            <button 
              type="submit" 
              className="bg-[#3ECF8E] hover:bg-[#34B97C] text-black font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap flex items-center justify-center"
              disabled={isSubmitting2}
            >
              {isSubmitting2 ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </>
              ) : "Join Waitlist"}
            </button>
          </form>
          
          {submitStatus.message && (
            <div className={`mt-2 text-sm ${submitStatus.isError ? 'text-red-400' : 'text-green-400'}`}>
              {submitStatus.message}
            </div>
          )}
        </div>
        
      </main>
    </div>
  );
}
