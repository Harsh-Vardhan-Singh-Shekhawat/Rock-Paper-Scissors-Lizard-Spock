import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import Game from "../../utils/Game";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const uri = process.env.MONGODB_URI as string;
  await mongoose.connect(uri).then(() => {
    console.log("Connected to MongoDB successfully!");
  });

  switch (req.body.type) {
    case "GET":
      const { address } = req.body.data;
      console.log("ACTIVE GAME GET REQUEST");
      try {
        const game = await Game.findOne({
          createdFor: address,
        });

        if (game === null) {
          res.status(200).json({ success: true, data: {} });
        }
        res.status(200).json({ success: true, data: game });
        console.log("SUCCESS");
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
      break;
    case "POST":
      try {
        console.log("NEW GAME POST REQUEST");
        const gameData = req.body.data;

        const game = await Game.create(gameData);
        res.status(201).json({ success: true, data: game });
        console.log("SUCCESS");
      } catch (error) {
        res
          .status(400)
          .json({ success: false, message: "Error creating game" });
      }
      break;

    case "PUT":
      try {
        const { address } = req.body.data;
        console.log("GAME UPDATE PUT REQUEST");
        const game = await Game.findOneAndUpdate(
          { createdFor: address, isPlayed: false }, // Find game where `isPlayed` is `false`
          { $set: { isPlayed: true } }, // Update `isPlayed` to `true`
          { new: true } // Return the updated document
        );
        if (game) {
          console.log("SUCCESS");
          res
            .status(200)
            .json({ success: true, message: "Game updated", game });
        } else {
          console.log("No game found or already played.");
          res.status(404).json({
            success: false,
            message: "Game not found or already played",
          });
        }
      } catch (error) {
        res
          .status(400)
          .json({ success: false, message: "Error updating game" });
      }
      break;

    case "REMOVE":
      try {
        const { createdBy, createdFor } = req.body.data;

        console.log("GAME REMOVE REQUEST");
        const game = await Game.deleteOne({
          createdBy: createdBy,
          createdFor: createdFor,
        });

        if (game !== null || game !== undefined) {
          console.log("SUCCESS");
          res.status(200).json({ success: true, message: "Game removed" });
        } else {
          res.status(404).json({
            success: false,
            message: "game not found",
          });
        }
      } catch (error) {
        res
          .status(400)
          .json({ success: false, message: "Error updating game" });
      }
      break;
    case "WINNER":
      try {
        const { winner, address } = req.body.data;
        console.log("WINNER UPDATE REQUEST");
        console.log("winner : ", winner);
        console.log("address : ", address);
        const game = await Game.findOneAndUpdate(
          { createdFor: address, isPlayed: true },
          { $set: { winner: winner } },
          { new: true }
        );
        if (game) {
          console.log("SUCCESS");
          res
            .status(200)
            .json({ success: true, message: "Game updated", game });
        } else {
          res.status(404).json({
            success: false,
            message: "Game not found",
          });
        }
      } catch (error) {
        res
          .status(400)
          .json({ success: false, message: "Error updating game" });
      }
      break;

    case "J1TIMEOUT":
      try {
        const { createdBy, createdFor } = req.body.data;

        console.log("J1 TIMEOUT UPDATE REQUEST");
        const game = await Game.findOneAndUpdate(
          { createdFor: createdFor, createdBy: createdBy },
          { $set: { j1Timeout: true } },
          { new: true }
        );
        if (game) {
          console.log("SUCCESS");
          res
            .status(200)
            .json({ success: true, message: "Game updated", game });
        } else {
          console.log("No game found or already played.");
          res.status(404).json({
            success: false,
            message: "Game not found or already played",
          });
        }
      } catch (error) {
        res
          .status(400)
          .json({ success: false, message: "Error updating game" });
      }
      break;

    case "J2TIMEOUT":
      try {
        const { createdBy, createdFor } = req.body.data;

        console.log("J2 TIMEOUT UPDATE REQUEST");
        const game = await Game.findOneAndUpdate(
          { createdFor: createdFor, createdBy: createdBy },
          { $set: { j2Timeout: true } },
          { new: true }
        );
        if (game) {
          console.log("SUCCESS");
          res
            .status(200)
            .json({ success: true, message: "Game updated", game });
        } else {
          console.log("No game found or already played.");
          res.status(404).json({
            success: false,
            message: "Game not found or already played",
          });
        }
      } catch (error) {
        res
          .status(400)
          .json({ success: false, message: "Error updating game" });
      }
      break;
  }
}
