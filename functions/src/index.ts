import axios from "axios";
import * as functions from "firebase-functions/v2";
import { defineJsonSecret } from "firebase-functions/params";

// Load the entire config JSON secret
const config = defineJsonSecret("FUNCTIONS_CONFIG_EXPORT");

export const runJava = functions
  .runWith({ secrets: [config] })
  .https.onRequest(async (req, res) => {
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

      // Parse the JSON secret value to get clientId and clientSecret
      const jdoodleConfig = JSON.parse(config.value());

      const response = await axios.post(
        "https://api.jdoodle.com/v1/execute",
        {
          clientId: jdoodleConfig.jdoodle.client_id,
          clientSecret: jdoodleConfig.jdoodle.client_secret,
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
