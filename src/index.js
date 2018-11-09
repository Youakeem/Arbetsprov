import axios from "axios";
import debounce from "lodash/debounce";
import config from "./config";
import "./main.scss";

function suggestionsSearch() {
	const form = document.querySelector(".suggestionsSearch");
	const searchBar = document.querySelector(".searchBar");
	const searchBarContainer = document.querySelector(".searchBarContainer");
	const suggestionsContainer = document.querySelector(".suggestionsContainer");
	const resultsNotifications = document.querySelector(".resultsNotifications");
	const historyListContainer = document.querySelector(".searchHistory");
	const historyList = document.querySelector(".historyList");

	const throttledGetSuggestions = debounce(getSuggestions, 250);

	let prevQuery = "";
	let selectedResult = 1;
	let shouldClearResults = true;
	let historyEntries = [];

	// Automatically focus on search field on page load
	searchBar.focus();

	// Event handlers
	form.addEventListener("submit", (event) => event.preventDefault());
	searchBar.addEventListener("blur", () => clearSuggestions());
	searchBar.addEventListener("keyup", handleSearchInput);
	searchBar.addEventListener("keydown", handleSuggestionsSelect);
	historyList.addEventListener("click", removeHistoryEntry);
	suggestionsContainer.addEventListener("mousedown", handleSuggestionClick);

	function handleSearchInput(event) {
		const { value: keyword } = event.target;

		// If input is empty, clear the suggestions menu
		if (keyword.length < 1) {
			clearSuggestions();
			return;
		}

		// // Call the API
		if (keyword.trim() !== prevQuery.trim()) {
			throttledGetSuggestions(keyword);
		}
	}

	function handleSuggestionsSelect(event) {
		const keyCode = event.which || event.keyCode;

		if (keyCode === 38 || keyCode === 40 || keyCode === 27 || keyCode === 13) {
			event.preventDefault();
		}

		// ArrowDown
		if (keyCode === 40) {
			if (selectedResult < suggestionsContainer.children.length) {
				selectedResult++;
			} else {
				selectedResult = 1;
			}
		}

		// ArrowUp
		if (keyCode === 38) {
			if (selectedResult > 1) {
				selectedResult--;
			} else {
				selectedResult = suggestionsContainer.children.length;
			}
		}

		// ESC
		if (keyCode === 27 && suggestionsContainer.children.length) {
			clearSuggestions();
		}

		// Enter
		if (keyCode === 13) {
			const results = [ ...suggestionsContainer.children ];
			const selected = results[getResultIndex()];

			addHistoryEntry(selected.textContent);
			clearSuggestions(true);
		}

		highlightSelectedResult();
	}

	// Private functions
	function handleSuggestionClick(event) {
		addHistoryEntry(event.target.innerHTML);
	}

	function addHistoryEntry(entryTitle) {
		const currentDate = new Date();
		const dateAndTime = `${currentDate.getFullYear()}-${currentDate.getMonth() +
			1}-${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}`;

		const suggestion = {
			title: entryTitle,
			date: dateAndTime
		};

		const entryIndex = historyEntries.map((entry) => entry.title).indexOf(entryTitle);

		if (entryIndex < 0) {
			historyEntries.push(suggestion);
			renderHistory();
		}
	}

	function removeHistoryEntry(event) {
		let button = event.target.closest("button");
		if (!button) return;

		const suggestionTitle = [].find.call(button.parentNode.children, (child) => child.nodeName === "H6");

		const newEntries = historyEntries.filter((entry) => entry.title !== suggestionTitle.innerHTML);

		historyEntries = newEntries;
		renderHistory();
	}

	function getSuggestions(keyword) {
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

	function renderSuggestions(suggestions) {
		// If no suggestions
		if (shouldClearResults) {
			handleProps();
			selectedResult = 1;
			suggestionsContainer.innerHTML = "";
			return;
		}

		// If there are suggestions - toggle elements props
		handleProps(true);

		// Set selected result to the first option
		selectedResult = 1;

		// Rebuild suggestions list
		suggestionsContainer.innerHTML = "";
		suggestions.forEach((suggestion) => {
			const suggestionOption = document.createElement("li");
			suggestionOption.setAttribute("role", "option");
			suggestionOption.innerHTML = suggestion.title;
			suggestionsContainer.appendChild(suggestionOption);
		});

		// Highlight selected result
		highlightSelectedResult();

		// Notify screen readers with the change
		notifyScreenReaders(suggestions.length);
	}

	function renderHistory() {
		// Rebuild history list
		if (!historyEntries.length) {
			historyListContainer.classList.add("hidden");
		} else {
			historyListContainer.classList.remove("hidden");
		}

		historyList.innerHTML = "";
		historyEntries.forEach((entry) => {
			const element = document.createElement("li");
			element.classList.add("historyItem");

			element.innerHTML =
				"<div class='inner'><time>" +
				entry.date +
				"</time><h6>" +
				entry.title +
				"</h6><button aria-label='Delete" +
				entry.title +
				"history entry'><span>X</span></button>";

			historyList.appendChild(element);
		});
	}

	function clearSuggestions(shouldClearInput) {
		shouldClearResults = true;

		if (shouldClearInput) {
			searchBar.value = "";
		}

		renderSuggestions();
		notifyScreenReaders(0);
	}

	function notifyScreenReaders(suggestionsCount) {
		if (suggestionsCount) {
			resultsNotifications.innerHTML = `You have ${suggestionsCount} suggestions. Use the UP and DOWN keys to navigate them.`;
			return;
		}

		resultsNotifications.innerHTML = "";
	}

	function handleProps(expanded) {
		if (expanded) {
			searchBarContainer.setAttribute("aria-haspopup", true);
			searchBarContainer.setAttribute("aria-expanded", true);
			suggestionsContainer.setAttribute("aria-expanded", true);
		} else {
			searchBarContainer.setAttribute("aria-haspopup", false);
			searchBarContainer.setAttribute("aria-expanded", false);
			suggestionsContainer.setAttribute("aria-expanded", false);
		}
	}

	function getResultIndex() {
		return selectedResult > 0 ? selectedResult - 1 : selectedResult;
	}

	function highlightSelectedResult() {
		const results = [ ...suggestionsContainer.children ];
		const selected = results[getResultIndex()];

		if (results.length) {
			for (let result of results) {
				result.setAttribute("id", "");
				result.setAttribute("aria-selected", false);
			}

			searchBar.setAttribute("aria-activedescendant", "chosen");
			selected.setAttribute("id", "chosen");
			selected.setAttribute("aria-selected", true);
		}
	}
}

// On Document Ready
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch);
}
