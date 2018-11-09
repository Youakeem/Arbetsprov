// Debounce - Used for the api calls to prevent too many requests error
function debounce(func, wait) {
	var timeout;
	return function(...args) {
		var context = this;
		clearTimeout(timeout);
		timeout = setTimeout(function() {
			func.apply(context, args);
		}, wait);
	};
}

var suggestionsSearch = {
	init: function init() {
		// Setup DOM refs
		this.form = document.querySelector(".suggestionsSearch");
		this.searchBar = document.querySelector(".searchBar");
		this.searchBarContainer = document.querySelector(".searchBarContainer");
		this.suggestionsContainer = document.querySelector(".suggestionsContainer");
		this.resultsNotifications = document.querySelector(".resultsNotifications");
		this.historyListContainer = document.querySelector(".searchHistory");
		this.historyList = document.querySelector(".historyList");

		// Debounce the Ajax calls
		this.throttledGetSuggestions = debounce(this.getSuggestions, 250);

		// Setup application "State"
		this.prevQuery = "";
		this.selectedResult = 1;
		this.historyEntries = [];

		this.config = {
			api_key: "49ae8291afdec560abe77eb8be0c5a6a",
			suggestionsLimit: 5
		};

		// Register event listeners
		this.registerEventListeners();

		// Focus search bar on page load
		this.searchBar.focus();
	},

	/**
	 * Register dom event listeners
	 */
	registerEventListeners: function registerEventListeners() {
		this.form.addEventListener("submit", function(event) {
			event.preventDefault();
		});
		this.searchBar.addEventListener("blur", this.handleSearchBlur.bind(this));
		this.searchBar.addEventListener("keyup", this.handleSearchInput.bind(this));
		this.searchBar.addEventListener("keydown", this.handleSuggestionsSelect.bind(this));
		this.historyList.addEventListener("click", this.removeHistoryEntry.bind(this));
		this.suggestionsContainer.addEventListener("mousedown", this.handleSuggestionClick.bind(this));
	},

	/**
	 * Check if search bar is populated and calls the API function
	 * @param event keyup event
	 */
	handleSearchInput: function handleSearchInput(event) {
		var keyword = event.target.value;

		if (keyword.length < 1) {
			this.clearSuggestions();
			return;
		}

		if (keyword.trim() !== this.prevQuery.trim()) {
			this.throttledGetSuggestions(keyword);
		}
	},

	/**
	 * Handle the navigation and selection of suggestions list
	 * @param event keydown event
	 */
	handleSuggestionsSelect: function handleSuggestionsSelect(event) {
		var keyCode = event.which || event.keyCode;
		var suggestiosCount = this.suggestionsContainer.children.length;

		// If up, down, esc, or enter we don't wanna default behaviour
		if (keyCode === 38 || keyCode === 40 || keyCode === 27 || keyCode === 13) {
			event.preventDefault();
		}

		// ArrowDown - decrease the currently selected item index
		if (keyCode === 40) {
			if (this.selectedResult < suggestiosCount) {
				this.selectedResult++;
			} else {
				this.selectedResult = 1;
			}
		}

		// ArrowUp - increase the currently selected item index
		if (keyCode === 38) {
			if (this.selectedResult > 1) {
				this.selectedResult--;
			} else {
				this.selectedResult = suggestiosCount;
			}
		}

		// ESC - close suggestions list
		if (keyCode === 27 && suggestiosCount) {
			this.clearSuggestions();
		}

		// Enter - select the current suggestion
		if (keyCode === 13) {
			var results = [].slice.call(this.suggestionsContainer.children);

			// Ignore if field is empty
			if (!results.length) {
				return;
			}

			var selected = results[this.getSelectedIndex()];

			this.addHistoryEntry(selected.textContent);
			this.clearSuggestions(true);
		}

		this.highlightSelectedResult();
	},

	/**
	 * Closes the suggestions list on field blur
	 */
	handleSearchBlur: function handleSuggestionClick() {
		this.clearSuggestions();
	},

	/**
	 * Add clicked suggestion to the history
	 * @param event mousedown event
	 */
	handleSuggestionClick: function handleSuggestionClick(event) {
		this.addHistoryEntry(event.target.innerHTML);
	},

	/**
	 * Removes the suggestions panel
	 * @param boolean `true` to clear search field
	 */
	clearSuggestions: function clearSuggestions(shouldClearInput) {
		if (shouldClearInput) {
			this.searchBar.value = "";
		}

		this.renderSuggestions(null);
		this.notifyScreenReaders(0);
	},

	/**
	 * Call the API and get a list of suggestions
	 * @param string Search Keyword
	 */
	getSuggestions: function getSuggestions(keyword) {
		var request = new XMLHttpRequest();
		var self = this;

		request.open(
			"GET",
			"https://api.themoviedb.org/3/search/movie?api_key=" +
				this.config.api_key +
				"&query=" +
				keyword +
				"&language=en-US&page=1&include_adult=false",
			true
		);

		request.onload = function() {
			if (request.status >= 200 && request.status < 400) {
				// Success!
				var data = JSON.parse(request.responseText);
				var suggestions = data.results.slice(0, self.config.suggestionsLimit);
				self.renderSuggestions(suggestions);
			} else {
				// We reached our target server, but it returned an error
				console.log("API Error!");
			}
		};

		request.onerror = function() {
			console.log("Request Failed!");
		};

		request.send();

		// Set the previous keyword variable to the current one - Prevents calling the api on navigation
		this.prevQuery = keyword;
	},

	/**
	 * Build suggestions list
	 * @param array Suggestions objects - pass `null` to clear the list
	 */
	renderSuggestions: function renderSuggestions(suggestions) {
		var self = this;

		// If no suggestions, clear the list
		if (!suggestions) {
			this.handleProps();
			this.selectedResult = 1;
			this.suggestionsContainer.innerHTML = "";
			return;
		}

		this.handleProps(true);

		// Reset the selected result
		this.selectedResult = 1;

		// Clear the current suggestions and then rebuild the list
		this.suggestionsContainer.innerHTML = "";
		suggestions.forEach(function(suggestion) {
			var suggestionOption = document.createElement("li");
			suggestionOption.setAttribute("role", "option");
			suggestionOption.innerHTML = suggestion.title;

			self.suggestionsContainer.appendChild(suggestionOption);
		});

		this.highlightSelectedResult();
		this.notifyScreenReaders(suggestions.length);
	},

	/**
	 * Construct the history entry object and push it to the `historyEntries` state variable
	 * @param string Suggestion Title
	 */
	addHistoryEntry: function addHistoryEntry(entryTitle) {
		var currentDate = new Date();
		var dateAndTime =
			currentDate.getFullYear() +
			"-" +
			(currentDate.getMonth() + 1) +
			"-" +
			currentDate.getDate() +
			" " +
			currentDate.getHours() +
			":" +
			currentDate.getMinutes();

		var suggestion = {
			title: entryTitle,
			date: dateAndTime
		};

		var entryIndex = this.historyEntries
			.map(function(entry) {
				return entry.title;
			})
			.indexOf(entryTitle);

		if (entryIndex < 0) {
			this.historyEntries.push(suggestion);
			this.renderHistory();
		}
	},

	/**
	 * Remove the clicked item from the `historyEntries` state variable
	 * @param event click event
	 */
	removeHistoryEntry: function removeHistoryEntry(event) {
		var button = event.target.closest("button");
		if (!button) return;

		var suggestionTitle = [].find.call(button.parentNode.children, function(child) {
			return child.nodeName === "H6";
		});
		var newEntries = this.historyEntries.filter(function(entry) {
			return entry.title !== suggestionTitle.innerHTML;
		});

		this.historyEntries = newEntries;
		this.renderHistory();
	},

	/**
	 * Build the history list - it depends on the `historyEntries` state variable for it's data
	 */
	renderHistory: function renderHistory() {
		var self = this;

		if (!this.historyEntries.length) {
			this.historyListContainer.classList.add("hidden");
		} else {
			this.historyListContainer.classList.remove("hidden");
		}

		this.historyList.innerHTML = "";
		this.historyEntries.forEach(function(entry) {
			var element = document.createElement("li");
			element.classList.add("historyItem");

			element.innerHTML =
				"<div class='inner'><time>" +
				entry.date +
				"</time><h6>" +
				entry.title +
				"</h6><button aria-label='Delete" +
				entry.title +
				"history entry'><span>X</span></button>";

			self.historyList.appendChild(element);
		});
	},

	/**
	 * Toggle the aria attributes for the search and suggestions list
	 * @param boolean Whether the suggestions list is expanded or not
	 */
	handleProps: function handleProps(expanded) {
		if (expanded) {
			this.searchBarContainer.setAttribute("aria-haspopup", true);
			this.searchBarContainer.setAttribute("aria-expanded", true);
			this.suggestionsContainer.setAttribute("aria-expanded", true);
		} else {
			this.searchBarContainer.setAttribute("aria-haspopup", false);
			this.searchBarContainer.setAttribute("aria-expanded", false);
			this.suggestionsContainer.setAttribute("aria-expanded", false);
		}
	},

	/**
	 * Highlight the current suggestion in the suggestions panel
	 */
	highlightSelectedResult: function highlightSelectedResult() {
		var results = [].slice.call(this.suggestionsContainer.children);
		var selected = results[this.getSelectedIndex()];

		if (results.length) {
			for (var result of results) {
				result.setAttribute("id", "");
				result.setAttribute("aria-selected", false);
			}

			this.searchBar.setAttribute("aria-activedescendant", "chosen");
			selected.setAttribute("id", "chosen");
			selected.setAttribute("aria-selected", true);
		}
	},

	/**
	 * Construct a message for screen readers with instruction to navigate the suggestions panel
	 * @param number How many suggestions do we have
	 */
	notifyScreenReaders: function notifyScreenReaders(suggestionsCount) {
		if (suggestionsCount) {
			this.resultsNotifications.innerHTML =
				"You have " + suggestionsCount + " suggestions. Use the UP and DOWN keys to navigate them.";
			return;
		}

		this.resultsNotifications.innerHTML = "";
	},

	/**
	 * Get the currently selected suggestion index
	 */
	getSelectedIndex: function getResultIndex() {
		return this.selectedResult > 0 ? this.selectedResult - 1 : this.selectedResult;
	}
};

// On Document Ready fire up the initilization
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch.init();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch.init.bind(suggestionsSearch));
}
