CREATE TABLE `time_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`technicianId` int NOT NULL,
	`date` datetime NOT NULL,
	`type` enum('start_day','start_break','end_break','end_day') NOT NULL,
	`timestamp` datetime NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`isRemote` boolean NOT NULL DEFAULT false,
	`remoteReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `time_entries_id` PRIMARY KEY(`id`)
);
