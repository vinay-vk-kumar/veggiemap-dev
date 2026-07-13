"use client";

import Link from "next/link";
import { SearchX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md w-full bg-white dark:bg-zinc-900/80 p-8 md:p-10 rounded-[32px] border border-zinc-200/80 dark:border-zinc-800 shadow-2xl text-center backdrop-blur-xl"
            >
                <div className="mb-8 relative flex justify-center">
                    <motion.div
                        animate={{ 
                            rotate: [0, -10, 10, -10, 10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatDelay: 3 
                        }}
                        className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center ring-8 ring-green-50/50 dark:ring-green-900/10"
                    >
                        <SearchX className="w-12 h-12 text-green-600 dark:text-green-500" />
                    </motion.div>
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-white tracking-tight mb-4">
                    404
                </h1>
                
                <h2 className="text-xl md:text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
                    Oops! Page Not Found
                </h2>
                
                <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8">
                    Looks like this page is out of stock! The link you followed might be broken, or the page may have been removed.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                        asChild
                        variant="outline" 
                        className="w-full sm:w-auto rounded-2xl h-12 px-6 border-zinc-200 dark:border-zinc-800 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-all font-bold gap-2 cursor-pointer"
                    >
                        <button onClick={() => window.history.back()}>
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                    </Button>
                    
                    <Button 
                        asChild
                        className="w-full sm:w-auto rounded-2xl h-12 px-6 shadow-lg shadow-green-600/20 text-white bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all font-bold gap-2 active:scale-[0.98] cursor-pointer"
                    >
                        <Link href="/">
                            <Home className="w-4 h-4" />
                            Return Home
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
