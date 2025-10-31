const connectDB = require("./db");
const Game = require("./game");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
require("dotenv").config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to format date as "oct_31", "nov_1", etc.
const formatDateForFolder = () => {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const now = new Date();
  const month = months[now.getMonth()];
  const day = now.getDate();
  return `${month}_${day}`;
};

// Function to upload gameData to S3 (appends to single file per day)
const uploadLogToS3 = async (gameData) => {
  try {
    // Validate gameData - skip if empty or invalid
    if (
      !gameData ||
      typeof gameData !== "object" ||
      Object.keys(gameData).length === 0
    ) {
      console.log(
        "Warning: Skipping S3 log upload - gameData is empty or invalid"
      );
      return;
    }

    const bucketName = "igdb-logs";
    const folderName = "webhooktotemp-db";
    const dateFolder = formatDateForFolder();
    const fileName = `${dateFolder}.json`; // Single file per day: "oct 31.json"
    const key = `${folderName}/${fileName}`;

    let existingEntries = [];

    // Try to get existing file for today
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });

      const response = await s3Client.send(getCommand);
      let bodyString = await streamToString(response.Body);
      bodyString = bodyString.trim();

      // Only parse if string is not empty
      if (bodyString && bodyString.length > 0) {
        existingEntries = JSON.parse(bodyString);

        if (!Array.isArray(existingEntries)) {
          // If it's not an array, convert it to one
          existingEntries = [existingEntries];
        }

        // Filter out any empty or invalid entries
        existingEntries = existingEntries.filter(
          (entry) =>
            entry && typeof entry === "object" && Object.keys(entry).length > 0
        );
      }
    } catch (getError) {
      // File doesn't exist yet or other error - start with empty array
      if (getError.name !== "NoSuchKey") {
        console.log(
          `Note: Could not read existing file (will create new): ${getError.message}`
        );
      }
      existingEntries = [];
    }

    // Add new entry with timestamp
    const entryWithTimestamp = {
      ...gameData,
      logged_at: new Date().toISOString(),
      logged_timestamp: Date.now(),
    };
    existingEntries.push(entryWithTimestamp);

    // Upload updated entries
    const logData = JSON.stringify(existingEntries, null, 2);

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: logData,
      ContentType: "application/json",
    });

    await s3Client.send(putCommand);
    console.log(
      `Log appended to S3: s3://${bucketName}/${key} (${existingEntries.length} total entries)`
    );
  } catch (err) {
    console.error("Error uploading log to S3:", err);
    // Don't throw - we don't want S3 failures to break the main flow
  }
};

// Helper function to convert stream to string
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
};

const addGameInTempDb = async (gameData) => {
  await connectDB();

  try {
    // Upload gameData to S3 logs
    await uploadLogToS3(gameData);

    // const existing = await Game.findOne({ id: gameData.id });
    // if (existing) {
    //   console.log("Game already exists:", gameData.name);
    //   return;
    // }

    const game = new Game(gameData);
    await game.save();
    console.log("Game saved:", game.name);
  } catch (err) {
    console.error("Error adding game:", err);
  }
};

const gameData = {
  id: 341400,
  category: 0,
  created_at: 1745333439,
  involved_companies: [317219],
  name: "Voidling Bound",
  platforms: [6],
  release_dates: [732164],
  slug: "voidling-bound--1",
  updated_at: 1745346705,
  url: "https://www.igdb.com/games/voidling-bound--1",
  websites: [733097],
  checksum: "43e9dd62-36a1-b958-facf-28c52d4af6c5",
  game_type: 0,
};
module.exports = addGameInTempDb;
module.exports.uploadLogToS3 = uploadLogToS3;
module.exports.formatDateForFolder = formatDateForFolder;
