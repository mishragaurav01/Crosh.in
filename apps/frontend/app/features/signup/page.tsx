import SignupForm from "@/components/SignupForm"

export default function SignUp() {
    return (
        <main className="flex min-h-screen w-full">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-0">
                {/* Left side */}
                {/* Left side (Image Placeholder) */}
                <div className="hidden md:flex relative overflow-hidden bg-surface-dim items-center justify-center border-r border-surface-variant">
                    {/* Placeholder Text / Icon */}
                    <div className="text-center text-on-surface-variant/50">
                        <span className="material-symbols-outlined text-[64px] mb-4">image</span>
                        <p className="font-label-md text-label-md">Artisanal Image Placeholder</p>
                    </div>

                    {/* The Quote Overlay at the bottom */}
                    <div className="absolute bottom-xl left-xl z-20 max-w-[320px]">
                        <p className="font-headline-sm text-headline-sm italic text-on-surface">Every stitch tells a story of patience and warmth.</p>
                    </div>
                </div>

                {/* right side */}
                <div className="bg-surface-container-lowest p-xl md:p-xl flex flex-col justify-center form-fade-in shadow-sm">
                    <SignupForm />
                </div>
            </div>
        </main>
    )
}