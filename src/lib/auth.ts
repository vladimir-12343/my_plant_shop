export async function getCurrentUser() {
  // Тут должна быть реальная проверка через сессию / JWT / cookie
  // Пока временно эмулируем "вход"
  return {
    id: 1,
    name: 'Admin User',
    role: 'admin' // или 'user'
  }
}
