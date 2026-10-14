import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//Insert statement for Product_Size table
async function main() {
  await prisma.$executeRaw`
    INSERT INTO product_size (size_name, size_price)
    VALUES
      ("1 inch", 350),
      ("1.5 inch", 600),
      ("1*3 inch", 500),
      ("4*1.5 inch", 550)
    ON DUPLICATE KEY UPDATE
      size_price = VALUES(size_price)
    `;

  console.log("Product sizes and prices inserted successfully.");

  //Insert statement for Category table
  await prisma.$executeRaw`
    INSERT INTO category (category_name)
    VALUES
      ("ReadyMade Stickers"),
      ("Custom Stickers")
    ON DUPLICATE KEY UPDATE
      category_name = VALUES(category_name)
    `;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
