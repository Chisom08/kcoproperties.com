ALTER TABLE `applications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `applications` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `contactMessages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `leases` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `leases` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `maintenanceRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `maintenanceRequests` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `properties` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `tourBookings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `tourBookings` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `units` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `units` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT now();--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT now();