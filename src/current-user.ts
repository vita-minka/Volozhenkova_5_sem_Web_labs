// Заглушка-синглтон текущего пользователя
// В лабе 4 будет подменяться на реального из сессии

let currentUserId: number | null = null;

export function setCurrentUserId(id: number): void {
  currentUserId = id;
}

export function getCurrentUserId(): number {
  // Если сессии нет — fallback на дефолтного создателя
  return currentUserId ?? 1;
}

export function clearCurrentUser(): void {
  currentUserId = null;
}