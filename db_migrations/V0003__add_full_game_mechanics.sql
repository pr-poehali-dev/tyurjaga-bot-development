-- Расширение игры "Тюряга" - полные механики

-- Таблица боссов
CREATE TABLE IF NOT EXISTS bosses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL,
    health INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    reward_money INTEGER DEFAULT 0,
    reward_exp INTEGER DEFAULT 0,
    icon VARCHAR(10),
    respawn_hours INTEGER DEFAULT 24
);

-- Таблица рейдов на боссов
CREATE TABLE IF NOT EXISTS boss_raids (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    boss_id INTEGER REFERENCES bosses(id),
    damage_dealt INTEGER DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    raid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица коллекций нычек
CREATE TABLE IF NOT EXISTS nychki_collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rarity VARCHAR(50) DEFAULT 'common',
    icon VARCHAR(10),
    bonus_type VARCHAR(50),
    bonus_value INTEGER DEFAULT 0
);

-- Связь игроков и нычек
CREATE TABLE IF NOT EXISTS player_nychki (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    nychka_id INTEGER REFERENCES nychki_collections(id),
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, nychka_id)
);

-- Таблица наколок (татуировок)
CREATE TABLE IF NOT EXISTS tattoos (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    body_part VARCHAR(50),
    price INTEGER DEFAULT 0,
    authority_bonus INTEGER DEFAULT 0,
    icon VARCHAR(10),
    unlock_level INTEGER DEFAULT 1
);

-- Связь игроков и наколок
CREATE TABLE IF NOT EXISTS player_tattoos (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    tattoo_id INTEGER REFERENCES tattoos(id),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, tattoo_id)
);

-- Таблица тюремного двора
CREATE TABLE IF NOT EXISTS prison_yard (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50),
    energy_cost INTEGER DEFAULT 10,
    reward_money INTEGER DEFAULT 0,
    reward_exp INTEGER DEFAULT 0,
    cooldown_minutes INTEGER DEFAULT 60
);

-- История активностей игроков
CREATE TABLE IF NOT EXISTS player_activities (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    yard_id INTEGER REFERENCES prison_yard(id),
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reward_claimed BOOLEAN DEFAULT FALSE
);

-- Таблица авторитетов (репутация)
CREATE TABLE IF NOT EXISTS reputation_levels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    min_authority INTEGER NOT NULL,
    description TEXT,
    perks TEXT,
    icon VARCHAR(10)
);

-- Таблица банд/кланов (расширенная)
ALTER TABLE clans ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0;
ALTER TABLE clans ADD COLUMN IF NOT EXISTS wins INTEGER DEFAULT 0;
ALTER TABLE clans ADD COLUMN IF NOT EXISTS losses INTEGER DEFAULT 0;
ALTER TABLE clans ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '⚔️';

-- Таблица войн между кланами
CREATE TABLE IF NOT EXISTS clan_wars (
    id SERIAL PRIMARY KEY,
    attacker_clan_id INTEGER REFERENCES clans(id),
    defender_clan_id INTEGER REFERENCES clans(id),
    winner_clan_id INTEGER,
    war_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    war_end TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active'
);

-- Добавление боссов
INSERT INTO bosses (name, description, level, health, attack, defense, reward_money, reward_exp, icon) VALUES
('Главарь камеры', 'Самый сильный в блоке', 10, 1000, 150, 50, 1000, 500, '💪'),
('Смотрящий', 'Контролирует весь корпус', 25, 2500, 300, 100, 2500, 1200, '👁️'),
('Вор в законе', 'Легендарный авторитет', 50, 5000, 500, 200, 5000, 2500, '👑'),
('Комендант', 'Глава тюрьмы', 75, 10000, 750, 300, 10000, 5000, '🛡️');

-- Добавление нычек
INSERT INTO nychki_collections (name, description, rarity, icon, bonus_type, bonus_value) VALUES
('Старая ложка', 'Может пригодиться', 'common', '🥄', 'money', 10),
('Золотые часы', 'Контрабанда', 'rare', '⌚', 'authority', 5),
('Мобильник Nokia', 'Неубиваемый', 'rare', '📱', 'authority', 10),
('Заточка', 'Опасное оружие', 'epic', '🔪', 'attack', 20),
('Ключи от камеры', 'Очень ценная находка', 'legendary', '🗝️', 'authority', 25),
('Портрет Ленина', 'Раритет', 'common', '🖼️', 'money', 50),
('Самогонный аппарат', 'Бизнес', 'epic', '🧪', 'money', 100);

-- Добавление наколок
INSERT INTO tattoos (name, description, body_part, price, authority_bonus, icon, unlock_level) VALUES
('Звезды на плечах', 'Знак авторитета', 'shoulders', 500, 5, '⭐', 5),
('Тигр на груди', 'Символ силы', 'chest', 1000, 10, '🐯', 10),
('Купола на спине', 'Количество ходок', 'back', 1500, 15, '⛪', 15),
('Змея на руке', 'Знак мудрости', 'arm', 800, 8, '🐍', 8),
('Череп', 'Символ бесстрашия', 'hand', 1200, 12, '💀', 12),
('Паутина на локте', 'Годы в тюрьме', 'elbow', 2000, 20, '🕸️', 20);

-- Добавление активностей во дворе
INSERT INTO prison_yard (name, description, activity_type, energy_cost, reward_money, reward_exp, cooldown_minutes) VALUES
('Качалка', 'Подкачать мышцы', 'workout', 20, 50, 20, 120),
('Карточная игра', 'Попытать удачу', 'gambling', 15, 150, 30, 60),
('Торговля', 'Продать контрабанду', 'trading', 10, 200, 15, 90),
('Драка', 'Показать кто тут главный', 'fight', 30, 100, 50, 180),
('Прогулка', 'Отдохнуть и подышать', 'rest', 5, 20, 10, 30);

-- Добавление уровней авторитета
INSERT INTO reputation_levels (name, min_authority, description, perks, icon) VALUES
('Петух', 0, 'Самая низкая каста', 'Нет привилегий', '🐔'),
('Мужик', 10, 'Обычный заключенный', 'Доступ к базовым активностям', '👤'),
('Бродяга', 25, 'Опытный сиделец', 'Скидки в магазине 10%', '🎒'),
('Шерстяной', 50, 'Уважаемый зэк', 'Скидки 20%, доступ к особым заданиям', '🧥'),
('Козырный', 75, 'Авторитетный', 'Скидки 30%, может создавать кланы', '🎴'),
('Блатной', 100, 'Очень влиятельный', 'Скидки 40%, особые привилегии', '💎'),
('Вор в законе', 150, 'Легенда тюрьмы', 'Максимальные привилегии', '👑');

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_boss_raids_player ON boss_raids(player_id);
CREATE INDEX IF NOT EXISTS idx_player_nychki_player ON player_nychki(player_id);
CREATE INDEX IF NOT EXISTS idx_player_tattoos_player ON player_tattoos(player_id);
CREATE INDEX IF NOT EXISTS idx_player_activities_player ON player_activities(player_id);
CREATE INDEX IF NOT EXISTS idx_clan_wars_clans ON clan_wars(attacker_clan_id, defender_clan_id);
