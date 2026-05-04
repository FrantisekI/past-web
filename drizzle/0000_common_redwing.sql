CREATE TABLE `survey_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`contestant_id` text NOT NULL,
	`email` text,
	`language` text NOT NULL,
	`answers` text NOT NULL,
	`created_at` integer
);
