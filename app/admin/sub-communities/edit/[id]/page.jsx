// "use client";

// import { useState, useEffect } from "react";
// import { useRouter, useParams } from "next/navigation";
// import { useDispatch, useSelector } from "react-redux";
// import toast from "react-hot-toast";
// import {
//   FiArrowLeft,
//   FiSave,
//   FiUpload,
//   FiX,
//   FiCheck,
//   FiAlertCircle,
//   FiMapPin,
// } from "react-icons/fi";
// import { Loader2, Search, Info, Image as ImageIcon, Video } from "lucide-react";
// import {
//   getCommunityById,
//   updateCommunity,
//   getAllCountries,
//   clearCommunityMessages,
//   clearCommunityErrors,
//   clearCurrentCommunity,
// } from "@/redux/actions/communityActions";

// const TABS = [
//   { id: "details", label: "Details", icon: Info },
//   { id: "seo", label: "SEO", icon: Search },
// ];

// const SLIDER_TYPES = [
//   { id: "image", label: "Image", icon: ImageIcon },
//   { id: "video", label: "Video", icon: Video },
// ];

// export default function EditCommunityPage() {
//   const router = useRouter();
//   const params = useParams();
//   const dispatch = useDispatch();
//   const communityId = params?.id;

//   const { currentCommunity, countries = [], loading, error, message } = useSelector(
//     (state) => state.communities || {}
//   );

//   const [form, setForm] = useState({
//     country: "",
//     community_name: "",
//     city: "",
//     longitude: "",
//     latitude: "",
//     slider_type: "image",
//     description: "",
//     seo_title: "",
//     seo_description: "",
//     focus_keyword: "",
//   });

//   const [locationImage, setLocationImage] = useState(null);
//   const [imagePreview, setImagePreview] = useState(null);
//   const [errors, setErrors] = useState({});
//   const [activeTab, setActiveTab] = useState("details");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Fetch community data and countries
//   useEffect(() => {
//     console.log("📍 Community ID:", communityId);
    
//     if (communityId) {
//       dispatch(getCommunityById(communityId));
//     } else {
//       toast.error("Community ID is missing");
//       router.push("/admin/communities");
//     }
    
//     dispatch(getAllCountries());

//     return () => {
//       dispatch(clearCurrentCommunity());
//     };
//   }, [dispatch, communityId, router]);

//   // Populate form when community data loads
//   useEffect(() => {
//     console.log("🏘️ Current Community Data:", currentCommunity);
    
//     if (currentCommunity) {
//       setForm({
//         country: currentCommunity.country || "",
//         community_name: currentCommunity.name || currentCommunity.community_name || "",
//         city: currentCommunity.city || "",
//         longitude: currentCommunity.longitude || "",
//         latitude: currentCommunity.latitude || "",
//         slider_type: currentCommunity.slider_type || "image",
//         description: currentCommunity.description || "",
//         seo_title: currentCommunity.seo_title || "",
//         seo_description: currentCommunity.seo_description || "",
//         focus_keyword: currentCommunity.focus_keyword || "",
//       });
      
//       if (currentCommunity.image) {
//         setImagePreview(currentCommunity.image);
//       }
//     }
//   }, [currentCommunity]);

//   // Handle success message
//   useEffect(() => {
//     if (message) {
//       toast.success(message);
//       dispatch(clearCommunityMessages());
//       router.push("/admin/communities");
//     }
//   }, [message, dispatch, router]);

//   // Handle error
//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       dispatch(clearCommunityErrors());
//     }
//   }, [error, dispatch]);

//   const handleChange = (field, value) => {
//     setForm((prev) => ({ ...prev, [field]: value }));
//     setErrors((prev) => ({ ...prev, [field]: "" }));
//   };

//   const handleImageUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       toast.error("Please upload an image file");
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       toast.error("Image must be less than 5MB");
//       return;
//     }

//     setLocationImage(file);
//     const reader = new FileReader();
//     reader.onload = (e) => setImagePreview(e.target.result);
//     reader.readAsDataURL(file);
//     toast.success("Image uploaded");
//   };

//   const removeImage = () => {
//     setLocationImage(null);
//     setImagePreview(null);
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     if (!form.country) newErrors.country = "Country is required";
//     if (!form.community_name) newErrors.community_name = "Community name is required";
//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) {
//       toast.error("Please fill all required fields");
//       return;
//     }

//     if (!communityId) {
//       toast.error("Community ID is missing");
//       return;
//     }

//     setIsSubmitting(true);

//     const formData = new FormData();
    
//     // Append all form fields
//     Object.keys(form).forEach((key) => {
//       if (form[key]) {
//         formData.append(key, form[key]);
//       }
//     });

//     // Append new image if uploaded
//     if (locationImage) {
//       formData.append("image", locationImage);
//     }

//     try {
//       await dispatch(updateCommunity({ id: communityId, formData }));
//     } catch (err) {
//       console.error("Update error:", err);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const seoChecks = [
//     {
//       label: "Add Focus Keyword to the SEO title",
//       passed: form.focus_keyword && form.seo_title.toLowerCase().includes(form.focus_keyword.toLowerCase()),
//     },
//     {
//       label: "Add Focus Keyword to your SEO Meta Description",
//       passed: form.focus_keyword && form.seo_description.toLowerCase().includes(form.focus_keyword.toLowerCase()),
//     },
//     {
//       label: "Use Focus Keyword in the content",
//       passed: form.focus_keyword && form.description.toLowerCase().includes(form.focus_keyword.toLowerCase()),
//     },
//     {
//       label: `Content is ${form.description.split(/\s+/).filter(Boolean).length} words long. Consider using at least 600 words.`,
//       passed: form.description.split(/\s+/).filter(Boolean).length >= 600,
//     },
//   ];

//   if (loading && !currentCommunity) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
//           <p className="text-sm text-gray-500">Loading community...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!currentCommunity && !loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-center">
//           <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
//           <p className="text-lg font-medium text-gray-900 mb-2">Community not found</p>
//           <button
//             onClick={() => router.push("/admin/communities")}
//             className="text-sm text-blue-600 hover:text-blue-700"
//           >
//             Go back to communities
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 pb-20">
//       <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//         {/* Header */}
//         <div className="mb-6">
//           <button
//             onClick={() => router.push("/admin/communities")}
//             className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4"
//           >
//             <FiArrowLeft className="w-4 h-4" />
//             Back to Communities
//           </button>

//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-semibold text-gray-900">Edit Community</h1>
//               <p className="text-sm text-gray-500 mt-1">Update community information</p>
//             </div>

//             <button
//               onClick={handleSubmit}
//               disabled={loading || isSubmitting}
//               className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
//             >
//               {isSubmitting ? (
//                 <Loader2 className="w-4 h-4 animate-spin" />
//               ) : (
//                 <FiSave className="w-4 h-4" />
//               )}
//               Update Community
//             </button>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="bg-white rounded-lg border border-gray-200 mb-6">
//           <div className="border-b border-gray-200">
//             <nav className="flex">
//               {TABS.map((tab) => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveTab(tab.id)}
//                   className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
//                     activeTab === tab.id
//                       ? "border-gray-900 text-gray-900"
//                       : "border-transparent text-gray-500 hover:text-gray-700"
//                   }`}
//                 >
//                   <tab.icon className="w-4 h-4" />
//                   {tab.label}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           <div className="p-6">
//             {/* Details Tab */}
//             {activeTab === "details" && (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 {/* Main Form */}
//                 <div className="lg:col-span-2 space-y-6">
//                   {/* Country & Community */}
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Select Country <span className="text-red-500">*</span>
//                       </label>
//                       <select
//                         value={form.country}
//                         onChange={(e) => handleChange("country", e.target.value)}
//                         className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
//                           errors.country ? "border-red-300" : "border-gray-200"
//                         }`}
//                       >
//                         <option value="">Select Country</option>
//                         {countries.map((country, idx) => (
//                           <option key={`${country}-${idx}`} value={country.name || country}>
//                             {country.name || country}
//                           </option>
//                         ))}
//                       </select>
//                       {errors.country && (
//                         <p className="text-xs text-red-600 mt-1">{errors.country}</p>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         Community name <span className="text-red-500">*</span>
//                       </label>
//                       <input
//                         type="text"
//                         value={form.community_name}
//                         onChange={(e) => handleChange("community_name", e.target.value)}
//                         className={`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 ${
//                           errors.community_name ? "border-red-300" : "border-gray-200"
//                         }`}
//                         placeholder="Enter community name"
//                       />
//                       {errors.community_name && (
//                         <p className="text-xs text-red-600 mt-1">{errors.community_name}</p>
//                       )}
//                     </div>
//                   </div>

//                   {/* City */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                       City
//                     </label>
//                     <input
//                       type="text"
//                       value={form.city}
//                       onChange={(e) => handleChange("city", e.target.value)}
//                       className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
//                       placeholder="e.g. Dubai"
//                     />
//                   </div>

//                   {/* Longitude & Latitude */}
//                   <div className="grid grid-cols-2 gap-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         <FiMapPin className="w-3.5 h-3.5 inline mr-1" />
//                         Longitude
//                       </label>
//                       <input
//                         type="text"
//                         value={form.longitude}
//                         onChange={(e) => handleChange("longitude", e.target.value)}
//                         className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
//                         placeholder="e.g. 55.2708"
//                       />
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                         <FiMapPin className="w-3.5 h-3.5 inline mr-1" />
//                         Latitude
//                       </label>
//                       <input
//                         type="text"
//                         value={form.latitude}
//                         onChange={(e) => handleChange("latitude", e.target.value)}
//                         className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
//                         placeholder="e.g. 25.2048"
//                       />
//                     </div>
//                   </div>

//                   {/* Slider Type */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Slider Type
//                     </label>
//                     <div className="flex gap-3">
//                       {SLIDER_TYPES.map((type) => {
//                         const Icon = type.icon;
//                         return (
//                           <button
//                             key={type.id}
//                             type="button"
//                             onClick={() => handleChange("slider_type", type.id)}
//                             className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
//                               form.slider_type === type.id
//                                 ? "border-gray-900 bg-gray-50 text-gray-900"
//                                 : "border-gray-200 text-gray-600 hover:border-gray-300"
//                             }`}
//                           >
//                             <Icon className="w-4 h-4" />
//                             {type.label}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* Community Description */}
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                       Community Description
//                     </label>
//                     <textarea
//                       value={form.description}
//                       onChange={(e) => handleChange("description", e.target.value)}
//                       rows={8}
//                       className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
//                       placeholder="Write about the community..."
//                     />
//                     <p className="text-xs text-gray-500 mt-1">
//                       {form.description.split(/\s+/).filter(Boolean).length} words
//                     </p>
//                   </div>
//                 </div>

//                 {/* Sidebar - Location Image */}
//                 <div className="space-y-4">
//                   <div className="bg-gray-50 rounded-lg p-4">
//                     <h3 className="text-sm font-medium text-gray-900 mb-3">Location Image</h3>
//                     <p className="text-xs text-gray-500 mb-3">
//                       Max File Size: 5MB<br />
//                       Filetypes: JPG, PNG
//                     </p>

//                     {imagePreview ? (
//                       <div className="relative">
//                         <div className="w-full h-40 bg-white border border-gray-200 rounded-lg overflow-hidden">
//                           <img
//                             src={imagePreview}
//                             alt="Location Preview"
//                             className="w-full h-full object-cover"
//                           />
//                         </div>
//                         <button
//                           type="button"
//                           onClick={removeImage}
//                           className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
//                         >
//                           <FiX className="w-3 h-3" />
//                         </button>
//                       </div>
//                     ) : (
//                       <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
//                         <FiUpload className="w-6 h-6 text-gray-400 mb-2" />
//                         <span className="text-sm text-gray-500">Upload Image</span>
//                         <span className="text-xs text-gray-400 mt-1">JPG or PNG</span>
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={handleImageUpload}
//                           className="hidden"
//                         />
//                       </label>
//                     )}

//                     {imagePreview && (
//                       <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
//                         <FiUpload className="w-3 h-3" />
//                         Change Image
//                         <input
//                           type="file"
//                           accept="image/*"
//                           onChange={handleImageUpload}
//                           className="hidden"
//                         />
//                       </label>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* SEO Tab */}
//             {activeTab === "seo" && (
//               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                 <div className="lg:col-span-2 space-y-4">
//                   {/* SEO Title */}
//                   <div>
//                     <div className="flex justify-between mb-1.5">
//                       <label className="text-sm font-medium text-gray-700">SEO Title</label>
//                       <span className="text-xs text-gray-500">{form.seo_title.length} / 60</span>
//                     </div>
//                     <input
//                       type="text"
//                       value={form.seo_title}
//                       onChange={(e) => handleChange("seo_title", e.target.value)}
//                       maxLength={60}
//                       className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
//                       placeholder="SEO title..."
//                     />
//                   </div>

//                   {/* SEO Description */}
//                   <div>
//                     <div className="flex justify-between mb-1.5">
//                       <label className="text-sm font-medium text-gray-700">SEO Description</label>
//                       <span className="text-xs text-gray-500">{form.seo_description.length} / 160</span>
//                     </div>
//                     <textarea
//                       value={form.seo_description}
//                       onChange={(e) => handleChange("seo_description", e.target.value)}
//                       maxLength={160}
//                       rows={3}
//                       className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
//                       placeholder="SEO description..."
//                     />
//                   </div>

//                   {/* Focus Keyword */}
//                   <div>
//                     <div className="flex justify-between mb-1.5">
//                       <label className="text-sm font-medium text-gray-700">SEO Focus Keyword</label>
//                       <span className="text-xs text-gray-500">{form.focus_keyword.length} / 100</span>
//                     </div>
//                     <input
//                       type="text"
//                       value={form.focus_keyword}
//                       onChange={(e) => handleChange("focus_keyword", e.target.value)}
//                       maxLength={100}
//                       className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
//                       placeholder="e.g. dubai community"
//                     />
//                   </div>
//                 </div>

//                 {/* SEO Checklist */}
//                 <div className="bg-gray-50 rounded-lg p-4 h-fit">
//                   <h3 className="text-sm font-medium text-gray-900 mb-4">SEO Checklist</h3>
//                   <div className="space-y-3">
//                     {seoChecks.map((item, i) => (
//                       <div key={i} className="flex items-start gap-2">
//                         {item.passed ? (
//                           <FiCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
//                         ) : (
//                           <FiAlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
//                         )}
//                         <span className={`text-xs ${item.passed ? "text-green-700" : "text-yellow-700"}`}>
//                           {item.label}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Bottom Action Bar */}
//         <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
//           <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
//             <button
//               onClick={() => router.push("/admin/communities")}
//               disabled={isSubmitting}
//               className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSubmit}
//               disabled={isSubmitting}
//               className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50"
//             >
//               {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
//               Update Community
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }