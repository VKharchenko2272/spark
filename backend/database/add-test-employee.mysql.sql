USE `sparkdb`;

INSERT INTO `user` (
  `manager_id`,
  `email`,
  `hired_date`,
  `company_role`,
  `role`,
  `username`,
  `password`,
  `is_admin`,
  `firstname`,
  `lastname`,
  `department_id`
)
SELECT
  2,
  'employee2@spark.local',
  '2026-03-15 09:00:00',
  'Software Engineer',
  'employee',
  'employee2',
  '$2y$10$Rg3AR6NEE/0ESAKXXFFU2.LlKaKTosAr8.V/jrgSHArTQ0WmbXn1y',
  0,
  'Elena',
  'Tester',
  1
WHERE NOT EXISTS (
  SELECT 1
  FROM `user`
  WHERE `username` = 'employee2'
);

SELECT
  `id`,
  `username`,
  `firstname`,
  `lastname`,
  `role`,
  `manager_id`,
  `department_id`
FROM `user`
WHERE `username` = 'employee2';
