## Manifest.js

My focus in building Manifest.js (which is under 500 lines of code) was to:

- avoid the need to work with any HTML or CSS files,
- write any HTML multiline strings within the JS,
- tightly couple each element of the UI with the code dictating its style and behavior,
- looseley coupled modular design overall

## Why another web app framework?

Rather than explain the difference, I'll show why I felt this framework design was more to my preference for building single-page web applications.
Consider this iOS Messenger clone:

![iOS messenger](https://www.iosapptemplates.com/wp-content/uploads/2018/09/chat-iphone-app-template-firebase-swift.png)

To compare Manifest.js to top web app frameworks **Vue.js**, **React.js**, and **Angular.js**, above you'll find working replicas of this UI built with each:

- Vue.js

- React.js

- Angular.js

- Manifest.js

But first...

## Basic Usage

Each Element is a wrapper for a DOM element. It provides straight-forward control over styles, behaviors, event handling, text, and anything you can change about a DOM element.

`new Element(<tag name>, { settings })`

Each element is attached to another with `append` or `appendTo`.

`new Element(<tag name>, { settings }).appendTo(<DOM Element> or another <Element>)`

Within the `settings` we fully control the DOM elment, with intuitive controls such as:

- `text`
- `innerHTML`
- `classes`
- `attributes`
- `styles`
- `id`

And app helper controls such as:

- `data`: Simply a preferred place to hold data associated with an Element's behavior.
- `traits` Like the `data` property, but passed down by reference to all decendants of the Element
- `actions` Preferred place to hold repeatable functions triggered by the Element's event listener
- `childClasses`: Define CSS classes applicable to children of an Element.

With a final `ready` property kicking off the behavior of the Element, including event emitters & listeners, and often appendage of child elements.

Like so:

```
new Element(<tag name>, {
    ready: self => {
        self.on("click", () => {
            // do something
        })
        self.append(new Element("div", { settings }))
    }
})
```

And to put it all together:

```
{
    text: "Hello World Manifest.js!",
    classes: ["app-wrapper"],
    styles: {
      "background-color": "#272830"
    },
    actions: {
      doStuff: self = {}
    },
    childClasses: {
      "button": {
        "padding": "5px",
        "border-style": "solid",
        "border-width": "1px",
        "color": "gray"
      }
    }, 
    traits: { // like the data property, but passed down by reference to all children of the Element
      publisher: new Publisher() // built in by default for easy communication between Elements anywhere in the app
    },
    ready: self => {
        self.on("click", () => {
            // do stuff
        })
        for (let i = 0; i < 10; i++) {
            self.append(new Element("div", { ... }))
        }
    }
}
```
