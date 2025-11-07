-- Создание таблиц для игры Тюряга

-- Таблица игроков
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(255),
    nickname VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'prisoner',
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    money INTEGER DEFAULT 1000,
    authority INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 100,
    health INTEGER DEFAULT 100,
    clan_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица кланов
CREATE TABLE IF NOT EXISTS clans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    leader_id INTEGER REFERENCES players(id),
    territory VARCHAR(255),
    level INTEGER DEFAULT 1,
    money INTEGER DEFAULT 0,
    members_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица предметов
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    price INTEGER DEFAULT 0,
    effect_type VARCHAR(50),
    effect_value INTEGER DEFAULT 0
);

-- Таблица инвентаря игроков
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(player_id, item_id)
);

-- Таблица приказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'easy',
    duration_minutes INTEGER DEFAULT 30,
    reward_money INTEGER DEFAULT 50,
    reward_exp INTEGER DEFAULT 10,
    required_level INTEGER DEFAULT 1,
    active BOOLEAN DEFAULT TRUE
);

-- Таблица выполнения приказов
CREATE TABLE IF NOT EXISTS player_orders (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    order_id INTEGER REFERENCES orders(id),
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    reward_claimed BOOLEAN DEFAULT FALSE
);

-- Таблица игровых событий
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    initiator_id INTEGER REFERENCES players(id),
    target_id INTEGER,
    result VARCHAR(20),
    reward_money INTEGER DEFAULT 0,
    reward_exp INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица достижений
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    reward_money INTEGER DEFAULT 0,
    reward_exp INTEGER DEFAULT 0
);

-- Таблица достижений игроков
CREATE TABLE IF NOT EXISTS player_achievements (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    achievement_id INTEGER REFERENCES achievements(id),
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id, achievement_id)
);

-- Добавляем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_players_telegram_id ON players(telegram_id);
CREATE INDEX IF NOT EXISTS idx_players_clan_id ON players(clan_id);
CREATE INDEX IF NOT EXISTS idx_inventory_player_id ON inventory(player_id);
CREATE INDEX IF NOT EXISTS idx_player_orders_player_id ON player_orders(player_id);
CREATE INDEX IF NOT EXISTS idx_events_initiator_id ON events(initiator_id);

-- Вставляем начальные предметы
INSERT INTO items (name, description, type, icon, price, effect_type, effect_value) VALUES
('Сигареты', 'Тюремная валюта', 'currency', '🚬', 10, 'money', 10),
('Чай', 'Восстанавливает энергию', 'food', '🫖', 50, 'energy', 20),
('Карты', 'Для игры в дурака', 'game', '🃏', 100, 'none', 0),
('Телефон', 'Контрабанда', 'contraband', '📱', 500, 'authority', 5),
('Тату машинка', 'Инструмент', 'tool', '💉', 300, 'authority', 2),
('Нычка', 'Место для хранения', 'storage', '📦', 200, 'none', 0),
('Самогон', 'Контрабанда', 'contraband', '🥃', 150, 'authority', 3),
('Передача', 'Еда из дома', 'food', '📮', 80, 'health', 30)
ON CONFLICT DO NOTHING;

-- Вставляем начальные приказы
INSERT INTO orders (title, description, type, difficulty, duration_minutes, reward_money, reward_exp, required_level) VALUES
('Встать в строй', 'Построиться на плацу за 5 минут', 'discipline', 'easy', 5, 50, 10, 1),
('Передать нычку', 'Отнести посылку в 3-й барак', 'delivery', 'medium', 15, 150, 30, 5),
('Спрятаться от обыска', 'Найти укромное место', 'stealth', 'hard', 10, 200, 50, 10),
('Уборка камеры', 'Навести порядок в камере', 'work', 'easy', 20, 80, 15, 1),
('Караул на вышке', 'Дежурство 2 часа', 'guard', 'medium', 120, 300, 60, 15),
('Разнять драку', 'Остановить конфликт в столовой', 'combat', 'hard', 5, 250, 70, 20)
ON CONFLICT DO NOTHING;

-- Вставляем начальные достижения
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, reward_money, reward_exp) VALUES
('Новичок', 'Достигните 10 уровня', '🎖️', 'level', 10, 1000, 500),
('Авторитет', 'Наберите 50 авторитета', '👑', 'authority', 50, 2000, 1000),
('Богач', 'Накопите 100000 денег', '💰', 'money', 100000, 5000, 2000),
('Выживший', 'Выполните 100 приказов', '🏆', 'orders_completed', 100, 3000, 1500),
('Лидер', 'Создайте клан', '⭐', 'clan_created', 1, 1000, 500)
ON CONFLICT DO NOTHING;