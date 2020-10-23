import { createElement, render, Component } from './toy-react';

class MyComponent extends Component{
  render() {
    return (<div>
      <h1>my component</h1>
      {this.children}
    </div>)
  }
}

render(<MyComponent id='a' class='c'> 
  <div>abc</div>
  <div>efg</div>
  <div>hyz</div>
</MyComponent>, document.body);