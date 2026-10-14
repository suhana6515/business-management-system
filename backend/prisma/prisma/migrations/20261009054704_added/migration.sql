/*
  Warnings:

  - You are about to drop the column `price` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `product` table. All the data in the column will be lost.
  - Added the required column `product_size_id` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product` DROP COLUMN `price`,
    DROP COLUMN `size`,
    ADD COLUMN `product_size_id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `Product_Size` (
    `product_size_id` INTEGER NOT NULL AUTO_INCREMENT,
    `size_name` VARCHAR(191) NOT NULL,
    `size_price` INTEGER NOT NULL,

    PRIMARY KEY (`product_size_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_product_size_id_fkey` FOREIGN KEY (`product_size_id`) REFERENCES `Product_Size`(`product_size_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
