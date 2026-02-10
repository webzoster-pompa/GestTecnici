CREATE TABLE `whatsapp_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`message` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whatsapp_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointments` ADD `sendWhatsAppReminder` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `whatsappTemplateId` int;--> statement-breakpoint
ALTER TABLE `appointments` ADD `whatsappReminderSent` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `appointments` ADD `whatsappReminderSentAt` timestamp;