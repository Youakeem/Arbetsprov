import axios from "axios";
import throttle from "lodash/throttle";
import config from "./config";
import "./main.scss";

function suggestionsSearch() {
	const form = document.querySelector(".suggestionsSearch");
	const searchInput = document.querySelector(".searchBar");
	const suggestionsContainer = document.querySelector(".suggestionsContainer");

	let shouldClearResults = true;

	form.addEventListener("submit", (event) => event.preventDefault());
	searchInput.addEventListener("input", throttle(handleSearchInput, 500));

	function handleSearchInput(event) {
		const { value: keyword } = event.target;

		if (keyword.length < 1) {
			shouldClearResults = true;
			renderSuggestions();
			return;
		}

		shouldClearResults = false;
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
	}

	function renderSuggestions(suggestions) {
		if (shouldClearResults) {
			handleProps();
			suggestionsContainer.innerHTML = "";
			return;
		}

		handleProps("hasPopup");

		suggestionsContainer.innerHTML = "";
		suggestions.forEach((suggestion) => {
			const suggestionOption = document.createElement("li");
			suggestionOption.role = "option";
			suggestionOption.innerHTML = suggestion.title;
			suggestionsContainer.appendChild(suggestionOption);
		});
	}

	function handleProps(state) {
		if (state === "hasPopup") {
			searchInput.setAttribute("aria-haspopup", true);
		} else {
			searchInput.setAttribute("aria-haspopup", false);
		}
	}
}

// On Document Ready
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch);
}
