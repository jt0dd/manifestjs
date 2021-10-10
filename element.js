const { Publisher, Element } = (() => {
  class Publisher {
    constructor(socket) {
      if (socket) this.socket = socket;
      this.events = {};
      this.data = {};
    }
    on(command, func, settings = {
      debug: false
    }) {
      const socket = settings.socket;
      const debug = settings.debug;
      if (!this.events[command])
        this.events[command] = [];
      this.events[command].push(func);
      if (debug) {
        console.log("listening for event: " + command + " [ socket forwarding = " + socket + " ]")
      }
      if (socket && this.socket) {
        this.socket.on(command, (data) => {
          func(data);
        });
      }
    }
    emit(command, data = {}, settings = {
      socket: true,
      debug: false
    }) {
      const socket = settings.socket
      const debug = settings.debug
      if (socket && this.socket) {
        if (debug) {
          console.log('event emitted: ' + command + ' payload: ' + data + ' [ socket forwarding = ' + socket + ' ]')
        }
        this.socket.emit(command, data)
      } else if (this.events[command]) {
        if (debug) {
          console.log('event emitted: ' + command + ' payload: ' + data + ' [ socket forwarding = ' + socket + ' ]')
        }
        this.events[command].forEach(func => {
          func(data)
        })
      }
    }
  }

  function isObjNotArray(obj) {
    return obj && typeof obj == 'object' && !Array.isArray(obj)
  }

  function isIterable(obj) {
    let type = false
    if (isObjNotArray(obj)) type = 'obj'
    else if (Array.isArray(obj)) type = 'arr'
    return type
  }

  function mergeDeep(source, target) {
    if (source === undefined) return target
    if (target === undefined) return source
    let allProps = [], sourceProps, targetProps, sourceType, targetType, type, merged, iterable, filler
    sourceType = isIterable(source)
    targetType = isIterable(target)
    type = sourceType
    if (source && target && sourceType != targetType) {
      throw 'source, target type mismatch'
    }
    if (sourceType == 'obj') {
      sourceProps = Object.keys(source)
    } else if (sourceType == 'arr') {
      sourceProps = source
    } else {
      return source
    }
    if (targetType == 'obj') {
      targetProps = Object.keys(target)
    } else if (targetType = 'arr') {
      targetProps = target;
    } else {
      throw 'mergeDeep target must be an Object or Array'
    }
    sourceProps.forEach(prop => {
      allProps.push(prop);
    })
    targetProps.forEach(prop => {
      allProps.push(prop);
    })
    allProps = [...new Set(allProps)]
    if (type == 'obj') {
      merged = {}
    } else if (type == 'arr') {
      merged = []
    }
    allProps.forEach(prop => {
      if (type == 'obj') {
        if (source[prop]) {
          if (isIterable(source[prop])) {
            if (isIterable(target[prop])) {
              merged[prop] = mergeDeep(source[prop], target[prop])
            } else {
              merged[prop] = source[prop]
            }
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
        iterable = isIterable(prop)
        if (iterable) {
          if (iterable == 'obj') {
            filler = {}
          } else if (iterable == 'arr') {
            filler = []
          }
          merged.push(mergeDeep(prop, filler))
        } else {
          merged.push(prop)
        }
      }
    })
    return merged
  }

  function searchTree(elementWrapper, selector, resultTarget, downward = false) {
    if (elementWrapper.parentWrapper && !downward) {
      searchChildren(elementWrapper, selector, resultTarget)
      if (!resultTarget.selection) {
        searchTree(elementWrapper.parentWrapper, selector, resultTarget)
      }
    } else {
      searchChildren(elementWrapper, selector, resultTarget)
    }
  }

  function searchChildren(elementWrapper, selector, resultTarget) {
    let children = elementWrapper.children, childWrapper, idSelector, parts
    if (children.length > 0) {
      for (let i = 0; i < children.length; i++) {
        childWrapper = children[i]
        if (childWrapper.id) {
          parts = childWrapper.id.split("#")
          idSelector = parts[parts.length - 1]
        }
        if (idSelector = selector || childWrapper.selector === selector) {
          resultTarget.selection = childWrapper
        } else {
          searchTree(childWrapper, selector, resultTarget, true)
        }
      }
    }
  }

  function applySettings(newSettings) {
    const defaults = {
      text: this.text === undefined ? false : this.text,
      innerHTML: this.innerHTML === undefined ? false : this.innerHTML,
      classes: this.classes === undefined ? [] : this.classes,
      actions: this.actions === undefined ? {} : this.actions,
      data: this.data === undefined ? {} : this.data,
      attributes: this.attributes === undefined ? {} : this.attributes,
      styles: this.styles === undefined ? {} : this.styles,
      cssClasses: this.cssClasses === undefined ? {} : this.cssClasses,
      traits: this.traits === undefined ? {} : this.traits,
      id: this.id === undefined ? false : this.id,
      callback: this.callback === undefined ? false : this.callback,
      ready: this.ready === undefined ? false : this.ready
    }
    const settings = mergeDeep(newSettings, defaults)
    if (settings === undefined) {
      throw "bad merge"
    }
    if (settings.id) {
      this.element.id = settings.id
      this.selector = settings.id
    }
    if (settings.text) this.element.textContent = settings.text
    if (settings.name) this.element.setAttribute('name', settings.name)
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
    if (!this.boundActions) this.boundActions = {}
    Object.keys(settings.actions).forEach(actionName => {
      if (!this.boundActions[actionName]) {
        this.boundActions[actionName] = true
        this.actions[actionName] = (...rest) => {
          return settings.actions[actionName](this, ...rest)
        }
      }
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

  let elemIndex = 0

  class Element {
    constructor(tag, settings) {
      this.elemID = elemIndex
      elemIndex++
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
      this.cachedStyle = {}
      this.element = document.createElement(tag)
      if (Array.isArray(settings)) {
        settings.forEach(obj => {
          applySettings.apply(this, [obj])
        })
      } else {
        applySettings.apply(this, [settings])
      }
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
    scrollTo(num = false) {
      if (num) this.element.scrollTop = num
      else this.element.scrollIntoView({behavior: "smooth", block: "center", inline: "center"});
    }
    focus() {
      this.element.focus()
    }
    hasClass(className) {
      return this.element.classList.contains(className)
    }
    getDims() {
      return this.element.getBoundingClientRect()
    }
    getData(key = False) {
      if (key) return this.data[key]
      else return this.data
    }
    delete() {
      if (this.parent) {
        if (this.parent.contains(this.element)) {
          this.parent.removeChild(this.element)
        }
      } else {
        document.body.removeChild(this.element)
      }
    }
    empty() {
      this.children.forEach(child => {
        child.delete()
      })
    }
    style(styleName, value) {
      this.element.style[styleName] = value
    }
    setStyles(styles) {
      Object.keys(styles).forEach(key => {
        this.style(key, styles[key])
      })
    }
    getStyle(styleName) {
      return this.element.style[styleName]
    }
    cacheStyle(styleName) {
      this.cachedStyle[styleName] = this.getStyle(styleName)
    }
    restoreStyle(styleName) {
      this.element.style[styleName] = this.cachedStyle[styleName]
    }
    clearStyle(styleName) {
      this.element.style[styleName] = ''
    }
    setHTML(html) {
      this.element.innerHTML = html
    }
    setText(text) {
      this.element.textContent = text
    }
    getText() {
      return this.element.textContent
    }
    setAttribute(attributeName, attributeContent) {
      this.element.setAttribute(attributeName, attributeContent)
    }
    getAttribute(attributeName) {
      return this.element.getAttribute(attributeName)
    }
    getValue() {
      return this.element.value
    }
    setValue(value) {
      this.element.value = value
    }
    addClass(className) {
      this.classes.push(className)
      this.element.classList.add(className)
      const cssClass = this.cssClasses[className]
      if (cssClass) {
        Object.keys(cssClass).forEach(cssProp => {
          this.style(cssProp, cssClass[cssProp])
        })
      }
    }
    setID(id) {
      this.element.id = id
    }
    removeClass(className) {
      this.classes = this.classes.filter(e => e !== className)
      this.element.classList.remove(className)
      let cssClass = this.cssClasses[className]
      if (cssClass) {
        Object.keys(cssClass).forEach(cssProp => {
          this.style(cssProp, "")
        })
        Object.keys(this.cssClasses).forEach(className => {
          cssClass = this.cssClasses[className]
          if (this.classes.includes(className)) {
            Object.keys(cssClass).forEach(cssProp => {
              this.style(cssProp, cssClass[cssProp])
            })
          }
        })
      }
    }
    on(evt, func) {
      if (Array.isArray(evt)) {
        evt.forEach(str => {
          this.element.addEventListener(str, func)
        })
      } else {
        this.element.addEventListener(evt, func)
      }
    }
    addEventListener(event, func) {
      this.element.addEventListener(event, func)
    }
    select(selector, refresh = false) {
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
      let element, wrapped = false
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
  return { Publisher, Element }
})()
