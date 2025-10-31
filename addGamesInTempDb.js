const connectDB = require("./db");
const Game = require("./game");

const addGameInTempDb = async (gameData) => {
  await connectDB();

  try {
    const existing = await Game.findOne({ id: gameData.id });
    if (existing) {
      console.log("Game already exists:", gameData.name);
      return;
    }

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
