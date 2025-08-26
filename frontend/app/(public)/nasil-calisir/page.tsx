import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";

export default function HowItWorksPage() {
  return (
    <>
      <Navbar />
      <Banner
        title="Nasıl Çalışır?"
        description="Sanayicin platformunun işleyişini aşağıda adım adım öğrenebilirsiniz."
        backgroundColor="var(--black)"
        textColor="var(--white)"
      />
      <main>
        <HowItWorks />
      </main>
      <Footer />
    </>
  );
}