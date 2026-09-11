import type { TokenPayload, User, TenantStatus } from '../types';

const STORAGE_KEY = 'odontosoft.session.token';
const encode = (value: unknown) => btoa(unescape(encodeURIComponent(JSON.stringify(value))));
const decode = <T,>(value: string): T | null => { try { return JSON.parse(decodeURIComponent(escape(atob(value)))) as T; } catch { return null; } };

export function generateToken(user: Pick<User, 'id' | 'email' | 'name' | 'role'> & { tenantId?: string }, tenantStatus: TenantStatus = 'active') {
  const issuedAt = Date.now();
  const payload: TokenPayload = { token: '', userId: user.id, email: user.email, name: user.name, role: user.role, tenantId: user.tenantId, tenantStatus, issuedAt, expiresAt: issuedAt + 1000 * 60 * 60 * 8 };
  return `os.${encode({ ...payload, token: undefined })}.${encode({ v: 1 })}`;
}
export function saveSessionToken(token: string) { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, token); }
export function getSessionToken() { return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null; }
export function clearSessionToken() { if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY); }
export function parseToken(token: string): TokenPayload | null { const part = token.split('.')[1]; if (!part) return null; const payload = decode<any>(part); return payload ? { ...payload, token } : null; }
export function isTokenValid(token: string | null) { const payload = token ? parseToken(token) : null; return !!payload && payload.expiresAt > Date.now() && payload.tenantStatus !== 'suspended'; }
