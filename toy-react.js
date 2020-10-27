const RENDER_TO_DOM = Symbol("render to dom");

export class Component {
  constructor() {
    this.props = Object.create(null);
    this.children = [];
    this._root = null;
    this._range = null;
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    this._vdom = this.vdom;
    this._vdom[RENDER_TO_DOM](range);
  }
  update() {
    let isSameNode = (oldNode, newNode) => {
      if (oldNode.type !== newNode.type) {
        return false;
      }
      for (const name in newNode.props) {
        if (oldNode.props[name] !== newNode.props[name]) {
          return false;
        }
      }
      if (Object.keys(oldNode.props).length > Object.keys(newNode.props).length) {
        return false;
      }
      if (newNode.type === '#text') {
        if (newNode.content !== oldNode.content) {
          return false;
        }
      }
      return true;
    };
    let update = (oldNode, newNode) => {
      if (!isSameNode(oldNode, newNode)) {
        newNode[RENDER_TO_DOM](oldNode._range);
        return;
      }
      newNode._range = oldNode._range;

      let newChildren = newNode.vchildren;
      let oldChildren = oldNode.vchildren;

      if (!newChildren || !newChildren.length) {
        return;
      }
      let tailRange = oldChildren[oldChildren.length - 1]._range;
      for (let i = 0; i < newChildren.length; i++) {
        let newChild = newChildren[i];
        let oldChild = oldChildren[i];
        if (i < oldChildren.length) {
          update(oldChild, newChild);
        } else {
          let range = document.createRange();
          range.setStart(tailRange.endContainer, tailRange.endOffset);
          range.setEnd(tailRange.endContainer, tailRange.endOffset);
          newChild[RENDER_TO_DOM](range);
          tailRange = range;
        }
      }

    };
    let vdom = this.vdom;
    update(this._vdom, vdom);
    this._vdom = vdom;
  }
  get vdom() {
    return this.render().vdom;
  }
  // get vchildren() {
  //   return this.children.map(child => child.vdom);
  // }
  /*
  rerender() {
    let oldRange = this._range;
    let range = document.createRange();
    range.setStart(oldRange.startContainer, oldRange.startOffset);
    range.setEnd(oldRange.startContainer, oldRange.startOffset);
    range.deleteContents();
    this[RENDER_TO_DOM](range);

    oldRange.setStart(range.endContainer, range.endOffset);
    oldRange.deleteContents();
  }
  */
  setState(newState) {
    if (this.state === null || typeof this.state !== 'object') {
      this.state = newState;
      this.update();
      return;
    }

    let merge = (oldState, newState) => {
      for (const p in newState) {
        if (oldState[p] === null || typeof oldState[p] !== 'object') {
          oldState[p] = newState[p];
        } else {
          merge(oldState[p], newState[p]);
        }
      }
    };

    merge(this.state, newState);
    this.update();
  }
}

class ElementWrapper extends Component{
  constructor(type) {
    super(type);
    this.type = type;
    this.root = document.createElement(type);
  }
  /*
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
    } else {
      if (name === 'className') {
        this.root.setAttribute('class', value);
      } else {
        this.root.setAttribute(name, value);
      }
    }
  }
  appendChild(component) {
    let range = document.createRange();
    range.setStart(this.root, this.root.childNodes.length);
    range.setEnd(this.root, this.root.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
  }
  */
  get vdom() {
    this.vchildren = this.children.map(child => child.vdom);
    return this;
    /*
    return {
      type: this.type,
      props: this.props,
      children: this.children.map(child => child.vdom)
    }
    */
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    const root = document.createElement(this.type);

    for (const name in this.props) {
      let value = this.props[name];
      if (name.match(/^on([\s\S]+)$/)) {
        root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
      } else {
        if (name === 'className') {
          root.setAttribute('class', value);
        } else {
          root.setAttribute(name, value);
        }
      }
    }

    if (!this.vchildren) {
      this.vchildren = this.children.map(child => child.vdom);
    }
    for (const child of this.vchildren) {
      let childRange = document.createRange();
      childRange.setStart(root, root.childNodes.length);
      childRange.setEnd(root, root.childNodes.length);
      childRange.deleteContents();
      child[RENDER_TO_DOM](childRange);
    }
    replaceContent(range, root);
  }
}

class TextWrapper extends Component{
  constructor(content) {
    super(content);
    this.content = content;
    this.type = "#text";
  }
  get vdom() {
    return this;
    /*
    return {
      type: "#text",
      content: this.content
    };
    */
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    const root = document.createTextNode(this.content);
    replaceContent(range, root);
  }
}

function replaceContent(range, node) {
  range.insertNode(node);
  range.setStartAfter(node);
  range.deleteContents();

  range.setStartBefore(node);
  range.setEndAfter(node);
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

      if (child === null) {
        continue;
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
