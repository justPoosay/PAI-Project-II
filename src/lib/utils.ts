export function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch(e) {
    return false;
  }
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function isBackendAlive(): Promise<boolean> {
  const res = await fetch("/api/alive");
  return res.ok;
}

export async function calculateHash(buffer: ArrayBuffer) {
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const array = Array.from(new Uint8Array(hash));
  const hex = array.map(b => b.toString(16).padStart(2, "0")).join("");
  const base64 = btoa(String.fromCharCode(...array));
  return { hex, base64 };
}