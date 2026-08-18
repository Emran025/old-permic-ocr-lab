CREATE TABLE `analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`originalFilename` varchar(255) NOT NULL,
	`imageKey` varchar(512) NOT NULL,
	`imageUrl` text NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`status` enum('pending','model_not_configured','completed','failed') NOT NULL DEFAULT 'pending',
	`extractedText` text,
	`detections` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `analyses_id` PRIMARY KEY(`id`)
);
