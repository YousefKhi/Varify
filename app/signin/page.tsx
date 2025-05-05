"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/libs/supabase/client";
import { Provider } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import config from "@/config";

// This a login/singup page for Supabase Auth.
// Successfull login redirects to /api/auth/callback where the Code Exchange is processed (see app/api/auth/callback/route.js).
export default function Login() {
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const handleSignup = async (
    e: any,
    options: {
      type: string;
      provider?: Provider;
    }
  ) => {
    e?.preventDefault();

    setIsLoading(true);

    try {
      const { type, provider } = options;
      const redirectURL = window.location.origin + "/api/auth/callback";

      if (type === "oauth") {
        await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectURL,
            scopes: 'repo read:user user:email',
          },
        
        });
      } else if (type === "magic_link") {
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectURL,
          },
        });

        toast.success("Check your emails!");

        setIsDisabled(true);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#121212]">
      <div className="w-full max-w-xl p-6 sm:p-8 bg-[#1f1f1f] border border-[#444444] rounded-lg">
        <div className="text-center mb-4">
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white text-sm transition-colors">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5 mr-1"
            >
              <path
                fillRule="evenodd"
                d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
                clipRule="evenodd"
              />
            </svg>
            Home
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Sign in to {config.appName}
        </h1>

        <div className="space-y-6">
          <button
            className="w-full flex items-center justify-center py-2.5 px-4 bg-[#2a2a2a] hover:bg-[#333333] text-white rounded-md transition-colors border border-[#444444]"
            onClick={(e) =>
              handleSignup(e, { type: "oauth", provider: "github" })
            }
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 mr-2"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.489.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.16 22 16.419 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            )}
            Sign in with GitHub
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#444444]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[#1f1f1f] text-gray-400">OR</span>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => handleSignup(e, { type: "magic_link" })}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <input
                required
                type="email"
                value={email}
                autoComplete="email"
                placeholder="email@example.com"
                className="w-full py-2.5 px-4 bg-[#2a2a2a] text-white rounded-md border border-[#444444] focus:border-[#39a276] focus:ring-1 focus:ring-[#39a276] focus:outline-none transition-colors placeholder:text-gray-500"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              className="w-full py-2.5 px-4 bg-[#39a276] hover:bg-[#2d7d5a] text-white rounded-md transition-colors flex items-center justify-center"
              disabled={isLoading || isDisabled}
              type="submit"
            >
              {isLoading && (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></span>
              )}
              {isDisabled ? "Check Your Email" : "Send Magic Link"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
