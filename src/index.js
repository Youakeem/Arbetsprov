import axios from "axios";
import throttle from "lodash/throttle";
import config from "./config";
import "./main.scss";

function suggestionsSearch() {
	const form = document.querySelector(".suggestionsSearch");
	const searchInput = document.querySelector(".searchBar");
	const suggestionsContainer = document.querySelector(".suggestionsContainer");
	const throttledGetSuggestions = throttle(getSuggestions, 500);

	let prevQuery = "";
	let selectedResult = 1;
	let shouldClearResults = true;

	// Automatically focus on search field on page load
	searchInput.focus();

	// Event handlers
	form.addEventListener("submit", (event) => event.preventDefault());
	searchInput.addEventListener("blur", () => clearSuggestions());
	searchInput.addEventListener("keyup", handleSearchInput);

	function handleSearchInput(event) {
		const { value: keyword } = event.target;

		// If input is empty, clear the suggestions menu
		if (keyword.length < 1) {
			clearSuggestions();
			return;
		}

		// ArrowDown
		if (event.keyCode === 40) {
			event.preventDefault();

			if (selectedResult < suggestionsContainer.children.length) {
				selectedResult++;
			} else {
				selectedResult = 1;
			}

			highlightSelectedResult();
		}

		// ArrowUp
		if (event.keyCode === 38) {
			event.preventDefault();

			if (selectedResult > 1) {
				selectedResult--;
			} else {
				selectedResult = suggestionsContainer.children.length;
			}

			highlightSelectedResult();
		}

		// ESC
		if (event.keyCode === 27 && suggestionsContainer.children.length) {
			clearSuggestions();
		}

		// Call the API
		throttledGetSuggestions(keyword);
	}

	// Private functions
	function getSuggestions(keyword) {
		if (keyword.trim() !== prevQuery.trim()) {
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

			// Set previous query to the current keyword
			prevQuery = keyword;
		}
	}

	function renderSuggestions(suggestions) {
		// If no suggestions
		if (shouldClearResults) {
			handleProps();
			selectedResult = 1;
			suggestionsContainer.innerHTML = "";
			return;
		}

		// If there are suggestions - toggle elements props
		handleProps("hasPopup");

		// Set selected result to the first option
		selectedResult = 1;

		// Rebuild suggestions list
		suggestionsContainer.innerHTML = "";
		suggestions.forEach((suggestion) => {
			const suggestionOption = document.createElement("li");
			suggestionOption.role = "option";
			suggestionOption.innerHTML = suggestion.title;
			suggestionsContainer.appendChild(suggestionOption);
		});

		// Highlight selected result
		highlightSelectedResult();
	}

	function clearSuggestions() {
		shouldClearResults = true;
		renderSuggestions();
	}

	function handleProps(state) {
		if (state === "hasPopup") {
			searchInput.setAttribute("aria-expanded", true);
		} else {
			searchInput.setAttribute("aria-expanded", false);
		}
	}

	function getResultIndex() {
		return selectedResult > 0 ? selectedResult - 1 : selectedResult;
	}

	function highlightSelectedResult() {
		var results = [ ...suggestionsContainer.children ];

		if (results.length) {
			for (let result of results) {
				result.classList.remove("chosen");
			}

			results[getResultIndex()].classList.add("chosen");
		}
	}
}

// On Document Ready
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch);
}
