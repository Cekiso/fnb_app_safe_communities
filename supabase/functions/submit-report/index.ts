import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// AES-256-GCM encryption using Web Crypto API
const ENCRYPTION_KEY = Deno.env.get("REPORT_ENCRYPTION_KEY")!;

async function deriveKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(ENCRYPTION_KEY),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode("safe-comm-gbv-salt"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptField(plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const key = await deriveKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivStr = btoa(String.fromCharCode(...iv));
  return { ciphertext, iv: ivStr };
}

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "safe-comm-pin-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateRefCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from(
      { length: 4 },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  return `GBV-${part()}-${part()}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.consent_given) {
      return new Response(
        JSON.stringify({ error: "Consent is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate reference code and PIN
    const referenceCode = generateRefCode();
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const pinHash = await hashPin(pin);

    // Encrypt sensitive fields
    const fieldsToEncrypt: Record<string, string> = {};
    if (body.description) fieldsToEncrypt.description = body.description;
    if (body.location_text) fieldsToEncrypt.location_text = body.location_text;
    if (body.contact_details) fieldsToEncrypt.contact_details = body.contact_details;

    const encryptedFields: string[] = [];
    let encryptionIv = "";
    const encryptedData: Record<string, string> = {};

    for (const [field, value] of Object.entries(fieldsToEncrypt)) {
      const { ciphertext, iv } = await encryptField(value);
      encryptedData[field] = ciphertext;
      if (!encryptionIv) encryptionIv = iv;
      encryptedFields.push(field);
    }

    // Build the data for the SECURITY DEFINER function
    const reportData = {
      reference_code: referenceCode,
      report_type: body.incident_type || body.report_type || "gbv",
      description: encryptedData.description || "",
      location_text: encryptedData.location_text || null,
      contact_details: encryptedData.contact_details || null,
      is_anonymous: body.is_anonymous ?? true,
      consent_given: body.consent_given ?? false,
      report_pin: pinHash,
      incident_type: body.incident_type || "gbv",
      incident_date: body.incident_date || null,
      is_ongoing: body.is_ongoing ?? false,
      children_involved: body.children_involved ?? false,
      police_contacted: body.police_contacted ?? false,
      medical_contacted: body.medical_contacted ?? false,
      support_requested: body.support_requested || [],
      relationship: body.relationship || null,
      priority: body.children_involved ? "high" : "normal",
      encryption_iv: encryptionIv,
      encrypted_fields: encryptedFields,
    };

    // Call the SECURITY DEFINER function with service role
    const { error: rpcError } = await supabase.rpc("submit_report_anon", {
      p_data: reportData,
    });

    if (rpcError) throw rpcError;

    return new Response(
      JSON.stringify({
        reference_code: referenceCode,
        pin: pin,
        message: "Report submitted successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit report";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
