import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import ForVendors from "@/components/landing/ForVendors";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white dark:bg-black font-sans scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <ForVendors />
      <Footer />
    </main>
  );
}
