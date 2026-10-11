import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type Session = { token: string; memberId: string; groupId: string; code: string; server: string };
export type Member = { id: string; name: string; location: { latitude: number; longitude: number; updatedAt: number } | null };
export type Group = { id: string; name: string; code: string; meeting: string; ownerId: string; members: Member[]; messages: { id: string; memberId: string; name: string; text: string; createdAt: number }[] };
const key = 'group-session';
export const defaultServer = process.env.EXPO_PUBLIC_API_URL ?? (Platform.OS === 'web' ? 'http://localhost:8787' : 'http://10.0.2.2:8787');
export async function saveSession(session: Session | null) {
  if (Platform.OS === 'web') { session ? localStorage.setItem(key, JSON.stringify(session)) : localStorage.removeItem(key); return; }
  if (session) await SecureStore.setItemAsync(key, JSON.stringify(session));
  else await SecureStore.deleteItemAsync(key);
}
export async function loadSession(): Promise<Session | null> {
  const value = Platform.OS === 'web' ? localStorage.getItem(key) : await SecureStore.getItemAsync(key);
  if (!value) return null;
  const s = JSON.parse(value);
  return s && typeof s.token === 'string' && typeof s.server === 'string' && typeof s.memberId === 'string' ? s : null;
}
export async function request<T>(server: string, path: string, method = 'GET', body?: unknown, token?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(server.replace(/\/$/, '') + path, { method, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Request failed.');
    return data;
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('Network'))) throw new Error('Cannot reach the group server. Check your connection and server address.');
    throw error;
  } finally { clearTimeout(timeout); }
}
