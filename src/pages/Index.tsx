import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AuthForm from '@/components/AuthForm';
import {
  getAuthToken,
  clearAuthToken,
  getServers,
  createServer,
  getChannels,
  getMessages,
  sendMessage,
  getMembers,
  Server,
  Channel,
  Message,
  Member,
} from '@/lib/api';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [servers, setServers] = useState<Server[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newServerName, setNewServerName] = useState('');
  const [newServerIcon, setNewServerIcon] = useState('🚀');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      setIsAuthenticated(true);
      loadServers();
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedServer) {
      loadChannels(selectedServer);
      loadMembers(selectedServer);
    }
  }, [selectedServer]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel);
    }
  }, [selectedChannel]);

  const loadServers = async () => {
    try {
      const data = await getServers();
      setServers(data);
      if (data.length > 0 && !selectedServer) {
        setSelectedServer(data[0].id);
      }
    } catch (error) {
      toast.error('Ошибка загрузки серверов');
      clearAuthToken();
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async (serverId: string) => {
    try {
      const data = await getChannels(serverId);
      setChannels(data);
      const textChannel = data.find((c) => c.type === 'text');
      if (textChannel) {
        setSelectedChannel(textChannel.id);
      }
    } catch (error) {
      toast.error('Ошибка загрузки каналов');
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const data = await getMessages(channelId);
      setMessages(data);
    } catch (error) {
      toast.error('Ошибка загрузки сообщений');
    }
  };

  const loadMembers = async (serverId: string) => {
    try {
      const data = await getMembers(serverId);
      setMembers(data);
    } catch (error) {
      toast.error('Ошибка загрузки участников');
    }
  };

  const handleCreateServer = async () => {
    if (!newServerName.trim()) {
      toast.error('Введите название сервера');
      return;
    }

    try {
      const server = await createServer(newServerName, newServerIcon);
      setServers([...servers, server]);
      setSelectedServer(server.id);
      setNewServerName('');
      setNewServerIcon('🚀');
      setDialogOpen(false);
      toast.success('Сервер создан!');
    } catch (error) {
      toast.error('Ошибка создания сервера');
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel) return;

    try {
      const message = await sendMessage(selectedChannel, messageInput);
      setMessages([...messages, message]);
      setMessageInput('');
    } catch (error) {
      toast.error('Ошибка отправки сообщения');
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setIsAuthenticated(false);
    setServers([]);
    setChannels([]);
    setMessages([]);
    setMembers([]);
    setSelectedServer(null);
    setSelectedChannel(null);
  };

  if (!isAuthenticated) {
    return <AuthForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  if (loading) {
    return (
      <div className="dark h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  const selectedServerData = servers.find((s) => s.id === selectedServer);
  const selectedChannelData = channels.find((c) => c.id === selectedChannel);

  return (
    <div className="dark h-screen flex bg-background text-foreground overflow-hidden">
      <div className="w-[72px] bg-sidebar flex flex-col items-center py-3 gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-primary hover:bg-primary/90 hover:rounded-xl transition-all duration-200"
          onClick={handleLogout}
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-2xl bg-sidebar-accent hover:bg-primary/50 hover:rounded-xl transition-all duration-200"
            >
              <Icon name="Plus" className="w-6 h-6 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать сервер</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="server-name">Название сервера</Label>
                <Input
                  id="server-name"
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="Мой сервер"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="server-icon">Иконка (эмодзи)</Label>
                <Input
                  id="server-icon"
                  value={newServerIcon}
                  onChange={(e) => setNewServerIcon(e.target.value)}
                  placeholder="🚀"
                  maxLength={2}
                />
              </div>
              <Button onClick={handleCreateServer} className="w-full">
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="w-60 bg-sidebar-accent flex flex-col">
        <div className="h-12 px-4 flex items-center shadow-md border-b border-sidebar-border">
          <h2 className="font-semibold text-sidebar-foreground">
            {selectedServerData?.name || 'Выберите сервер'}
          </h2>
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              Текстовые каналы
            </div>
            {channels
              .filter((c) => c.type === 'text')
              .map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full justify-start px-2 h-8 font-medium hover:bg-sidebar hover:text-sidebar-foreground ${
                    selectedChannel === channel.id
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
            {channels
              .filter((c) => c.type === 'voice')
              .map((channel) => (
                <Button
                  key={channel.id}
                  variant="ghost"
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`w-full justify-start px-2 h-8 font-medium hover:bg-sidebar hover:text-sidebar-foreground ${
                    selectedChannel === channel.id
                      ? 'bg-sidebar text-sidebar-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon name="Volume2" className="w-4 h-4 mr-2" />
                  {channel.name}
                </Button>
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
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleLogout}>
              <Icon name="LogOut" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-12 px-4 flex items-center shadow-sm border-b border-border">
          <Icon name="Hash" className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="font-semibold">{selectedChannelData?.name || 'Канал'}</span>
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
                  <AvatarFallback className="bg-primary">{message.author[0]}</AvatarFallback>
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
              placeholder={`Сообщение в #${selectedChannelData?.name || 'канал'}`}
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
            {members.length}
          </Badge>
        </div>

        <ScrollArea className="flex-1 px-2 py-2">
          <div className="space-y-1">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              Онлайн — {members.filter((m) => m.online).length}
            </div>
            {members
              .filter((m) => m.online)
              .map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-sidebar cursor-pointer"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-xs">{member.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-accent" />
                  </div>
                  <span className="text-sm font-medium text-sidebar-foreground">{member.name}</span>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Index;
