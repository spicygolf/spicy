import { find } from 'lodash';



class ScoringWrapper {

  constructor(scoring, currentHole) {
    this._scoring = scoring;
    this._currentHole = parseInt(currentHole);
  }

  getPrevHole() {
    const prev = find(this._scoring.holes, {
      hole: (this._currentHole-1).toString()
    });
    return prev;
  }

}

export default ScoringWrapper;
