import crypto from 'crypto';

const users = new Map();
const verificationCodes = new Map();
const sessions = new Map();

export const generateUserId = () => {
  return crypto.randomUUID();
};

export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const createUser = (email, username, password) => {
  const userId = generateUserId();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');

  const user = {
    id: userId,
    email,
    username: username || email.split('@')[0],
    passwordHash: hashedPassword,
    salt,
    verified: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  users.set(userId, user);
  return user;
};

export const findUserByEmail = (email) => {
  for (const user of users.values()) {
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

export const findUserById = (userId) => {
  return users.get(userId) || null;
};

export const validatePassword = (user, password) => {
  const hashedPassword = crypto
    .pbkdf2Sync(password, user.salt, 1000, 64, 'sha512')
    .toString('hex');
  return user.passwordHash === hashedPassword;
};

export const storeVerificationCode = (email, code, expiresInMinutes = 10) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
  
  verificationCodes.set(email, {
    code,
    expiresAt
  });
};

export const verifyCode = (email, code) => {
  const verification = verificationCodes.get(email);
  
  if (!verification) {
    return false;
  }
  
  if (new Date() > verification.expiresAt) {
    verificationCodes.delete(email);
    return false;
  }
  
  if (verification.code !== code) {
    return false;
  }
  
  verificationCodes.delete(email);
  return true;
};

export const markUserVerified = (userId) => {
  const user = users.get(userId);
  if (user) {
    user.verified = true;
    user.updatedAt = new Date();
    users.set(userId, user);
    return true;
  }
  return false;
};

export const createSession = (userId) => {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const session = {
    token,
    userId,
    createdAt: new Date(),
    expiresAt
  };
  
  sessions.set(token, session);
  return session;
};

export const validateSession = (token) => {
  const session = sessions.get(token);
  
  if (!session) {
    return null;
  }
  
  if (new Date() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }
  
  return findUserById(session.userId);
};

export const deleteSession = (token) => {
  return sessions.delete(token);
}; 