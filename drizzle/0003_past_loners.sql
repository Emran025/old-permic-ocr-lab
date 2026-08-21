CREATE TABLE `annotation_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`origin` enum('source_library','upload') NOT NULL,
	`sourceLibraryId` varchar(180),
	`originalFilename` varchar(255) NOT NULL,
	`imageKey` varchar(512),
	`imageUrl` text NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sourceTitle` varchar(255) NOT NULL,
	`repositoryId` varchar(255) NOT NULL,
	`folioOrPage` varchar(255) NOT NULL,
	`sourceUrl` text NOT NULL,
	`rightsBasis` text NOT NULL,
	`oldPermicVisible` boolean NOT NULL DEFAULT true,
	`split` enum('unassigned','train','val','test') NOT NULL DEFAULT 'unassigned',
	`annotationStatus` enum('in_progress','needs_review','reviewed','approved','excluded') NOT NULL DEFAULT 'in_progress',
	`boxes` json NOT NULL,
	`notes` text,
	`imageWidth` int,
	`imageHeight` int,
	`reviewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annotation_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `annotation_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `annotation_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `annotation_images_project_idx` ON `annotation_images` (`projectId`);--> statement-breakpoint
CREATE INDEX `annotation_images_user_idx` ON `annotation_images` (`userId`);--> statement-breakpoint
CREATE INDEX `annotation_images_project_status_idx` ON `annotation_images` (`projectId`,`annotationStatus`);--> statement-breakpoint
CREATE INDEX `annotation_projects_user_idx` ON `annotation_projects` (`userId`);