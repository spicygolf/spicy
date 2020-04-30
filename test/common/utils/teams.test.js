import {
  getHolesToUpdate,
} from 'common/utils/teams';



describe('common/utils/teams tests', () => {

  // getHolesToUpdate
  test('getHolesToUpdate - never', () => {

    const game = {
      scope: {
        holes: 'all18',
        teams_rotate: 'never',
      },
    };

    const holes = Array.from(Array(18).keys()).map(x => (++x).toString());

    expect(getHolesToUpdate(game.scope.teams_rotate, game)).toEqual(holes);

  });

  test('getHolesToUpdate - rest of nine - hole 1', () => {

    const game = {
      scope: {
        holes: 'all18',
        teams_rotate: 'never',
      },
    };

    const holes = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    expect(getHolesToUpdate('rest_of_nine', game, '1')).toEqual(holes);

  });

  test('getHolesToUpdate - rest of nine - hole 7', () => {

    const game = {
      scope: {
        holes: 'all18',
        teams_rotate: 'never',
      },
    };

    const holes = ['7', '8', '9'];

    expect(getHolesToUpdate('rest_of_nine', game, '7')).toEqual(holes);

  });

  test('getHolesToUpdate - rest of nine - hole 9', () => {

    const game = {
      scope: {
        holes: 'all18',
        teams_rotate: 'never',
      },
    };

    const holes = ['9'];

    expect(getHolesToUpdate('rest_of_nine', game, '9')).toEqual(holes);

  });

  test('getHolesToUpdate - rest of nine - hole 10', () => {

    const game = {
      scope: {
        holes: 'all18',
        teams_rotate: 'never',
      },
    };

    const holes = ['10', '11', '12', '13', '14', '15', '16', '17', '18'];

    expect(getHolesToUpdate('rest_of_nine', game, '10')).toEqual(holes);

  });

  test('getHolesToUpdate - rest of nine - hole 15', () => {

    const game = {
      scope: {
        holes: 'all18',
        teams_rotate: 'never',
      },
    };

    const holes = ['15', '16', '17', '18'];

    expect(getHolesToUpdate('rest_of_nine', game, '15')).toEqual(holes);

  });


});
