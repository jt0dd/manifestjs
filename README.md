My focus in building Manifest.js (which is under 500 lines of code) was to:

- avoid the need to work with any HTML or CSS files,
- write any HTML multiline strings within the JS,
- tightly couple each element of the UI with the code dictating its style and behavior,
- looseley coupled modular design overall

## Why another web app framework?

Rather than explain the difference, I'll show why I felt this framework design was more to my preference for building single-page web applications.
Consider this iOS Messenger clone:

![iOS messenger](https://www.iosapptemplates.com/wp-content/uploads/2018/09/chat-iphone-app-template-firebase-swift.png)

To compare Manifest.js to top web app frameworks **Vue.js**, **React.js**, and **Angular.js**, here are working replicas of this UI built with each:

- Vue.js

- React.js

- Angular.js

But first, basic usage:

Each Element is a wrapper for a DOM element. It provides easy contro over styles, behaviors, event handling, text, and anything you can change about a DOM element.

`new Element(<tag name>, { settings })`

Each element is attached to another with `append` or `appendTo`.

`new Element(<tag name>, { settings }).appendTo(<DOM Element> or another <Element>)`

Within the `settings` we fully control the DOM elment:

