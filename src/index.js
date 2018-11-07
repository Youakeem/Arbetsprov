import axios from "axios";
import config from "./config";
import "./main.scss";

function suggestionsSearch() {
	const form = document.querySelector(".suggestionsSearch");
	const searchInput = document.querySelector(".searchBar");
	const suggestionsContainer = document.querySelector(".suggestionsContainer");

	let clearResults = true;

	function renderSuggestions(suggestions) {
		if (clearResults) {
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

	searchInput.addEventListener("input", (event) => {
		const { value: keyword } = event.target;

		// We got nothing - Abort
		if (keyword.length < 1) {
			clearResults = true;
			renderSuggestions();
			return;
		}

		// It seems someone is searching - keep doing what you are doing
		clearResults = false;

		axios
			.get(`https://api.themoviedb.org/3/search/movie?language=en-US&page=1&include_adult=false`, {
				params: {
					api_key: config.api_key,
					query: keyword
				}
			})
			.then((response) => {
				const suggestions = response.data.results.slice(0, config.suggestionsLimit);
				renderSuggestions(suggestions);
			})
			.catch((error) => {
				console.log(error);
			});
	});
}

// On Document Ready
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch);
}
