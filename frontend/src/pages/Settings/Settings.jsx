import { useEffect, useState } from "react";
import "./Settings.css";

import {
  ImagePlus,
  MessageCircle,
  Users,
  Smartphone,
  Save,
  CheckCircle,
} from "lucide-react";

const Settings = () => {
  const [formData, setFormData] = useState({
    shopName: "Vk Jacky Span",
    ownerName: "Abdul Manaf",
    mobile: "9746094576",
    email: "",
    address: "",
    whatsappMode: "registered",
    logo: "",
  });

  const [logoPreview, setLogoPreview] = useState("");
  const [saved, setSaved] = useState(false);

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("shopSettings");

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      setFormData(settings);

      if (settings.logo) {
        setLogoPreview(settings.logo);
      }
    }
  }, []);

  // Handle normal inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSaved(false);
  };

  // Handle logo
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const imageData = reader.result;

      setLogoPreview(imageData);

      setFormData((prev) => ({
        ...prev,
        logo: imageData,
      }));

      setSaved(false);
    };

    reader.readAsDataURL(file);
  };

  // Save settings
  const handleSubmit = (e) => {
    e.preventDefault();

    localStorage.setItem(
      "shopSettings",
      JSON.stringify(formData)
    );

    setSaved(true);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your shop information and preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* SHOP INFORMATION */}
        <section className="settings-card">
          <div className="settings-card-header">
            <h2>Shop Information</h2>
          </div>

          <div className="settings-card-body">

            {/* LOGO */}
            <div className="shop-logo-row">
              <div className="shop-logo-preview">
                {logoPreview ? (
                  <img src={logoPreview} alt="Shop Logo" />
                ) : (
                  <ImagePlus size={30} />
                )}
              </div>

              <div className="shop-logo-content">
                <label>Shop Logo</label>

                <label className="choose-file-button">
                  Choose File

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>

                <span>
                  {logoPreview
                    ? "Image selected"
                    : "No file selected"}
                </span>
              </div>
            </div>

            {/* SHOP NAME */}
            <div className="settings-form-group">
              <label>
                Shop Name <span>*</span>
              </label>

              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                required
              />
            </div>

            {/* OWNER NAME */}
            <div className="settings-form-group">
              <label>
                Owner Name <span>*</span>
              </label>

              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
              />
            </div>

            {/* MOBILE */}
            <div className="settings-form-group">
              <label>
                Mobile Number <span>*</span>
              </label>

              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="settings-form-group">
              <label>Email (optional)</label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* ADDRESS */}
            <div className="settings-form-group">
              <label>Address (optional)</label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="4"
              />
            </div>

            {/* WHATSAPP */}
            <div className="whatsapp-section">
              <div className="whatsapp-title">
                <MessageCircle size={21} />
                <span>WhatsApp Bill Sharing</span>
              </div>

              <label
                className={`whatsapp-option ${
                  formData.whatsappMode === "registered"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="whatsappMode"
                  value="registered"
                  checked={
                    formData.whatsappMode === "registered"
                  }
                  onChange={handleChange}
                />

                <div className="whatsapp-option-icon">
                  <MessageCircle size={20} />
                </div>

                <div>
                  <strong>
                    Open WhatsApp with registered number
                  </strong>

                  <p>
                    Open WhatsApp with the bill addressed to
                    the customer's registered number.
                  </p>
                </div>
              </label>

              <label
                className={`whatsapp-option ${
                  formData.whatsappMode === "another"
                    ? "selected"
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="whatsappMode"
                  value="another"
                  checked={
                    formData.whatsappMode === "another"
                  }
                  onChange={handleChange}
                />

                <div className="whatsapp-option-icon">
                  <Users size={20} />
                </div>

                <div>
                  <strong>
                    Send to Another Number
                  </strong>

                  <p>
                    Open WhatsApp normally so any contact can
                    be selected.
                  </p>
                </div>
              </label>
            </div>

            {/* SAVE */}
            <div className="settings-actions">
              {saved && (
                <div className="settings-saved">
                  <CheckCircle size={18} />
                  Settings saved
                </div>
              )}

              <button
                type="submit"
                className="settings-save-button"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </section>

        {/* APP INSTALLATION */}
        <section className="settings-card app-installation-card">
          <div className="settings-card-header">
            <h2>App Installation</h2>
          </div>

          <div className="app-installation-body">
            <p>
              Install Rentalytics on your device for a
              full-screen, native-like experience. Works on
              Android, iPhone, Windows, and macOS.
            </p>

            <div className="app-installed">
              <Smartphone size={20} />
              <span>App installed</span>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
};

export default Settings;