import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

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

const INITIAL_PLAYER: PlayerStats = {
  id: 1,
  nickname: 'Зэк по кличке [ЧМ]',
  level: 5,
  experience: 2500,
  money: 5000,
  authority: 10,
  energy: 85,
  health: 90,
  role: 'prisoner'
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, item_id: 1, name: 'Сигареты', icon: '🚬', quantity: 15, type: 'currency' },
  { id: 2, item_id: 2, name: 'Чай', icon: '🫖', quantity: 8, type: 'food' },
  { id: 3, item_id: 3, name: 'Карты', icon: '🃏', quantity: 1, type: 'game' },
  { id: 4, item_id: 4, name: 'Телефон', icon: '📱', quantity: 1, type: 'contraband' },
  { id: 5, item_id: 6, name: 'Нычка', icon: '📦', quantity: 23, type: 'storage' }
];

const INITIAL_ORDERS: Order[] = [
  { id: 1, title: 'Встать в строй', description: 'Построиться на плацу за 5 минут', reward_money: 50, reward_exp: 10, difficulty: 'easy', duration_minutes: 5 },
  { id: 2, title: 'Передать нычку', description: 'Отнести посылку в 3-й барак', reward_money: 150, reward_exp: 30, difficulty: 'medium', duration_minutes: 15 },
  { id: 3, title: 'Спрятаться от обыска', description: 'Найти укромное место', reward_money: 200, reward_exp: 50, difficulty: 'hard', duration_minutes: 10 }
];

const SHOP_ITEMS: ShopItem[] = [
  { id: 1, name: 'Сигареты', description: 'Тюремная валюта', icon: '🚬', price: 10, type: 'currency', effect_type: 'money', effect_value: 10 },
  { id: 2, name: 'Чай', description: 'Восстанавливает энергию', icon: '🫖', price: 50, type: 'food', effect_type: 'energy', effect_value: 20 },
  { id: 3, name: 'Телефон', description: 'Контрабанда', icon: '📱', price: 500, type: 'contraband', effect_type: 'authority', effect_value: 5 },
  { id: 4, name: 'Передача', description: 'Еда из дома', icon: '📮', price: 80, type: 'food', effect_type: 'health', effect_value: 30 }
];

export default function GameInterface() {
  const { toast } = useToast();
  const [player, setPlayer] = useState<PlayerStats>(INITIAL_PLAYER);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [shopItems] = useState<ShopItem[]>(SHOP_ITEMS);
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [hideGame, setHideGame] = useState<'priatki' | 'bunt' | 'cards' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mockLeaderboard: LeaderboardPlayer[] = [
      { nickname: 'Вор в законе', level: 45, money: 250000, authority: 89, experience: 45000 },
      { nickname: 'Авторитет Макс', level: 38, money: 180000, authority: 72, experience: 38000 },
      { nickname: player.nickname, level: player.level, money: player.money, authority: player.authority, experience: player.experience },
      { nickname: 'Бывалый Петя', level: 12, money: 35000, authority: 25, experience: 12000 },
      { nickname: 'Новичок 228', level: 3, money: 2500, authority: 5, experience: 3000 }
    ];
    setLeaderboard(mockLeaderboard);
  }, [player]);

  const handleCompleteOrder = (order: Order) => {
    setLoading(true);
    
    setTimeout(() => {
      const newMoney = player.money + order.reward_money;
      const newExperience = player.experience + order.reward_exp;
      const maxExp = player.level * 1000;
      const newLevel = newExperience >= maxExp ? player.level + 1 : player.level;
      
      setPlayer(prev => ({
        ...prev,
        money: newMoney,
        experience: newExperience >= maxExp ? newExperience - maxExp : newExperience,
        level: newLevel
      }));
      
      toast({
        title: '✅ Приказ выполнен!',
        description: `Получено: +${order.reward_money}💰 и +${order.reward_exp}⭐ ${newLevel > player.level ? '🎉 Новый уровень!' : ''}`,
      });
      
      setLoading(false);
    }, 1000);
  };

  const handleBuyItem = (item: ShopItem) => {
    if (player.money < item.price) {
      toast({
        title: '❌ Недостаточно денег',
        description: `Нужно ${item.price}💰`,
        variant: 'destructive'
      });
      return;
    }

    setPlayer(prev => ({ ...prev, money: prev.money - item.price }));
    
    const existingItem = inventory.find(i => i.item_id === item.id);
    if (existingItem) {
      setInventory(prev => prev.map(i => 
        i.item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setInventory(prev => [...prev, {
        id: Date.now(),
        item_id: item.id,
        name: item.name,
        icon: item.icon,
        quantity: 1,
        type: item.type
      }]);
    }

    toast({
      title: '✅ Предмет куплен!',
      description: `${item.name} добавлен в инвентарь`,
    });
  };

  const handleUseItem = (item: InventoryItem) => {
    const shopItem = shopItems.find(s => s.id === item.item_id);
    if (!shopItem || item.quantity <= 0) return;

    const updates: Partial<PlayerStats> = {};
    
    if (shopItem.effect_type === 'health') {
      updates.health = Math.min(player.health + shopItem.effect_value, 100);
    } else if (shopItem.effect_type === 'energy') {
      updates.energy = Math.min(player.energy + shopItem.effect_value, 100);
    } else if (shopItem.effect_type === 'authority') {
      updates.authority = player.authority + shopItem.effect_value;
    }

    setPlayer(prev => ({ ...prev, ...updates }));
    
    setInventory(prev => prev.map(i => 
      i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i
    ).filter(i => i.quantity > 0));

    const effectNames: Record<string, string> = {
      health: 'Здоровье',
      energy: 'Энергия',
      authority: 'Авторитет'
    };

    toast({
      title: '✅ Предмет использован!',
      description: `${item.name}: +${shopItem.effect_value} ${effectNames[shopItem.effect_type] || ''}`,
    });
  };

  const startMiniGame = (game: 'priatki' | 'bunt' | 'cards') => {
    setHideGame(game);
    setShowMiniGame(true);
  };

  const completeMiniGame = (won: boolean) => {
    if (won) {
      const reward = hideGame === 'bunt' ? 500 : hideGame === 'priatki' ? 300 : 200;
      const expReward = hideGame === 'bunt' ? 100 : hideGame === 'priatki' ? 60 : 40;
      
      setPlayer(prev => ({
        ...prev,
        money: prev.money + reward,
        experience: prev.experience + expReward,
        authority: prev.authority + (hideGame === 'bunt' ? 5 : 2)
      }));
      
      toast({
        title: '🎉 Победа!',
        description: `Получено: +${reward}💰 и +${expReward}⭐`,
      });
    } else {
      toast({
        title: '😔 Проигрыш',
        description: 'Попробуйте еще раз!',
      });
    }
    setShowMiniGame(false);
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

  const maxExperience = player.level * 1000;
  const maxEnergy = 100;
  const maxHealth = 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1410] to-[#2d1810] p-2 md:p-4">
      <div className="max-w-[1800px] mx-auto space-y-3">
        {/* Верхняя панель */}
        <Card className="bg-gradient-to-r from-[#3d2817] to-[#5c3d2e] border-[#8b6f47] border-2 shadow-2xl">
          <div className="p-3 md:p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 border-2 border-yellow-500">
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

              <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-[#2d1810] px-3 py-2 rounded-lg border border-yellow-700">
                  <Icon name="Award" className="text-yellow-500" size={18} />
                  <span className="text-yellow-400 font-bold text-sm">Ур. {player.level}</span>
                </div>

                <div className="flex items-center gap-2 bg-[#2d1810] px-3 py-2 rounded-lg border border-yellow-700">
                  <Icon name="Coins" className="text-yellow-500" size={18} />
                  <span className="text-yellow-400 font-bold text-sm">{player.money.toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2 bg-[#2d1810] px-3 py-2 rounded-lg border border-red-700">
                  <Icon name="Flame" className="text-red-500" size={18} />
                  <span className="text-red-400 font-bold text-sm">{player.authority}</span>
                </div>

                <div className="flex items-center gap-2 bg-[#2d1810] px-3 py-2 rounded-lg border border-orange-700">
                  <Icon name="Zap" className="text-orange-500" size={18} />
                  <span className="text-orange-400 font-bold text-sm">{player.energy}/{maxEnergy}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-yellow-300 text-xs md:text-sm min-w-[60px]">Опыт:</span>
                <Progress value={(player.experience / maxExperience) * 100} className="h-2 md:h-3 flex-1" />
                <span className="text-yellow-400 text-xs md:text-sm">{player.experience}/{maxExperience}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-300 text-xs md:text-sm min-w-[60px]">Здоровье:</span>
                <Progress value={(player.health / maxHealth) * 100} className="h-2 md:h-3 flex-1 [&>div]:bg-red-600" />
                <span className="text-red-400 text-xs md:text-sm">{player.health}/{maxHealth}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Основной контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Левая панель - Действия */}
          <Card className="bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2">
            <div className="p-3 border-b border-[#8b6f47]">
              <h3 className="text-yellow-400 font-bold text-center">⚡ Действия</h3>
            </div>
            <div className="p-3 space-y-2">
              <Button 
                className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700 justify-start"
                onClick={() => setShowShop(true)}
              >
                <Icon name="ShoppingBag" size={16} className="mr-2" />
                🏪 Магазин
              </Button>
              <Button 
                className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700 justify-start"
                onClick={() => setShowLeaderboard(true)}
              >
                <Icon name="Trophy" size={16} className="mr-2" />
                🏆 Рейтинг
              </Button>
              <Button 
                className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700 justify-start"
                onClick={() => startMiniGame('priatki')}
              >
                <Icon name="MapPin" size={16} className="mr-2" />
                🎯 Прятки
              </Button>
              <Button 
                className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700 justify-start"
                onClick={() => startMiniGame('bunt')}
              >
                <Icon name="Swords" size={16} className="mr-2" />
                ⚔️ Бунт
              </Button>
              <Button 
                className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700 justify-start"
                onClick={() => startMiniGame('cards')}
              >
                <Icon name="Dices" size={16} className="mr-2" />
                🃏 Карты
              </Button>
            </div>
          </Card>

          {/* Центр - Персонаж */}
          <Card className="bg-gradient-to-b from-[#4a3828] to-[#3d2817] border-[#8b6f47] border-2 relative overflow-hidden">
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, #000 20px, #000 22px)`
              }}
            />
            
            <div className="relative p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2">🔒 Камера №{player.id}</h2>
                <p className="text-yellow-300/70 text-sm">Ваше местоположение</p>
              </div>

              <div className="relative mb-6">
                <div className="w-48 h-48 bg-[#2d1810] rounded-lg border-4 border-[#8b6f47] flex items-center justify-center shadow-2xl">
                  <div className="text-8xl animate-pulse">👤</div>
                </div>
                <Badge className="absolute -top-3 -right-3 bg-yellow-600 text-white border-yellow-400 text-sm">
                  Уровень {player.level}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                <Button 
                  className="bg-red-800 hover:bg-red-700 text-white text-sm"
                  onClick={() => {
                    if (player.health < 100) {
                      setPlayer(prev => ({ ...prev, health: Math.min(prev.health + 20, 100) }));
                      toast({ title: '❤️ Здоровье восстановлено', description: '+20 HP' });
                    }
                  }}
                >
                  <Icon name="Heart" size={16} className="mr-1" />
                  Лечиться
                </Button>
                <Button 
                  className="bg-orange-800 hover:bg-orange-700 text-white text-sm"
                  onClick={() => {
                    if (player.energy < 100) {
                      setPlayer(prev => ({ ...prev, energy: Math.min(prev.energy + 30, 100) }));
                      toast({ title: '⚡ Энергия восстановлена', description: '+30 энергии' });
                    }
                  }}
                >
                  <Icon name="Coffee" size={16} className="mr-1" />
                  Отдохнуть
                </Button>
                <Button className="bg-blue-800 hover:bg-blue-700 text-white text-sm">
                  <Icon name="Shirt" size={16} className="mr-1" />
                  Одежда
                </Button>
              </div>
            </div>
          </Card>

          {/* Правая панель - Приказы */}
          <Card className="bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2">
            <div className="p-3 border-b border-[#8b6f47]">
              <h3 className="text-yellow-400 font-bold text-center">📋 Приказы</h3>
            </div>
            <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
              {orders.map(order => (
                <Card key={order.id} className="bg-[#2d1810] border-[#8b6f47] p-3 hover:bg-[#3d2817] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-yellow-400 font-bold text-sm">{order.title}</h4>
                    <Badge className={`${difficultyColors[order.difficulty]} text-white text-xs`}>
                      {difficultyEmoji[order.difficulty]}
                    </Badge>
                  </div>
                  <p className="text-yellow-300/70 text-xs mb-3">{order.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-400 font-bold">💰{order.reward_money}</span>
                      <span className="text-blue-400 font-bold">⭐{order.reward_exp}</span>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-green-700 hover:bg-green-600 text-white text-xs h-7"
                      onClick={() => handleCompleteOrder(order)}
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

        {/* Инвентарь */}
        <Card className="bg-gradient-to-r from-[#3d2817] to-[#5c3d2e] border-[#8b6f47] border-2">
          <div className="p-3">
            <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
              <Icon name="Backpack" size={20} />
              🎒 Инвентарь
            </h3>
            
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2 md:gap-3">
              {inventory.map(item => (
                <div
                  key={item.id}
                  className="relative bg-[#2d1810] border-2 border-[#8b6f47] rounded-lg p-2 hover:border-yellow-500 transition-colors cursor-pointer group"
                  onClick={() => handleUseItem(item)}
                >
                  <div className="text-2xl md:text-3xl text-center mb-1">{item.icon}</div>
                  <div className="text-yellow-300 text-[8px] md:text-[10px] text-center font-bold truncate">{item.name}</div>
                  {item.quantity > 1 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-600 text-white text-xs h-4 px-1">
                      {item.quantity}
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 rounded-lg transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Магазин */}
      <Dialog open={showShop} onOpenChange={setShowShop}>
        <DialogContent className="max-w-4xl bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 text-yellow-300">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-2xl">🏪 Магазин</DialogTitle>
            <DialogDescription className="text-yellow-300/70">
              Покупайте предметы для улучшения персонажа
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
            {shopItems.map(item => (
              <Card key={item.id} className="bg-[#2d1810] border-[#8b6f47] p-3">
                <div className="text-center mb-2">
                  <div className="text-4xl mb-2">{item.icon}</div>
                  <h4 className="text-yellow-400 font-bold text-sm">{item.name}</h4>
                  <p className="text-yellow-300/70 text-xs mb-2">{item.description}</p>
                  {item.effect_type !== 'none' && (
                    <Badge className="bg-blue-700 text-white text-xs mb-2">
                      +{item.effect_value} {item.effect_type}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-green-400 font-bold text-center">💰 {item.price}</span>
                  <Button 
                    size="sm" 
                    className="bg-green-700 hover:bg-green-600 text-white w-full"
                    onClick={() => handleBuyItem(item)}
                    disabled={player.money < item.price}
                  >
                    Купить
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Рейтинг */}
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
              <Card key={index} className={`bg-[#2d1810] border-[#8b6f47] p-3 flex items-center justify-between ${p.nickname === player.nickname ? 'border-yellow-500 border-2' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="text-2xl min-w-[40px]">
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

      {/* Мини-игры */}
      <Dialog open={showMiniGame} onOpenChange={setShowMiniGame}>
        <DialogContent className="max-w-lg bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 text-yellow-300">
          <DialogHeader>
            <DialogTitle className="text-yellow-400 text-2xl">
              {hideGame === 'priatki' && '🎯 Прятки'}
              {hideGame === 'bunt' && '⚔️ Бунт'}
              {hideGame === 'cards' && '🃏 Карточная игра'}
            </DialogTitle>
            <DialogDescription className="text-yellow-300/70">
              {hideGame === 'priatki' && 'Спрячьтесь от охраны и выживите!'}
              {hideGame === 'bunt' && 'Поднимите восстание в тюрьме!'}
              {hideGame === 'cards' && 'Сыграйте в карты на деньги!'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 p-4">
            <div className="text-center text-yellow-300">
              <p className="mb-4">Выберите свою стратегию:</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="bg-green-700 hover:bg-green-600 text-white h-20"
                  onClick={() => completeMiniGame(Math.random() > 0.3)}
                >
                  Рискованно<br/>+70% шанс
                </Button>
                <Button
                  className="bg-blue-700 hover:bg-blue-600 text-white h-20"
                  onClick={() => completeMiniGame(Math.random() > 0.5)}
                >
                  Безопасно<br/>50% шанс
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
