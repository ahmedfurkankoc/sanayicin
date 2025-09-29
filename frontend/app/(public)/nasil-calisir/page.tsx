import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import HowItWorks from "../components/HowItWorks";
import Footer from "../../components/Footer";
import VideoBanner from "../../components/VideoBanner";

export default function HowItWorksPage() {
  return (
    <>
      <Banner
        title="Nasıl Çalışır?"
        description="Sanayicin platformunun işleyişini aşağıda adım adım öğrenebilirsiniz."
        backgroundColor="var(--black)"
        textColor="var(--white)"
      />
      <HowItWorks />
    </>
  );
}