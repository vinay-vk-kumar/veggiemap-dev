import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, TrendingUp, Users, Smartphone } from "lucide-react";

const benefits = [
    {
        title: "Reach More Customers",
        description: "Be visible to thousands of nearby customers looking for fresh produce.",
        icon: Users,
    },
    {
        title: "Boost Your Sales",
        description: "Vendors on VeggieMap report up to 30% increase in daily earnings.",
        icon: TrendingUp,
    },
    {
        title: "Easy to Use",
        description: "Simple mobile app designed for everyone. No tech skills needed.",
        icon: Smartphone,
    },
];

const ForVendors = () => {
    return (
        <section id="vendors" className="py-24 bg-zinc-900 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm font-medium mb-6 border border-green-500/20">
                            For Street Vendors & Shop Owners
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">
                            Grow your business with <span className="text-green-500">VeggieMap</span>
                        </h2>
                        <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                            Stop waiting for customers to come to you. Let them find you on the map.
                            Join the digital revolution of street vending today.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {benefits.map((benefit) => (
                                <li key={benefit.title} className="flex gap-4">
                                    <div className="mt-1 bg-green-500/10 p-1 rounded-full h-fit">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white">{benefit.title}</h4>
                                        <p className="text-zinc-400 text-sm">{benefit.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link href="/auth/signup?role=vendor" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-green-600 text-primary-foreground hover:bg-green-700 h-11 px-8 py-2">
                                Register as Vendor
                            </Link>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="relative rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl bg-zinc-800/50 aspect-square sm:aspect-video lg:aspect-square flex items-center justify-center">
                            {/* Placeholder for Vendor App UI Graphic */}
                            <div className="text-center p-8">
                                <Smartphone className="w-24 h-24 mx-auto text-zinc-600 mb-4" />
                                <p className="text-zinc-500">App Screenshot / Graphic</p>
                            </div>

                            {/* Overlay Card */}
                            <div className="absolute bottom-6 left-6 right-6 bg-zinc-900/90 backdrop-blur-md p-4 rounded-xl border border-zinc-700 flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                    ₹
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400">Daily Earnings</p>
                                    <p className="text-lg font-bold text-white">₹ 2,500+</p>
                                </div>
                                <div className="ml-auto text-green-400 text-sm font-bold">
                                    +32% ↗
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ForVendors;
