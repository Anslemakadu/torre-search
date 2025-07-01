import { useState } from "react";
import "./App.css";
import { mockResults } from "./mockData";

function App() {
  // This state holds the text I type into the search box
  const [query, setQuery] = useState("");

  // This state holds the search results we display
  const [results, setResults] = useState([]);

  // Becomes true when no results are found
  const [noResults, setNoResults] = useState(false);

  // Becomes true if I try to search without typing anything
  const [emptySearch, setEmptySearch] = useState(false);

  // Becomes true while we are fetching results (shows spinner)
  const [loading, setLoading] = useState(false);

  // This holds the last query I searched (so it doesn't change while typing)
  const [lastQuery, setLastQuery] = useState("");

  // This function runs when I click the Search button
  const handleSearch = async () => {
    console.log("Searching for:", query);

    // If the input is empty, show an error and stop here
    if (query.trim() === "") {
      setEmptySearch(true);
      setNoResults(false);
      return;
    }

    // If the input was not empty, clear any previous error
    setEmptySearch(false);

    // Show loading spinner
    setLoading(true);

    // Save the query so it stays visible after search
    setLastQuery(query);

    try {
      // Try to call the Torre live API with cookies
      const response = await fetch("https://torre.ai/api/entities/_searchStream", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-ndjson",
        },
        credentials: "include", // Try to send cookies automatically
        body: JSON.stringify({ query }),
      });

      // If the server responds with error, throw to jump to fallback
      if (!response.ok) {
        throw new Error(`Server responded ${response.status}`);
      }

      // Read the response as text (NDJSON)
      const text = await response.text();

      // Split by new lines, remove empty ones, parse JSON
      const lines = text.trim().split("\n").filter(Boolean);
      const parsed = lines.map((line) => JSON.parse(line));

      // Convert parsed data into our display format
      setResults(
        parsed.map((person) => ({
          name: person.name,
          professionalHeadline: person.professionalHeadline,
          location: person.location?.name || "Unknown",
          skills: person.skills || [],
        }))
      );
      setNoResults(false);
    } catch (error) {
      console.error("Live fetch failed, falling back to mock data:", error);

      // Fallback: look for matching names in mock data
      const filtered = mockResults.filter((person) =>
        person.name.toLowerCase().includes(query.toLowerCase())
      );

      if (filtered.length === 0) {
        // No matches found in mock data
        setNoResults(true);
        setResults([]);
      } else {
        // Matches found in mock data
        setNoResults(false);
        setResults(filtered);
      }
    } finally {
      // No matter what happened, stop showing spinner
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>Torre AI People Search</h1>
      </header>
      <main>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter a name..."
            value={query}
            onChange={(e) => {
              // Update the search box text as I type
              setQuery(e.target.value);
            }}
          />
          <button onClick={handleSearch}>Search</button>
        </div>

        <div className="results">
          {/* Show red message if trying to search without typing */}
          {emptySearch && (
            <p className="error-text">
              Please enter a name before searching.
            </p>
          )}

          {/* Show a spinner while loading */}
          {loading && <div className="loader"></div>}

          {/* Show this if no results found (and not loading) */}
          {noResults && !loading && (
            <>
              <p>
                Sorry, no results found for <strong>{lastQuery}</strong>.
              </p>
              <p>Here are some profiles you might be interested in:</p>
              <ul>
                {mockResults.map((person, index) => (
                  <li key={index}>
                    <strong>{person.name}</strong> - {person.professionalHeadline}
                    <br />
                    {person.location}
                    <div className="skills">
                      {person.skills.map((skill, i) => (
                        <span key={i} className="skill-badge">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Show results if we have them and not loading */}
          {!noResults && results.length > 0 && !loading && (
            <ul>
              {results.map((person, index) => (
                <li key={index}>
                  <strong>{person.name}</strong> - {person.professionalHeadline}
                  <br />
                  {person.location}
                  <div className="skills">
                    {person.skills.map((skill, i) => (
                      <span key={i} className="skill-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Show instructions when nothing has been searched */}
          {!noResults && results.length === 0 && !emptySearch && !loading && (
            <p>Type a name and click search to see results.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

