pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/mimc.circom";
include "./consts.circom";

function isMatch(guess, ship, len) {
  if (ship[2] == 0) { // Down
    return
      guess[0] == ship[0] &&
      guess[1] >= ship[1] &&
      guess[1] <  ship[1] + len;
  } else { // Right
    return
      guess[1] == ship[1] &&
      guess[0] >= ship[0] &&
      guess[0] <  ship[0] + len;
  }
}

template BattleshipMove() {
  // Public Inputs:
  signal input boardHash;
  signal input guess[2]; // [x,y]
  // Private Inputs:
  signal input ships[5][3]; // [x,y,direction]

  signal output isHit;

  var boardSize = getBoardSize();
  var lengths[5] = getShipLengths();

  // 1. validate the guess is actually valid
  assert(guess[0] >= 0 && guess[0] < boardSize);
  assert(guess[1] >= 0 && guess[1] < boardSize);

  // 2. validate the inputted ships matches the public hash

  component mimc = MiMC7(91);

  var multiplier = 1;
  var sum = 0;
  for (var i = 0; i < 5; i++) {
    var val =  ships[i][0] + (ships[i][1] * 16) + (ships[i][2] * 16 * 16);
    sum += val * multiplier;
    multiplier *= 16 ** 3;
  }

  mimc.x_in <== sum;
  mimc.k <== 0;

  assert(boardHash == mimc.out);

  // 3. check if it's a hit
  isHit <-- (
    isMatch(guess, ships[0], lengths[0]) ||
    isMatch(guess, ships[1], lengths[1]) ||
    isMatch(guess, ships[2], lengths[2]) ||
    isMatch(guess, ships[3], lengths[3]) ||
    isMatch(guess, ships[4], lengths[4])
  );
}

component main {public [boardHash, guess]} = BattleshipMove();
