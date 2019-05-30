// キャンパスの高さと幅を設定
var boardWidth = 512;
var boardHeight = 256;
var canvas;
var context;
//カウンター変数を設定
var counter = 0; //0で初期化

// 最終フレームの変数を設定
var lastTime;

// パックのインスタンスを作成する
var puck;

var paddle1;
var paddle2;

// スコアを記録する変数を作成
var score1 = 0;
var score2 = 0;

var BoardDirection = {
  Left: 0,
  Right: 1
};

// パックオブジェクトの作成
function Puck(x, y) {
  var self = this;

  self.radius = 5;
  self.x = x;
  self.y = y;
  // 速度変数の追加
  self.speed = 0.5;
  self.vel = {
    x: 0.2,
    y: 0.1
  };

  normalize(self.vel);

  //パックの位置を更新する関数
  self.update = function (dt) {
    //パック水平方向に動かす
    self.x += self.vel.x * self.speed * dt;
    //パック垂直方向に動かす
    self.y += self.vel.y * self.speed * dt;

    // 下の壁の跳ね返り
    if(self.y + self.radius > boardHeight) {
      self.vel.y *= -1;
      self.y = boardHeight - self.radius;
    }

    // 右の壁の跳ね返り
    if (self.x + self.radius > boardWidth) {
        self.reset(BoardDirection.Right);
        score1 ++;
    }

    // 上の壁の跳ね返り
    if (self.y - self.radius < 0) {
      self.vel.y *= -1;
      self.y = self.radius;
    }

    // 左の壁の跳ね返り
    if (self.x - self.radius < 0) {
        self.reset(BoardDirection.Left);
        score2 ++;
    }

  }

  self.draw = function (context) {
    var fillColor = "white";

    if (self.collidesWithPaddle(paddle1) || self.collidesWithPaddle(paddle2)) {
      fillColor = "red";
    }
    context.fillStyle = fillColor;
    context.beginPath();
    context.arc(self.x, self.y, self.radius, 0, 2 * Math.PI);
    context.fill();
  }

  // パックの再配置
  self.reset = function (boardDirection) {
    self.x = boardWidth / 2;
    self.y = boardHeight /2;

    var randomPoint;

  // パックの進行方向
    if (boardDirection === BoardDirection.Left) {

      randomPoint = {
        x: 0,
        y: Math.random() * boardHeight
      };

    } else if (boardDirection === BoardDirection.Right) {

      randomPoint = {
        x: boardWidth,
        y: Math.random() * boardHeight
      };
    }

    self.vel = {
      x: randomPoint.x - self.x,
      y: randomPoint.y - self.y
    };

    // 向きを正規化する
    normalize(self.vel);
  }

  self.collidesWithPaddle = function (paddle) {
    var closestPoint = self.closestPointOnPaddle(paddle);

    var diff = {
      x: self.x - closestPoint.x,
      y: self.y - closestPoint.y
    };
    var length = Math.sqrt(diff.x * diff.x + diff.y * diff.y);

    return length < self.radius;
  };

  // 最も近い点を取得する
  self.closestPointOnPaddle = function (paddle) {
    return {
      x: clamp(self.x, paddle.x - paddle.halfWidth, paddle.x + paddle.halfWidth),
      y: clamp(self.y, paddle.y - paddle.halfHeight, paddle.y + paddle.halfHeight),
    };
  };

  // 簡単な跳ね返りを作る
  self.handlePaddleCollision = function (paddle) {
    var collisionHappened = false;

    while (self.collidesWithPaddle(paddle)) {
      self.x -= self.vel.x;
      self.y -= self.vel.y;

      collisionHappened = true;
    }

    if(collisionHappened) {
      var closestPoint = self.closestPointOnPaddle(paddle);
      // 法線ベクトルの計算
      var normal = {
        x: self.x - closestPoint.x,
        y: self.y -closestPoint.y
      };

      // 単位ベクトル化
      normalize(normal);

      // 法線を使った跳ね返り
      var dotProd = dot(self.vel, normal);

      self.vel.x = self.vel.x - (2 * dotProd * normal.x);
      self.vel.y = self.vel.y - (2 * dotProd * normal.y);

      // self.vel.x *= -1;
    }
  };
}

// パドルクラスを定義する
function Paddle(x, upKeyCode, downKeyCode) {
  var self = this;
  self.x = x;
  self.y = boardHeight / 2;
  // パドルに幅と高さを追加する
  self.halfWidth = 5;
  self.halfHeight = 20;
  // パドルの移動速度を定義する
  self.moveSpeed = 0.5;
  // 押されたボタンを判定する
  self.upButtonPressed = false;
  self.downButtonPressed = false;
  self.upKeyCode = upKeyCode;
  self.downKeyCode = downKeyCode;

  // キーが押された時の処理
  self.onKeyDown = function (keyCode) {
    if (keyCode === self.upKeyCode) {
      self.upButtonPressed = true;
    }
    if (keyCode === self.downKeyCode) {
      self.downButtonPressed = true;
    }
  };

  // キーが離された時の処理
  self.onKeyUp = function (keyCode) {
    if (keyCode === self.upKeyCode) {
      self.upButtonPressed = false;
    }
    if (keyCode === self.downKeyCode) {
      self.downButtonPressed = false;
    }
  };

  // パドルを動かす
  self.update = function (dt) {
    if (self.upButtonPressed) {
      self.y -= self.moveSpeed * dt;
    }

    if (self.downButtonPressed) {
      self.y += self.moveSpeed * dt;
    }

    if (self.y - self.halfHeight < 0) {
      self.y = self.halfHeight;
    }

    if (self.y + self.halfHeight > boardHeight) {
      self.y = self.boardHeight - self.halfHeight;
    }

  };


  self.draw = function (context) {
    // パドルを作成する
    context.fillStyle = "white";

    context.fillRect(
      self.x - self.halfWidth,
      self.y - self.halfHeight,
      self.halfWidth * 2,
      self.halfHeight * 2
    );
  };
}

// 円の中心と最も近い長方形の外周の点を計算する
function clamp(val, min, max) {
  return Math.max(min, Math.min(max,val));
}

function vecLength(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function normalize(v) {
  var len = vecLength(v);

  if (len > 0) {
    v.x /= len;
    v.y /= len;
  }
}

function dot(u,v) {
  return u.x * v.x + u.y * v.y;
}

function init() {
  // キャンバスの高さと幅を設定
  canvas = document.getElementById("game-canvas");
  canvas.width = boardWidth;
  canvas.height = boardHeight;
  // パックのインスタンスを作成
  puck = new Puck(100, 100);
  // キーコードを渡してパドルを動かす
  paddle1 = new Paddle(10, 87, 83);
  paddle2 = new Paddle(boardWidth - 10, 38, 40);

  // keydownイベントの取得
  document.addEventListener("keydown", function (e) {
    e.preventDefault();

    paddle1.onKeyDown(e.keyCode);
    paddle2.onKeyDown(e.keyCode);
  });

  // keyupイベントの取得
  document.addEventListener("keyup", function (e) {
    e.preventDefault();

    paddle1.onKeyUp(e.keyCode);
    paddle2.onKeyUp(e.keyCode);
  });

  // キャンバスから２Dのcontextを取得
  context = canvas.getContext("2d");

  // 現在時刻のミリ秒を取得
  lastTime = performance.now();

  // ゲーム終了を知らせる関数
  function gameIsOver() {
    return score1 >= 11 || score2 >= 11;
  }
}

//フレーム毎のゲーム状態を更新する機能
function update(dt) {
  puck.update(dt);
  paddle1.update(dt);
  paddle2.update(dt);

  puck.handlePaddleCollision(paddle1);
  puck.handlePaddleCollision(paddle2);
}

  // スコアを描画する
  function drawScore(context, score, boardDirection) {
    var score = String(score);
    context.font = "20px Sans";
    var width = context.measureText(score).width;
    var centerOffset = 60;

    if(boardDirection === BoardDirection.Left) {
      context.fillText(score, (boardWidth / 2) - width - centerOffset, 30);
    } else {
      context.fillText(score, (boardWidth / 2) + centerOffset, 30);
    }
  }

// ゲームの状態をキャンバスに書き出す機能
function render(dt) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  puck.draw(context);
  // パドルを描画する
  paddle1.draw(context);
  paddle2.draw(context);

  drawScore(context, score1, BoardDirection.Left);
  drawScore(context, score2, BoardDirection.Right);
}

// main関数でupdateとrender関数を呼び出す
function main() {
  var now = performance.now(); //現在時刻のミリ秒を取得
  var dt = now - lastTime; //フレームの時刻と現在時刻の差を作成
  // フレーム間の時刻差を制限する
  var maxFrameTime = 1000 / 60;

  if(dt > maxFrameTime) {
    dt = maxFrameTime;
  }
  update(dt);
  render(dt);

  // フレーム毎に時間を計測する
  lastTime = now;

  requestAnimationFrame(main);
}

init(); //ゲームの初期化
main(); //ループの呼び出し
