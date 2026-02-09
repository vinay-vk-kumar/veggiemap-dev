import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col justify-center py-6 sm:py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 sm:mb-0">
                <Link href="/" className="flex items-center justify-center gap-2 mb-2 sm:mb-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">V</span>
                    </div>
                    <span className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-white">
                        VeggieMap
                    </span>
                </Link>
            </div>

            <div className="mt-4 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                {children}
            </div>
        </div>
    )
}
