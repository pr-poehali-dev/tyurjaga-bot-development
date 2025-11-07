import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = 'https://functions.poehali.dev/82f599ab-dbde-4e55-aedf-da43d7366a66';

interface Player {
  id: number;
  nickname: string;
  level: number;
  experience: number;
  money: number;
  authority: number;
  energy: number;
  health: number;
  attack: number;
  defense: number;
  reputation_title: string;
}

interface Boss {
  id: number;
  name: string;
  level: number;
  health: number;
  max_health: number;
  attack: number;
  defense: number;
  reward_money: number;
  reward_exp: number;
  icon: string;
}

interface Nychka {
  id: number;
  name: string;
  rarity: string;
  icon: string;
  bonus_type: string;
  bonus_value: number;
  collected: boolean;
}

interface Tattoo {
  id: number;
  name: string;
  body_part: string;
  price: number;
  authority_bonus: number;
  icon: string;
  unlock_level: number;
  owned: boolean;
}

interface YardActivity {
  id: number;
  name: string;
  activity_type: string;
  energy_cost: number;
  reward_money: number;
  reward_exp: number;
  icon: string;
}

const INITIAL_PLAYER: Player = {
  id: 1,
  nickname: 'Зэк по кличке [ЧМ]',
  level: 5,
  experience: 2500,
  money: 5000,
  authority: 10,
  energy: 85,
  health: 90,
  attack: 50,
  defense: 30,
  reputation_title: 'Мужик'
};

const BOSSES: Boss[] = [
  { id: 1, name: 'Главарь камеры', level: 10, health: 1000, max_health: 1000, attack: 150, defense: 50, reward_money: 1000, reward_exp: 500, icon: '💪' },
  { id: 2, name: 'Смотрящий', level: 25, health: 2500, max_health: 2500, attack: 300, defense: 100, reward_money: 2500, reward_exp: 1200, icon: '👁️' },
  { id: 3, name: 'Вор в законе', level: 50, health: 5000, max_health: 5000, attack: 500, defense: 200, reward_money: 5000, reward_exp: 2500, icon: '👑' },
  { id: 4, name: 'Комендант', level: 75, health: 10000, max_health: 10000, attack: 750, defense: 300, reward_money: 10000, reward_exp: 5000, icon: '🛡️' }
];

const NYCHKI: Nychka[] = [
  { id: 1, name: 'Старая ложка', rarity: 'common', icon: '🥄', bonus_type: 'money', bonus_value: 10, collected: false },
  { id: 2, name: 'Золотые часы', rarity: 'rare', icon: '⌚', bonus_type: 'authority', bonus_value: 5, collected: false },
  { id: 3, name: 'Мобильник Nokia', rarity: 'rare', icon: '📱', bonus_type: 'authority', bonus_value: 10, collected: false },
  { id: 4, name: 'Заточка', rarity: 'epic', icon: '🔪', bonus_type: 'attack', bonus_value: 20, collected: false },
  { id: 5, name: 'Ключи от камеры', rarity: 'legendary', icon: '🗝️', bonus_type: 'authority', bonus_value: 25, collected: false }
];

const TATTOOS: Tattoo[] = [
  { id: 1, name: 'Звезды на плечах', body_part: 'Плечи', price: 500, authority_bonus: 5, icon: '⭐', unlock_level: 5, owned: false },
  { id: 2, name: 'Тигр на груди', body_part: 'Грудь', price: 1000, authority_bonus: 10, icon: '🐯', unlock_level: 10, owned: false },
  { id: 3, name: 'Купола на спине', body_part: 'Спина', price: 1500, authority_bonus: 15, icon: '⛪', unlock_level: 15, owned: false },
  { id: 4, name: 'Змея на руке', body_part: 'Рука', price: 800, authority_bonus: 8, icon: '🐍', unlock_level: 8, owned: false }
];

const YARD_ACTIVITIES: YardActivity[] = [
  { id: 1, name: 'Качалка', activity_type: 'workout', energy_cost: 20, reward_money: 50, reward_exp: 20, icon: '💪' },
  { id: 2, name: 'Карточная игра', activity_type: 'gambling', energy_cost: 15, reward_money: 150, reward_exp: 30, icon: '🎴' },
  { id: 3, name: 'Торговля', activity_type: 'trading', energy_cost: 10, reward_money: 200, reward_exp: 15, icon: '💼' },
  { id: 4, name: 'Драка', activity_type: 'fight', energy_cost: 30, reward_money: 100, reward_exp: 50, icon: '👊' },
  { id: 5, name: 'Прогулка', activity_type: 'rest', energy_cost: 5, reward_money: 20, reward_exp: 10, icon: '🚶' }
];

export default function FullGameInterface() {
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [bosses, setBosses] = useState<Boss[]>(BOSSES);
  const [nychki, setNychki] = useState<Nychka[]>(NYCHKI);
  const [tattoos, setTattoos] = useState<Tattoo[]>(TATTOOS);
  const [currentBoss, setCurrentBoss] = useState<Boss | null>(null);
  const [activeSection, setActiveSection] = useState<'main' | 'bosses' | 'nychki' | 'tattoos' | 'yard'>('main');

  const updateReputationTitle = (authority: number) => {
    if (authority >= 150) return 'Вор в законе 👑';
    if (authority >= 100) return 'Блатной 💎';
    if (authority >= 75) return 'Козырный 🎴';
    if (authority >= 50) return 'Шерстяной 🧥';
    if (authority >= 25) return 'Бродяга 🎒';
    if (authority >= 10) return 'Мужик 👤';
    return 'Петух 🐔';
  };

  const rarityColors: Record<string, string> = {
    common: 'bg-gray-600',
    rare: 'bg-blue-600',
    epic: 'bg-purple-600',
    legendary: 'bg-orange-600'
  };

  const handleBossAttack = (boss: Boss) => {
    if (player.energy < 30) {
      toast({ title: '❌ Недостаточно энергии', description: 'Нужно 30 энергии', variant: 'destructive' });
      return;
    }

    const damage = Math.max(player.attack - boss.defense, 10);
    const newBossHealth = Math.max(boss.health - damage, 0);
    
    setBosses(prev => prev.map(b => 
      b.id === boss.id ? { ...b, health: newBossHealth } : b
    ));

    setPlayer(prev => ({ ...prev, energy: prev.energy - 30 }));

    if (newBossHealth === 0) {
      const newMoney = player.money + boss.reward_money;
      const newExp = player.experience + boss.reward_exp;
      const maxExp = player.level * 1000;
      const levelUp = newExp >= maxExp;

      setPlayer(prev => ({
        ...prev,
        money: newMoney,
        experience: levelUp ? newExp - maxExp : newExp,
        level: levelUp ? prev.level + 1 : prev.level,
        authority: prev.authority + 5
      }));

      toast({
        title: '🎉 Босс побежден!',
        description: `+${boss.reward_money}💰 +${boss.reward_exp}⭐ +5🔥${levelUp ? ' 🎊 Новый уровень!' : ''}`,
      });

      setTimeout(() => {
        setBosses(prev => prev.map(b => 
          b.id === boss.id ? { ...b, health: b.max_health } : b
        ));
      }, 5000);

      setCurrentBoss(null);
    } else {
      toast({ title: `💥 Урон: ${damage}`, description: `У босса осталось ${newBossHealth} HP` });
    }
  };

  const handleCollectNychka = (nychka: Nychka) => {
    const chance = Math.random();
    const success = (nychka.rarity === 'legendary' && chance > 0.95) ||
                   (nychka.rarity === 'epic' && chance > 0.8) ||
                   (nychka.rarity === 'rare' && chance > 0.6) ||
                   chance > 0.4;

    if (!success) {
      toast({ title: '❌ Не повезло', description: 'Попробуйте еще раз!', variant: 'destructive' });
      return;
    }

    setNychki(prev => prev.map(n => 
      n.id === nychka.id ? { ...n, collected: true } : n
    ));

    const updates: Partial<Player> = {};
    if (nychka.bonus_type === 'money') updates.money = player.money + nychka.bonus_value;
    if (nychka.bonus_type === 'authority') updates.authority = player.authority + nychka.bonus_value;
    if (nychka.bonus_type === 'attack') updates.attack = player.attack + nychka.bonus_value;

    setPlayer(prev => ({ ...prev, ...updates }));

    toast({
      title: '✅ Нычка найдена!',
      description: `${nychka.icon} ${nychka.name}: +${nychka.bonus_value} ${nychka.bonus_type}`,
    });
  };

  const handleBuyTattoo = (tattoo: Tattoo) => {
    if (player.level < tattoo.unlock_level) {
      toast({ title: '❌ Недостаточный уровень', description: `Нужен ${tattoo.unlock_level} уровень`, variant: 'destructive' });
      return;
    }

    if (player.money < tattoo.price) {
      toast({ title: '❌ Недостаточно денег', description: `Нужно ${tattoo.price}💰`, variant: 'destructive' });
      return;
    }

    setTattoos(prev => prev.map(t => 
      t.id === tattoo.id ? { ...t, owned: true } : t
    ));

    setPlayer(prev => ({
      ...prev,
      money: prev.money - tattoo.price,
      authority: prev.authority + tattoo.authority_bonus
    }));

    toast({
      title: '✅ Наколка набита!',
      description: `${tattoo.icon} ${tattoo.name}: +${tattoo.authority_bonus}🔥`,
    });
  };

  const handleYardActivity = (activity: YardActivity) => {
    if (player.energy < activity.energy_cost) {
      toast({ title: '❌ Недостаточно энергии', description: `Нужно ${activity.energy_cost} энергии`, variant: 'destructive' });
      return;
    }

    const success = Math.random() > 0.3;

    setPlayer(prev => ({ ...prev, energy: prev.energy - activity.energy_cost }));

    if (success) {
      const newExp = player.experience + activity.reward_exp;
      const maxExp = player.level * 1000;
      const levelUp = newExp >= maxExp;

      setPlayer(prev => ({
        ...prev,
        money: prev.money + activity.reward_money,
        experience: levelUp ? newExp - maxExp : newExp,
        level: levelUp ? prev.level + 1 : prev.level
      }));

      toast({
        title: '✅ Успех!',
        description: `${activity.icon} ${activity.name}: +${activity.reward_money}💰 +${activity.reward_exp}⭐`,
      });
    } else {
      toast({ title: '❌ Неудача', description: 'Попробуйте еще раз!', variant: 'destructive' });
    }
  };

  useEffect(() => {
    const newTitle = updateReputationTitle(player.authority);
    if (newTitle !== player.reputation_title) {
      setPlayer(prev => ({ ...prev, reputation_title: newTitle }));
      toast({ title: '🎖️ Новый статус!', description: newTitle });
    }
  }, [player.authority]);

  const maxExperience = player.level * 1000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1410] to-[#2d1810] p-2">
      <div className="max-w-[1600px] mx-auto space-y-3">
        {/* Header */}
        <Card className="bg-gradient-to-r from-[#3d2817] to-[#5c3d2e] border-[#8b6f47] border-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-16 h-16 border-2 border-yellow-500">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=prisoner" />
                  <AvatarFallback>ЗК</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-yellow-400 font-bold text-xl">{player.nickname}</div>
                  <Badge className="bg-red-900 border-red-700">{player.reputation_title}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-3">
                <div className="bg-[#2d1810] px-3 py-2 rounded-lg border border-yellow-700 text-center">
                  <div className="text-yellow-300 text-xs">Уровень</div>
                  <div className="text-yellow-400 font-bold">{player.level}</div>
                </div>
                <div className="bg-[#2d1810] px-3 py-2 rounded-lg border border-yellow-700 text-center">
                  <div className="text-yellow-300 text-xs">Деньги</div>
                  <div className="text-yellow-400 font-bold">{player.money}</div>
                </div>
                <div className="bg-[#2d1810] px-3 py-2 rounded-lg border border-red-700 text-center">
                  <div className="text-red-300 text-xs">Авторитет</div>
                  <div className="text-red-400 font-bold">{player.authority}</div>
                </div>
                <div className="bg-[#2d1810] px-3 py-2 rounded-lg border border-orange-700 text-center">
                  <div className="text-orange-300 text-xs">Энергия</div>
                  <div className="text-orange-400 font-bold">{player.energy}</div>
                </div>
                <div className="bg-[#2d1810] px-3 py-2 rounded-lg border border-green-700 text-center">
                  <div className="text-green-300 text-xs">Здоровье</div>
                  <div className="text-green-400 font-bold">{player.health}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-yellow-300 text-xs mb-1">Опыт</div>
                <Progress value={(player.experience / maxExperience) * 100} className="h-2" />
              </div>
              <div>
                <div className="text-red-300 text-xs mb-1">Атака: {player.attack}</div>
                <Progress value={(player.attack / 200) * 100} className="h-2 [&>div]:bg-red-600" />
              </div>
              <div>
                <div className="text-blue-300 text-xs mb-1">Защита: {player.defense}</div>
                <Progress value={(player.defense / 200) * 100} className="h-2 [&>div]:bg-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="grid grid-cols-5 gap-2">
          <Button 
            onClick={() => setActiveSection('main')}
            className={`${activeSection === 'main' ? 'bg-yellow-700' : 'bg-[#5c3d2e]'} hover:bg-yellow-600`}
          >
            🏠 Камера
          </Button>
          <Button 
            onClick={() => setActiveSection('bosses')}
            className={`${activeSection === 'bosses' ? 'bg-yellow-700' : 'bg-[#5c3d2e]'} hover:bg-yellow-600`}
          >
            💪 Боссы
          </Button>
          <Button 
            onClick={() => setActiveSection('nychki')}
            className={`${activeSection === 'nychki' ? 'bg-yellow-700' : 'bg-[#5c3d2e]'} hover:bg-yellow-600`}
          >
            📦 Нычки
          </Button>
          <Button 
            onClick={() => setActiveSection('tattoos')}
            className={`${activeSection === 'tattoos' ? 'bg-yellow-700' : 'bg-[#5c3d2e]'} hover:bg-yellow-600`}
          >
            ⭐ Наколки
          </Button>
          <Button 
            onClick={() => setActiveSection('yard')}
            className={`${activeSection === 'yard' ? 'bg-yellow-700' : 'bg-[#5c3d2e]'} hover:bg-yellow-600`}
          >
            🏃 Двор
          </Button>
        </div>

        {/* Content */}
        {activeSection === 'main' && (
          <Card className="bg-gradient-to-b from-[#4a3828] to-[#3d2817] border-[#8b6f47] border-2 p-8">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">👤</div>
              <h2 className="text-3xl text-yellow-400 font-bold mb-2">Камера №{player.id}</h2>
              <p className="text-yellow-300/70">Выберите раздел для продолжения игры</p>
            </div>
          </Card>
        )}

        {activeSection === 'bosses' && (
          <Card className="bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 p-4">
            <h2 className="text-2xl text-yellow-400 font-bold mb-4">💪 Боссы тюрьмы</h2>
            <div className="grid grid-cols-2 gap-4">
              {bosses.map(boss => (
                <Card key={boss.id} className="bg-[#2d1810] border-[#8b6f47] p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-5xl">{boss.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-yellow-400 font-bold text-lg">{boss.name}</h3>
                      <Badge className="bg-purple-700">Уровень {boss.level}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-red-300">HP:</span>
                        <span className="text-red-400">{boss.health}/{boss.max_health}</span>
                      </div>
                      <Progress value={(boss.health / boss.max_health) * 100} className="h-3 [&>div]:bg-red-600" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-orange-300">⚔️ Атака: {boss.attack}</div>
                      <div className="text-blue-300">🛡️ Защита: {boss.defense}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-green-300">💰 {boss.reward_money}</div>
                      <div className="text-yellow-300">⭐ {boss.reward_exp}</div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-red-700 hover:bg-red-600"
                    onClick={() => handleBossAttack(boss)}
                    disabled={boss.health === 0 || player.energy < 30}
                  >
                    {boss.health === 0 ? '💀 Повержен' : '⚔️ Атаковать (30⚡)'}
                  </Button>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {activeSection === 'nychki' && (
          <Card className="bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 p-4">
            <h2 className="text-2xl text-yellow-400 font-bold mb-4">📦 Коллекция нычек</h2>
            <div className="grid grid-cols-5 gap-3">
              {nychki.map(nychka => (
                <Card key={nychka.id} className={`bg-[#2d1810] border-2 p-3 ${nychka.collected ? 'border-green-600' : 'border-[#8b6f47]'}`}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">{nychka.icon}</div>
                    <Badge className={`${rarityColors[nychka.rarity]} mb-2`}>{nychka.rarity}</Badge>
                    <div className="text-yellow-300 text-xs font-bold mb-2">{nychka.name}</div>
                    <div className="text-green-400 text-xs mb-2">+{nychka.bonus_value} {nychka.bonus_type}</div>
                    <Button
                      size="sm"
                      className="w-full bg-green-700 hover:bg-green-600"
                      onClick={() => handleCollectNychka(nychka)}
                      disabled={nychka.collected}
                    >
                      {nychka.collected ? '✅ Собрано' : '🔍 Искать'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {activeSection === 'tattoos' && (
          <Card className="bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 p-4">
            <h2 className="text-2xl text-yellow-400 font-bold mb-4">⭐ Тюремные наколки</h2>
            <div className="grid grid-cols-4 gap-4">
              {tattoos.map(tattoo => (
                <Card key={tattoo.id} className={`bg-[#2d1810] border-2 p-4 ${tattoo.owned ? 'border-green-600' : 'border-[#8b6f47]'}`}>
                  <div className="text-center">
                    <div className="text-5xl mb-2">{tattoo.icon}</div>
                    <h3 className="text-yellow-400 font-bold text-sm mb-1">{tattoo.name}</h3>
                    <div className="text-yellow-300/70 text-xs mb-2">{tattoo.body_part}</div>
                    <Badge className="bg-purple-700 mb-2">Уровень {tattoo.unlock_level}</Badge>
                    <div className="text-red-400 text-sm mb-2">+{tattoo.authority_bonus}🔥 авторитет</div>
                    <div className="text-green-400 text-sm mb-3">Цена: {tattoo.price}💰</div>
                    <Button
                      size="sm"
                      className="w-full bg-purple-700 hover:bg-purple-600"
                      onClick={() => handleBuyTattoo(tattoo)}
                      disabled={tattoo.owned || player.level < tattoo.unlock_level || player.money < tattoo.price}
                    >
                      {tattoo.owned ? '✅ Набита' : '💉 Набить'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {activeSection === 'yard' && (
          <Card className="bg-gradient-to-b from-[#3d2817] to-[#2d1810] border-[#8b6f47] border-2 p-4">
            <h2 className="text-2xl text-yellow-400 font-bold mb-4">🏃 Тюремный двор</h2>
            <div className="grid grid-cols-5 gap-4">
              {YARD_ACTIVITIES.map(activity => (
                <Card key={activity.id} className="bg-[#2d1810] border-[#8b6f47] p-4">
                  <div className="text-center">
                    <div className="text-5xl mb-2">{activity.icon}</div>
                    <h3 className="text-yellow-400 font-bold mb-2">{activity.name}</h3>
                    <div className="text-orange-400 text-sm mb-2">⚡ {activity.energy_cost}</div>
                    <div className="text-green-400 text-xs mb-1">💰 {activity.reward_money}</div>
                    <div className="text-blue-400 text-xs mb-3">⭐ {activity.reward_exp}</div>
                    <Button
                      size="sm"
                      className="w-full bg-orange-700 hover:bg-orange-600"
                      onClick={() => handleYardActivity(activity)}
                      disabled={player.energy < activity.energy_cost}
                    >
                      Начать
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
