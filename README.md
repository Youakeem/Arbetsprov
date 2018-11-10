## Table of contents
- [Table of contents](#table-of-contents)
- [Summary](#summary)
- [Technologies](#technologies)
- [Expected Behaviour](#expected-behaviour)
    - [Search bar](#search-bar)
    - [History/Watch List](#historywatch-list)
- [Usage](#usage)

## Summary
This application enable the user to search TMDB (The Movie Data Base) API by title and add movie suggestions to a history/watch list.

## Technologies
The application is built with HTML5, CSS3, and ES5 Vanilla JS.

## Expected Behaviour
### Search bar
- Provide an autocomplete suggestions list from TMDB API
- Pressing the DOWN key will navigate down the suggestions list
- Pressing the UP key will navigate up the suggestions list
- If you press UP while on the first option, the last result will be highlighted
- If you press DOWN while on the last option, the first result will be highlighted
- Pressing ENTER right after typing will add the first result to the watch list and clear the search field
- Navigating to a specific suggestion and pressing ENTER will add it to the watch list and clear the search field
- Clicking on a suggestion by mouse will add it to the watch list and clear the search field
- Clicking outside of the search field will close the suggestions panel
- Pressing ESC will close the suggestions panel

### History/Watch List
- List chosen suggestions with the time and date of selection
- On desktop: Hovering over an entry will display a delete button
- Clicking the delete button removes this entry from the list
- On mobile: The time and date is repositioned to give more space for the movie titles
- On mobile: The delete buttons are always visible

## Usage
Open the [index.html](src/index.html) in a web browser
