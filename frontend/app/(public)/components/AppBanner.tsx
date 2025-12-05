import React from "react";

const AppBanner = () => (
  <section className="appBannerSection">
    <div className="container">
      <div className="appBanner">
          <div className="appBannerText">
            <h2 className="appBannerTitle">Hemen indir, Sanayicin ile ustaları hızlıca bul!</h2>
            <p className="appBannerDesc">Sanayicin ile hızlı ve kolay bir şekilde ustaları bulabilir, fiyat karşılaştırması yapabilir ve hizmet alabilirsiniz.</p>
            <div className="appButtons">
              <a href="#" className="appStoreBtn" aria-label="App Store">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ marginRight: 8 }}>
                  <path d="M16.365 1.43c0 1.14-.417 2.198-1.11 3.01-.794.94-2.107 1.665-3.207 1.56-.144-1.08.458-2.25 1.15-2.97.81-.86 2.19-1.5 3.167-1.6zM20.63 17.18c-.61 1.41-.9 2.03-1.69 3.27-1.1 1.68-2.65 3.77-4.56 3.79-1.07.02-1.8-.7-3.12-.7-1.32 0-2.1.68-3.17.72-1.93.07-3.41-1.96-4.52-3.63-2.46-3.72-2.72-8.08-1.2-10.39 1.13-1.75 2.92-2.78 4.6-2.78 1.72 0 2.8.74 4.23.74 1.4 0 2.24-.75 4.24-.75 1.52 0 3.14.83 4.26 2.27-3.73 2.05-3.13 7.48.39 8.86z" fill="#ffffff"/>
                </svg>
                <span>App Store</span>
              </a>
              <a href="#" className="googlePlayBtn" aria-label="Google Play">
                <svg width="18" height="18" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ marginRight: 8 }}>
                  <path fill="none" d="M0,0h40v40H0V0z"></path>
                  <g>
                    <path d="M19.7,19.2L4.3,35.3c0,0,0,0,0,0c0.5,1.7,2.1,3,4,3c0.8,0,1.5-0.2,2.1-0.6l0,0l17.4-9.9L19.7,19.2z" fill="#EA4335"></path>
                    <path d="M35.3,16.4L35.3,16.4l-7.5-4.3l-8.4,7.4l8.5,8.3l7.5-4.2c1.3-0.7,2.2-2.1,2.2-3.6C37.5,18.5,36.6,17.1,35.3,16.4z" fill="#FBBC04"></path>
                    <path d="M4.3,4.7C4.2,5,4.2,5.4,4.2,5.8v28.5c0,0.4,0,0.7,0.1,1.1l16-15.7L4.3,4.7z" fill="#4285F4"></path>
                    <path d="M19.8,20l8-7.9L10.5,2.3C9.9,1.9,9.1,1.7,8.3,1.7c-1.9,0-3.6,1.3-4,3c0,0,0,0,0,0L19.8,20z" fill="#34A853"></path>
                  </g>
                </svg>
                <span>Google Play</span>
              </a>
            </div>
          </div>
          <div className="appBannerImg">
            <img src="/images/app.png" alt="Mobil uygulama mockup" />
          </div>
      </div>
    </div>
  </section>
);

export default AppBanner; 