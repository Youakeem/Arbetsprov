import "babel-polyfill";
import axios from "axios";
import "./main.scss";
import config from "./config";

function suggestionsSearch() {
	const form = document.querySelector(".suggestionsSearch");
	const searchInput = document.querySelector(".searchBar");
	const suggestionsContainer = document.querySelector(".suggestionsContainer");

	let shouldUpdate = true;

	function renderSuggestions(suggestions) {
		if (!shouldUpdate) {
			suggestionsContainer.innerHTML = "";
			return;
		}

		suggestionsContainer.innerHTML = "";
		suggestions.forEach((suggestion) => {
			const suggestionOption = document.createElement("li");
			suggestionOption.innerHTML = suggestion.title;
			suggestionsContainer.appendChild(suggestionOption);
		});
	}

	form.addEventListener("submit", (event) => {
		event.preventDefault();
	});

	searchInput.addEventListener("input", async (event) => {
		const { value: keyword } = event.target;

		// We got nothing - Abort
		if (keyword.length < 1) {
			shouldUpdate = false;
			return;
		}

		// It seems someone is searching - keep doing what you are doing
		shouldUpdate = true;

		try {
			const response = await axios.get(
				`https://api.themoviedb.org/3/search/movie?language=en-US&page=1&include_adult=false`,
				{
					params: {
						api_key: config.api_key,
						query: keyword
					}
				}
			);

			const suggestions = response.data.results.slice(0, config.suggestionsLimit);
			renderSuggestions(suggestions);
		} catch (err) {
			console.log(err);
		}
	});
}

// On Document Ready
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch);
}
