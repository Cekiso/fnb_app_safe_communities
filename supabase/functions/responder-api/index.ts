import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ENCRYPTION_KEY = Deno.env.get("REPORT_ENCRYPTION_KEY")!;

// Service-role client for DB operations
const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// AES-256-GCM decryption
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

async function decryptField(ciphertext: string, ivStr: string): Promise<string> {
  try {
    const key = await deriveKey();
    const iv = Uint8Array.from(atob(ivStr), (c) => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return "[Decryption failed]";
  }
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

// Create a client with the user's JWT for RLS-protected calls
function userClient(authHeader: string) {
  return createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: authHeader } },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") || "";

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/responder-api", "") || "/";
    const method = req.method;

    // GET /responder-api/reports — list reports (metadata only)
    if (path === "/reports" && method === "GET") {
      const status = url.searchParams.get("status") || "all";
      const limit = parseInt(url.searchParams.get("limit") || "100");

      const client = userClient(authHeader);
      const { data, error } = await client.rpc("list_reports_for_responder", {
        p_status: status,
        p_limit: limit,
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ reports: data || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /responder-api/reports/:id — get single report with decrypted fields
    const reportMatch = path.match(/^\/reports\/([a-f0-9-]+)$/);
    if (reportMatch && method === "GET") {
      const reportId = reportMatch[1];
      const client = userClient(authHeader);

      const { data, error } = await client.rpc("get_report_for_responder", {
        p_report_id: reportId,
      });

      if (error) throw error;
      if (!data || data.found === false) {
        return new Response(
          JSON.stringify({ error: "Report not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt sensitive fields
      const report = { ...data };
      const iv = report.encryption_iv;
      const encryptedFields: string[] = report.encrypted_fields || [];

      for (const field of encryptedFields) {
        if (report[field] && iv) {
          report[field] = await decryptField(report[field], iv);
        }
      }

      // Get messages
      const { data: messages } = await client.rpc("get_report_messages", {
        p_report_id: reportId,
      });

      // Decrypt messages
      if (messages && Array.isArray(messages)) {
        for (const msg of messages) {
          if (msg.message_encrypted && msg.encryption_iv) {
            msg.message_text = await decryptField(msg.message_encrypted, msg.encryption_iv);
            delete msg.message_encrypted;
            delete msg.encryption_iv;
          }
        }
        report.messages = messages;
      } else {
        report.messages = [];
      }

      return new Response(
        JSON.stringify({ report }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PUT /responder-api/reports/:id/status — update status
    const statusMatch = path.match(/^\/reports\/([a-f0-9-]+)\/status$/);
    if (statusMatch && method === "PUT") {
      const reportId = statusMatch[1];
      const body = await req.json();

      const client = userClient(authHeader);
      const { error } = await client.rpc("update_report_status", {
        p_report_id: reportId,
        p_status: body.status,
        p_note: body.note || null,
        p_responder_name: body.responder_name || "Responder",
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // POST /responder-api/reports/:id/messages — send message
    const msgMatch = path.match(/^\/reports\/([a-f0-9-]+)\/messages$/);
    if (msgMatch && method === "POST") {
      const reportId = msgMatch[1];
      const body = await req.json();

      const { ciphertext, iv } = await encryptField(body.message);
      const client = userClient(authHeader);

      const { data, error } = await client.rpc("send_report_message", {
        p_report_id: reportId,
        p_message_encrypted: ciphertext,
        p_iv: iv,
        p_sender_type: "responder",
      });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message_id: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /responder-api/reports/:id/export — export with audit
    const exportMatch = path.match(/^\/reports\/([a-f0-9-]+)\/export$/);
    if (exportMatch && method === "GET") {
      const reportId = exportMatch[1];
      const client = userClient(authHeader);

      const { data, error } = await client.rpc("export_report_data", {
        p_report_id: reportId,
      });

      if (error) throw error;
      if (!data || data.found === false) {
        return new Response(
          JSON.stringify({ error: "Report not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrypt sensitive fields in the export
      const report = data.report;
      const iv = report.encryption_iv;
      const encryptedFields: string[] = report.encrypted_fields || [];
      for (const field of encryptedFields) {
        if (report[field] && iv) {
          report[field] = await decryptField(report[field], iv);
        }
      }

      // Decrypt messages
      if (data.messages && Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          if (msg.message_encrypted && msg.encryption_iv) {
            msg.message_text = await decryptField(msg.message_encrypted, msg.encryption_iv);
            delete msg.message_encrypted;
            delete msg.encryption_iv;
          }
        }
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /responder-api/audit — admin only, view audit log
    if (path === "/audit" && method === "GET") {
      const client = userClient(authHeader);

      // Check admin role
      const { data: profile } = await client
        .from("profiles")
        .select("role")
        .eq("id", authHeader.replace("Bearer ", ""))
        .maybeSingle();

      // Use service role to check the JWT's user
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await serviceSupabase.auth.getUser(token);
      if (!userData.user) {
        return new Response(
          JSON.stringify({ error: "Not authenticated" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: userProfile } = await serviceSupabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (!userProfile || userProfile.role !== "ADMIN") {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: logs, error } = await serviceSupabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      return new Response(
        JSON.stringify({ logs: logs || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
