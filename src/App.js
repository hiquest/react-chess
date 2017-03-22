import React, { Component } from 'react';
import './App.css';
import { BrowserRouter, Route } from 'react-router-dom';
import Home from './Home';
import Game from './Game';

export default class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <Route path="/" exact={true} component={Home} />
          <Route path="/:token" component={Game} />
        </div>
      </BrowserRouter>
    );
  }
}
