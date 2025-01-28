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
        console.log(req.body.data);
        const gameData = req.body.data;
        const game = await Game.create(gameData);
        res.status(201).json({ success: true, data: game });
        console.log("SUCCESS");
      } catch (error) {
        console.log(error);
        res
          .status(400)
          .json({ success: false, message: "Error creating game" });
      }
      break;
  }
}
