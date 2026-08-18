import 'server-only'

// PBKDF2-SHA256 password hashing using Web Crypto (runtime-compatible with
// Cloudflare Workers / V8 isolates and Node.js).
//
// Stored format: `pbkdf2-sha256:<iterations>:<salt_hex>:<derived_hex>`

const ITERATIONS = 150_000
const KEY_LENGTH = 32 // bytes (256-bit)
const PREFIX = 'pbkdf2-sha256'

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function derive(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  )
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const derived = await derive(password, salt, ITERATIONS)
  return `${PREFIX}:${ITERATIONS}:${toHex(salt.buffer)}:${toHex(derived)}`
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 4 || parts[0] !== PREFIX) return false

  const iterations = Number(parts[1])
  const salt = fromHex(parts[2])
  const expected = parts[3]

  const derived = await derive(password, salt, iterations)
  const actual = toHex(derived)

  // Constant-time comparison of the two hex strings.
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) {
    diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}
