import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import VendorCard from "./components/VendorCard";
import AppBanner from "./components/AppBanner";
import Footer from "./components/Footer";
import CTASection from "./components/CTASection";
import PlatformAdvantages from "./components/PlatformAdvantages";
import HowItWorks from "./components/HowItWorks";
import CityVendorsSection from "./components/CityVendorsSection";
import VendorsSection from "./components/VendorsSection";

export default function Home() {
  return (
    <>
      <Navbar />
      
      <main>
        <section className="heroSection">
          <img 
            src="/images/banner.jpg" 
            alt="Hero background" 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />
          <div className="container">
            <h1 className="heroTitle">Size En Yakın Ustayı Hemen Bulun</h1>
            <p className="heroDescription">
              Size en yakın ve güvenilir ustalara kolayca ulaşın, vakit kaybetmeyin.
            </p>
            <SearchBar />
          </div>
        </section>

        <PlatformAdvantages />
        
        <HowItWorks />

        <CTASection
          title="Hizmet Ver"
          description="Daha fazla müşteriye ulaşmak, işlerinizi büyütmek ve kazancınızı artırmak ister misiniz? Esnafların ve hizmet verenlerin buluştuğu bu platformda kendi profilinizi oluşturun, hizmetlerinizi sergileyin ve anında yeni iş fırsatlarına erişin."
          buttonText="Hemen Kayıt Ol"
          buttonHref="/esnaf/kayit"
          variant="vendor"
          imageSrc="/images/hizmet-ver.jpg"
          imageAlt="Hizmet verenler için kayıt görseli"
        />
        
        <VendorsSection />

        <CityVendorsSection />

        <CTASection
          title="Usta Bul"
          description="Aracınızda bir sorun mu var? Elektrik, elektronik, mekanik veya kaporta boya işleriniz için güvenilir ustalar mı arıyorsunuz? Sanayicin ile size en yakın, deneyimli ve güvenilir otomotiv ustalarını bulun. Hızlı fiyat teklifleri alın, değerlendirmeleri inceleyin ve aracınızı güvenle teslim edin."
          buttonText="Hemen Bul"
          buttonHref="#usta-ara"
          variant="user"
          imageSrc="/images/hizmet-bul.jpg"
          imageAlt="Hizmet alanlar için usta bul görseli"
          reverse
        />
        
        <AppBanner /> 

      </main>
      <Footer />
    </>
  );
}
 