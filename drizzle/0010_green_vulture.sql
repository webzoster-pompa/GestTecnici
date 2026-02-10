ALTER TABLE `appointments` ADD `checkInTime` timestamp;--> statement-breakpoint
ALTER TABLE `appointments` ADD `checkInLatitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `appointments` ADD `checkInLongitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `appointments` ADD `checkOutTime` timestamp;--> statement-breakpoint
ALTER TABLE `appointments` ADD `checkOutLatitude` decimal(10,8);--> statement-breakpoint
ALTER TABLE `appointments` ADD `checkOutLongitude` decimal(11,8);--> statement-breakpoint
ALTER TABLE `appointments` ADD `actualDuration` int;