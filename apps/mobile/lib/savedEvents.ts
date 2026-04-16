import * as SecureStore from 'expo-secure-store';

const getSavedEventsKey = (userId?: string | null) => `saved-event-ids:${userId || 'guest'}`;
const memoryStore = new Map<string, string[]>();

export async function getSavedEventIds(userId?: string | null): Promise<string[]> {
  const key = getSavedEventsKey(userId);
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return memoryStore.get(key) || [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch (_error) {
    return memoryStore.get(key) || [];
  }
}

export async function saveSavedEventIds(userId: string | null | undefined, eventIds: string[]) {
  const key = getSavedEventsKey(userId);
  memoryStore.set(key, eventIds);
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(eventIds));
  } catch (_error) {
    return;
  }
}

export async function toggleSavedEvent(userId: string | null | undefined, eventId: string) {
  const current = await getSavedEventIds(userId);
  const exists = current.includes(eventId);
  const next = exists ? current.filter((item) => item !== eventId) : [eventId, ...current.filter((item) => item !== eventId)];
  await saveSavedEventIds(userId, next);
  return { saved: !exists, items: next };
}

export async function removeSavedEvent(userId: string | null | undefined, eventId: string) {
  const current = await getSavedEventIds(userId);
  const next = current.filter((item) => item !== eventId);
  await saveSavedEventIds(userId, next);
  return next;
}
