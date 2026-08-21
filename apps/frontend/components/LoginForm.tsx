"use client"; // This tells Next.js this component uses browser interactions
import { useState } from "react";

export default function LoginForm() {
    const [method, setMethod] = useState<'email' | 'phone'>('email');

    return (
        <div className="max-w-[448px] mx-auto w-full">
            <header className="mb-lg">
                <h1 className="font-headline-md text-headline-md text-primary mb-sm">
                    Welcome Back
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                    Sign in to your account to continue your journey.
                </p>
            </header>

            <div className="space-y-md">
                {/* Google OAuth Button */}
                <button className="w-full flex items-center justify-center gap-md bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface font-label-md text-label-md py-md rounded-full transition-all duration-300 shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                        ></path>
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        ></path>
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        ></path>
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                            fill="#EA4335"
                        ></path>
                    </svg>
                    Continue with Google
                </button>

                <div className="relative flex items-center py-sm">
                    <div className="flex-grow border-t border-outline-variant"></div>
                    <span className="flex-shrink mx-4 text-label-sm text-outline">
                        or
                    </span>
                    <div className="flex-grow border-t border-outline-variant"></div>
                </div>

                {/* Tabs for Email/Phone */}
                <div className="flex bg-surface-container-low p-1 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setMethod('email')}
                        className={`flex-1 py-2 text-label-md rounded-lg transition-all ${method === 'email' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => setMethod('phone')}
                        className={`flex-1 py-2 text-label-md rounded-lg transition-all ${method === 'phone' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
                    >
                        Phone
                    </button>
                </div>

                {/* Form Logic */}
                <form
                    className="space-y-sm"
                    onSubmit={(e) => e.preventDefault()}
                >
                    {/* Conditionally Render Email or Phone */}
                    {method === 'email' ? (
                        <div className="space-y-xs group form-fade-in">
                            <label
                                className="font-label-sm text-label-sm text-on-secondary-fixed-variant ml-1"
                                htmlFor="contact-email"
                            >
                                Email Address
                            </label>
                            <div className="relative tactile-input rounded-xl bg-surface-container-low transition-all duration-300">
                                <input
                                    className="w-full bg-transparent border-none focus:ring-0 px-lg py-md text-body-md text-on-surface placeholder:text-outline/50 rounded-xl"
                                    id="contact-email"
                                    placeholder="hello@crosh.in"
                                    type="email"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-xs group form-fade-in">
                            <label
                                className="font-label-sm text-label-sm text-on-secondary-fixed-variant ml-1"
                                htmlFor="contact-phone"
                            >
                                Phone Number
                            </label>
                            <div className="flex gap-sm tactile-input rounded-xl bg-surface-container-low transition-all duration-300">
                                <div className="flex items-center pl-lg pr-sm border-r border-outline-variant/30 text-on-surface-variant font-label-md">
                                    +91
                                </div>
                                <input
                                    className="w-full bg-transparent border-none focus:ring-0 px-md py-md text-body-md text-on-surface placeholder:text-outline/50 rounded-r-xl"
                                    id="contact-phone"
                                    placeholder="98765 43210"
                                    type="tel"
                                />
                            </div>
                        </div>
                    )}

                    <button className="w-full bg-primary text-on-primary font-label-md text-label-md py-md rounded-full transition-all duration-300 transform active:scale-[0.98] shadow-sm hover:shadow-md mt-md">
                        Send OTP
                    </button>
                </form>
            </div>

            <footer className="mt-lg text-center space-y-md">
                <p className="font-body-md text-body-md text-on-surface-variant">
                    Don't have an account?{" "}
                    <a
                        className="font-label-md text-label-md text-primary hover:underline underline-offset-4 decoration-primary/30 transition-all duration-300"
                        href="/signup"
                    >
                        Join our community
                    </a>
                </p>
            </footer>
        </div>
    );
}
