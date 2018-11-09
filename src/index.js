var suggestionsSearch = {
	init: function init() {
		this.form = document.querySelector(".suggestionsSearch");
		this.searchBar = document.querySelector(".searchBar");
		this.searchBarContainer = document.querySelector(".searchBarContainer");
		this.suggestionsContainer = document.querySelector(".suggestionsContainer");
		this.resultsNotifications = document.querySelector(".resultsNotifications");
		this.historyListContainer = document.querySelector(".searchHistory");
		this.historyList = document.querySelector(".historyList");

		this.throttledGetSuggestions = _.debounce(this.getSuggestions, 250);

		this.prevQuery = "";
		this.selectedResult = 1;
		this.shouldClearResults = true;
		this.historyEntries = [];
		this.config = {
			api_key: "49ae8291afdec560abe77eb8be0c5a6a",
			suggestionsLimit: 5
		};

		this.registerEventListeners();

		this.searchBar.focus();
	},

	registerEventListeners: function registerEventListeners() {
		this.form.addEventListener("submit", (event) => event.preventDefault());
		this.searchBar.addEventListener("blur", () => this.clearSuggestions.call(this));
		this.searchBar.addEventListener("keyup", this.handleSearchInput.bind(this));
		this.searchBar.addEventListener("keydown", this.handleSuggestionsSelect.bind(this));
		this.historyList.addEventListener("click", this.removeHistoryEntry.bind(this));
		this.suggestionsContainer.addEventListener("mousedown", this.handleSuggestionClick.bind(this));
	},

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

	handleSuggestionsSelect: function handleSuggestionsSelect(event) {
		var keyCode = event.which || event.keyCode;
		var suggestiosCount = this.suggestionsContainer.children.length;

		if (keyCode === 38 || keyCode === 40 || keyCode === 27 || keyCode === 13) {
			event.preventDefault();
		}

		// ArrowDown
		if (keyCode === 40) {
			if (this.selectedResult < suggestiosCount) {
				this.selectedResult++;
			} else {
				this.selectedResult = 1;
			}
		}

		// ArrowUp
		if (keyCode === 38) {
			if (this.selectedResult > 1) {
				this.selectedResult--;
			} else {
				this.selectedResult = suggestiosCount;
			}
		}

		// ESC
		if (keyCode === 27 && suggestiosCount) {
			this.clearSuggestions();
		}

		// Enter
		if (keyCode === 13) {
			var results = [].slice.call(this.suggestionsContainer.children);

			if (!results.length) {
				return;
			}

			var selected = results[this.getResultIndex()];

			this.addHistoryEntry(selected.textContent);
			this.clearSuggestions(true);
		}

		this.highlightSelectedResult();
	},

	handleSuggestionClick: function handleSuggestionClick(event) {
		this.addHistoryEntry(event.target.innerHTML);
	},

	clearSuggestions: function clearSuggestions(shouldClearInput) {
		if (shouldClearInput) {
			this.searchBar.value = "";
		}

		this.shouldClearResults = true;
		this.renderSuggestions();
		this.notifyScreenReaders(0);
	},

	getSuggestions: function getSuggestions(keyword) {
		this.shouldClearResults = false;

		axios
			.get(`https://api.themoviedb.org/3/search/movie?language=en-US&page=1&include_adult=false`, {
				params: {
					api_key: this.config.api_key,
					query: keyword
				}
			})
			.then((response) => {
				var suggestions = response.data.results.slice(0, this.config.suggestionsLimit);
				this.renderSuggestions(suggestions);
			})
			.catch((error) => {
				console.log(error);
			});

		this.prevQuery = keyword;
	},

	renderSuggestions: function renderSuggestions(suggestions) {
		if (this.shouldClearResults) {
			this.handleProps();
			this.selectedResult = 1;
			this.suggestionsContainer.innerHTML = "";
			return;
		}

		this.handleProps(true);
		this.selectedResult = 1;

		this.suggestionsContainer.innerHTML = "";
		suggestions.forEach((suggestion) => {
			var suggestionOption = document.createElement("li");
			suggestionOption.setAttribute("role", "option");
			suggestionOption.innerHTML = suggestion.title;
			this.suggestionsContainer.appendChild(suggestionOption);
		});

		this.highlightSelectedResult();
		this.notifyScreenReaders(suggestions.length);
	},

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

		const entryIndex = this.historyEntries.map((entry) => entry.title).indexOf(entryTitle);

		if (entryIndex < 0) {
			this.historyEntries.push(suggestion);
			this.renderHistory();
		}
	},

	removeHistoryEntry: function removeHistoryEntry(event) {
		var button = event.target.closest("button");
		if (!button) return;

		var suggestionTitle = [].find.call(button.parentNode.children, (child) => child.nodeName === "H6");
		var newEntries = this.historyEntries.filter((entry) => entry.title !== suggestionTitle.innerHTML);

		this.historyEntries = newEntries;
		this.renderHistory();
	},

	renderHistory: function renderHistory() {
		if (!this.historyEntries.length) {
			this.historyListContainer.classList.add("hidden");
		} else {
			this.historyListContainer.classList.remove("hidden");
		}

		this.historyList.innerHTML = "";
		this.historyEntries.forEach((entry) => {
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

			this.historyList.appendChild(element);
		});
	},

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

	highlightSelectedResult: function highlightSelectedResult() {
		var results = [].slice.call(this.suggestionsContainer.children);
		var selected = results[this.getResultIndex()];

		if (results.length) {
			for (let result of results) {
				result.setAttribute("id", "");
				result.setAttribute("aria-selected", false);
			}

			this.searchBar.setAttribute("aria-activedescendant", "chosen");
			selected.setAttribute("id", "chosen");
			selected.setAttribute("aria-selected", true);
		}
	},

	notifyScreenReaders: function notifyScreenReaders(suggestionsCount) {
		if (suggestionsCount) {
			this.resultsNotifications.innerHTML =
				"You have " + suggestionsCount + " suggestions. Use the UP and DOWN keys to navigate them.";
			return;
		}

		this.resultsNotifications.innerHTML = "";
	},

	getResultIndex: function getResultIndex() {
		return this.selectedResult > 0 ? this.selectedResult - 1 : this.selectedResult;
	}
};

// On Document Ready
if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
	suggestionsSearch.init();
} else {
	document.addEventListener("DOMContentLoaded", suggestionsSearch.init.bind(suggestionsSearch));
}
