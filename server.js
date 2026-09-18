require("dotenv").config({
    path: __dirname + "/football.env"
});

const express = require("express");

const app = express();

app.use(express.static(__dirname));


// ===============================
// GET TODAY'S MATCHES
// ===============================

app.get("/api/matches", async (req, res) => {

    try {

        const today = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Kolkata"
        }).format(new Date());

        console.log("TODAY:", today);

        const token = process.env.SPORTMONKS_TOKEN.trim();

        const url =
            `https://api.sportmonks.com/v3/football/fixtures/date/${today}` +
            `?api_token=${encodeURIComponent(token)}` +
            `&include=participants;scores;events;periods;state;league`;

        const response = await fetch(url);

        const data = await response.json();

        const matches = (data.data || []).map(match => {

            const stateId = match.state_id;

            let status = "UPCOMING";

            // LIVE / HALF TIME / BREAK
            if ([2, 3, 4, 6, 9, 21, 22, 25].includes(stateId)) {

                status = "LIVE";

            }

            // FINISHED
            else if ([5, 7, 8].includes(stateId)) {

                status = "FINISHED";

            }

            return {
                ...match,
                status: status
            };

        });

        res.json({
            data: matches
        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch football matches"
        });

    }

});


// ===============================
// GET CURRENT LIVE MATCHES
// ===============================

app.get("/api/live", async (req, res) => {

    try {

        const token = process.env.SPORTMONKS_TOKEN.trim();

        const url =
            `https://api.sportmonks.com/v3/football/livescores/inplay` +
            `?api_token=${encodeURIComponent(token)}` +
            `&include=participants;scores;events;periods;state;league`;

        const response = await fetch(url);

        const data = await response.json();

        const matches = (data.data || []).map(match => {

            return {
                ...match,
                status: "LIVE"
            };

        });

        console.log("LIVE MATCHES:", matches.length);

        res.json({
            data: matches
        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to fetch live matches"
        });

    }

});


// ===============================
// SERVER
// ===============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Football LiveScore server running on port ${PORT}`);
});