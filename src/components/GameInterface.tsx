import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = 'https://functions.poehali.dev/82f599ab-dbde-4e55-aedf-da43d7366a66';

interface PlayerStats {
  id: number;
  nickname: string;
  level: number;
  experience: number;
  money: number;
  authority: number;
  energy: number;
  health: number;
  role: 'prisoner' | 'guard';
}

interface InventoryItem {
  id: number;
  item_id: number;
  name: string;
  icon: string;
  quantity: number;
  type: string;
  description?: string;
}

interface Order {
  id: number;
  title: string;
  description: string;
  reward_money: number;
  reward_exp: number;
  difficulty: 'easy' | 'medium' | 'hard';
  duration_minutes: number;
}

interface ShopItem {
  id: number;
  name: string;
  description: string;
  icon: string;
  price: number;
  type: string;
  effect_type: string;
  effect_value: number;
}

interface LeaderboardPlayer {
  nickname: string;
  level: number;
  money: number;
  authority: number;
  experience: number;
}

export default function GameInterface() {
  const { toast } = useToast();
  const [player, setPlayer] = useState<PlayerStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'shop' | 'leaderboard'>('orders');
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [loading, setLoading] = useState(false);

  const playerId = 1;

  const fetchPlayerData = async () => {
    try {
      const response = await fetch(`${API_URL}?action=player&player_id=${playerId}`);
      const data = await response.json();
      if (data.player) {
        setPlayer(data.player);
      }
    } catch (error) {
      console.error('Error fetching player:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_URL}?action=inventory&player_id=${playerId}`);
      const data = await response.json();
      setInventory(data.inventory || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}?action=orders&player_id=${playerId}`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchShopItems = async () => {
    try {
      const response = await fetch(`${API_URL}?action=items`);
      const data = await response.json();
      setShopItems(data.items || []);
    } catch (error) {
      console.error('Error fetching shop items:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}?action=leaderboard`);
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  useEffect(() => {
    fetchPlayerData();
    fetchInventory();
    fetchOrders();
    fetchShopItems();
    fetchLeaderboard();
  }, []);

  const handleCompleteOrder = async (orderId: number, reward_money: number, reward_exp: number) => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_order',
          player_id: playerId,
          order_id: orderId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '✅ Приказ выполнен!',
          description: `Получено: ${reward_money} монет и ${reward_exp} опыта`,
        });
        
        await fetchPlayerData();
        await fetchOrders();
      } else {
        toast({
          title: '❌ Ошибка',
          description: data.error || 'Не удалось выполнить приказ',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Ошибка при выполнении приказа',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleBuyItem = async (itemId: number, itemName: string, price: number) => {
    if (!player || player.money < price) {
      toast({
        title: '❌ Недостаточно денег',
        description: `Нужно ${price} монет`,
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buy_item',
          player_id: playerId,
          item_id: itemId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: '✅ Предмет куплен!',
          description: `${itemName} добавлен в инвентарь`,
        });
        
        await fetchPlayerData();
        await fetchInventory();
      } else {
        toast({
          title: '❌ Ошибка',
          description: data.error || 'Не удалось купить предмет',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Ошибка при покупке предмета',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleUseItem = async (itemId: number, itemName: string) => {
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'use_item',
          player_id: playerId,
          item_id: itemId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const effectNames: Record<string, string> = {
          health: 'Здоровье',
          energy: 'Энергия',
          authority: 'Авторитет'
        };
        
        toast({
          title: '✅ Предмет использован!',
          description: `${itemName}: +${data.value} ${effectNames[data.effect] || ''}`,
        });
        
        await fetchPlayerData();
        await fetchInventory();
      } else {
        toast({
          title: '❌ Ошибка',
          description: data.error || 'Не удалось использовать предмет',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Ошибка при использовании предмета',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const difficultyColors = {
    easy: 'bg-green-600',
    medium: 'bg-yellow-600',
    hard: 'bg-red-600'
  };

  const difficultyEmoji = {
    easy: '🟢',
    medium: '🟡',
    hard: '🔴'
  };

  if (!player) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-[#1a1410] to-[#2d1810]">
        <div className="text-yellow-400 text-2xl">Загрузка...</div>
      </div>
    );
  }

  const maxExperience = player.level * 1000;
  const maxEnergy = 100;
  const maxHealth = 100;

  return (
    <div className="h-screen flex flex-col p-2 gap-2 overflow-hidden">
      <Card className="bg-gradient-to-r from-[#3d2817] to-[#5c3d2e] border-[#8b6f47] border-2 shadow-2xl">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border-2 border-yellow-500">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=prisoner" />
              <AvatarFallback>ЗК</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-yellow-400 font-bold text-lg">{player.nickname}</div>
              <Badge variant="outline" className="bg-red-900 text-red-100 border-red-700">
                {player.role === 'prisoner' ? '⛓️ Заключенный' : '🛡️ Охрана'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-[#2d1810] px-4 py-2 rounded-lg border border-yellow-700">
              <Icon name="Award" className="text-yellow-500" size={20} />
              <span className="text-yellow-400 font-bold">Уровень {player.level}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#2d1810] px-4 py-2 rounded-lg border border-yellow-700">
              <Icon name="Coins" className="text-yellow-500" size={20} />
              <span className="text-yellow-400 font-bold">{player.money.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#2d1810] px-4 py-2 rounded-lg border border-red-700">
              <Icon name="Flame" className="text-red-500" size={20} />
              <span className="text-red-400 font-bold">{player.authority}</span>
            </div>

            <div className="flex items-center gap-2 bg-[#2d1810] px-4 py-2 rounded-lg border border-orange-700">
              <Icon name="Zap" className="text-orange-500" size={20} />
              <span className="text-orange-400 font-bold">{player.energy}/{maxEnergy}</span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-yellow-300 text-sm min-w-[60px]">Опыт:</span>
            <Progress value={(player.experience / maxExperience) * 100} className="h-3 flex-1" />
            <span className="text-yellow-400 text-sm">{player.experience.toLocaleString()}/{maxExperience.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-red-300 text-sm min-w-[60px]">Здоровье:</span>
            <Progress value={(player.health / maxHealth) * 100} className="h-3 flex-1 [&>div]:bg-red-600" />
            <span className="text-red-400 text-sm">{player.health}/{maxHealth}</span>
          </div>
        </div>
      </Card>

      <div className="flex-1 flex gap-2 min-h-0">
        <Card className="w-64 bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 flex flex-col">
          <div className="p-3 border-b border-[#8b6f47]">
            <h3 className="text-yellow-400 font-bold text-center text-lg">⚡ Быстрые действия</h3>
          </div>
          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            <Button 
              className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700"
              onClick={() => setShowShop(true)}
            >
              <Icon name="ShoppingBag" size={18} className="mr-2" />
              Магазин
            </Button>
            <Button 
              className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700"
              onClick={() => setShowLeaderboard(true)}
            >
              <Icon name="Trophy" size={18} className="mr-2" />
              Рейтинг
            </Button>
            <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700">
              <Icon name="Users" size={18} className="mr-2" />
              Искать игроков
            </Button>
            <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700">
              <Icon name="MapPin" size={18} className="mr-2" />
              Прятки
            </Button>
            <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700">
              <Icon name="Swords" size={18} className="mr-2" />
              Устроить бунт
            </Button>
            <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700">
              <Icon name="Dices" size={18} className="mr-2" />
              Сыграть в карты
            </Button>
          </div>
        </Card>

        <Card className="flex-1 bg-gradient-to-b from-[#4a3828] to-[#3d2817] border-[#8b6f47] border-2 relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                #000 20px,
                #000 22px
              )`
            }}
          />
          
          <div className="relative h-full flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold text-yellow-400 mb-2">🔒 Камера №{player.id}</h2>
              <p className="text-yellow-300/70">Ваше текущее местоположение</p>
            </div>

            <div className="relative">
              <div className="w-64 h-64 bg-[#2d1810] rounded-lg border-4 border-[#8b6f47] flex items-center justify-center shadow-2xl">
                <div className="text-9xl animate-pulse">👤</div>
              </div>
              <Badge className="absolute -top-3 -right-3 bg-yellow-600 text-white border-yellow-400">
                Уровень {player.level}
              </Badge>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <Button className="bg-red-800 hover:bg-red-700 text-white">
                <Icon name="Heart" size={18} className="mr-2" />
                Лечиться
              </Button>
              <Button className="bg-orange-800 hover:bg-orange-700 text-white">
                <Icon name="Coffee" size={18} className="mr-2" />
                Отдохнуть
              </Button>
              <Button className="bg-blue-800 hover:bg-blue-700 text-white">
                <Icon name="Shirt" size={18} className="mr-2" />
                Одежда
              </Button>
            </div>
          </div>
        </Card>

        <Card className="w-80 bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 flex flex-col">
          <div className="flex border-b border-[#8b6f47]">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 p-3 font-bold text-sm ${
                activeTab === 'orders' 
                  ? 'bg-[#5c3d2e] text-yellow-400' 
                  : 'text-yellow-300/60 hover:bg-[#3d2817]'
              }`}
            >
              📋 Приказы
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === 'orders' && orders.map(order => (
              <Card key={order.id} className="bg-[#2d1810] border-[#8b6f47] p-3 hover:bg-[#3d2817] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-yellow-400 font-bold text-sm">{order.title}</h4>
                  <Badge className={`${difficultyColors[order.difficulty]} text-white text-xs`}>
                    {difficultyEmoji[order.difficulty]} {order.difficulty}
                  </Badge>
                </div>
                <p className="text-yellow-300/70 text-xs mb-3">{order.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <span className="text-green-400 font-bold flex items-center gap-1 text-xs">
                      <Icon name="Coins" size={14} />
                      +{order.reward_money}
                    </span>
                    <span className="text-blue-400 font-bold flex items-center gap-1 text-xs">
                      <Icon name="Award" size={14} />
                      +{order.reward_exp}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-green-700 hover:bg-green-600 text-white text-xs h-7"
                    onClick={() => handleCompleteOrder(order.id, order.reward_money, order.reward_exp)}
                    disabled={loading}
                  >
                    Выполнить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-[#3d2817] to-[#5c3d2e] border-[#8b6f47] border-2">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2">
              <Icon name="Backpack" size={20} />
              Инвентарь
            </h3>
          </div>
          
          <div className="grid grid-cols-10 gap-3">
            {inventory.map(item => (
              <div
                key={item.id}
                className="relative bg-[#2d1810] border-2 border-[#8b6f47] rounded-lg p-3 hover:border-yellow-500 transition-colors cursor-pointer group"
                onClick={() => handleUseItem(item.item_id, item.name)}
              >
                <div className="text-3xl text-center mb-1">{item.icon}</div>
                <div className="text-yellow-300 text-[10px] text-center font-bold truncate">{item.name}</div>
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-600 text-white text-xs h-5 px-1">
                    {item.quantity}
                  </Badge>
                )}
                <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 rounded-lg transition-colors" />
              </div>
            ))}
            {inventory.length === 0 && (
              <div className="col-span-10 text-center text-yellow-300/50 py-4">
                Инвентарь пуст
              </div>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={showShop} onOpenChange={setShowShop}>
        <DialogContent className="max-w-4xl bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 text-yellow-300">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-2xl">🏪 Магазин</DialogTitle>
            <DialogDescription className="text-yellow-300/70">
              Покупайте предметы для улучшения своего персонажа
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {shopItems.map(item => (
              <Card key={item.id} className="bg-[#2d1810] border-[#8b6f47] p-4">
                <div className="text-center mb-2">
                  <div className="text-5xl mb-2">{item.icon}</div>
                  <h4 className="text-yellow-400 font-bold">{item.name}</h4>
                  <p className="text-yellow-300/70 text-xs mb-2">{item.description}</p>
                  {item.effect_type !== 'none' && (
                    <Badge className="bg-blue-700 text-white text-xs mb-2">
                      +{item.effect_value} {item.effect_type}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold flex items-center gap-1">
                    <Icon name="Coins" size={16} />
                    {item.price}
                  </span>
                  <Button 
                    size="sm" 
                    className="bg-green-700 hover:bg-green-600 text-white"
                    onClick={() => handleBuyItem(item.id, item.name, item.price)}
                    disabled={loading || (player && player.money < item.price)}
                  >
                    Купить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-2xl bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 text-yellow-300">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-2xl">🏆 Таблица лидеров</DialogTitle>
            <DialogDescription className="text-yellow-300/70">
              Топ игроков по уровню и опыту
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {leaderboard.map((p, index) => (
              <Card key={index} className="bg-[#2d1810] border-[#8b6f47] p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div>
                    <div className="text-yellow-400 font-bold">{p.nickname}</div>
                    <div className="text-yellow-300/70 text-sm">Уровень {p.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 font-bold">{p.money.toLocaleString()} 💰</div>
                  <div className="text-red-400 text-sm">{p.authority} 🔥</div>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
