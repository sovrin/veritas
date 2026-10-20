CREATE TABLE `collections` (
	`project` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`fields` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`project`, `slug`),
	FOREIGN KEY (`project`) REFERENCES `projects`(`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `entries` (
	`project` text NOT NULL,
	`collection` text NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`fields` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`project`, `collection`, `slug`),
	FOREIGN KEY (`project`,`collection`) REFERENCES `collections`(`project`,`slug`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`slug` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`created_at` text NOT NULL
);
