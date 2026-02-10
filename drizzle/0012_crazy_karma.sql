ALTER TABLE `appointments` ADD `paymentMethod` enum('cash','pos','transfer','unpaid');--> statement-breakpoint
ALTER TABLE `appointments` ADD `paymentAmount` decimal(10,2);--> statement-breakpoint
ALTER TABLE `appointments` ADD `invoiceStatus` enum('pending','issued','sent') DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `appointments` ADD `invoiceNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `appointments` ADD `invoicedAt` timestamp;