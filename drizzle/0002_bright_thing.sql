CREATE TABLE `tourBookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`tourDate` varchar(20) NOT NULL,
	`tourTime` varchar(20) NOT NULL,
	`numberOfPeople` int DEFAULT 1,
	`message` text,
	`status` enum('pending','confirmed','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
	`confirmedBy` int,
	`confirmedAt` timestamp,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT now(),
	`updatedAt` timestamp NOT NULL DEFAULT now() ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tourBookings_id` PRIMARY KEY(`id`)
);
