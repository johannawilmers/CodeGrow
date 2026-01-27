import * as functions from "firebase-functions";
import axios from "axios";
import { defineString } from "firebase-functions/params";

const JDOODLE_CLIENT_ID = defineString("JDOODLE_CLIENT_ID");
const JDOODLE_CLIENT_SECRET = defineString("JDOODLE_CLIENT_SECRET");

export const runJava = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: "No code provided" });
      return;
    }

    const response = await axios.post(
      "https://api.jdoodle.com/v1/execute",
      {
        clientId: JDOODLE_CLIENT_ID.value(),
        clientSecret: JDOODLE_CLIENT_SECRET.value(),
        script: code,
        language: "java",
        versionIndex: "4",
      }
    );

    res.json({
      output: response.data.output,
      statusCode: response.data.statusCode,
      memory: response.data.memory,
      cpuTime: response.data.cpuTime,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "JDoodle execution failed" });
  }
});
