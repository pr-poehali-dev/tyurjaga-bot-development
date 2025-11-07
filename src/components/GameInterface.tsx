import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface PlayerStats {
  nickname: string;
  level: number;
  experience: number;
  maxExperience: number;
  money: number;
  authority: number;
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  role: 'prisoner' | 'guard';
}

interface InventoryItem {
  id: number;
  name: string;
  icon: string;
  quantity: number;
  type: string;
}

interface Order {
  id: number;
  title: string;
  description: string;
  reward: number;
  timeLeft: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function GameInterface() {
  const [player, setPlayer] = useState<PlayerStats>({
    nickname: 'Зэк по кличке [ЧМ]',
    level: 133,
    experience: 75000,
    maxExperience: 100000,
    money: 161601,
    authority: 4,
    energy: 81,
    maxEnergy: 100,
    health: 15474,
    maxHealth: 20000,
    role: 'prisoner'
  });

  const [inventory] = useState<InventoryItem[]>([
    { id: 1, name: 'Сигареты', icon: '🚬', quantity: 15, type: 'currency' },
    { id: 2, name: 'Чай', icon: '🫖', quantity: 8, type: 'food' },
    { id: 3, name: 'Карты', icon: '🃏', quantity: 1, type: 'game' },
    { id: 4, name: 'Телефон', icon: '📱', quantity: 1, type: 'contraband' },
    { id: 5, name: 'Тату машинка', icon: '💉', quantity: 1, type: 'tool' },
    { id: 6, name: 'Нычка', icon: '📦', quantity: 23, type: 'storage' },
    { id: 7, name: 'Самогон', icon: '🥃', quantity: 5, type: 'contraband' },
    { id: 8, name: 'Передача', icon: '📮', quantity: 3, type: 'food' }
  ]);

  const [orders] = useState<Order[]>([
    { id: 1, title: 'Встать в строй', description: 'Построиться на плацу за 5 минут', reward: 50, timeLeft: '4:32', difficulty: 'easy' },
    { id: 2, title: 'Передать нычку', description: 'Отнести посылку в 3-й барак', reward: 150, timeLeft: '12:15', difficulty: 'medium' },
    { id: 3, title: 'Спрятаться от обыска', description: 'Найти укромное место', reward: 200, timeLeft: '8:45', difficulty: 'hard' }
  ]);

  const [activeTab, setActiveTab] = useState<'orders' | 'actions' | 'clan'>('orders');

  const difficultyColors = {
    easy: 'bg-green-600',
    medium: 'bg-yellow-600',
    hard: 'bg-red-600'
  };

  return (
    <div className="h-screen flex flex-col p-2 gap-2">
      {/* Верхняя панель статистики */}
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
              <span className="text-orange-400 font-bold">{player.energy}/{player.maxEnergy}</span>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-yellow-300 text-sm min-w-[60px]">Опыт:</span>
            <Progress value={(player.experience / player.maxExperience) * 100} className="h-3 flex-1" />
            <span className="text-yellow-400 text-sm">{player.experience.toLocaleString()}/{player.maxExperience.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-red-300 text-sm min-w-[60px]">Здоровье:</span>
            <Progress value={(player.health / player.maxHealth) * 100} className="h-3 flex-1 [&>div]:bg-red-600" />
            <span className="text-red-400 text-sm">{player.health.toLocaleString()}/{player.maxHealth.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Основная игровая область */}
      <div className="flex-1 flex gap-2">
        {/* Левая боковая панель */}
        <Card className="w-64 bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 flex flex-col">
          <div className="p-3 border-b border-[#8b6f47]">
            <h3 className="text-yellow-400 font-bold text-center text-lg">⚡ Быстрые действия</h3>
          </div>
          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
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
              <Icon name="MessageSquare" size={18} className="mr-2" />
              Отправить послание
            </Button>
            <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700">
              <Icon name="Dices" size={18} className="mr-2" />
              Сыграть в карты
            </Button>
            <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 border border-yellow-700">
              <Icon name="ShoppingBag" size={18} className="mr-2" />
              Купить нычку
            </Button>
          </div>
        </Card>

        {/* Центральная область с персонажем */}
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
              <h2 className="text-4xl font-bold text-yellow-400 mb-2">🔒 Камера №133</h2>
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

        {/* Правая боковая панель */}
        <Card className="w-80 bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 flex flex-col">
          <div className="flex border-b border-[#8b6f47]">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 p-3 font-bold ${
                activeTab === 'orders' 
                  ? 'bg-[#5c3d2e] text-yellow-400' 
                  : 'text-yellow-300/60 hover:bg-[#3d2817]'
              }`}
            >
              📋 Приказы
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 p-3 font-bold ${
                activeTab === 'actions' 
                  ? 'bg-[#5c3d2e] text-yellow-400' 
                  : 'text-yellow-300/60 hover:bg-[#3d2817]'
              }`}
            >
              ⚡ Действия
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === 'orders' && orders.map(order => (
              <Card key={order.id} className="bg-[#2d1810] border-[#8b6f47] p-3 hover:bg-[#3d2817] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-yellow-400 font-bold">{order.title}</h4>
                  <Badge className={`${difficultyColors[order.difficulty]} text-white`}>
                    {order.timeLeft}
                  </Badge>
                </div>
                <p className="text-yellow-300/70 text-sm mb-3">{order.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-green-400 font-bold flex items-center gap-1">
                    <Icon name="Coins" size={16} />
                    +{order.reward}
                  </span>
                  <Button size="sm" className="bg-green-700 hover:bg-green-600 text-white">
                    Выполнить
                  </Button>
                </div>
              </Card>
            ))}

            {activeTab === 'actions' && (
              <div className="space-y-2">
                <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 justify-start">
                  <Icon name="UserPlus" size={18} className="mr-2" />
                  Пригласить в банду
                </Button>
                <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 justify-start">
                  <Icon name="Shield" size={18} className="mr-2" />
                  Защитить заключенного
                </Button>
                <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 justify-start">
                  <Icon name="Target" size={18} className="mr-2" />
                  Подставить противника
                </Button>
                <Button className="w-full bg-[#5c3d2e] hover:bg-[#6d4a38] text-yellow-300 justify-start">
                  <Icon name="Eye" size={18} className="mr-2" />
                  Следить за игроком
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Нижняя панель инвентаря */}
      <Card className="bg-gradient-to-r from-[#3d2817] to-[#5c3d2e] border-[#8b6f47] border-2">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-yellow-400 font-bold text-lg flex items-center gap-2">
              <Icon name="Backpack" size={20} />
              Инвентарь
            </h3>
            <Button size="sm" className="bg-yellow-700 hover:bg-yellow-600 text-white">
              Управление
            </Button>
          </div>
          
          <div className="grid grid-cols-8 gap-3">
            {inventory.map(item => (
              <div
                key={item.id}
                className="relative bg-[#2d1810] border-2 border-[#8b6f47] rounded-lg p-3 hover:border-yellow-500 transition-colors cursor-pointer group"
              >
                <div className="text-4xl text-center mb-1">{item.icon}</div>
                <div className="text-yellow-300 text-xs text-center font-bold">{item.name}</div>
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-600 text-white text-xs">
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
  );
}
