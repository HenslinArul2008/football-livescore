let matches = [];
let currentFilter = "ALL";

async function loadMatches() {
    try {

        // Get today's matches
        const response = await fetch("/api/matches");
        const data = await response.json();

        if (!response.ok) {
            throw new Error("API request failed");
        }

        matches = data.data || [];


        // Get currently live matches
        const liveResponse = await fetch("/api/live");
        const liveData = await liveResponse.json();

        if (liveResponse.ok && liveData.data) {

            const liveMatches = liveData.data;

            // Add live matches if they are not already present
            liveMatches.forEach(liveMatch => {

                const existingIndex = matches.findIndex(
                    match => match.id === liveMatch.id
                );

                if (existingIndex !== -1) {

                    // Replace old version with live version
                    matches[existingIndex] = liveMatch;

                } else {

                    // Add new live match
                    matches.push(liveMatch);

                }

            });

        }

        displayMatches();

    } catch (error) {

        console.error("Error:", error);

        document.getElementById("matches").innerHTML = `
            <p style="text-align:center;">
                ❌ Unable to load football matches.
            </p>
        `;
    }
}

function getTeam(match, location) {

    const team = match.participants?.find(
        participant =>
            participant.meta?.location === location
    );

    return team ? team.name : "Unknown Team";
}

function getScore(match, location) {

    const team = match.participants?.find(
        participant =>
            participant.meta?.location === location
    );

    if (!team) {
        return 0;
    }

    const score = match.scores?.find(
        item =>
            item.participant_id === team.id &&
            item.description === "CURRENT"
    );

    return score ? score.score?.goals || 0 : 0;
}

function getMatchTime(match) {

    if (match.status === "FINISHED") {
        return "✅ FINISHED";
    }

    if (match.status === "UPCOMING") {
        const date = new Date(
            match.starting_at.replace(" ", "T") + "Z"
        );

        return "🔜 " + date.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        });
    }

    if (match.status === "LIVE") {

        const stateId = match.state_id;

        if (stateId === 3) {
            return "⏸️ HALF TIME";
        }

        if (stateId === 4 || stateId === 21 || stateId === 25) {
            return "⏸️ BREAK";
        }

        const periods = match.periods || [];

        const currentPeriod = periods.find(
            period => period.ticking === true
        );

        if (currentPeriod) {

            const minutes = currentPeriod.minutes ?? 0;

            return `🔴 LIVE ${minutes}'`;
        }

        return "🔴 LIVE";
    }

    return match.status;
}

function createMatchCard(match) {

    const homeTeam = match.participants?.find(
        participant =>
            participant.meta?.location === "home"
    );

    const awayTeam = match.participants?.find(
        participant =>
            participant.meta?.location === "away"
    );

    const homeName = homeTeam ? homeTeam.name : "Home Team";
    const awayName = awayTeam ? awayTeam.name : "Away Team";

    const homeLogo = homeTeam
        ? homeTeam.image_path
        : "";

    const awayLogo = awayTeam
        ? awayTeam.image_path
        : "";

    const homeScore = getScore(match, "home");
    const awayScore = getScore(match, "away");

    const leagueName =
        match.league?.name || "Football";

    const leagueLogo =
        match.league?.image_path || "";

    return `
        <div class="match-card">

            <div class="league">

                ${leagueLogo
                    ? `<img src="${leagueLogo}" class="league-logo">`
                    : "⚽"
                }

                ${leagueName}

            </div>

            <div class="status ${match.status.toLowerCase()}">
                ${getMatchTime(match)}
            </div>

            <div class="teams">

                <div class="team">

                    <img
                        src="${homeLogo}"
                        class="team-logo"
                        alt="${homeName}"
                    >

                    <h3 class="team-name">
                        ${homeName}
                    </h3>

                </div>

                <div class="score">
                    <strong>
                        ${homeScore} - ${awayScore}
                    </strong>
                </div>

                <div class="team">

                    <img
                        src="${awayLogo}"
                        class="team-logo"
                        alt="${awayName}"
                    >

                    <h3 class="team-name">
                        ${awayName}
                    </h3>

                </div>

            </div>
            <button class="favorite-btn" onclick="toggleFavorite(${match.id})">
                ⭐ Favorite
            </button>
            <button class="details-btn" onclick="showMatchDetails(${match.id})">
                📋 Match Details
            </button>

        </div>
    `;
}
function showMatchDetails(matchId) {

    const match = matches.find(
        match => match.id === matchId
    );

    if (!match) {
        return;
    }

    const homeTeam = getTeam(match, "home");
    const awayTeam = getTeam(match, "away");

    const homeScore = getScore(match, "home");
    const awayScore = getScore(match, "away");

    const events = match.events || [];

    let eventHTML = "";

    if (events.length === 0) {

        eventHTML = `
            <p>No match events available.</p>
        `;

    } else {

        events.forEach(event => {

            eventHTML += `
                <div class="event">
                    ⚽ ${event.minute || ""}' 
                    ${event.type || "Event"}
                </div>
            `;

        });
    }

    const container =
        document.getElementById("matches");

    container.innerHTML = `
        <div class="match-card">

            <button class="back-btn"
                onclick="displayMatches()">
                ← Back
            </button>

            <div class="league">
                ${match.league?.name || "Football"}
            </div>

            <div class="status">
                ${getMatchTime(match)}
            </div>

            <div class="teams">

                <div class="team">
                    <h3>${homeTeam}</h3>
                </div>

                <div class="score">
                    ${homeScore} - ${awayScore}
                </div>

                <div class="team">
                    <h3>${awayTeam}</h3>
                </div>

            </div>

            <hr>

            <h3>Match Events</h3>

            ${eventHTML}

        </div>
    `;
}
function toggleFavorite(matchId) {

    let favorites =
        JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.includes(matchId)) {

        favorites = favorites.filter(
            id => id !== matchId
        );

    } else {

        favorites.push(matchId);

    }

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    displayMatches();
}

function displayMatches() {

    const container = document.getElementById("matches");

    const searchInput =
        document.getElementById("searchInput");

    const searchText = searchInput
        ? searchInput.value.toLowerCase()
        : "";

    const filteredMatches = matches.filter(match => {

        const homeTeam =
            getTeam(match, "home").toLowerCase();

        const awayTeam =
            getTeam(match, "away").toLowerCase();

        const matchesSearch =
            homeTeam.includes(searchText) ||
            awayTeam.includes(searchText);

        const favorites =
    JSON.parse(localStorage.getItem("favorites")) || [];

let matchesFilter = true;

if (currentFilter !== "ALL") {

    if (currentFilter === "FAVORITES") {

        matchesFilter = favorites.includes(match.id);

    } else {

        matchesFilter = match.status === currentFilter;

    }
}

        return matchesSearch && matchesFilter;
    });

    container.innerHTML = "";

    if (filteredMatches.length === 0) {

    let message = "There are no matches in this category.";

    if (matches.length === 0) {
        message = "There are no matches available today under your current API coverage.";
    }
    else if (currentFilter === "LIVE") {
        message = "There are no live matches right now.";
    }
    else if (currentFilter === "UPCOMING") {
        message = "There are no upcoming matches today.";
    }
    else if (currentFilter === "FINISHED") {
        message = "There are no finished matches today.";
    }
    else if (currentFilter === "FAVORITES") {
        message = "You have no favorite matches.";
    }

    container.innerHTML = `
        <div class="match-card">
            <h3 style="text-align:center;">
                ⚽ No matches
            </h3>

            <p style="text-align:center;">
                ${message}
            </p>
        </div>
    `;

    return;
}

    filteredMatches.forEach(match => {

        container.innerHTML +=
            createMatchCard(match);

    });
}

function filterMatches(status) {

    currentFilter = status;

    displayMatches();
}

document
    .getElementById("searchInput")
    ?.addEventListener("input", displayMatches);

loadMatches();

setInterval(loadMatches, 30000);