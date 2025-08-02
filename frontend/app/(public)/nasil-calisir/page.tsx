import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <HeroSection
        title="Nasıl Çalışır?"
        description="Sanayicin platformunun işleyişini aşağıda adım adım öğrenebilirsiniz."
      />
      <main>
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}