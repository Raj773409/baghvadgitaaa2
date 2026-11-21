CREATE TABLE `admin_users` (
	`id` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` enum('SUPER_ADMIN','EVENT_ADMIN','REGISTRATION_MANAGER','FINANCE_MANAGER','VOLUNTEER_MANAGER','CONTENT_EDITOR','MEDIA_MANAGER','AUDITOR') NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`must_change_password` boolean NOT NULL DEFAULT false,
	`password_updated_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`last_login_at` timestamp,
	CONSTRAINT `admin_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_users_email_idx` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(64) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`actor_email` varchar(255) NOT NULL,
	`actor_role` varchar(40) NOT NULL,
	`action` varchar(80) NOT NULL,
	`module` varchar(60) NOT NULL,
	`target_id` varchar(120),
	`summary` text,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carousel_slides` (
	`id` varchar(64) NOT NULL,
	`carousel_id` varchar(64) NOT NULL,
	`version_kind` enum('published','draft') NOT NULL,
	`src` varchar(500) NOT NULL,
	`mobile_src` varchar(500),
	`title` varchar(300),
	`subtitle` varchar(300),
	`caption` varchar(300),
	`chapter_ref` varchar(120),
	`alt` varchar(300) NOT NULL,
	`object_position` varchar(40),
	`order` int NOT NULL DEFAULT 0,
	`enabled` boolean NOT NULL DEFAULT true,
	CONSTRAINT `carousel_slides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `carousels` (
	`id` varchar(64) NOT NULL,
	`name` varchar(200) NOT NULL,
	`placement` varchar(200) NOT NULL,
	`auto_advance_ms` int NOT NULL DEFAULT 6000,
	CONSTRAINT `carousels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_items` (
	`id` varchar(64) NOT NULL,
	`section` varchar(60) NOT NULL,
	`title` varchar(300),
	`subtitle` varchar(300),
	`body` text,
	`language` varchar(10) NOT NULL,
	`status` varchar(40) NOT NULL,
	`meta` json,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cms_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collection_meta` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collection_id` varchar(64) NOT NULL,
	`meta_key` varchar(80) NOT NULL,
	`meta_value` text,
	CONSTRAINT `collection_meta_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(40) NOT NULL,
	`title` varchar(300) NOT NULL,
	`subtitle` varchar(300),
	`description` text,
	`date_label` varchar(120),
	`location_label` varchar(200),
	`badge_label` varchar(120),
	`href` varchar(500),
	`image_url` varchar(500),
	`language` varchar(10) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`featured` boolean NOT NULL DEFAULT false,
	`status` varchar(40) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `entry_passes` (
	`id` varchar(64) NOT NULL,
	`participant_id` varchar(64) NOT NULL,
	`payment_id` varchar(64) NOT NULL,
	`pass_code` varchar(40) NOT NULL,
	`event_key` varchar(40) NOT NULL,
	`event_name` varchar(200) NOT NULL,
	`event_date` varchar(40) NOT NULL,
	`venue` varchar(255) NOT NULL,
	`admits` int NOT NULL DEFAULT 1,
	`tier` varchar(80) NOT NULL,
	`qr_payload` varchar(255) NOT NULL,
	`status` varchar(20) NOT NULL,
	`issued_at` timestamp NOT NULL DEFAULT (now()),
	`checked_in_at` timestamp,
	CONSTRAINT `entry_passes_id` PRIMARY KEY(`id`),
	CONSTRAINT `entry_passes_code_idx` UNIQUE(`pass_code`)
);
--> statement-breakpoint
CREATE TABLE `managed_media` (
	`id` varchar(64) NOT NULL,
	`kind` varchar(20) NOT NULL,
	`category` varchar(40) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`language` varchar(10) NOT NULL,
	`copyright` varchar(200),
	`source` varchar(200),
	`alt_text` varchar(300),
	`url` varchar(500) NOT NULL,
	`focal_point` varchar(40),
	`published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `managed_media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_asset_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`media_asset_id` varchar(64) NOT NULL,
	`tag` varchar(80) NOT NULL,
	CONSTRAINT `media_asset_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `media_assets` (
	`id` varchar(64) NOT NULL,
	`asset_key` varchar(120),
	`kind` varchar(20) NOT NULL,
	`category` varchar(40) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`alt_text` varchar(300),
	`caption` varchar(300),
	`copyright` varchar(200),
	`source` varchar(200),
	`language` varchar(10) NOT NULL,
	`url` varchar(500) NOT NULL,
	`focal_point` varchar(40),
	`featured` boolean NOT NULL DEFAULT false,
	`published` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `media_assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `media_assets_asset_key_idx` UNIQUE(`asset_key`)
);
--> statement-breakpoint
CREATE TABLE `media_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`media_asset_id` varchar(64) NOT NULL,
	`location` varchar(300) NOT NULL,
	CONSTRAINT `media_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` varchar(64) NOT NULL,
	`member_name` varchar(200) NOT NULL,
	`email` varchar(255) NOT NULL,
	`tier` varchar(40) NOT NULL,
	`country` varchar(120) NOT NULL,
	`status` varchar(40) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_blocks` (
	`id` varchar(64) NOT NULL,
	`page_version_id` varchar(64) NOT NULL,
	`type` varchar(60) NOT NULL,
	`label` varchar(200),
	`order` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`payload` json NOT NULL,
	CONSTRAINT `page_blocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_versions` (
	`id` varchar(64) NOT NULL,
	`page_id` varchar(64) NOT NULL,
	`version_kind` enum('published','draft') NOT NULL,
	`title_json` json NOT NULL,
	`subtitle_json` json,
	`summary_json` json,
	`seo_json` json,
	CONSTRAINT `page_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` varchar(64) NOT NULL,
	`slug` varchar(200) NOT NULL,
	`route` varchar(200) NOT NULL,
	`name` varchar(200) NOT NULL,
	`category` varchar(40) NOT NULL,
	`cms_connected` boolean NOT NULL DEFAULT true,
	`sync_status` varchar(40) NOT NULL,
	`status` varchar(40) NOT NULL,
	`has_unpublished_draft` boolean NOT NULL DEFAULT false,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	`published_at` timestamp,
	`updated_by` varchar(255),
	CONSTRAINT `pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `pages_slug_idx` UNIQUE(`slug`),
	CONSTRAINT `pages_route_idx` UNIQUE(`route`)
);
--> statement-breakpoint
CREATE TABLE `participant_notifications` (
	`id` varchar(64) NOT NULL,
	`participant_id` varchar(64) NOT NULL,
	`kind` varchar(20) NOT NULL,
	`tone` varchar(20) NOT NULL,
	`title` varchar(200) NOT NULL,
	`body` text NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participant_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `participants` (
	`id` varchar(64) NOT NULL,
	`full_name` varchar(200) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`no_of_persons` int NOT NULL,
	`donation_amount_inr` int NOT NULL,
	`registration_type` varchar(40) NOT NULL,
	`country` varchar(120) NOT NULL,
	`city` varchar(120) NOT NULL,
	`assistance_visa` boolean NOT NULL DEFAULT false,
	`assistance_accommodation` boolean NOT NULL DEFAULT false,
	`assistance_local_transport` boolean NOT NULL DEFAULT false,
	`events_curtain_raiser` boolean NOT NULL DEFAULT false,
	`events_mahotsav` boolean NOT NULL DEFAULT false,
	`preferred_language` varchar(10),
	`family_or_group_members` text,
	`organisation_name` varchar(200),
	`organisation_role` varchar(120),
	`volunteer_skills` text,
	`parayana_city` varchar(120),
	`assistance_notes` text,
	`verification_status` varchar(40) NOT NULL,
	`payment_status` varchar(40) NOT NULL,
	`reference_code` varchar(40) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `participants_id` PRIMARY KEY(`id`),
	CONSTRAINT `participants_reference_code_idx` UNIQUE(`reference_code`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(64) NOT NULL,
	`participant_id` varchar(64) NOT NULL,
	`participant_name` varchar(200) NOT NULL,
	`amount_inr` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`gateway` varchar(40) NOT NULL,
	`gateway_reference` varchar(120) NOT NULL,
	`gateway_order_id` varchar(120),
	`status` varchar(40) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`mode` varchar(8),
	`method_family` varchar(20),
	`method_provider` varchar(40),
	`method_label` varchar(120),
	`receipt_number` varchar(40),
	`captured_at` timestamp,
	`failure_reason` varchar(255),
	`attempts` int NOT NULL DEFAULT 0,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refunds` (
	`id` varchar(64) NOT NULL,
	`payment_id` varchar(64) NOT NULL,
	`amount_inr` int NOT NULL,
	`reason` text NOT NULL,
	`approved_by` varchar(255) NOT NULL,
	`status` varchar(40) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `refunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` varchar(64) NOT NULL,
	`entity_type` varchar(40) NOT NULL,
	`entity_id` varchar(64) NOT NULL,
	`entity_title` varchar(300),
	`action` varchar(40) NOT NULL,
	`actor_email` varchar(255) NOT NULL,
	`summary` text,
	`snapshot_json` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revoked_tokens` (
	`token_hash` varchar(128) NOT NULL,
	`expires_at` timestamp NOT NULL,
	CONSTRAINT `revoked_tokens_token_hash` PRIMARY KEY(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `scripture_chapters` (
	`chapter_number` int NOT NULL,
	`title_en` varchar(300) NOT NULL,
	`title_sanskrit` varchar(300) NOT NULL,
	`title_hi` varchar(300),
	`title_te` varchar(300),
	`summary_en` text NOT NULL,
	`summary_hi` text,
	`summary_te` text,
	`key_teaching` text NOT NULL,
	`featured_verse_ref` varchar(120) NOT NULL,
	`verse_count` int NOT NULL,
	`audio_url` varchar(500),
	`status` varchar(40) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scripture_chapters_chapter_number` PRIMARY KEY(`chapter_number`)
);
--> statement-breakpoint
CREATE TABLE `scripture_verses` (
	`id` varchar(64) NOT NULL,
	`chapter_number` int NOT NULL,
	`verse_number` int NOT NULL,
	`sanskrit_devanagari` text NOT NULL,
	`transliteration` text NOT NULL,
	`translation_en` text NOT NULL,
	`translation_hi` text,
	`translation_te` text,
	`commentary_note` text,
	`audio_url` varchar(500),
	`status` varchar(40) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scripture_verses_id` PRIMARY KEY(`id`),
	CONSTRAINT `scripture_verses_chapter_verse_idx` UNIQUE(`chapter_number`,`verse_number`)
);
--> statement-breakpoint
CREATE TABLE `story_scenes` (
	`id` varchar(64) NOT NULL,
	`scene_number` int NOT NULL,
	`title_en` varchar(300),
	`title_hi` varchar(300),
	`title_te` varchar(300),
	`chapter_tag` varchar(120),
	`dialogue_en` text,
	`dialogue_hi` text,
	`dialogue_te` text,
	`narration_en` text,
	`narration_hi` text,
	`narration_te` text,
	`primary_image_url` varchar(500),
	`audio_url` varchar(500),
	`status` varchar(40) NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `story_scenes_id` PRIMARY KEY(`id`),
	CONSTRAINT `story_scenes_scene_number_idx` UNIQUE(`scene_number`)
);
--> statement-breakpoint
CREATE TABLE `system_settings` (
	`id` int NOT NULL DEFAULT 1,
	`registration_open` boolean NOT NULL DEFAULT true,
	`require_volunteer_approval` boolean NOT NULL DEFAULT true,
	`maintenance_banner` text,
	`default_voice_gender` varchar(10) NOT NULL DEFAULT 'female',
	`backup_retention_days` int NOT NULL DEFAULT 30,
	CONSTRAINT `system_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `volunteers` (
	`id` varchar(64) NOT NULL,
	`full_name` varchar(200) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`country` varchar(120) NOT NULL,
	`city` varchar(120) NOT NULL,
	`department` varchar(60) NOT NULL,
	`volunteer_badge_id` varchar(40) NOT NULL,
	`approval_status` varchar(40) NOT NULL,
	`attendance_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `volunteers_id` PRIMARY KEY(`id`),
	CONSTRAINT `volunteers_badge_id_idx` UNIQUE(`volunteer_badge_id`)
);
--> statement-breakpoint
CREATE INDEX `audit_logs_timestamp_idx` ON `audit_logs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_email`);--> statement-breakpoint
CREATE INDEX `carousel_slides_carousel_idx` ON `carousel_slides` (`carousel_id`,`version_kind`);--> statement-breakpoint
CREATE INDEX `collection_meta_collection_idx` ON `collection_meta` (`collection_id`);--> statement-breakpoint
CREATE INDEX `collections_kind_idx` ON `collections` (`kind`);--> statement-breakpoint
CREATE INDEX `entry_passes_participant_idx` ON `entry_passes` (`participant_id`);--> statement-breakpoint
CREATE INDEX `media_asset_tags_asset_idx` ON `media_asset_tags` (`media_asset_id`);--> statement-breakpoint
CREATE INDEX `media_usage_asset_idx` ON `media_usage` (`media_asset_id`);--> statement-breakpoint
CREATE INDEX `page_blocks_version_idx` ON `page_blocks` (`page_version_id`);--> statement-breakpoint
CREATE INDEX `page_versions_page_idx` ON `page_versions` (`page_id`,`version_kind`);--> statement-breakpoint
CREATE INDEX `participant_notifications_participant_idx` ON `participant_notifications` (`participant_id`);--> statement-breakpoint
CREATE INDEX `payments_participant_idx` ON `payments` (`participant_id`);--> statement-breakpoint
CREATE INDEX `payments_order_idx` ON `payments` (`gateway_order_id`);--> statement-breakpoint
CREATE INDEX `refunds_payment_idx` ON `refunds` (`payment_id`);--> statement-breakpoint
CREATE INDEX `revisions_entity_idx` ON `revisions` (`entity_type`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `revoked_tokens_expires_idx` ON `revoked_tokens` (`expires_at`);