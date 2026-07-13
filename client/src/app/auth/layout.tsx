import Link from "next/link";
import { Leaf, Navigation, Store } from "lucide-react";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex font-sans">
            {/* Left Side - Brand & Value Prop (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 via-emerald-600 to-green-900 relative overflow-hidden flex-col justify-between p-12">
                {/* Decorative background circles */}
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-3xl mix-blend-overlay"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-black/20 blur-3xl mix-blend-overlay"></div>

                {/* Logo */}
                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-3 w-fit">
                        <div className="w-12 h-12 bg-white rounded-[16px] shadow-xl flex items-center justify-center transform -rotate-6 transition-transform hover:rotate-0">
                            <span className="text-green-600 font-black text-2xl font-outfit">V</span>
                        </div>
                        <span className="font-black text-4xl tracking-tighter text-white font-outfit drop-shadow-sm">
                            VeggieMap
                        </span>
                    </Link>
                </div>

                {/* Value Proposition */}
                <div className="relative z-10 max-w-md">
                    <h1 className="text-5xl font-black text-white mb-6 leading-[1.1] tracking-tight">
                        Fresh from the farm, straight to your block.
                    </h1>
                    <p className="text-green-50 text-xl font-medium mb-12 opacity-90 leading-relaxed">
                        Connect with local vegetable vendors, track fresh produce in real-time, and support your community.
                    </p>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <Navigation className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Live Tracking</h3>
                                <p className="text-green-100 text-sm">Find mobile carts near you instantly.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <Store className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Local Shops</h3>
                                <p className="text-green-100 text-sm">Discover top-rated static vegetable vendors.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Footer link */}
                <div className="relative z-10 text-green-100 text-sm font-medium opacity-80">
                    © {new Date().getFullYear()} VeggieMap. All rights reserved.
                </div>
            </div>

            {/* Right Side - Auth Forms */}
            <div className="flex-1 h-screen overflow-y-auto bg-zinc-50 dark:bg-black relative">
                {/* Mobile Header (Only visible on small screens) */}
                <div className="absolute top-6 left-6 lg:hidden z-10">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-[10px] flex items-center justify-center">
                            <span className="text-white font-bold text-lg font-outfit">V</span>
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-white font-outfit">
                            VeggieMap
                        </span>
                    </Link>
                </div>

                <div className="flex min-h-full items-center justify-center p-6 py-6 lg:py-8 pt-16 lg:pt-8">
                    <div className="w-full max-w-md">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}
