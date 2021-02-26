class Publisher {
  constructor(socket) {
    if (socket) this.socket = socket
    this.events = {}
    this.data = {}
  }
  on(command, func, socket = true) {
    if (!this.events[command]) this.events[command] = []
    this.events[command].push(func)
    if (socket && this.socket) this.socket.on(command, func)
  }
  emit(command, data = {}, socket = false) {
    if (this.events[command]) {
      this.events[command].forEach(func => func(data))
    }
    if (socket && this.socket) this.socket.emit(command, data)
  }
}

/**
 * Tests whether the argument is of type 'object' and not an array
 * @param {Object} obj - The variable to ensure
 * @return {boolean} - Whether or not the passed argument is a non-array object
 */
function isObjNotArray(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(item)
}

/**
 * Classifies the argument as an Object or Array, or neither
 * @param {Object} obj - The variable to ensure
 * @return {string|boolean} - A string classfying the argument as 'obj' or 'arr', or false for neither
 */
function isIterable(obj) {
  let type = false
  if (isObjNotArray(obj)) type = 'obj'
  else if (Array.isArray(obj)) type = 'arr'
  return type
}

/**
 * Recursively merge erge the contents of a source object into a target object including all iterable contents
 * @param {Object|Array} source - The Object or Array to be merged from
 * @param {Object|Array} target - The Object or Array to be merged into
 * @return {Object} - The recursively merged result of the contents of both objects
 */
function mergeDeep(source, target) {
  let allProps = [],
    sourceProps, type, targetProps
  if (isObjNotArray(source)) {
    sourceProps = Object.keys(source)
    type = 'obj'
  } else if (Array.isArray(source)) {
    sourceProps = source
    type = 'arr'
  } else {
    return source
  }
  if (isObjNotArray(target)) {
    targetProps = Object.keys(target)
  } else if (Array.isArray(target)) {
    targetProps = target
  } else {
    debugger
    throw "target missing"
  }
  sourceProps.forEach(prop => {
    allProps.push(prop)
  })
  targetProps.forEach(prop => {
    allProps.push(prop)
  })
  allProps = [...new Set(allProps)]
  let merged
  if (type == 'obj') {
    merged = {}
  } else if (type == 'arr') {
    merged = []
  }
  allProps.forEach(prop => {
    if (type == "obj") {
      if (source[prop]) {
        if (isIterable(source[prop])) {
          if (isIterable(target[prop])) {
            merged[prop] = mergeDeep(source[prop], target[prop])
          } else merged[prop] = source[prop]
        } else {
          merged[prop] = source[prop]
        }
      } else {
        if (source[prop] !== undefined) {
          merged[prop] = source[prop]
        } else {
          merged[prop] = target[prop]
        }
      }
    } else {
      let iterable = isIterable(prop)
      if (iterable) {
        let filler
        if (iterable == "obj") filler = {}
        else if (iterable == "arr") filler = []
        merged.push(mergeDeep(prop, filler))
      } else {
        merged.push(prop)
      }
    }
  })
  return merged
}

/**
 * Search the full Manifest.js heirarchy of ElementWrappers for an ElementWrapper with a matching classname
 * @param {Object} elementWrapper - The Manifest.js ElementWrapper to search
 * @param {string} selector - The classname to search for
 * @param {Object} resultTarget - A storage object to accumulate results upon rcursive calls of the function
 * @param {Object} downward - Whether or not to search child ElementWrappers (used to prevent circular searching)
 * @return {void} - The results have been passed by reference to the resultTarget object
 */
const searchTree = (elementWrapper, selector, resultTarget, downward = false) => {
  if (elementWrapper.parentWrapper && !downward) {
    searchChildren(elementWrapper, selector, resultTarget)
    if (!resultTarget.selection) searchTree(elementWrapper.parentWrapper, selector, resultTarget)
  } else {
    searchChildren(elementWrapper, selector, resultTarget)
  }
}

/**
 * Search the Manifest.js heirarchy of child ElementWrappers for an ElementWrapper with a matching classname
 * @param {Object} elementWrapper - The Manifest.js ElementWrapper to search
 * @param {string} selector - The classname to search for
 * @param {Object} resultTarget - A storage object to accumulate results upon rcursive calls of the function
 * @return {void} - The results have been passed by reference to the resultTarget object
 */
const searchChildren = (elementWrapper, selector, resultTarget) => {
  let children = elementWrapper.children
  if (children.length > 0) {
    for (let i = 0; i < children.length; i++) {
      const childWrapper = children[i]
      let idSelector
      if (childWrapper.id) {
        const parts = childWrapper.id.split("#")
        idSelector = parts[parts.length - 1]
      }
      if (idSelector === selector || childWrapper.selector === selector) {
        resultTarget.selection = childWrapper
      } else {
        searchTree(childWrapper, selector, resultTarget, true)
      }
    }
  }
}

/**
 * Handles application of new settings and defaults into a Manifest.js Element
 * @param {Object} newSettings - The Manifest.js ElementWrapper settings to apply
 * @return {Object} - The applied context is returned for method chaining
 */
const applySettings = function (newSettings) {
  const settings = mergeDeep(newSettings, {
    text: false,
    innerHTML: false,
    classes: [],
    actions: {},
    data: {},
    attributes: {},
    styles: {},
    cssClasses: {},
    traits: {},
    id: false,
    callback: false,
    ready: false,
  })
  if (settings.id) {
    this.element.id = settings.id
    this.selector = settings.id
  }
  if (settings.text) this.element.textContent = settings.text
  if (settings.innerHTML) this.element.innerHTML = settings.innerHTML
  if (settings.selector) {
    this.selector = settings.selector
    this.selectors[settings.selector] = this
  }
  this.classes = []
  settings.classes.forEach(className => {
    this.element.classList.add(className)
    this.classes.push(className)
  })
  Object.keys(settings.attributes).forEach(attributeName => this.element.setAttribute(attributeName, settings.attributes[attributeName]))
  Object.keys(settings.styles).forEach(styleName => this.element.style[styleName] = settings.styles[styleName])
  Object.keys(settings.data).forEach(propertyName => this.data[propertyName] = settings.data[propertyName])
  Object.keys(settings.traits).forEach(propertyName => this.traits[propertyName] = settings.traits[propertyName])
  Object.keys(settings.cssClasses).forEach(propertyName => this.cssClasses[propertyName] = settings.cssClasses[propertyName])
  Object.keys(settings.actions).forEach(actionName => this.actions[actionName] = (...rest) => {
    settings.actions[actionName](this, ...rest)
    return this
  })
  if (settings.callback) this.callback = settings.callback
  if (settings.ready) {
    if (typeof this.ready === "function") {
      const originalReadyFunc = this.ready
      this.ready = []
      this.ready.push(originalReadyFunc)
      this.ready.push(settings.ready)
    } else {
      this.ready = settings.ready
    }
  }
}

module.exports = class {
  constructor(tag, settings) {
    this.readyComplete = new Set()
    this.settings = settings
    this.children = []
    this.data = {}
    this.actions = {}
    this.traits = {}
    this.selectors = {}
    this.styles = {}
    this.cssClasses = {}
    this.selectionCache = {}
    this.element = document.createElement(tag)
    applySettings.apply(this, [settings])
  }
  preload(url) {
    const arr = []
    if (!Array.isArray(url)) {
      arr.push(url)
    }
    arr.forEach(url => {
      const img = new Image()
      img.src = url
    })
  }
  use(settings) {
    let mergedSettings = mergeDeep(settings, this.settings)
    applySettings.apply(this, [mergedSettings])
    if (settings.callback) settings.callback(this)
    return this
  }
  addEventListener(event, func) {
    this.element.addEventListener(event, func)
  }
  scrollTo(num) {
    if (num) this.element.scrollTop = num
    else this.element.scrollIntoView()
  }
  hasClass(className) {
    return this.element.classList.contains(className)
  }
  getDims() {
    return this.element.getBoundingClientRect()
  }
  getData() {
    return this.data
  }
  delete() {
    if (this.parent.contains(this.element)) {
      this.parent.removeChild(this.element)
    }
  }
  style(styleName, value) {
    this.element.style[styleName] = value
  }
  getStyle(styleName) {
    return this.element.style[styleName]
  }
  clearStyle(styleName) {
    this.element.style[styleName] = ""
  }
  updateHTML(html) {
    this.element.innerHTML = html
  }
  updateText(text) {
    this.element.textContent = text
  }
  updateAttribute(attributeName, attributeContent) {
    this.element.setAttribute(attributeName, attributeContent)
  }
  addClass(className) {
    this.classes.push(className)
    this.element.classList.add(className)
    const cssClass = this.cssClasses[className]
    if (cssClass) {
      Object.keys(cssClass).forEach(cssProp => {
        this.style(cssProp, cssClass[cssProp])
      })
    } else {
      console.log("this[", this, "] class list[", this.cssClasses, "] missing added class:", className)
    }
  }
  removeClass(className) {
    this.classes = this.classes.filter(e => e !== className)
    this.element.classList.remove(className)
    const cssClass = this.cssClasses[className]
    Object.keys(cssClass).forEach(cssProp => {
      this.style(cssProp, "")
    })
    Object.keys(this.cssClasses).forEach(className => {
      const cssClass = this.cssClasses[className]
      if (this.classes.includes(className)) {
        Object.keys(cssClass).forEach(cssProp => {
          this.style(cssProp, cssClass[cssProp])
        })
      }
    })
  }
  on(evt, func) {
    this.element.addEventListener(evt, func)
  }
  select(selector, refresh) {
    let selectorParts = selector.split("#")
    selector = selectorParts[selectorParts.length - 1]
    let cached = this.selectionCache[selector]
    if (!cached || refresh) {
      let selectionObj = {}
      searchTree(this, selector, selectionObj)
      this.selectionCache[selector] = selectionObj.selection
      return selectionObj.selection
    } else {
      return cached
    }
  }
  init() {
    if (this.parentWrapper && this.parentWrapper.traits) Object.keys(this.parentWrapper.traits).forEach(traitKey => {
      if (this.traits[traitKey] && this.parentWrapper.traits[traitKey]) {
        this.traits[traitKey] = mergeDeep(this.traits[traitKey], this.parentWrapper.traits[traitKey])
      } else {
        this.traits[traitKey] = this.parentWrapper.traits[traitKey]
      }
    })
    if (this.parentWrapper && this.parentWrapper.cssClasses) Object.keys(this.parentWrapper.cssClasses).forEach(cssClassName => {
      if (this.cssClasses[cssClassName] && this.parentWrapper.cssClasses[cssClassName]) {
        this.cssClasses[cssClassName] = mergeDeep(this.cssClasses[cssClassName], this.parentWrapper.cssClasses[cssClassName])
      } else {
        this.cssClasses[cssClassName] = this.parentWrapper.cssClasses[cssClassName]
      }
    })
    this.children.forEach(childWrapper => {
      if (this.traits) childWrapper.traits = this.traits
      if (this.cssClasses) childWrapper.cssClasses = this.cssClasses
    })
    Object.keys(this.cssClasses).forEach(className => {
      const cssClass = this.cssClasses[className]
      if (this.classes.includes(className)) {
        Object.keys(cssClass).forEach(cssProp => {
          this.style(cssProp, cssClass[cssProp])
        })
      }
    })
    if (this.ready && this.ready !== true) {
      if (typeof this.ready == "function" && !this.readyComplete.has(this.ready)) {
        this.readyComplete.add(this.ready)
        this.ready(this)
        this.ready = true
      } else if (Array.isArray(this.ready)) {
        this.ready.forEach(func => {
          if (!this.readyComplete.has(func)) {
            this.readyComplete.add(func)
            func(this)
          }
        })
        this.ready = true
      } else {
        throw "bad ready func"
      }
    }
    if (this.callback) this.callback(this)
    return this
  }
  appendTo(elementWrapper) {
    let element
    if (elementWrapper.nodeName) element = elementWrapper
    else {
      element = elementWrapper.element
      this.parent = element
      this.parentWrapper = elementWrapper
      elementWrapper.children.push(this)
    }
    element.appendChild(this.element)
    return this.init()
  }
  append(elementWrapper) {
    let element
    let wrapped = false
    if (elementWrapper.nodeName) element = elementWrapper
    else {
      wrapped = true
      element = elementWrapper.element
      elementWrapper.parent = this.element
      elementWrapper.parentWrapper = this
      this.children.push(elementWrapper)
    }
    this.element.appendChild(element)
    elementWrapper.init()
    return elementWrapper
  }
}
