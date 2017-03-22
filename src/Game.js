import React from 'react';

const { firebase, Chess, ChessBoard } = window;

const INITIAL_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

export default class Game extends React.Component {

  constructor({ match: { params: { token } } }) {
    super();
    this.state = { token };
    this.engine = new Chess();
  }

  componentDidMount() {
    const token = this.state.token;
    const engine = this.engine;

    listenForUpdates(token, (id, game) => {

      const playerNum = figurePlayer(token, game);
      this.engine.load(game.fen || INITIAL_FEN);

      const onDragStart = (source, piece) => {
        return !engine.game_over() &&
          isMyTurn(playerNum, engine.turn()) &&
          allowMove(engine.turn(), piece);
      };

      const onDrop = (source, target) => {
        const m = engine.move({
          from: source,
          to: target,
          promotion: 'q'
        });
        if (m === null) return "snapback";

        game.fen = engine.fen();
        game.moves = pushMove(game.moves, `${m['from']}-${m['to']}`);

        games(id).set(game);
      };

      const onSnapEnd = () => {
        return this.board.position(engine.fen());
      };

      if (!this.board) {
        this.board = initBoard(playerNum, onDragStart, onDrop, onSnapEnd);
        this.board.position(engine.fen());
      } else if (isMyTurn(playerNum, engine.turn())) {
        this.board.position(engine.fen());
      }

      this.setState({
        moves: game.moves.split(","),
        p1_token: game.p1_token,
        p2_token: game.p2_token,
        turnText: turnText(playerNum, isMyTurn(playerNum, engine.turn())),
        statusText: statusText(engine.turn(), engine.in_checkmate(), engine.in_draw(), engine.in_check())
      });

    });
  }

  render() {
    return (
      <div className='view row'>
        <div className='column column-50'>
          <div id='game-board'></div>
        </div>
        <div className='column column-50'>
          <div className="links">
            <div>Player 1: <a href={domain() + "/" + this.state.p1_token}>{domain()}/{this.state.p1_token}</a></div>
            <div>Player 2: <a href={domain() + "/" + this.state.p2_token}>{domain()}/{this.state.p2_token}</a></div>
          </div>
          <blockquote>
            <h5 className='turn'>{ this.state.turnText }</h5>
            <h5 className='status'>{ this.state.statusText }</h5>
          </blockquote>
          <p className='history'>{ history(this.state.moves) }</p>
        </div>
      </div>
    );
  }
}

function initBoard(playerNum, onDragStart, onDrop, onSnapEnd) {
  const config = {
    draggable: true,
    pieceTheme: "https://s3-us-west-2.amazonaws.com/chessimg/{piece}.png",
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  };

  const board = ChessBoard('game-board', config);
  if (playerNum === 2) {
    board.orientation('black');
  }
  return board;
}

function history(moves = []) {
  return moves.map((m, idx) => <span key={m}>{idx + 1}) {m}</span>);
}

function listenForUpdates(token, cb) {

  gameByToken("p1_token", token).on('value', (ref) => {
    const [id, game] = parse(ref.val());
    if (!id) return;
    cb(id, game);
  });
  gameByToken("p2_token", token).on('value', (ref) => {
    const [id, game] = parse(ref.val());
    if (!id) return;
    cb(id, game);
  });
}

function parse(tree) {
  if (!tree) return [];
  const keys = Object.keys(tree);
  const id = keys[0];
  const game = tree[id];
  return [id, game];
}

function gameByToken(key, token) {
  const db = firebase.database().ref("/games");
  return db
    .orderByChild(key)
    .equalTo(token);
}

function games(id) {
  return firebase
    .database()
    .ref(`/games/${id}`);
}

function domain() {
  const { hostname, port } = window.location;
  return `http://${hostname}:${port}`;
}

function pushMove(moves, move) {
  if (!moves) {
    return [move].join(",");
  } else {
    const arr = moves.split(",");
    return [...arr, move].join(",");
  }
}

function isMyTurn(playerNum, turn) {
  return (playerNum === 1 && turn === 'w') || (playerNum === 2 && turn === 'b');
}

function allowMove(turn, piece) {
  return !(turn === 'w' && piece.search(/^b/) !== -1) || (turn === 'b' && piece.search(/^w/) !== -1);
}

function figurePlayer(token, { p1_token, p2_token }) {
  if (token === p1_token) {
    return 1;
  } else if (token === p2_token) {
    return 2;
  } else {
    return 0;
  }
}

function turnText(playerNum, isMyTurn) {
  if (playerNum > 0) {
    if (isMyTurn) {
      return "Your Turn";
    } else {
      return "Waiting for opponent's move...";
    }
  } else {
    return "View Only";
  }

}

function statusText(turn, in_mate, in_draw, in_check) {
  const moveColor = turn === 'b' ? "Black" : "White";
  if (in_mate)
    return `Game Over, ${moveColor} is in checkmate`;
  else if (in_draw)
    return 'Game over, drawn position';
  else if (in_check)
    return `${moveColor} is in check!`;
  else
    return "";
}
