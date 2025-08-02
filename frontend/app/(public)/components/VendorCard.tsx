import React from "react";

type VendorCardProps = {
  name: string;
  experience: string;
  type: string;
  city: string;
  img: string;
};

const VendorCard = ({ name, experience, type, city, img }: VendorCardProps) => (
  <div className="vendorCard">
    <img src={img} alt={name} className="vendorImg" loading="lazy" />
    <div className="vendorInfo">
      <h3 className="vendorName">{name}</h3>
      <div className="vendorExp">{experience}</div>
      <div className="vendorType">{type} · {city}</div>
      <button className="vendorCardActionBtn">Esnaf Bul</button>
    </div>
  </div>
);

export default VendorCard; 