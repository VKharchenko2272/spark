CREATE DATABASE IF NOT EXISTS `sparkdb`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sparkdb`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `option_evaluation`;
DROP TABLE IF EXISTS `category_comment`;
DROP TABLE IF EXISTS `behavior`;
DROP TABLE IF EXISTS `evaluation_form`;
DROP TABLE IF EXISTS `topic`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `department`;

CREATE TABLE `department` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_department_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `manager_id` INT NULL,
  `email` VARCHAR(255) NULL,
  `hired_date` DATETIME NULL,
  `company_role` VARCHAR(255) NULL,
  `role` VARCHAR(32) NULL,
  `auth_version` INT NOT NULL DEFAULT 1,
  `username` VARCHAR(128) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `firstname` VARCHAR(128) NULL,
  `lastname` VARCHAR(128) NULL,
  `img` LONGBLOB NULL,
  `department_id` INT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_user_username` (`username`),
  UNIQUE KEY `ux_user_email` (`email`),
  KEY `ix_user_manager_id` (`manager_id`),
  KEY `ix_user_department_id` (`department_id`),
  CONSTRAINT `fk_user_manager` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_user_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `category` (
  `id` INT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `topic` (
  `id` INT NOT NULL,
  `category_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_topic_category_id` (`category_id`),
  CONSTRAINT `fk_topic_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `evaluation_form` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `created` DATETIME NULL,
  `department_id` INT NOT NULL,
  `manager_id` INT NOT NULL,
  `is_ready` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ix_evaluation_form_user_id` (`user_id`),
  KEY `ix_evaluation_form_department_id` (`department_id`),
  KEY `ix_evaluation_form_manager_id` (`manager_id`),
  CONSTRAINT `fk_evaluation_form_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_form_department` FOREIGN KEY (`department_id`) REFERENCES `department` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_evaluation_form_manager` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `behavior` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `text` TEXT NULL,
  `form_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_behavior_form_id` (`form_id`),
  CONSTRAINT `fk_behavior_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `category_comment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT NOT NULL,
  `comment` TEXT NULL,
  `form_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_category_comment_category_id` (`category_id`),
  KEY `ix_category_comment_form_id` (`form_id`),
  CONSTRAINT `fk_category_comment_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_category_comment_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `option_evaluation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `topic_id` INT NOT NULL,
  `comment` TEXT NULL,
  `score` INT NOT NULL,
  `form_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_option_evaluation_topic_id` (`topic_id`),
  KEY `ix_option_evaluation_form_id` (`form_id`),
  CONSTRAINT `fk_option_evaluation_topic` FOREIGN KEY (`topic_id`) REFERENCES `topic` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_option_evaluation_form` FOREIGN KEY (`form_id`) REFERENCES `evaluation_form` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `department` (`id`, `name`) VALUES
  (1, 'Engineering'),
  (2, 'Design'),
  (3, 'Operations');

INSERT INTO `category` (`id`) VALUES
  (1),
  (2),
  (3),
  (4),
  (5);

INSERT INTO `topic` (`id`, `category_id`) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (4, 1),
  (5, 1),
  (6, 2),
  (7, 2),
  (8, 2),
  (9, 2),
  (10, 2),
  (11, 3),
  (12, 3),
  (13, 3),
  (14, 4),
  (15, 4),
  (16, 4),
  (17, 4),
  (18, 5),
  (19, 5),
  (20, 5),
  (21, 5),
  (22, 5);

INSERT INTO `user` (
  `id`,
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
) VALUES
  (
    1,
    NULL,
    'admin@spark.local',
    '2024-01-15 09:00:00',
    'Engineering Director',
    'admin',
    'admin',
    '$2y$10$9sKfNYLr5zTmrZaJpLzBeutg1xwqjPJvvXiLyA7pa1vNSGNDaSt8a',
    1,
    'Admin',
    'User',
    1
  ),
  (
    2,
    1,
    'manager@spark.local',
    '2024-03-10 09:00:00',
    'Engineering Manager',
    'manager',
    'manager',
    '$2y$10$bbyDgi8zCRfRKwHN65qDkO8ks08/Z0cwCChECWfNMGi7f1BIs8MFi',
    0,
    'Marta',
    'Manager',
    1
  ),
  (
    3,
    2,
    'employee@spark.local',
    '2024-06-01 09:00:00',
    'Software Engineer',
    'employee',
    'employee',
    '$2y$10$Rg3AR6NEE/0ESAKXXFFU2.LlKaKTosAr8.V/jrgSHArTQ0WmbXn1y',
    0,
    'Evan',
    'Employee',
    1
  );

INSERT INTO `evaluation_form` (
  `id`,
  `user_id`,
  `created`,
  `department_id`,
  `manager_id`,
  `is_ready`
) VALUES
  (1, 3, '2026-03-15 10:00:00', 1, 2, 1);

INSERT INTO `behavior` (`id`, `text`, `form_id`) VALUES
  (1, 'Shows consistent ownership and communicates blockers early.', 1),
  (2, 'Collaborates well with the team and supports quality improvements.', 1);

INSERT INTO `category_comment` (`id`, `category_id`, `comment`, `form_id`) VALUES
  (1, 1, 'Strong teammate with dependable follow-through.', 1),
  (2, 2, 'Communication is clear and timely across the team.', 1),
  (3, 3, 'Makes thoughtful technical decisions and solves issues effectively.', 1),
  (4, 4, 'Code is readable and aligned with project conventions.', 1),
  (5, 5, 'Shows good testing and defensive programming habits.', 1);

INSERT INTO `option_evaluation` (`id`, `topic_id`, `comment`, `score`, `form_id`) VALUES
  (1, 1, 'Works well with peers.', 4, 1),
  (2, 2, 'Handles disagreement constructively.', 4, 1),
  (3, 3, 'Owns delivery and follows through.', 4, 1),
  (4, 4, 'Adapts quickly to shifting priorities.', 3, 1),
  (5, 5, 'Helps onboard others.', 3, 1),
  (6, 6, 'Engages consistently in discussions.', 4, 1),
  (7, 7, 'Communicates verbally with clarity.', 4, 1),
  (8, 8, 'Written updates are useful and concise.', 4, 1),
  (9, 9, 'Feedback is actionable.', 3, 1),
  (10, 10, 'Receives feedback professionally.', 4, 1),
  (11, 11, 'Thinks through tradeoffs.', 4, 1),
  (12, 12, 'Debugs issues methodically.', 4, 1),
  (13, 13, 'Uses tools appropriately.', 3, 1),
  (14, 14, 'Documentation is sufficient for handoff.', 3, 1),
  (15, 15, 'Formatting is consistent.', 4, 1),
  (16, 16, 'Names reflect intent.', 4, 1),
  (17, 17, 'Code structure is easy to navigate.', 4, 1),
  (18, 18, 'Tests core flows reliably.', 3, 1),
  (19, 19, 'Refactors when needed.', 3, 1),
  (20, 20, 'Handles edge cases thoughtfully.', 4, 1),
  (21, 21, 'Keeps performance in mind.', 3, 1),
  (22, 22, 'Applies secure defaults.', 4, 1);
