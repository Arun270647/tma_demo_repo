import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  User,
  MapPin,
  Globe,
  Phone,
  Mail,
  Calendar,
  Upload,
  Camera,
  Edit,
  Save,
  Award,
  Star,
  LogOut,
  Building2,
  Users,
  Clock,
  Shield,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AcademyProfile = ({ onLogoUpdated }) => {
  const { token, userRole, signOut } = useAuth();
  const { isLight } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    // Basic Information
    academy_name: "",
    description: "",
    established_year: "",
    website: "",

    // Contact Information
    contact_email: "",
    contact_phone: "",
    facility_address: "",

    // Social Media
    social_media: {
      facebook: "",
      twitter: "",
      instagram: "",
      youtube: "",
    },

    // Additional Information (Optional)
    facility_amenities: [],
    total_capacity: "",
    specializations: [],
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  const amenityOptions = [
    "Gym",
    "Pool",
    "Field",
    "Locker Rooms",
    "Parking",
    "Cafeteria",
    "Medical Room",
    "Equipment Storage",
    "Changing Rooms",
    "Physiotherapy Center",
  ];
  const specializationOptions = [
    "Football",
    "Basketball",
    "Tennis",
    "Swimming",
    "Athletics",
    "Cricket",
    "Badminton",
    "Volleyball",
    "Hockey",
    "Multi-Sport",
  ];

  const socialPlatforms = [
    {
      key: "facebook",
      label: "Facebook",
      icon: "📘",
      placeholder: "https://facebook.com/academy",
    },
    {
      key: "twitter",
      label: "Twitter",
      icon: "🐦",
      placeholder: "https://twitter.com/academy",
    },
    {
      key: "instagram",
      label: "Instagram",
      icon: "📷",
      placeholder: "https://instagram.com/academy",
    },
    {
      key: "youtube",
      label: "YouTube",
      icon: "📺",
      placeholder: "https://youtube.com/academy",
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);

        setFormData((prevData) => ({
          ...prevData,
          academy_name: userRole?.academy_name || data.academy_name || "",
          description: data.description || "",
          established_year: data.established_year || "",
          website: data.website || "",
          contact_email: data.contact_email || "",
          contact_phone: data.contact_phone || "",
          facility_address: data.facility_address || "",
          social_media: {
            facebook: data.social_media?.facebook || "",
            twitter: data.social_media?.twitter || "",
            instagram: data.social_media?.instagram || "",
            youtube: data.social_media?.youtube || "",
          },
          facility_amenities: data.facility_amenities || [],
          total_capacity: data.total_capacity || "",
          specializations: data.specializations || [],
        }));

        const incomingLogo = data.branding?.logo_url || data.logo_url;
        if (incomingLogo) {
          setLogoPreview(incomingLogo.startsWith('data:') ? incomingLogo : `${API_BASE_URL}${incomingLogo}`);
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prevData) => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [field]: value,
      }));
    }
  };

  const handleArrayToggle = (field, item) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: prevData[field].includes(item)
        ? prevData[field].filter((i) => i !== item)
        : [...prevData[field], item],
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setMessage({
        type: "error",
        text: "Only JPG, JPEG, PNG, and HEIC formats are allowed.",
      });
      return;
    }

    // Validate file size (500KB = 500 * 1024 bytes)
    const maxSize = 500 * 1024;
    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "Logo size must be less than 500KB. Please choose a smaller file.",
      });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return logoPreview; // Return current preview if no new file

    try {
      // logoPreview already contains the base64 string from handleLogoChange
      return logoPreview;
    } catch (error) {
      console.error("Error processing logo:", error);
      setMessage({ type: "error", text: "Failed to process logo" });
      return null;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });

      let logo_url = settings?.branding?.logo_url;
      if (logoFile) {
        logo_url = await uploadLogo();
        if (!logo_url) {
          setSaving(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          logo_url: logo_url,
          branding: {
            logo_url: logo_url,
            description: formData.description,
          },
        }),
      });

      if (response.ok) {
        const updatedSettings = await response.json();
        setSettings(updatedSettings);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
        setLogoFile(null);
        // Update logo preview to saved value
        const savedLogo = updatedSettings?.branding?.logo_url || updatedSettings?.logo_url;
        if (savedLogo) {
          setLogoPreview(savedLogo.startsWith('data:') ? savedLogo : `${API_BASE_URL}${savedLogo}`);
          if (typeof onLogoUpdated === 'function') {
            onLogoUpdated(savedLogo);
          }
        }
      } else {
        const error = await response.json();
        setMessage({
          type: "error",
          text: error.detail || "Failed to save profile",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveProfilePhoto = async () => {
    if (window.confirm('Are you sure you want to remove your academy logo?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/academy/settings`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            logo_url: null,
            branding: {
              ...settings?.branding,
              logo_url: null
            }
          })
        });

        if (response.ok) {
          const updatedSettings = await response.json();
          setSettings(updatedSettings); // Update local state to prevent logo from reappearing
          setLogoPreview(null);
          setLogoFile(null);
          setMessage({ type: 'success', text: '✅ Logo removed successfully' });
          if (typeof onLogoUpdated === 'function') {
            onLogoUpdated(null);
          }
        } else {
          const error = await response.json();
          setMessage({ type: 'error', text: `❌ Failed to remove logo: ${error.detail || 'Unknown error'}` });
        }
      } catch (error) {
        console.error('Error removing logo:', error);
        setMessage({ type: 'error', text: '❌ Error removing logo. Please try again.' });
      }
    }
  };

  const handleSignOut = async () => {
    if (window.confirm("Are you sure you want to sign out?")) {
      try {
        if (signOut) {
          await signOut();
        } else {
          // Fallback if signOut is not available
          localStorage.clear();
          sessionStorage.clear();
        }
        navigate("/");
      } catch (error) {
        console.error("Error signing out:", error);
        // Force navigate even if there's an error
        navigate("/");
      }
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isLight ? "bg-gray-50" : "bg-gray-900"
        }`}
      >
        <div className="flex flex-col items-center space-y-4">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-4 ${
              isLight
                ? "border-gray-300 border-t-blue-600"
                : "border-gray-800 border-t-cyan-400"
            }`}
          ></div>
          <p className={`${isLight ? "text-gray-600" : "text-cyan-400"}`}>
            Loading academy profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-6 space-y-6 ${
        isLight ? "bg-gray-50" : "bg-gray-900"
      } min-h-screen`}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2
            className={`text-3xl font-bold ${
              isLight ? "text-gray-900" : "text-white"
            } flex items-center gap-3`}
          >
            <User
              className={`w-8 h-8 ${
                isLight ? "text-blue-600" : "text-cyan-400"
              }`}
            />
            Academy Profile
          </h2>
          <p
            className={`${
              isLight ? "text-gray-600" : "text-gray-400"
            } mt-2 text-lg`}
          >
            Manage your academy's identity and public information
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                isLight
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30"
              }`}
            >
              <Edit className="w-5 h-5" />
              Edit Profile
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setLogoFile(null);
                  loadSettings();
                }}
                className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                  isLight
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                  isLight
                    ? "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shadow-md"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50"
                } disabled:cursor-not-allowed`}
              >
                <Save className="w-5 h-5" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === "success"
              ? isLight
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-green-500/10 border border-green-500/30 text-green-400"
              : isLight
              ? "bg-red-50 border border-red-200 text-red-800"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? (
            <Award className="w-5 h-5" />
          ) : (
            <Shield className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Overview Card */}
        <div className={`lg:col-span-1 space-y-6`}>
          {/* Logo & Basic Info Card */}
          <div
            className={`${
              isLight
                ? "bg-white border border-gray-200"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-8 shadow-lg`}
          >
            <div className="text-center">
              <div className="relative inline-block mb-6">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Academy Logo"
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-200 shadow-xl"
                  />
                ) : (
                  <div
                    className={`w-32 h-32 rounded-2xl flex items-center justify-center ${
                      isLight
                        ? "bg-gradient-to-br from-blue-50 to-purple-50"
                        : "bg-gradient-to-br from-gray-800 to-gray-900"
                    } border-4 border-gray-200 shadow-xl`}
                  >
                    <Building2
                      className={`w-16 h-16 ${
                        isLight ? "text-gray-400" : "text-gray-600"
                      }`}
                    />
                  </div>
                )}
                {isEditing && (
                  <label
                    className={`absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg ${
                      isLight
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30"
                    }`}
                  >
                    <Camera
                      className={`w-6 h-6 ${
                        isLight ? "text-white" : "text-blue-400"
                      }`}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <h3
                className={`text-2xl font-bold ${
                  isLight ? "text-gray-900" : "text-white"
                } mb-3`}
              >
                {formData.academy_name || "Academy Name"}
              </h3>
              <p
                className={`${
                  isLight ? "text-gray-600" : "text-gray-400"
                } mb-4 leading-relaxed`}
              >
                {formData.description ||
                  "Add a description to showcase your academy..."}
              </p>
              {logoFile && (
                <div
                  className={`text-sm ${
                    isLight ? "text-blue-600" : "text-blue-400"
                  } mb-4`}
                >
                  New logo selected - save to apply changes
                </div>
              )}
            </div>
          </div>

          {/* Account Management Card */}
          <div
            className={`${
              isLight
                ? "bg-white border border-gray-200"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-6 shadow-lg`}
          >
            <h4
              className={`text-lg font-semibold ${
                isLight ? "text-gray-900" : "text-white"
              } mb-4 flex items-center gap-2`}
            >
              <Shield
                className={`w-5 h-5 ${
                  isLight ? "text-blue-600" : "text-cyan-400"
                }`}
              />
              Account Management
            </h4>
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl ${
                  isLight ? "bg-gray-50" : "bg-gray-900"
                }`}
              >
                <div
                  className={`text-sm ${
                    isLight ? "text-gray-600" : "text-gray-400"
                  } mb-1`}
                >
                  Logged in as
                </div>
                <div
                  className={`font-medium ${
                    isLight ? "text-gray-900" : "text-white"
                  }`}
                >
                  {userRole?.email || "Academy Admin"}
                </div>
              </div>
              <button
                onClick={handleRemoveProfilePhoto}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isLight
                    ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                    : "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                }`}
              >
                <Trash2 className="w-5 h-5" />
                Remove Logo
              </button>
              <button
                onClick={handleSignOut}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isLight
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600"
                }`}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className={`lg:col-span-2 space-y-6`}>
          {/* Basic Information */}
          <div
            className={`${
              isLight
                ? "bg-white border border-gray-200"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-8 shadow-lg`}
          >
            <h4
              className={`text-xl font-semibold ${
                isLight ? "text-gray-900" : "text-white"
              } mb-6 flex items-center gap-2`}
            >
              <Building2
                className={`w-6 h-6 ${
                  isLight ? "text-blue-600" : "text-cyan-400"
                }`}
              />
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Academy Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.academy_name}
                    onChange={(e) =>
                      handleInputChange("academy_name", e.target.value)
                    }
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <p
                    className={`px-4 py-3 rounded-xl ${
                      isLight
                        ? "bg-gray-50 text-gray-900"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    {formData.academy_name || "Not specified"}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Academy Description
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe your academy's mission, values, and what makes it special..."
                    rows="4"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <p
                    className={`px-4 py-3 rounded-xl ${
                      isLight
                        ? "bg-gray-50 text-gray-900"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    {formData.description || "No description provided"}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Established Year{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.established_year}
                    onChange={(e) =>
                      handleInputChange("established_year", e.target.value)
                    }
                    placeholder="e.g., 2010"
                    min="1800"
                    max={new Date().getFullYear()}
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <p
                    className={`px-4 py-3 rounded-xl ${
                      isLight
                        ? "bg-gray-50 text-gray-900"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    {formData.established_year || "Not specified"}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Website URL <span className="text-gray-400">(Optional)</span>
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange("website", e.target.value)
                    }
                    placeholder="https://youracademy.com"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <div
                    className={`px-4 py-3 rounded-xl ${
                      isLight ? "bg-gray-50" : "bg-gray-900"
                    }`}
                  >
                    {formData.website ? (
                      <a
                        href={formData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-2 ${
                          isLight
                            ? "text-blue-600 hover:text-blue-700"
                            : "text-blue-400 hover:text-blue-300"
                        } transition-colors duration-200`}
                      >
                        <Globe className="w-4 h-4" />
                        {formData.website}
                      </a>
                    ) : (
                      <span
                        className={isLight ? "text-gray-500" : "text-gray-400"}
                      >
                        Not specified
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Total Capacity{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    value={formData.total_capacity}
                    onChange={(e) =>
                      handleInputChange("total_capacity", e.target.value)
                    }
                    placeholder="e.g., 200"
                    min="1"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <p
                    className={`px-4 py-3 rounded-xl ${
                      isLight
                        ? "bg-gray-50 text-gray-900"
                        : "bg-gray-900 text-white"
                    }`}
                  >
                    {formData.total_capacity
                      ? `${formData.total_capacity} students`
                      : "Not specified"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            className={`${
              isLight
                ? "bg-white border border-gray-200"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-8 shadow-lg`}
          >
            <h4
              className={`text-xl font-semibold ${
                isLight ? "text-gray-900" : "text-white"
              } mb-6 flex items-center gap-2`}
            >
              <Phone
                className={`w-6 h-6 ${
                  isLight ? "text-blue-600" : "text-cyan-400"
                }`}
              />
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Contact Email{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      handleInputChange("contact_email", e.target.value)
                    }
                    placeholder="info@youracademy.com"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <div
                    className={`px-4 py-3 rounded-xl ${
                      isLight ? "bg-gray-50" : "bg-gray-900"
                    }`}
                  >
                    {formData.contact_email ? (
                      <a
                        href={`mailto:${formData.contact_email}`}
                        className={`flex items-center gap-2 ${
                          isLight
                            ? "text-blue-600 hover:text-blue-700"
                            : "text-blue-400 hover:text-blue-300"
                        } transition-colors duration-200`}
                      >
                        <Mail className="w-4 h-4" />
                        {formData.contact_email}
                      </a>
                    ) : (
                      <span
                        className={isLight ? "text-gray-500" : "text-gray-400"}
                      >
                        Not specified
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Contact Phone{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      handleInputChange("contact_phone", e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <div
                    className={`px-4 py-3 rounded-xl ${
                      isLight ? "bg-gray-50" : "bg-gray-900"
                    }`}
                  >
                    {formData.contact_phone ? (
                      <a
                        href={`tel:${formData.contact_phone}`}
                        className={`flex items-center gap-2 ${
                          isLight
                            ? "text-blue-600 hover:text-blue-700"
                            : "text-blue-400 hover:text-blue-300"
                        } transition-colors duration-200`}
                      >
                        <Phone className="w-4 h-4" />
                        {formData.contact_phone}
                      </a>
                    ) : (
                      <span
                        className={isLight ? "text-gray-500" : "text-gray-400"}
                      >
                        Not specified
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label
                  className={`block text-sm font-medium mb-3 ${
                    isLight ? "text-gray-700" : "text-gray-300"
                  }`}
                >
                  Facility Address{" "}
                  <span className="text-gray-400">(Optional)</span>
                </label>
                {isEditing ? (
                  <textarea
                    value={formData.facility_address}
                    onChange={(e) =>
                      handleInputChange("facility_address", e.target.value)
                    }
                    placeholder="123 Sports Complex Drive, Athletic City, State 12345"
                    rows="3"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isLight
                        ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                        : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  />
                ) : (
                  <div
                    className={`px-4 py-3 rounded-xl ${
                      isLight ? "bg-gray-50" : "bg-gray-900"
                    }`}
                  >
                    {formData.facility_address ? (
                      <div
                        className={`flex items-start gap-2 ${
                          isLight ? "text-gray-900" : "text-white"
                        }`}
                      >
                        <MapPin
                          className={`w-4 h-4 mt-0.5 ${
                            isLight ? "text-blue-600" : "text-blue-400"
                          }`}
                        />
                        {formData.facility_address}
                      </div>
                    ) : (
                      <span
                        className={isLight ? "text-gray-500" : "text-gray-400"}
                      >
                        Not specified
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div
            className={`${
              isLight
                ? "bg-white border border-gray-200"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-8 shadow-lg`}
          >
            <h4
              className={`text-xl font-semibold ${
                isLight ? "text-gray-900" : "text-white"
              } mb-6 flex items-center gap-2`}
            >
              <Globe
                className={`w-6 h-6 ${
                  isLight ? "text-blue-600" : "text-cyan-400"
                }`}
              />
              Social Media Links{" "}
              <span className="text-gray-400 text-base font-normal">
                (Optional)
              </span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {socialPlatforms.map((platform) => (
                <div key={platform.key}>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium mb-3 ${
                      isLight ? "text-gray-700" : "text-gray-300"
                    }`}
                  >
                    <span className="text-lg">{platform.icon}</span>
                    {platform.label}
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.social_media[platform.key]}
                      onChange={(e) =>
                        handleInputChange(
                          `social_media.${platform.key}`,
                          e.target.value
                        )
                      }
                      placeholder={platform.placeholder}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${
                        isLight
                          ? "border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500"
                          : "border-gray-700 bg-gray-900 text-white focus:border-cyan-400"
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                    />
                  ) : (
                    <div
                      className={`px-4 py-3 rounded-xl ${
                        isLight ? "bg-gray-50" : "bg-gray-900"
                      }`}
                    >
                      {formData.social_media[platform.key] ? (
                        <a
                          href={formData.social_media[platform.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${
                            isLight
                              ? "text-blue-600 hover:text-blue-700"
                              : "text-blue-400 hover:text-blue-300"
                          } transition-colors duration-200`}
                        >
                          {formData.social_media[platform.key]}
                        </a>
                      ) : (
                        <span
                          className={
                            isLight ? "text-gray-500" : "text-gray-400"
                          }
                        >
                          Not specified
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div
            className={`${
              isLight
                ? "bg-white border border-gray-200"
                : "bg-gray-800 border border-gray-700"
            } rounded-2xl p-8 shadow-lg`}
          >
            <h4
              className={`text-xl font-semibold ${
                isLight ? "text-gray-900" : "text-white"
              } mb-6 flex items-center gap-2`}
            >
              <Award
                className={`w-6 h-6 ${
                  isLight ? "text-blue-600" : "text-cyan-400"
                }`}
              />
              Additional Information{" "}
              <span className="text-gray-400 text-base font-normal">
                (Optional)
              </span>
            </h4>

            {/* Specializations */}
            <div className="mb-8">
              <label
                className={`block text-sm font-medium mb-4 ${
                  isLight ? "text-gray-700" : "text-gray-300"
                }`}
              >
                Sports Specializations
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {specializationOptions.map((sport) => (
                    <label
                      key={sport}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.specializations.includes(sport)}
                        onChange={() =>
                          handleArrayToggle("specializations", sport)
                        }
                        className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                          isLight
                            ? "text-blue-600 focus:ring-blue-500 border-gray-300"
                            : "text-cyan-400 focus:ring-cyan-400 bg-gray-800 border-cyan-500/30"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isLight ? "text-gray-700" : "text-gray-300"
                        }`}
                      >
                        {sport}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div
                  className={`px-4 py-3 rounded-xl ${
                    isLight ? "bg-gray-50" : "bg-gray-900"
                  }`}
                >
                  {formData.specializations.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.specializations.map((sport) => (
                        <span
                          key={sport}
                          className={`px-3 py-1 rounded-full text-sm ${
                            isLight
                              ? "bg-blue-100 text-blue-800"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {sport}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span
                      className={isLight ? "text-gray-500" : "text-gray-400"}
                    >
                      No specializations specified
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Facility Amenities */}
            <div>
              <label
                className={`block text-sm font-medium mb-4 ${
                  isLight ? "text-gray-700" : "text-gray-300"
                }`}
              >
                Facility Amenities
              </label>
              {isEditing ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenityOptions.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.facility_amenities.includes(amenity)}
                        onChange={() =>
                          handleArrayToggle("facility_amenities", amenity)
                        }
                        className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                          isLight
                            ? "text-blue-600 focus:ring-blue-500 border-gray-300"
                            : "text-cyan-400 focus:ring-cyan-400 bg-gray-800 border-cyan-500/30"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isLight ? "text-gray-700" : "text-gray-300"
                        }`}
                      >
                        {amenity}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div
                  className={`px-4 py-3 rounded-xl ${
                    isLight ? "bg-gray-50" : "bg-gray-900"
                  }`}
                >
                  {formData.facility_amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {formData.facility_amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className={`px-3 py-1 rounded-full text-sm ${
                            isLight
                              ? "bg-green-100 text-green-800"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span
                      className={isLight ? "text-gray-500" : "text-gray-400"}
                    >
                      No amenities specified
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyProfile;
