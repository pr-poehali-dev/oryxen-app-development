const AUTH_URL = 'https://functions.poehali.dev/215156de-f84d-4dd4-aa66-b03e45944582';
const API_URL = 'https://functions.poehali.dev/8dd0deeb-530f-4f9d-afc9-a3a42639b36d';

export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Server {
  id: string;
  name: string;
  icon: string;
  owner_id: number;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  position: number;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  author: string;
  author_id: number;
  avatar?: string;
}

export interface Member {
  id: number;
  name: string;
  avatar?: string;
  online: boolean;
}

export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
};

export const register = async (
  email: string,
  username: string,
  password: string
): Promise<AuthResponse> => {
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register', email, username, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  return response.json();
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login', email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return response.json();
};

export const getServers = async (): Promise<Server[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}?path=servers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch servers');
  }

  const data = await response.json();
  return data.servers;
};

export const createServer = async (name: string, icon: string): Promise<Server> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}?path=servers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
    body: JSON.stringify({ name, icon }),
  });

  if (!response.ok) {
    throw new Error('Failed to create server');
  }

  const data = await response.json();
  return data.server;
};

export const getChannels = async (serverId: string): Promise<Channel[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}?path=channels&server_id=${serverId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch channels');
  }

  const data = await response.json();
  return data.channels;
};

export const getMessages = async (channelId: string): Promise<Message[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}?path=messages&channel_id=${channelId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  return data.messages;
};

export const sendMessage = async (channelId: string, content: string): Promise<Message> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}?path=messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
    body: JSON.stringify({ channel_id: channelId, content }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();
  return data.message;
};

export const getMembers = async (serverId: string): Promise<Member[]> => {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}?path=members&server_id=${serverId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': token,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }

  const data = await response.json();
  return data.members;
};
