require("dotenv").config();
const { uploadLogToS3, formatDateForFolder } = require("./addGamesInTempDb");

// Test data
const testGameData = {
  id: 999999,
  category: 0,
  created_at: Math.floor(Date.now() / 1000),
  involved_companies: [123456],
  name: "Test Game for S3 Logging",
  platforms: [6],
  release_dates: [123456],
  slug: "test-game-s3-logging",
  updated_at: Math.floor(Date.now() / 1000),
  url: "https://www.igdb.com/games/test-game",
  websites: [123456],
  checksum: "test-checksum-12345",
  game_type: 0,
};

// Run the test
(async () => {
  console.log("Testing S3 logging functionality...");
  console.log("===================================");

  // Check if AWS credentials are set
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error(
      "❌ ERROR: AWS credentials not found in environment variables!"
    );
    console.log("\nPlease set these in your .env file:");
    console.log("AWS_ACCESS_KEY_ID=your_access_key");
    console.log("AWS_SECRET_ACCESS_KEY=your_secret_key");
    console.log("AWS_REGION=us-east-1 (optional)");
    process.exit(1);
  }

  console.log("✅ AWS credentials found");
  console.log(`   Region: ${process.env.AWS_REGION || "us-east-1 (default)"}`);
  console.log("\nAttempting to upload test game data to S3...");
  console.log(`Test game: ${testGameData.name} (ID: ${testGameData.id})`);
  console.log(`Date folder: ${formatDateForFolder()}`);

  try {
    await uploadLogToS3(testGameData);
    console.log("\n✅ Test completed successfully!");
    console.log("\nCheck the S3 bucket 'igdb-logs' at:");
    console.log(`   s3://igdb-logs/webhooktotemp-db/${formatDateForFolder()}/`);
    console.log("\nYou should see a file named: game_999999_[timestamp].json");
    console.log("\nTo verify:");
    console.log("1. Go to AWS S3 Console");
    console.log("2. Navigate to bucket: igdb-logs");
    console.log(`3. Go to folder: webhooktotemp-db/${formatDateForFolder()}/`);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error("\nFull error:", error);
  }
})();
