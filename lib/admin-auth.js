const crypto = require('crypto');
const { readData, writeData } = require('./site-data');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

function normalizeUsers(admin) {
  if (admin.users?.length) return admin.users;

  const users = [{
    id: 'admin',
    username: admin.username || 'admin',
    passwordHash: admin.passwordHash,
    role: 'admin',
    name: 'Quản trị viên',
    active: true,
  }];
  admin.users = users;
  return users;
}

function getUsers() {
  const data = readData();
  const hadUsers = Array.isArray(data.admin.users) && data.admin.users.length > 0;
  const users = normalizeUsers(data.admin);
  if (!hadUsers) saveUsers(users);
  return users;
}

function findUserByCredentials(username, password) {
  const data = readData();
  const users = normalizeUsers(data.admin);
  const hash = sha256(password);
  return users.find(u => u.username === username && u.active !== false && u.passwordHash === hash) || null;
}

function findUserById(userId) {
  return getUsers().find(u => u.id === userId) || null;
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, username: user.username, role: user.role, name: user.name };
}

function saveUsers(users) {
  const data = readData();
  data.admin.users = users;
  if (users[0]) {
    data.admin.username = users.find(u => u.role === 'admin')?.username || users[0].username;
    data.admin.passwordHash = users.find(u => u.role === 'admin')?.passwordHash || users[0].passwordHash;
  }
  writeData(data);
}

function createUser({ username, password, name, role = 'staff' }) {
  const users = getUsers();
  if (users.some(u => u.username === username)) {
    throw new Error('Tên đăng nhập đã tồn tại');
  }
  const user = {
    id: crypto.randomBytes(8).toString('hex'),
    username: username.trim(),
    passwordHash: sha256(password),
    role: role === 'admin' ? 'admin' : 'staff',
    name: (name || username).trim(),
    active: true,
  };
  users.push(user);
  saveUsers(users);
  return publicUser(user);
}

function updateUser(userId, patch) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) throw new Error('Không tìm thấy tài khoản');

  if (patch.username && users.some(u => u.username === patch.username && u.id !== userId)) {
    throw new Error('Tên đăng nhập đã tồn tại');
  }

  if (patch.username) users[idx].username = patch.username.trim();
  if (patch.name) users[idx].name = patch.name.trim();
  if (patch.role && users[idx].role !== 'admin') users[idx].role = patch.role === 'admin' ? 'admin' : 'staff';
  if (patch.password) users[idx].passwordHash = sha256(patch.password);
  if (typeof patch.active === 'boolean' && users[idx].role !== 'admin') users[idx].active = patch.active;

  saveUsers(users);
  return publicUser(users[idx]);
}

function deleteUser(userId) {
  const users = getUsers();
  const user = users.find(u => u.id === userId);
  if (!user) throw new Error('Không tìm thấy tài khoản');
  if (user.role === 'admin') throw new Error('Không thể xóa tài khoản quản trị');
  saveUsers(users.filter(u => u.id !== userId));
}

function changePassword(userId, currentPassword, newPassword) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx < 0) throw new Error('Không tìm thấy tài khoản');
  if (sha256(currentPassword) !== users[idx].passwordHash) {
    throw new Error('Mật khẩu hiện tại không đúng');
  }
  users[idx].passwordHash = sha256(newPassword);
  saveUsers(users);
}

module.exports = {
  sha256,
  getUsers,
  findUserByCredentials,
  findUserById,
  publicUser,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
};
