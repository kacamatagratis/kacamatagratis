"use client";

import { useState, useEffect } from "react";
import {
  Save,
  MessageSquare,
  Key,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TestTube,
  Loader2,
  Clock,
  Info,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export const dynamic = "force-dynamic";

interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
}

interface DripSenderKey {
  id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  last_used?: string;
  usage_count: number;
  created_at?: string;
  health_status?: "unknown" | "working" | "failed" | "testing";
  health_checked_at?: string;
  health_error?: string;
}

interface AutomationSettings {
  welcome_delay_minutes: number;
  referrer_alert_delay_minutes: number;
  event_reminder_hours_before: number;
  automation_enabled: boolean;
  automation_engine_interval_seconds: number;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<
    "templates" | "apikeys" | "automation"
  >("templates");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [apiKeys, setApiKeys] = useState<DripSenderKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Automation settings
  const [automationSettings, setAutomationSettings] =
    useState<AutomationSettings>({
      welcome_delay_minutes: 5,
      referrer_alert_delay_minutes: 5,
      event_reminder_hours_before: 1,
      automation_enabled: true,
      automation_engine_interval_seconds: 60,
    });

  // Template form state
  const [editingTemplate, setEditingTemplate] =
    useState<MessageTemplate | null>(null);

  // API Key form state
  const [newApiKey, setNewApiKey] = useState("");
  const [newApiKeyLabel, setNewApiKeyLabel] = useState("");

  const loadAutomationSettings = async () => {
    try {
      const settingsRef = doc(db, "automation_settings", "config");
      const settingsDoc = await getDoc(settingsRef);

      if (settingsDoc.exists()) {
        setAutomationSettings(settingsDoc.data() as AutomationSettings);
      } else {
        // Create default settings
        const defaultSettings: AutomationSettings = {
          welcome_delay_minutes: 5,
          referrer_alert_delay_minutes: 5,
          event_reminder_hours_before: 1,
          automation_enabled: true,
          automation_engine_interval_seconds: 60,
        };
        await setDoc(settingsRef, defaultSettings);
        setAutomationSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading automation settings:", error);
    }
  };

  const saveAutomationSettings = async () => {
    setSaving(true);
    try {
      const settingsRef = doc(db, "automation_settings", "config");
      await setDoc(settingsRef, automationSettings);
      alert("Automation settings saved successfully!");
      setSaving(false);
    } catch (error) {
      console.error("Error saving automation settings:", error);
      alert("Failed to save automation settings");
      setSaving(false);
    }
  };

  // Load message templates from Firebase
  const loadTemplates = async () => {
    try {
      const templatesRef = collection(db, "message_templates");
      const snapshot = await getDocs(templatesRef);
      const templatesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MessageTemplate[];

      // Filter duplicates - keep only one of each type (latest one)
      const uniqueTemplates: MessageTemplate[] = [];
      const seenTypes = new Set<string>();

      // Sort by ID descending to get latest first
      const sortedTemplates = templatesData.sort((a, b) =>
        b.id.localeCompare(a.id)
      );

      for (const template of sortedTemplates) {
        if (!seenTypes.has(template.type)) {
          uniqueTemplates.push(template);
          seenTypes.add(template.type);
        }
      }

      // Set default templates if none exist
      if (uniqueTemplates.length === 0) {
        const defaultTemplates = [
          {
            name: "Welcome Message",
            type: "welcome",
            content:
              "Halo {sapaan} {name}! 👋\n\nTerima kasih sudah mendaftar di Kacamata Gratis dari {city}.\n\n🔗 Link Referral Anda:\n{referral_code}\n\nBagikan link di atas untuk mengajak teman!",
            variables: [
              "sapaan",
              "name",
              "city",
              "referral_code",
            ],
          },
          {
            name: "Referrer Alert",
            type: "referrer_alert",
            content:
              "🎉 Selamat {sapaan} {name}!\n\nTeman Anda telah bergabung menggunakan kode referral Anda!\n\nTotal referral Anda sekarang: {referral_count}",
            variables: ["sapaan", "name", "referral_count"],
          },
          {
            name: "Event Reminder",
            type: "event_reminder",
            content:
              "📅 Reminder: {event_title}\n\nHalo {sapaan} {name},\n\nEvent akan dimulai dalam 1 jam!\n\nZoom Link: {zoom_link}\n\nSampai jumpa!",
            variables: ["event_title", "sapaan", "name", "zoom_link"],
          },
        ];

        for (const template of defaultTemplates) {
          await addDoc(collection(db, "message_templates"), template);
        }

        // Set the templates we just created
        setTemplates(
          defaultTemplates.map((t, index) => ({
            ...t,
            id: `temp-${index}`, // Temporary ID
          })) as MessageTemplate[]
        );
      } else {
        setTemplates(uniqueTemplates);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading templates:", error);
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    try {
      const keysRef = collection(db, "dripsender_keys");
      const snapshot = await getDocs(keysRef);
      const keysData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DripSenderKey[];
      setApiKeys(keysData);
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const saveTemplate = async (template: MessageTemplate) => {
    setSaving(true);
    try {
      const templateRef = doc(db, "message_templates", template.id);
      await setDoc(
        templateRef,
        {
          name: template.name,
          type: template.type,
          content: template.content,
          variables: template.variables,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
      await loadTemplates();
      setEditingTemplate(null);
      setSaving(false);
    } catch (error) {
      console.error("Error saving template:", error);
      setSaving(false);
    }
  };

  const addApiKey = async () => {
    if (!newApiKey || !newApiKeyLabel) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "dripsender_keys"), {
        api_key: newApiKey,
        label: newApiKeyLabel,
        is_active: true,
        usage_count: 0,
        created_at: new Date().toISOString(),
      });
      setNewApiKey("");
      setNewApiKeyLabel("");
      await loadApiKeys();
      setSaving(false);
    } catch (error) {
      console.error("Error adding API key:", error);
      setSaving(false);
    }
  };

  const toggleApiKey = async (keyId: string, currentStatus: boolean) => {
    try {
      const keyRef = doc(db, "dripsender_keys", keyId);
      await updateDoc(keyRef, {
        is_active: !currentStatus,
      });
      await loadApiKeys();
    } catch (error) {
      console.error("Error toggling API key:", error);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      await deleteDoc(doc(db, "dripsender_keys", keyId));
      await loadApiKeys();
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const testApiKey = async (keyId: string, apiKey: string, label: string) => {
    try {
      // Update status to testing
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, health_status: "testing" as const } : k
        )
      );

      const response = await fetch("/api/dripsender/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey, label }),
      });

      const result = await response.json();

      // Update Firestore with health status
      const keyRef = doc(db, "dripsender_keys", keyId);
      await updateDoc(keyRef, {
        health_status: result.status,
        health_checked_at: new Date().toISOString(),
        health_error: result.error || result.details || null,
      });

      // Reload to show updated status
      await loadApiKeys();

      if (result.success) {
        alert(`✅ ${label}: API Key is working!`);
      } else {
        alert(
          `❌ ${label}: ${result.error || "Failed"}\n${result.details || ""}`
        );
      }
    } catch (error) {
      console.error("Error testing API key:", error);
      alert("❌ Connection error. Please try again.");

      // Update status to unknown on error
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, health_status: "unknown" as const } : k
        )
      );
    }
  };

  const testAllApiKeys = async () => {
    if (!confirm("Test all API keys? This will check each key's status.")) {
      return;
    }

    for (const key of apiKeys) {
      await testApiKey(key.id, key.api_key, key.label);
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    alert("✅ All API keys have been tested!");
  };

  // Load data on mount
  useEffect(() => {
    loadTemplates();
    loadApiKeys();
    loadAutomationSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage message templates and DripSender API keys
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("templates")}
            className={`pb-3 px-2 font-semibold transition-colors relative ${
              activeTab === "templates"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span>Message Templates</span>
            </div>
            {activeTab === "templates" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("apikeys")}
            className={`pb-3 px-2 font-semibold transition-colors relative ${
              activeTab === "apikeys"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              <span>DripSender API Keys</span>
            </div>
            {activeTab === "apikeys" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab("automation")}
            className={`pb-3 px-2 font-semibold transition-colors relative ${
              activeTab === "automation"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Automation</span>
            </div>
            {activeTab === "automation" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Message Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500">Type: {template.type}</p>
                </div>
              </div>

              {editingTemplate?.id === template.id ? (
                <div className="space-y-4">
                  {/* Variable Documentation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Available Variables for {template.name}
                        </h4>
                        <div className="space-y-2 text-sm text-blue-800">
                          {template.type === "welcome" && (
                            <>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{sapaan}"}
                                </code>{" "}
                                - Greeting (e.g., Bapak/Ibu)
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{name}"}
                                </code>{" "}
                                - Participant's full name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{city}"}
                                </code>{" "}
                                - Participant's city
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{referral_code}"}
                                </code>{" "}
                                - Full referral URL to share
                              </p>
                            </>
                          )}
                          {template.type === "referrer_alert" && (
                            <>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{sapaan}"}
                                </code>{" "}
                                - Greeting (e.g., Bapak/Ibu)
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{name}"}
                                </code>{" "}
                                - Referrer's full name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{referral_count}"}
                                </code>{" "}
                                - Total number of successful referrals
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{new_participant_name}"}
                                </code>{" "}
                                - Name of the new participant who just
                                registered
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{referrer_sequence}"}
                                </code>{" "}
                                - Order number of this referral (1st, 2nd, 3rd,
                                etc.)
                              </p>
                            </>
                          )}
                          {template.type === "event_reminder" && (
                            <>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{sapaan}"}
                                </code>{" "}
                                - Greeting (e.g., Bapak/Ibu)
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{name}"}
                                </code>{" "}
                                - Participant's full name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{event_title}"}
                                </code>{" "}
                                - Name of the event
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{zoom_link}"}
                                </code>{" "}
                                - Zoom meeting link
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Content
                    </label>
                    <textarea
                      value={editingTemplate.content}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          content: e.target.value,
                        })
                      }
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                      placeholder="Use variables like {sapaan}, {name}, etc."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => saveTemplate(editingTemplate)}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>Save Template</span>
                    </button>
                    <button
                      onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Variable Documentation */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Available Variables
                        </h4>
                        <div className="space-y-1 text-sm text-blue-800">
                          {template.type === "welcome" && (
                            <>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{sapaan}"}
                                </code>{" "}
                                - Greeting (Bapak/Ibu)
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{name}"}
                                </code>{" "}
                                - Participant's full name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{city}"}
                                </code>{" "}
                                - Participant's city
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{referral_code}"}
                                </code>{" "}
                                - Full referral URL to share
                              </p>
                            </>
                          )}
                          {template.type === "referrer_alert" && (
                            <>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{sapaan}"}
                                </code>{" "}
                                - Greeting (Bapak/Ibu)
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{name}"}
                                </code>{" "}
                                - Referrer's full name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{referral_count}"}
                                </code>{" "}
                                - Total referrals
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{new_participant_name}"}
                                </code>{" "}
                                - New participant's name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{referrer_sequence}"}
                                </code>{" "}
                                - Referral order number
                              </p>
                            </>
                          )}
                          {template.type === "event_reminder" && (
                            <>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{sapaan}"}
                                </code>{" "}
                                - Greeting (Bapak/Ibu)
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{name}"}
                                </code>{" "}
                                - Participant's full name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{event_title}"}
                                </code>{" "}
                                - Event name
                              </p>
                              <p>
                                <code className="bg-blue-100 px-2 py-0.5 rounded">
                                  {"{zoom_link}"}
                                </code>{" "}
                                - Zoom meeting link
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700">
                      {template.content}
                    </pre>
                  </div>
                  <button
                    onClick={() => setEditingTemplate(template)}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Edit Template
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === "apikeys" && (
        <div className="space-y-6">
          {/* API Keys Health Summary */}
          {apiKeys.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900">
                  {apiKeys.length}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 mb-1">Working</p>
                <p className="text-2xl font-bold text-green-900">
                  {apiKeys.filter((k) => k.health_status === "working").length}
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 mb-1">Failed</p>
                <p className="text-2xl font-bold text-red-900">
                  {apiKeys.filter((k) => k.health_status === "failed").length}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-blue-900">
                  {apiKeys.filter((k) => k.is_active).length}
                </p>
              </div>
            </div>
          )}

          {/* Add New API Key */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New API Key
              </h3>
              {apiKeys.length > 0 && (
                <button
                  onClick={testAllApiKeys}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Test All Keys</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Label / Name
                </label>
                <input
                  type="text"
                  value={newApiKeyLabel}
                  onChange={(e) => setNewApiKeyLabel(e.target.value)}
                  placeholder="e.g., Primary Number, Backup 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DripSender API Key
                </label>
                <input
                  type="text"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder="Enter API key from DripSender"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <button
              onClick={addApiKey}
              disabled={!newApiKey || !newApiKeyLabel || saving}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Add API Key</span>
            </button>
          </div>

          {/* API Keys List */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    API Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiKeys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center">
                      <p className="text-gray-500">
                        No API keys added yet. Add your first API key above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">
                          {key.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-xs text-gray-600">
                          {key.api_key.substring(0, 20)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {key.usage_count} messages
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {key.health_status === "testing" ? (
                            <>
                              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                              <span className="text-sm text-blue-600">
                                Testing...
                              </span>
                            </>
                          ) : key.health_status === "working" ? (
                            <>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-green-600 font-medium">
                                Working
                              </span>
                            </>
                          ) : key.health_status === "failed" ? (
                            <>
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span
                                className="text-sm text-red-600 font-medium"
                                title={key.health_error || "Failed"}
                              >
                                Failed
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-sm text-gray-500">
                                Unknown
                              </span>
                            </>
                          )}
                          {key.health_checked_at && (
                            <span className="text-xs text-gray-400">
                              (
                              {new Date(
                                key.health_checked_at
                              ).toLocaleTimeString()}
                              )
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleApiKey(key.id, key.is_active)}
                          className="flex items-center gap-1"
                        >
                          {key.is_active ? (
                            <>
                              <ToggleRight className="w-5 h-5 text-green-600" />
                              <span className="text-sm text-green-600 font-medium">
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-500">
                                Inactive
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              testApiKey(key.id, key.api_key, key.label)
                            }
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Test API Key"
                            disabled={key.health_status === "testing"}
                          >
                            {key.health_status === "testing" ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <TestTube className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteApiKey(key.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete API Key"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Automation Tab */}
      {activeTab === "automation" && (
        <div className="space-y-6">
          {/* Enable/Disable Automation */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Automation Status
                </h3>
                <p className="text-sm text-gray-500">
                  Enable or disable automatic message sending
                </p>
              </div>
              <button
                onClick={() =>
                  setAutomationSettings({
                    ...automationSettings,
                    automation_enabled: !automationSettings.automation_enabled,
                  })
                }
                className="flex items-center gap-2"
              >
                {automationSettings.automation_enabled ? (
                  <>
                    <ToggleRight className="w-8 h-8 text-green-600" />
                    <span className="text-green-600 font-medium">Enabled</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-500 font-medium">Disabled</span>
                  </>
                )}
              </button>
            </div>

            {!automationSettings.automation_enabled && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ Automation is currently disabled. Messages will not be sent
                  automatically.
                </p>
              </div>
            )}
          </div>

          {/* Welcome Message Delay */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Welcome Message Delay
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set how many minutes to wait after registration before sending
                  the welcome message to new participants.
                </p>

                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={automationSettings.welcome_delay_minutes || 5}
                    onChange={(e) =>
                      setAutomationSettings({
                        ...automationSettings,
                        welcome_delay_minutes: parseInt(e.target.value) || 5,
                      })
                    }
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-600">minutes</span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Current: Wait {automationSettings.welcome_delay_minutes || 5}{" "}
                  minute(s) before sending welcome message
                </p>
              </div>
            </div>
          </div>

          {/* Event Reminder Timing */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Event Reminder Timing
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set how many hours before an event starts to automatically
                  send reminder messages to all participants.
                </p>

                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={automationSettings.event_reminder_hours_before || 1}
                    onChange={(e) =>
                      setAutomationSettings({
                        ...automationSettings,
                        event_reminder_hours_before:
                          parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    hour(s) before event
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Current: Send reminders{" "}
                  {automationSettings.event_reminder_hours_before || 1} hour(s)
                  before event starts
                </p>
              </div>
            </div>
          </div>

          {/* Automation Engine Interval */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <Clock className="w-6 h-6 text-indigo-600 shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Automation Engine Interval
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Set how often the automation engine checks for pending
                  messages (client-side polling when dashboard is open).
                </p>

                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={
                      automationSettings.automation_engine_interval_seconds ||
                      60
                    }
                    onChange={(e) =>
                      setAutomationSettings({
                        ...automationSettings,
                        automation_engine_interval_seconds:
                          parseInt(e.target.value) || 60,
                      })
                    }
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    second(s) interval
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-2">
                  Current: Check every{" "}
                  {automationSettings.automation_engine_interval_seconds || 60}{" "}
                  second(s)
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ Shorter intervals = more frequent checks but higher
                  resource usage. Recommended: 60 seconds (1 minute)
                </p>
              </div>
            </div>
          </div>

          {/* How Automation Works */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  How Automation Works
                </h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    • <strong>Welcome Messages:</strong> After a participant
                    registers, the system waits for the configured delay before
                    sending the welcome message with their referral code.
                  </p>
                  <p>
                    • <strong>Referrer Alerts:</strong> When someone uses a
                    referral code to register, the referrer is notified
                    <strong> immediately</strong> (no delay) about their new
                    referral with the updated count.
                  </p>
                  <p>
                    • <strong>Event Reminders:</strong> The system automatically
                    checks for upcoming events and sends reminder messages to
                    all participants at the configured time before the event
                    starts.
                  </p>
                  <p className="mt-3 pt-3 border-t border-blue-200">
                    <strong>Note:</strong> The automation system runs every
                    minute to check for pending messages. Make sure at least one
                    DripSender API key is active for messages to be sent.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveAutomationSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>Save Automation Settings</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
