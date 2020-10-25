const RENDER_TO_DOM = Symbol("render to dom");

class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
  }
  setAttribute(name, value) {
    this.root.setAttribute(name, value);
  }
  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

class TextWrapper {
  constructor(content) {
    this.root = document.createTextNode(content);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      this.props[name] = value;
    }
  }
  appendChild(component) {
    this.children.push(component);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    this.render()[RENDER_TO_DOM](range);
  }
  rerender() {
    this._range.deleteContents();
    this[RENDER_TO_DOM](this._range);
  }
  // setState(newState) {
  //   let merge = 
  // }
}

export function createElement(type, attributes, ...children) {
  let ele = null;
  if (typeof type === "string") {
    ele = new ElementWrapper(type);
  } else {
    ele = new type();
  }

  for (const attr in attributes) {
    ele.setAttribute(attr, attributes[attr]);
  }
  const insertChildren = (children) => {
    for (const child of children) {
      if (typeof child === "string") {
        child = new TextWrapper(child);
      }
      if (typeof child === "object" && child instanceof Array) {
        insertChildren(child);
      } else {
        ele.appendChild(child);
      }
    }
  };
  insertChildren(children);
  return ele;
}

export function render(component, parentNode) {
  let range = document.createRange();
  range.setStart(parentNode, 0);
  range.setEnd(parentNode, parentNode.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
}
