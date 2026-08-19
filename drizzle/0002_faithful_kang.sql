CREATE TABLE `training_releases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`releaseId` varchar(180) NOT NULL,
	`sourceCommit` varchar(64) NOT NULL,
	`modelScope` varchar(180) NOT NULL,
	`publicationStatus` varchar(64) NOT NULL,
	`realManuscriptOcrValidated` boolean NOT NULL DEFAULT false,
	`releaseUrl` text NOT NULL,
	`releaseSha256` varchar(64) NOT NULL,
	`metrics` json NOT NULL,
	`dataContract` json NOT NULL,
	`assets` json NOT NULL,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_releases_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_releases_releaseId_unique` UNIQUE(`releaseId`)
);
--> statement-breakpoint
CREATE TABLE `training_sync_states` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stateKey` varchar(96) NOT NULL,
	`repository` varchar(255) NOT NULL,
	`branch` varchar(128) NOT NULL,
	`pointerPath` varchar(512) NOT NULL,
	`scheduleCronTaskUid` varchar(65),
	`lastPointerSha256` varchar(64),
	`lastReleaseId` varchar(180),
	`lastCheckedAt` timestamp,
	`lastSuccessAt` timestamp,
	`lastError` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `training_sync_states_id` PRIMARY KEY(`id`),
	CONSTRAINT `training_sync_states_stateKey_unique` UNIQUE(`stateKey`),
	CONSTRAINT `training_sync_states_scheduleCronTaskUid_unique` UNIQUE(`scheduleCronTaskUid`)
);
