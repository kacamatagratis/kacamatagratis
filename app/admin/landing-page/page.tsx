"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Loader2,
  Plus,
  Trash2,
  Edit,
  X,
  Upload,
  Image as ImageIcon,
  Video,
  CheckCircle,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function LandingPageAdmin() {
  const { showToast, showConfirm, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState("hero");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: "hero", label: "Hero Section" },
    { id: "value-proposition", label: "Value Proposition" },
    { id: "why-section", label: "Why Section" },
    { id: "statistics", label: "Statistics" },
    { id: "program", label: "Program" },
    { id: "roles", label: "Roles" },
    { id: "testimonials", label: "Testimonials" },
    { id: "faq", label: "FAQ" },
    { id: "media-coverage", label: "Media Coverage" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Landing Page Settings
        </h1>
        <p className="text-gray-600">
          Manage all content displayed on the main landing page
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "hero" && (
            <HeroSection showToast={showToast} showConfirm={showConfirm} />
          )}
          {activeTab === "value-proposition" && (
            <ValuePropositionSection
              showToast={showToast}
              showConfirm={showConfirm}
            />
          )}
          {activeTab === "why-section" && (
            <WhySection showToast={showToast} showConfirm={showConfirm} />
          )}
          {activeTab === "statistics" && (
            <StatisticsSection
              showToast={showToast}
              showConfirm={showConfirm}
            />
          )}
          {activeTab === "program" && (
            <ProgramSection showToast={showToast} showConfirm={showConfirm} />
          )}
          {activeTab === "roles" && (
            <RolesSection showToast={showToast} showConfirm={showConfirm} />
          )}
          {activeTab === "testimonials" && (
            <TestimonialsSection
              showToast={showToast}
              showConfirm={showConfirm}
            />
          )}
          {activeTab === "faq" && (
            <FAQSection showToast={showToast} showConfirm={showConfirm} />
          )}
          {activeTab === "media-coverage" && (
            <MediaCoverageSection
              showToast={showToast}
              showConfirm={showConfirm}
            />
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

// Toast props type
type ToastProps = {
  showToast: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmButtonClass?: string;
    }
  ) => void;
};

// Hero Section Component
function HeroSection({ showToast, showConfirm }: ToastProps) {
  const [formData, setFormData] = useState({
    heading: "",
    description: "",
    youtube_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page");
      const data = await response.json();
      if (data.success && data.data.hero) {
        setFormData(data.data.hero);
      }
    } catch (error) {
      console.error("Failed to fetch hero data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/landing-page/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("Hero section updated successfully!", "success");
      } else {
        showToast("Failed to update: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Heading
        </label>
        <textarea
          value={formData.heading}
          onChange={(e) =>
            setFormData({ ...formData, heading: e.target.value })
          }
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Main heading text..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Description text..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          YouTube Video URL
        </label>
        <input
          type="url"
          value={formData.youtube_url}
          onChange={(e) =>
            setFormData({ ...formData, youtube_url: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://www.youtube.com/embed/..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Use the embed URL format (e.g.,
          https://www.youtube.com/embed/VIDEO_ID)
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </>
        )}
      </button>
    </div>
  );
}

// Placeholder components - will be implemented
function ValuePropositionSection({ showToast, showConfirm }: ToastProps) {
  const [formData, setFormData] = useState({
    before_title: "",
    before_items: [""],
    after_title: "",
    after_items: [""],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page");
      const data = await response.json();
      if (data.success && data.data.value_proposition) {
        setFormData(data.data.value_proposition);
      }
    } catch (error) {
      console.error("Failed to fetch value proposition data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/landing-page/value-proposition", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("Value proposition updated successfully!", "success");
      } else {
        showToast("Failed to update: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const addBeforeItem = () => {
    setFormData({
      ...formData,
      before_items: [...formData.before_items, ""],
    });
  };

  const removeBeforeItem = (index: number) => {
    const newItems = formData.before_items.filter((_, i) => i !== index);
    setFormData({ ...formData, before_items: newItems });
  };

  const updateBeforeItem = (index: number, value: string) => {
    const newItems = [...formData.before_items];
    newItems[index] = value;
    setFormData({ ...formData, before_items: newItems });
  };

  const moveBeforeItem = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.before_items.length - 1)
    )
      return;
    const newItems = [...formData.before_items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setFormData({ ...formData, before_items: newItems });
  };

  const addAfterItem = () => {
    setFormData({
      ...formData,
      after_items: [...formData.after_items, ""],
    });
  };

  const removeAfterItem = (index: number) => {
    const newItems = formData.after_items.filter((_, i) => i !== index);
    setFormData({ ...formData, after_items: newItems });
  };

  const updateAfterItem = (index: number, value: string) => {
    const newItems = [...formData.after_items];
    newItems[index] = value;
    setFormData({ ...formData, after_items: newItems });
  };

  const moveAfterItem = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === formData.after_items.length - 1)
    )
      return;
    const newItems = [...formData.after_items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ];
    setFormData({ ...formData, after_items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Info */}
      <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Before & After Comparison
        </h3>
        <p className="text-sm text-gray-600">
          Create a compelling comparison between the problems (before) and
          solutions (after). Add as many items as needed and reorder them using
          the arrow buttons.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Before Section - Problems */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-linear-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Before - Problems
                </h3>
                <p className="text-xs text-gray-600">
                  {formData.before_items.length} item(s)
                </p>
              </div>
            </div>
            <button
              onClick={addBeforeItem}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all hover:scale-105 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add</span>
            </button>
          </div>

          {/* Title Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={formData.before_title}
              onChange={(e) =>
                setFormData({ ...formData, before_title: e.target.value })
              }
              placeholder="e.g., Sebelumnya"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            />
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {formData.before_items.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all hover:border-red-300"
              >
                <div className="flex items-start gap-3">
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => moveBeforeItem(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronDown className="w-4 h-4 rotate-180 text-gray-600" />
                    </button>
                    <button
                      onClick={() => moveBeforeItem(index, "down")}
                      disabled={index === formData.before_items.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Item Number Badge */}
                  <div className="shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">
                      {index + 1}
                    </span>
                  </div>

                  {/* Textarea */}
                  <div className="flex-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateBeforeItem(index, e.target.value)}
                      placeholder="Describe a problem..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all"
                    />
                  </div>

                  {/* Delete Button */}
                  {formData.before_items.length > 1 && (
                    <button
                      onClick={() => removeBeforeItem(index)}
                      className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* After Section - Solutions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-linear-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  After - Solutions
                </h3>
                <p className="text-xs text-gray-600">
                  {formData.after_items.length} item(s)
                </p>
              </div>
            </div>
            <button
              onClick={addAfterItem}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:scale-105 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="font-medium">Add</span>
            </button>
          </div>

          {/* Title Input */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={formData.after_title}
              onChange={(e) =>
                setFormData({ ...formData, after_title: e.target.value })
              }
              placeholder="e.g., Dengan Program Kami"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            />
          </div>

          {/* Items List */}
          <div className="space-y-3">
            {formData.after_items.map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all hover:border-green-300"
              >
                <div className="flex items-start gap-3">
                  {/* Order Controls */}
                  <div className="flex flex-col gap-1 mt-1">
                    <button
                      onClick={() => moveAfterItem(index, "up")}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <ChevronDown className="w-4 h-4 rotate-180 text-gray-600" />
                    </button>
                    <button
                      onClick={() => moveAfterItem(index, "down")}
                      disabled={index === formData.after_items.length - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Item Number Badge */}
                  <div className="shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-green-600">
                      {index + 1}
                    </span>
                  </div>

                  {/* Textarea */}
                  <div className="flex-1">
                    <textarea
                      value={item}
                      onChange={(e) => updateAfterItem(index, e.target.value)}
                      placeholder="Describe a solution..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none transition-all"
                    />
                  </div>

                  {/* Delete Button */}
                  {formData.after_items.length > 1 && (
                    <button
                      onClick={() => removeAfterItem(index)}
                      className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Delete item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function WhySection({ showToast, showConfirm }: ToastProps) {
  const [formData, setFormData] = useState<{
    title: string;
    items: (string | { text: string })[];
  }>({
    title: "",
    items: [""],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page");
      const data = await response.json();
      if (data.success && data.data.why_section) {
        setFormData(data.data.why_section);
      }
    } catch (error) {
      console.error("Failed to fetch why section data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/landing-page/why-section", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("Why section updated successfully!", "success");
      } else {
        showToast("Failed to update: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, ""],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData({ ...formData, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          📋 Section Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Karena Jutaan Orang di Indonesia..."
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Reason Items</h3>
            <p className="text-sm text-gray-500">
              {formData.items.length} item
              {formData.items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add Reason</span>
          </button>
        </div>

        <div className="grid gap-4">
          {formData.items.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Item Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Reason #{index + 1}
                      </label>
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={typeof item === "string" ? item : item.text || ""}
                      onChange={(e) => updateItem(index, e.target.value)}
                      rows={3}
                      placeholder={`Explain why reason #${
                        index + 1
                      } matters...`}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>
                        {typeof item === "string"
                          ? item.length
                          : item.text?.length || 0}{" "}
                        characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="sticky bottom-4 pt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] font-semibold text-lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-6 h-6" />
              <span>Save Why Section</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function StatisticsSection({ showToast, showConfirm }: ToastProps) {
  const [formData, setFormData] = useState({
    stats: [
      { number: "", label: "", description: "" },
      { number: "", label: "", description: "" },
      { number: "", label: "", description: "" },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page");
      const data = await response.json();
      if (data.success && data.data.statistics) {
        setFormData(data.data.statistics);
      }
    } catch (error) {
      console.error("Failed to fetch statistics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/landing-page/statistics", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("Statistics updated successfully!", "success");
      } else {
        showToast("Failed to update: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateStat = (index: number, field: string, value: string) => {
    const newStats = [...formData.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setFormData({ ...formData, stats: newStats });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {formData.stats.map((stat, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">
              Statistic {index + 1}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number
              </label>
              <input
                type="text"
                value={stat.number}
                onChange={(e) => updateStat(index, "number", e.target.value)}
                placeholder="e.g., 500.000+"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label
              </label>
              <input
                type="text"
                value={stat.label}
                onChange={(e) => updateStat(index, "label", e.target.value)}
                placeholder="e.g., Orang Terbantu"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={stat.description}
                onChange={(e) =>
                  updateStat(index, "description", e.target.value)
                }
                placeholder="e.g., Mendapatkan kacamata medis gratis"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </>
        )}
      </button>
    </div>
  );
}

function ProgramSection({ showToast, showConfirm }: ToastProps) {
  const [formData, setFormData] = useState({
    content_type: "video" as "video" | "images",
    video_url: "",
    image_urls: [] as string[],
    title: "",
    items: [""],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page");
      const data = await response.json();
      if (data.success && data.data.program) {
        setFormData(data.data.program);
      }
    } catch (error) {
      console.error("Failed to fetch program data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/landing-page/program", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("Program section updated successfully!", "success");
      } else {
        showToast("Failed to update: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    setFormData({ ...formData, items: [...formData.items, ""] });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = value;
    setFormData({ ...formData, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Type
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={formData.content_type === "video"}
              onChange={() =>
                setFormData({ ...formData, content_type: "video" })
              }
              className="w-4 h-4"
            />
            <Video className="w-5 h-5" />
            <span>Video</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={formData.content_type === "images"}
              onChange={() =>
                setFormData({ ...formData, content_type: "images" })
              }
              className="w-4 h-4"
            />
            <ImageIcon className="w-5 h-5" />
            <span>Images</span>
          </label>
        </div>
      </div>

      {formData.content_type === "video" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Video URL
          </label>
          <input
            type="url"
            value={formData.video_url}
            onChange={(e) =>
              setFormData({ ...formData, video_url: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://www.youtube.com/embed/..."
          />
        </div>
      )}

      {formData.content_type === "images" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Image upload feature coming soon. For now, images will be handled in
            a future update.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Program Points
          </h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Point</span>
          </button>
        </div>

        {formData.items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`Point ${index + 1}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData.items.length > 1 && (
              <button
                onClick={() => removeItem(index)}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </>
        )}
      </button>
    </div>
  );
}

function RolesSection({ showToast, showConfirm }: ToastProps) {
  const [formData, setFormData] = useState({
    title: "",
    items: [
      { title: "", description: "", whatsapp_number: "", whatsapp_message: "" },
      { title: "", description: "", whatsapp_number: "", whatsapp_message: "" },
      { title: "", description: "", whatsapp_number: "", whatsapp_message: "" },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page");
      const data = await response.json();
      if (data.success && data.data.roles) {
        setFormData(data.data.roles);
      }
    } catch (error) {
      console.error("Failed to fetch roles data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/landing-page/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        showToast("Roles section updated successfully!", "success");
      } else {
        showToast("Failed to update: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const updateRole = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Section Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {formData.items.map((role, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900">Role {index + 1}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={role.title}
                onChange={(e) => updateRole(index, "title", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={role.description}
                onChange={(e) =>
                  updateRole(index, "description", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={role.whatsapp_number}
                onChange={(e) =>
                  updateRole(index, "whatsapp_number", e.target.value)
                }
                placeholder="628123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Message
              </label>
              <textarea
                value={role.whatsapp_message}
                onChange={(e) =>
                  updateRole(index, "whatsapp_message", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Save Changes</span>
          </>
        )}
      </button>
    </div>
  );
}

function TestimonialsSection({ showToast, showConfirm }: ToastProps) {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    rating: 5,
    text: "",
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page/testimonials");
      const data = await response.json();
      if (data.success) {
        setTestimonials(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch testimonials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      location: "",
      rating: 5,
      text: "",
      order: testimonials.length,
    });
    setShowModal(true);
  };

  const handleEdit = (testimonial: any) => {
    setEditingId(testimonial.id);
    setFormData({
      name: testimonial.name,
      location: testimonial.location,
      rating: testimonial.rating,
      text: testimonial.text,
      order: testimonial.order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/landing-page/testimonials?id=${editingId}`
        : "/api/landing-page/testimonials";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
        showToast(
          `Testimonial ${editingId ? "updated" : "created"} successfully!`,
          "success"
        );
      } else {
        showToast("Failed to save: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      "Delete Testimonial",
      "Are you sure you want to delete this testimonial?",
      async () => {
        try {
          const response = await fetch(
            `/api/landing-page/testimonials?id=${id}`,
            {
              method: "DELETE",
            }
          );

          const data = await response.json();
          if (data.success) {
            fetchData();
            showToast("Testimonial deleted successfully!", "success");
          } else {
            showToast("Failed to delete: " + data.error, "error");
          }
        } catch (error) {
          showToast("Error: " + error, "error");
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Testimonials</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Testimonial</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {testimonials.map((testimonial) => (
              <tr key={testimonial.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {testimonial.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {testimonial.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {"⭐".repeat(testimonial.rating)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {testimonial.order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {testimonials.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No testimonials yet. Click "Add Testimonial" to create one.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Testimonial" : "Add Testimonial"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <select
                  value={formData.rating}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rating: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <option key={num} value={num}>
                      {"⭐".repeat(num)} ({num})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testimonial Text
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FAQSection({ showToast, showConfirm }: ToastProps) {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page/faq");
      const data = await response.json();
      if (data.success) {
        setFaqs(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      question: "",
      answer: "",
      order: faqs.length,
    });
    setShowModal(true);
  };

  const handleEdit = (faq: any) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/landing-page/faq?id=${editingId}`
        : "/api/landing-page/faq";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
        showToast(
          `FAQ ${editingId ? "updated" : "created"} successfully!`,
          "success"
        );
      } else {
        showToast("Failed to save: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      "Delete FAQ",
      "Are you sure you want to delete this FAQ?",
      async () => {
        try {
          const response = await fetch(`/api/landing-page/faq?id=${id}`, {
            method: "DELETE",
          });

          const data = await response.json();
          if (data.success) {
            fetchData();
            showToast("FAQ deleted successfully!", "success");
          } else {
            showToast("Failed to delete: " + data.error, "error");
          }
        } catch (error) {
          showToast("Error: " + error, "error");
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              ❓ Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-600">
              Manage your FAQ items • {faqs.length} question
              {faqs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105 font-semibold"
          >
            <Plus className="w-5 h-5" />
            <span>Add FAQ</span>
          </button>
        </div>
      </div>

      {/* FAQ List */}
      <div className="grid gap-4">
        {faqs.map((faq, index) => (
          <div
            key={faq.id}
            className="group bg-white rounded-xl border-2 border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-lg overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Number Badge */}
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md text-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                          ORDER: {faq.order}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-2 leading-tight">
                        Q: {faq.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        A: {faq.answer}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(faq)}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title="Edit FAQ"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(faq.id)}
                        className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete FAQ"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
                    <span>Question: {faq.question.length} chars</span>
                    <span>•</span>
                    <span>Answer: {faq.answer.length} chars</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {faqs.length === 0 && (
          <div className="text-center py-16 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 rounded-xl">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No FAQs Yet
              </h3>
              <p className="text-gray-500 mb-4">
                Get started by adding your first FAQ item
              </p>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First FAQ</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5">
              <h3 className="text-2xl font-bold text-white">
                {editingId ? "✏️ Edit FAQ" : "➕ Add New FAQ"}
              </h3>
              <p className="text-purple-100 text-sm mt-1">
                {editingId
                  ? "Update your FAQ question and answer"
                  : "Create a new frequently asked question"}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Question Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ❓ Question
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) =>
                      setFormData({ ...formData, question: e.target.value })
                    }
                    rows={2}
                    placeholder="What question do customers frequently ask?"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.question.length} characters
                  </p>
                </div>

                {/* Answer Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    💬 Answer
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) =>
                      setFormData({ ...formData, answer: e.target.value })
                    }
                    rows={5}
                    placeholder="Provide a clear and helpful answer..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.answer.length} characters
                  </p>
                </div>

                {/* Order Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔢 Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Lower numbers appear first
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all font-semibold"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{editingId ? "Update FAQ" : "Create FAQ"}</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaCoverageSection({ showToast, showConfirm }: ToastProps) {
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    location: "",
    title: "",
    url: "",
    source: "",
    image_url: "",
    order: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/landing-page/media-coverage");
      const data = await response.json();
      if (data.success) {
        setMediaItems(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch media coverage:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingId(null);
    setFormData({
      location: "",
      title: "",
      url: "",
      source: "",
      image_url: "",
      order: mediaItems.length,
    });
    setShowModal(true);
  };

  const handleEdit = (media: any) => {
    setEditingId(media.id);
    setFormData({
      location: media.location,
      title: media.title,
      url: media.url,
      source: media.source,
      image_url: media.image_url,
      order: media.order,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/landing-page/media-coverage?id=${editingId}`
        : "/api/landing-page/media-coverage";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        fetchData();
        showToast(
          `Media coverage ${editingId ? "updated" : "created"} successfully!`,
          "success"
        );
      } else {
        showToast("Failed to save: " + data.error, "error");
      }
    } catch (error) {
      showToast("Error: " + error, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      "Delete Media Coverage",
      "Are you sure you want to delete this media coverage?",
      async () => {
        try {
          const response = await fetch(
            `/api/landing-page/media-coverage?id=${id}`,
            {
              method: "DELETE",
            }
          );

          const data = await response.json();
          if (data.success) {
            fetchData();
            showToast("Media coverage deleted successfully!", "success");
          } else {
            showToast("Failed to delete: " + data.error, "error");
          }
        } catch (error) {
          showToast("Error: " + error, "error");
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Media Coverage</h2>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Media</span>
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mediaItems.map((media) => (
              <tr key={media.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {media.image_url && (
                    <img
                      src={media.image_url}
                      alt={media.title}
                      className="h-10 w-10 object-cover rounded"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {media.location}
                </td>
                <td className="px-6 py-4">{media.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{media.source}</td>
                <td className="px-6 py-4 whitespace-nowrap">{media.order}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(media)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {mediaItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No media coverage yet. Click "Add Media" to create one.
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? "Edit Media Coverage" : "Add Media Coverage"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  placeholder="e.g., Detik.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Note: Image upload feature coming soon. Use direct URL for
                  now.
                </p>
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="mt-2 h-20 w-20 object-cover rounded border"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
