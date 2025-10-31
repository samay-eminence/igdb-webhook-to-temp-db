require("dotenv").config();
const { uploadLogToS3, formatDateForFolder } = require("./addGamesInTempDb");

// Multiple test game data entries (simulating webhook calls coming one by one)
const testGameDataArray = [
  {
    id: 111111,
    name: "Game One",
    category: 0,
    created_at: Math.floor(Date.now() / 1000),
    slug: "game-one",
  },
  {
    id: 222222,
    name: "Game Two",
    category: 1,
    created_at: Math.floor(Date.now() / 1000),
    slug: "game-two",
  },
  {
    id: 333333,
    name: "Game Three",
    category: 0,
    created_at: Math.floor(Date.now() / 1000),
    slug: "game-three",
  },
];

// Simulate sequential webhook calls
(async () => {
  console.log("Testing multiple sequential entries...");
  console.log("=====================================\n");

  // Check if AWS credentials are set
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ ERROR: AWS credentials not found!");
    process.exit(1);
  }

  console.log(
    `✅ Uploading ${testGameDataArray.length} entries sequentially\n`
  );
  console.log(`Date folder: ${formatDateForFolder()}\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testGameDataArray.length; i++) {
    const gameData = testGameDataArray[i];
    console.log(
      `[${i + 1}/${testGameDataArray.length}] Processing: ${
        gameData.name
      } (ID: ${gameData.id})`
    );

    try {
      await uploadLogToS3(gameData);
      console.log(`   ✅ Uploaded successfully\n`);
      successCount++;

      // Small delay to simulate real-world timing (optional)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      failCount++;
    }
  }

  console.log("=====================================");
  console.log(`✅ Successfully uploaded: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log("\nCheck the S3 bucket 'igdb-logs' at:");
  console.log(
    `   s3://igdb-logs/webhooktotemp-db/${formatDateForFolder()}.json`
  );
  console.log("\nYou should see a single file with all entries:");
  console.log(
    `   - ${formatDateForFolder()}.json (contains ${successCount} entries as JSON array)`
  );
})();
