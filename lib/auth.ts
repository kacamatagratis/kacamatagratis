import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import bcrypt from "bcryptjs";

export interface AdminCredentials {
  username: string;
  password: string;
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  try {
    // First, check environment variables (for server-side auth)
    const envUsername = process.env.ADMIN_USERNAME;
    const envPassword = process.env.ADMIN_PASSWORD;

    if (envUsername && envPassword) {
      // Check if env password is hashed or plain text
      if (envPassword.startsWith("$2")) {
        // Hashed password
        return (
          username === envUsername &&
          (await bcrypt.compare(password, envPassword))
        );
      } else {
        // Plain text password
        return username === envUsername && password === envPassword;
      }
    }

    // Fallback to Firestore (only if env vars not set)
    // Try both "adminSetting/credentials" and "adminsetting/credential"
    let credentialRef = doc(db, "adminSetting", "credentials");
    let credentialSnap = await getDoc(credentialRef);

    if (!credentialSnap.exists()) {
      // Try alternative naming
      credentialRef = doc(db, "adminsetting", "credential");
      credentialSnap = await getDoc(credentialRef);
    }

    if (!credentialSnap.exists()) {
      console.error("Admin credentials not found in database or environment");
      return false;
    }

    const data = credentialSnap.data() as AdminCredentials;

    // Check if password is hashed or plain text
    if (data.password.startsWith("$2")) {
      // Hashed password
      return (
        data.username === username &&
        (await bcrypt.compare(password, data.password))
      );
    } else {
      // Plain text password (for initial setup)
      return data.username === username && data.password === password;
    }
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return false;
  }
}

export async function createAdminSession(username: string): Promise<string> {
  const sessionData = {
    username,
    loginTime: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };

  // In production, use proper JWT or session token
  return Buffer.from(JSON.stringify(sessionData)).toString("base64");
}

export function validateSession(sessionToken: string): boolean {
  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionToken, "base64").toString()
    );
    const expiresAt = new Date(sessionData.expiresAt);
    return expiresAt > new Date();
  } catch {
    return false;
  }
}

export function getSessionData(sessionToken: string) {
  try {
    return JSON.parse(Buffer.from(sessionToken, "base64").toString());
  } catch {
    return null;
  }
}
