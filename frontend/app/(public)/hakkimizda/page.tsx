import Navbar from "../components/Navbar";
import Banner from "../components/Banner";
import Footer from "../components/Footer";

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <Banner
        title="Hakkımızda"
        description="Sanayicin olarak misyonumuz ve vizyonumuz hakkında bilgi edinin."
        backgroundColor="var(--black)"
        textColor="var(--white)"
      />
      <main className="container">
        <section className="about-section">
          <h2 className="about-title">Sanayicin Nedir?</h2>
          <p className="about-text">
            Sanayicin, otomotiv sektöründe hizmet veren ustalar ile hizmet almak isteyen kullanıcıları bir araya getiren modern bir platformdur. Amacımız, güvenilir ve hızlı bir şekilde en yakın ustaya ulaşmanızı sağlamak ve sektördeki dijital dönüşüme öncülük etmektir.
          </p>
          <h3 className="about-subtitle">Misyonumuz</h3>
          <p className="about-text">
            Sanayi ekosistemini dijitalleştirerek, hem ustaların hem de hizmet arayanların hayatını kolaylaştırmak. Şeffaf, güvenilir ve hızlı bir hizmet ağı oluşturmak.
          </p>
          <h3 className="about-subtitle">Vizyonumuz</h3>
          <p className="about-text">
            Türkiye'nin dört bir yanında sanayi hizmetlerine erişimi kolaylaştırmak ve sektörde dijitalleşmenin öncüsü olmak.
          </p>
          <h3 className="about-subtitle">Neden Sanayicin?</h3>
          <ul className="about-list">
            <li>Güvenilir ve onaylı ustalar</li>
            <li>Gerçek müşteri yorumları ve puanlama sistemi</li>
            <li>Kullanıcı dostu ve hızlı arayüz</li>
            <li>Farklı kategorilerde geniş hizmet ağı</li>
            <li>Şeffaf fiyatlandırma ve kolay iletişim</li>
          </ul>
          <p className="about-text">
            Sanayicin ekibi olarak, sizlere en iyi deneyimi sunmak için sürekli çalışıyoruz. Bize her türlü öneri ve geri bildiriminizi iletebilirsiniz.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
} 