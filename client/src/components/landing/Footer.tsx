const Footer = () => {
    return (
        <footer className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">V</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
                            VeggieMap
                        </span>
                    </div>
                    <p className="text-sm text-zinc-500">
                        © {new Date().getFullYear()} VeggieMap
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Support</h3>
                    <p className="text-sm text-zinc-500">
                        <a href="mailto:support@codewithvin.app" className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300">
                            support@codewithvin.app
                        </a>
                        <br />
                        and we'll get back to you within 24 hours.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-zinc-900 dark:text-white">Legal</h3>
                    <div className="flex flex-col gap-2">
                        <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm w-fit">
                            Privacy Policy
                        </a>
                        <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm w-fit">
                            Terms of Service
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;