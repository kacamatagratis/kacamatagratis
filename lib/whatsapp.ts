import { db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  addDoc,
  increment,
} from "firebase/firestore";

interface DripSenderKey {
  id: string;
  api_key: string;
  label: string;
  is_active: boolean;
  usage_count: number;
}

interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
}

/**
 * Get a random active API key from Firebase
 */
async function getRandomApiKey(): Promise<DripSenderKey | null> {
  try {
    const keysRef = collection(db, "dripsender_keys");
    const q = query(keysRef, where("is_active", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error("No active API keys found");
      return null;
    }

    const activeKeys = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DripSenderKey[];

    // Select random key
    const randomIndex = Math.floor(Math.random() * activeKeys.length);
    return activeKeys[randomIndex];
  } catch (error) {
    console.error("Error getting random API key:", error);
    return null;
  }
}

/**
 * Generate random text to append to messages to avoid spam detection
 */
function generateRandomText(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomCode = "";
  for (let i = 0; i < 5; i++) {
    randomCode += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return `\n\n#${randomCode}`;
}

/**
 * Update API key usage statistics
 */
async function updateKeyUsage(keyId: string) {
  try {
    const keyRef = doc(db, "dripsender_keys", keyId);
    await updateDoc(keyRef, {
      usage_count: increment(1),
      last_used: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating key usage:", error);
  }
}

/**
 * Get message template by type
 */
async function getTemplate(type: string): Promise<MessageTemplate | null> {
  try {
    const templatesRef = collection(db, "message_templates");
    const q = query(templatesRef, where("type", "==", type));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as MessageTemplate;
  } catch (error) {
    console.error("Error getting template:", error);
    return null;
  }
}

/**
 * Replace variables in template with actual values
 */
function replaceVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  let message = template;
  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{${key}\\}`, "g");
    message = message.replace(regex, String(variables[key]));
  });
  return message;
}

/**
 * Log notification to Firebase
 */
async function logNotification(
  participantId: string,
  phone: string,
  type: string,
  apiKeyLabel: string,
  status: "success" | "failed" | "pending",
  message: string,
  errorMessage?: string,
  eventId?: string,
  metadata?: Record<string, any>
) {
  try {
    await addDoc(collection(db, "notifications_log"), {
      participant_id: participantId,
      target_phone: phone,
      type: type,
      api_key_used: apiKeyLabel,
      status: status,
      message_content: message,
      error: errorMessage || null,
      event_id: eventId || null,
      metadata: metadata || null,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error logging notification:", error);
  }
}

/**
 * Format phone number for DripSender API
 * Converts +62xxx or 0xxx to 62xxx format
 */
function formatPhoneForDripSender(phone: string): string {
  // Remove all spaces, dashes, and plus signs
  let formatted = phone.replace(/[\s\-+]/g, "");

  // If starts with 0, replace with 62
  if (formatted.startsWith("0")) {
    formatted = "62" + formatted.substring(1);
  }

  // Ensure it starts with 62
  if (!formatted.startsWith("62")) {
    formatted = "62" + formatted;
  }

  return formatted;
}

/**
 * Send WhatsApp message via DripSender with random API key
 */
export async function sendWhatsAppMessage(
  phone: string,
  messageType: string,
  variables: Record<string, string | number>,
  participantId?: string,
  eventId?: string
): Promise<{
  success: boolean;
  error?: string;
  apiKeyUsed?: string;
}> {
  try {
    // Format phone number for DripSender (remove + and ensure 62xxx format)
    const formattedPhone = formatPhoneForDripSender(phone);
    console.log(`[WhatsApp] Formatting phone: ${phone} -> ${formattedPhone}`);

    // Get random active API key
    const apiKey = await getRandomApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: "No active API keys available",
      };
    }

    // Get message template
    const template = await getTemplate(messageType);
    if (!template) {
      return {
        success: false,
        error: `Template not found for type: ${messageType}`,
      };
    }

    // Replace variables in template
    const message = replaceVariables(template.content, variables);

    // Add random text to avoid spam detection
    const messageWithRandom = message + generateRandomText();

    // Send message via DripSender
    const response = await fetch("https://api.dripsender.id/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey.api_key,
        phone: formattedPhone,
        text: messageWithRandom,
      }),
    });

    let errorDetail = "";
    const isSuccess = response.ok;

    if (!isSuccess) {
      try {
        // Check content type before parsing
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          errorDetail = `HTTP ${response.status}: ${
            errorData.message || errorData.error || JSON.stringify(errorData)
          }`;
        } else {
          const textError = await response.text();
          errorDetail = `HTTP ${response.status}: ${
            textError || response.statusText
          }`;
        }
      } catch {
        errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      }
    }

    // Update API key usage
    if (isSuccess) {
      await updateKeyUsage(apiKey.id);
    }

    // Log notification
    if (participantId) {
      await logNotification(
        participantId,
        phone,
        messageType,
        apiKey.label,
        isSuccess ? "success" : "failed",
        message,
        isSuccess ? undefined : errorDetail,
        eventId,
        variables // Pass variables as metadata for retry
      );
    }

    if (isSuccess) {
      return {
        success: true,
        apiKeyUsed: apiKey.label,
      };
    } else {
      // Try with another API key if first one fails
      const retryKey = await getRandomApiKey();
      if (retryKey && retryKey.id !== apiKey.id) {
        // Generate new random text for retry
        const retryMessageWithRandom = message + generateRandomText();

        const retryResponse = await fetch("https://api.dripsender.id/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: retryKey.api_key,
            phone: formattedPhone,
            text: retryMessageWithRandom,
          }),
        });

        if (retryResponse.ok) {
          await updateKeyUsage(retryKey.id);
          if (participantId) {
            await logNotification(
              participantId,
              phone,
              messageType,
              retryKey.label,
              "success",
              message,
              undefined,
              eventId,
              variables // Pass variables as metadata
            );
          }
          return {
            success: true,
            apiKeyUsed: retryKey.label,
          };
        }
      }

      return {
        success: false,
        error: `Failed to send message: ${errorDetail}`,
      };
    }
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send WhatsApp message with media
 */
export async function sendWhatsAppMessageWithMedia(
  phone: string,
  messageType: string,
  variables: Record<string, string | number>,
  mediaUrl: string,
  participantId?: string
): Promise<{
  success: boolean;
  error?: string;
  apiKeyUsed?: string;
}> {
  try {
    // Format phone number for DripSender
    const formattedPhone = formatPhoneForDripSender(phone);
    console.log(
      `[WhatsApp Media] Formatting phone: ${phone} -> ${formattedPhone}`
    );

    const apiKey = await getRandomApiKey();
    if (!apiKey) {
      return {
        success: false,
        error: "No active API keys available",
      };
    }

    const template = await getTemplate(messageType);
    if (!template) {
      return {
        success: false,
        error: `Template not found for type: ${messageType}`,
      };
    }

    const message = replaceVariables(template.content, variables);

    // Add random text to avoid spam detection
    const messageWithRandom = message + generateRandomText();

    const response = await fetch("https://api.dripsender.id/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey.api_key,
        phone: formattedPhone,
        text: messageWithRandom,
        media_url: mediaUrl,
      }),
    });

    const isSuccess = response.ok;

    if (isSuccess) {
      await updateKeyUsage(apiKey.id);
    }

    if (participantId) {
      await logNotification(
        participantId,
        phone,
        messageType,
        apiKey.label,
        isSuccess ? "success" : "failed",
        message,
        isSuccess ? undefined : `HTTP ${response.status}`,
        undefined,
        variables // Pass variables as metadata
      );
    }

    return {
      success: isSuccess,
      apiKeyUsed: apiKey.label,
      error: isSuccess ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    console.error("Error sending WhatsApp message with media:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
