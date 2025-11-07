-- Добавляем демо игрока для тестирования

INSERT INTO players (telegram_id, username, nickname, level, experience, money, authority, energy, health, role)
VALUES (NULL, 'demo_player', 'Зэк по кличке [ЧМ]', 133, 75000, 161601, 4, 81, 100, 'prisoner')
ON CONFLICT DO NOTHING;

-- Добавляем предметы в инвентарь демо игрока
INSERT INTO inventory (player_id, item_id, quantity)
SELECT 1, id, 
  CASE 
    WHEN id = 1 THEN 15
    WHEN id = 2 THEN 8
    WHEN id = 6 THEN 23
    WHEN id = 7 THEN 5
    WHEN id = 8 THEN 3
    ELSE 1
  END
FROM items
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8)
ON CONFLICT DO NOTHING;
