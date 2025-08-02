import React from "react";

const AppBanner = () => (
  <section className="appBannerSection">
      <div className="appBanner">
          <div className="appBannerText">
            <h2 className="appBannerTitle">Hemen indir, Sanayicin ile ustaları hızlıca bul!</h2>
            <p className="appBannerDesc">Sanayicin ile hızlı ve kolay bir şekilde ustaları bulabilir, fiyat karşılaştırması yapabilir ve hizmet alabilirsiniz.</p>
            <div className="appButtons">
              <a href="#" className="appStoreBtn" aria-label="App Store">
                <span>App Store</span>
              </a>
              <a href="#" className="googlePlayBtn" aria-label="Google Play">
                <span>Google Play</span>
              </a>
            </div>
          </div>
          <div className="appBannerImg">
            <img src="/images/app.jpg" alt="Mobil uygulama mockup" />
          </div>
      </div>
  </section>
);

export default AppBanner; 