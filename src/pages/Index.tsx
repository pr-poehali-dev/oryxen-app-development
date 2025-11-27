import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Server {
  id: string;
  name: string;
  icon: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
}

interface Message {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

interface VoiceUser {
  id: string;
  name: string;
  avatar: string;
  isSpeaking: boolean;
  isMuted: boolean;
}

const Index = () => {
  const [selectedServer, setSelectedServer] = useState('1');
  const [selectedChannel, setSelectedChannel] = useState('1');
  const [messageInput, setMessageInput] = useState('');

  const servers: Server[] = [
    { id: '1', name: 'Мой сервер', icon: '🚀' },
    { id: '2', name: 'Друзья', icon: '🎮' },
    { id: '3', name: 'Работа', icon: '💼' },
    { id: '4', name: 'Хобби', icon: '🎨' },
  ];

  const channels: Channel[] = [
    { id: '1', name: 'общий', type: 'text' },
    { id: '2', name: 'разработка', type: 'text' },
    { id: '3', name: 'random', type: 'text' },
    { id: '4', name: 'Общая комната', type: 'voice' },
    { id: '5', name: 'AFK', type: 'voice' },
  ];

  const messages: Message[] = [
    {
      id: '1',
      author: 'Александр',
      avatar: '',
      content: 'Привет всем! Как дела?',
      timestamp: '12:30',
    },
    {
      id: '2',
      author: 'Мария',
      avatar: '',
      content: 'Отлично! Работаю над новым проектом 🚀',
      timestamp: '12:32',
    },
    {
      id: '3',
      author: 'Дмитрий',
      avatar: '',
      content: 'У кого-нибудь есть опыт с WebRTC?',
      timestamp: '12:35',
    },
    {
      id: '4',
      author: 'Елена',
      avatar: '',
      content: 'Да, работала с ним в прошлом проекте. Могу помочь!',
      timestamp: '12:37',
    },
  ];

  const voiceUsers: VoiceUser[] = [
    { id: '1', name: 'Иван', avatar: '', isSpeaking: true, isMuted: false },
    { id: '2', name: 'Ольга', avatar: '', isSpeaking: false, isMuted: false },
    { id: '3', name: 'Павел', avatar: '', isSpeaking: false, isMuted: true },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessageInput('');
    }
  };

  return (
    <div className="dark h-screen flex bg-background text-foreground overflow-hidden">
      <div className="w-[72px] bg-sidebar flex flex-col items-center py-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:rounded-xl transition-all duration-200"
        >
          <Icon name="Home" className="w-6 h-6" />
        </Button>
        
        <Separator className="w-8 bg-sidebar-border" />
        
        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-2 px-3">
            {servers.map((server) => (
              <Button
                key={server.id}
                variant="ghost"
                size="icon"
                onClick={() => setSelectedServer(server.id)}
                className={`w-12 h-12 rounded-2xl transition-all duration-200 text-2xl hover:rounded-xl ${
                  selectedServer === server.id
                    ? 'bg-primary rounded-xl'
                    : 'bg-sidebar-accent hover:bg-primary/50'
                }`}
              >
                {server.icon}
              </Button>
            ))}
          </div>
        </ScrollArea>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-sidebar-accent hover:bg-primary/50 hover:rounded-xl transition-all duration-200"
        >
          <Icon name="Plus" className="w-6 h-6 text-primary" />
        </Button>
      </div>

      <div className="w-60 bg-sidebar-accent flex flex-col">
        <div className="h-12 px-4 flex items-center shadow-md border-b border-sidebar-border">
          <h2 className="font-semibold text-sidebar-foreground">
            {servers.find(s => s.id === selectedServer)?.name}
          </h2>
        </div>
        
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              Текстовые каналы
            </div>
            {channels.filter(c => c.type === 'text').map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full justify-start px-2 h-8 font-medium hover:bg-sidebar hover:text-sidebar-foreground ${
                  selectedChannel === channel.id && channels.find(c => c.id === channel.id)?.type === 'text'
                    ? 'bg-sidebar text-sidebar-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon name="Hash" className="w-4 h-4 mr-2" />
                {channel.name}
              </Button>
            ))}
            
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-4">
              Голосовые каналы
            </div>
            {channels.filter(c => c.type === 'voice').map((channel) => (
              <div key={channel.id}>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full justify-start px-2 h-8 font-medium hover:bg-sidebar hover:text-sidebar-foreground ${
                    selectedChannel === channel.id && channels.find(c => c.id === channel.id)?.type === 'voice'
                      ? 'bg-sidebar text-sidebar-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon name="Volume2" className="w-4 h-4 mr-2" />
                  {channel.name}
                </Button>
                {selectedChannel === channel.id && channels.find(c => c.id === channel.id)?.type === 'voice' && (
                  <div className="ml-6 mt-1 space-y-1">
                    {voiceUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <div className="relative">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-primary text-xs">
                              {user.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {user.isSpeaking && (
                            <div className="absolute -inset-0.5 rounded-full border-2 border-primary animate-pulse" />
                          )}
                        </div>
                        <span className="flex-1 text-xs">{user.name}</span>
                        {user.isMuted && (
                          <Icon name="MicOff" className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="h-14 px-2 py-2 bg-sidebar-background border-t border-sidebar-border">
          <div className="flex items-center gap-2 px-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-sm">Я</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-sidebar-foreground truncate">Мой профиль</div>
              <div className="text-xs text-muted-foreground">#1234</div>
            </div>
            <Button variant="ghost" size="icon" className="w-8 h-8">
              <Icon name="Settings" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-12 px-4 flex items-center shadow-sm border-b border-border">
          <Icon name="Hash" className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="font-semibold">
            {channels.find(c => c.id === selectedChannel)?.name}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Icon name="Users" className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Icon name="Search" className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Icon name="Bell" className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="py-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-3 hover:bg-muted/50 px-4 py-2 -mx-4 rounded group">
                <Avatar className="w-10 h-10 mt-0.5">
                  <AvatarFallback className="bg-primary">
                    {message.author[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-sm">{message.author}</span>
                    <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4">
          <div className="flex items-center gap-2 bg-card rounded-lg px-4 py-3 border border-border">
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Icon name="Plus" className="w-5 h-5" />
            </Button>
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Сообщение в #${channels.find(c => c.id === selectedChannel)?.name}`}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button variant="ghost" size="icon" className="w-9 h-9">
              <Icon name="Smile" className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-60 bg-sidebar-accent border-l border-sidebar-border">
        <div className="h-12 px-4 flex items-center border-b border-sidebar-border">
          <h3 className="font-semibold text-sm">Участники</h3>
          <Badge variant="secondary" className="ml-auto">
            24
          </Badge>
        </div>
        
        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              Онлайн — 12
            </div>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-xs">
                      У{i + 1}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-accent" />
                </div>
                <span className="text-sm font-medium text-sidebar-foreground">
                  Участник {i + 1}
                </span>
              </div>
            ))}
            
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase mt-3">
              Офлайн — 12
            </div>
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar cursor-pointer opacity-50"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-muted text-xs">
                    У{i + 13}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-muted-foreground">
                  Участник {i + 13}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Index;
