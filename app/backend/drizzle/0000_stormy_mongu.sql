CREATE TABLE `metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` integer NOT NULL,
	`gpu_index` integer NOT NULL,
	`gpu_util` integer NOT NULL,
	`mem_used` integer NOT NULL,
	`mem_total` integer NOT NULL,
	`temperature` integer NOT NULL,
	`power_draw` real NOT NULL,
	`gpu_name` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_metrics_timestamp` ON `metrics` (`timestamp`);--> statement-breakpoint
CREATE TABLE `processes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`metric_id` integer NOT NULL,
	`gpu_index` integer NOT NULL,
	`pid` integer NOT NULL,
	`process_name` text NOT NULL,
	`used_memory` integer NOT NULL,
	FOREIGN KEY (`metric_id`) REFERENCES `metrics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_processes_metric_id` ON `processes` (`metric_id`);