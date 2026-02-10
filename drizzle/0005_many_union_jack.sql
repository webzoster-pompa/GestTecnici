CREATE TABLE `technician_absences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`technicianId` int NOT NULL,
	`date` datetime NOT NULL,
	`type` enum('vacation','sick','leave') NOT NULL,
	`startTime` varchar(5),
	`endTime` varchar(5),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `technician_absences_id` PRIMARY KEY(`id`)
);
