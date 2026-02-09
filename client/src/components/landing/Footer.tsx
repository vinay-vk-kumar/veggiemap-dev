const Footer = () => {
    return (
        <footer className="bg-white dark:bg-black border-t border-zinc-200 dark:border-zinc-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
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
                <div className="flex gap-6">
                    <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm">
                        Privacy
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm">
                        Terms
                    </a>
                    <a href="#" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-sm">
                        Twitter
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
