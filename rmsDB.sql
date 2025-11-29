CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile_no` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `category` (
  `CategoryID` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) NOT NULL,
  PRIMARY KEY (`CategoryID`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `menu` (
  `MenuItemID` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` text,
  `Price` decimal(10,2) NOT NULL,
  `CategoryID` int DEFAULT NULL,
  PRIMARY KEY (`MenuItemID`),
  KEY `CategoryID` (`CategoryID`),
  CONSTRAINT `menu_ibfk_1` FOREIGN KEY (`CategoryID`) REFERENCES `category` (`CategoryID`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orders` (
  `OrderID` int NOT NULL AUTO_INCREMENT,
  `UserID` int NOT NULL,
  `OrderDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `TotalAmount` decimal(10,2) NOT NULL,
  PRIMARY KEY (`OrderID`),
  KEY `UserID` (`UserID`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`UserID`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `orderitems` (
  `OrderItemID` int NOT NULL AUTO_INCREMENT,
  `OrderID` int NOT NULL,
  `MenuItemID` int NOT NULL,
  `Quantity` int NOT NULL DEFAULT '1',
  `Price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`OrderItemID`),
  KEY `OrderID` (`OrderID`),
  KEY `MenuItemID` (`MenuItemID`),
  CONSTRAINT `orderitems_ibfk_1` FOREIGN KEY (`OrderID`) REFERENCES `orders` (`OrderID`),
  CONSTRAINT `orderitems_ibfk_2` FOREIGN KEY (`MenuItemID`) REFERENCES `menu` (`MenuItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `cart_items` (
  `cart_item_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int DEFAULT '1',
  `added_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`cart_item_id`),
  KEY `user_id` (`user_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu` (`MenuItemID`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `payments` (
  `payment_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `payment_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `amount` decimal(10,2) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`payment_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `favorites` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `menu_item_id` (`menu_item_id`),
  CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`menu_item_id`) REFERENCES `menu` (`MenuItemID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
