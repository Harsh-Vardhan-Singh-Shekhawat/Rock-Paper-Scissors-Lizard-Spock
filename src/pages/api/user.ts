//api for active user updates in db

import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import ActiveUser from "../../utils/ActiveUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const uri = process.env.MONGODB_URI as string;
  await mongoose.connect(uri).then(() => {
    console.log("Connected to MongoDB successfully!");
  });

  switch (req.method) {
    case "GET":
      try {
        console.log("ACTIVE USER GET REQEUST");
        const activeUsers = await ActiveUser.find({});
        res.status(200).json({ success: true, data: activeUsers });
        console.log("SUCCESS");
      } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
      }
      break;

    case "POST":
      try {
        const { type } = req.body;
        switch (type) {
          case "activeUser":
            try {
              console.log("ACTIVE USER POST REQUEST FOR NEW USER");
              const activeUserData = req.body.data;
              const existingUser = await ActiveUser.findOne({
                address: activeUserData.address,
              });

              if (existingUser) {
                return res.status(200).json({
                  success: true,
                  message: "Active user already exists",
                  data: existingUser,
                });
              }
              const activeUser = await ActiveUser.create(activeUserData);
              res.status(201).json({ success: true, data: activeUser });
              console.log("SUCCESS");
            } catch (error) {
              res.status(400).json({
                success: false,
                message: "Error creating active user",
              });
            }
            break;
          case "removeActiveUser":
            try {
              console.log("ACTIVE USER POST REQUEST FOR REMOVING USER");
              const userData = req.body.data;
              const existingUser = await ActiveUser.findOne({
                address: userData.address,
              });

              if (!existingUser) {
                return res.status(404).json({
                  success: false,
                  message: "Active user not found",
                });
              }
              await ActiveUser.deleteOne({ address: userData.address });
              res.status(200).json({
                success: true,
                message: "Active user removed successfully",
              });
              console.log("SUCCESS");
            } catch (error) {
              res.status(400).json({
                success: false,
                message: "Error removing active user",
              });
            }
            break;
        }
      } catch (error) {
        res.status(400).json({ success: false });
      }

      break;

    default:
      res.status(405).json({ success: false });
      break;
  }
}
