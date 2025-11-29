const { exec } = require("child_process");

console.log("Running database migrations...");

exec("npx sequelize-cli db:migrate", (error, stdout, stderr) => {
  console.log("Migration output:", stdout);

  if (stderr) {
    console.log("Migration info:", stderr);
  }

  if (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }

  console.log("Migrations completed successfully!");
  process.exit(0);
});
