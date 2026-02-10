ALTER TABLE `appointments` ADD `signatureUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `appointments` ADD `signedAt` timestamp;--> statement-breakpoint
ALTER TABLE `technicians` ADD `pushToken` varchar(255);