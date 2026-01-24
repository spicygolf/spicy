/**
 * Scoring Explorer
 *
 * Visual tool for testing and understanding the scoring engine.
 * Allows selecting a GameSpec, configuring mock players/teams,
 * entering scores, and visualizing the pipeline output.
 */

import { useCallback, useMemo, useState } from "react";
import {
  parseLogicCondition,
  parseScoreToParCondition,
  rankWithTies,
} from "spicylib/scoring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// =============================================================================
// Types
// =============================================================================

interface MockPlayer {
  id: string;
  name: string;
  handicap: number;
  teamId: string;
}

interface JunkOptionBase {
  name: string;
  type: "junk";
  value: number;
  scope: "player" | "team";
  based_on: string;
}

interface ScoreToParJunkOption extends JunkOptionBase {
  scope: "player";
  score_to_par: string;
}

interface LogicJunkOption extends JunkOptionBase {
  scope: "player";
  logic: string;
}

interface TeamCalcJunkOption extends JunkOptionBase {
  scope: "team";
  calculation: string;
}

type JunkOption = ScoreToParJunkOption | LogicJunkOption | TeamCalcJunkOption;

interface GameSpec {
  name: string;
  description: string;
  playerCount: number;
  hasTeams: boolean;
  teamSize: number;
  junkOptions: JunkOption[];
}

interface HoleResultDisplay {
  playerId: string;
  playerName: string;
  teamId: string;
  gross: number;
  pops: number;
  net: number;
  scoreToPar: number;
  rank: number;
  tieCount: number;
  junk: string[];
  points: number;
}

interface TeamResultDisplay {
  teamId: string;
  lowBall: number;
  total: number;
  rank: number;
  tieCount: number;
  junk: string[];
  points: number;
}

// =============================================================================
// Sample Data
// =============================================================================

const SAMPLE_GAME_SPECS: GameSpec[] = [
  {
    name: "Five Points",
    description: "2v2 team game, 5 points per hole (3 low ball, 2 low total)",
    playerCount: 4,
    hasTeams: true,
    teamSize: 2,
    junkOptions: [
      {
        name: "low_ball",
        type: "junk",
        value: 3,
        scope: "team",
        calculation: "best_ball",
        based_on: "net",
      },
      {
        name: "low_total",
        type: "junk",
        value: 2,
        scope: "team",
        calculation: "sum",
        based_on: "net",
      },
      {
        name: "birdie",
        type: "junk",
        value: 1,
        scope: "player",
        score_to_par: "exactly -1",
        based_on: "gross",
      },
      {
        name: "eagle",
        type: "junk",
        value: 2,
        scope: "player",
        score_to_par: "exactly -2",
        based_on: "gross",
      },
    ],
  },
  {
    name: "Ten Points",
    description: "3-player individual game, 10 points per hole",
    playerCount: 3,
    hasTeams: false,
    teamSize: 1,
    junkOptions: [
      {
        name: "outright_winner",
        type: "junk",
        value: 5,
        scope: "player",
        logic: "{'rankWithTies': [1, 1]}",
        based_on: "net",
      },
      {
        name: "2nd_place",
        type: "junk",
        value: 3,
        scope: "player",
        logic: "{'rankWithTies': [2, 1]}",
        based_on: "net",
      },
      {
        name: "3rd_place",
        type: "junk",
        value: 2,
        scope: "player",
        logic: "{'rankWithTies': [3, 1]}",
        based_on: "net",
      },
      {
        name: "2_way_tie_1st",
        type: "junk",
        value: 4,
        scope: "player",
        logic: "{'rankWithTies': [1, 2]}",
        based_on: "net",
      },
      {
        name: "2_way_tie_2nd",
        type: "junk",
        value: 2,
        scope: "player",
        logic: "{'rankWithTies': [2, 2]}",
        based_on: "net",
      },
      {
        name: "all_tie",
        type: "junk",
        value: 3.33,
        scope: "player",
        logic: "{'rankWithTies': [1, 3]}",
        based_on: "net",
      },
      {
        name: "birdie",
        type: "junk",
        value: 1,
        scope: "player",
        score_to_par: "exactly -1",
        based_on: "gross",
      },
    ],
  },
];

const DEFAULT_PLAYERS: MockPlayer[] = [
  { id: "p1", name: "Alice", handicap: 10, teamId: "1" },
  { id: "p2", name: "Bob", handicap: 15, teamId: "1" },
  { id: "p3", name: "Carol", handicap: 8, teamId: "2" },
  { id: "p4", name: "Dave", handicap: 12, teamId: "2" },
];

// =============================================================================
// Type Guards
// =============================================================================

function isScoreToParJunk(junk: JunkOption): junk is ScoreToParJunkOption {
  return "score_to_par" in junk;
}

function isLogicJunk(junk: JunkOption): junk is LogicJunkOption {
  return "logic" in junk;
}

function isTeamCalcJunk(junk: JunkOption): junk is TeamCalcJunkOption {
  return "calculation" in junk;
}

// =============================================================================
// Component
// =============================================================================

export function ScoringExplorer(): React.JSX.Element {
  // State
  const [selectedSpecIndex, setSelectedSpecIndex] = useState(0);
  const [players, setPlayers] = useState<MockPlayer[]>(DEFAULT_PLAYERS);
  const [holePar, setHolePar] = useState(4);
  const [holeAllocation, setHoleAllocation] = useState(5);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("setup");

  const selectedSpec = SAMPLE_GAME_SPECS[selectedSpecIndex] as GameSpec;

  // Adjust players when spec changes
  const handleSpecChange = useCallback((index: number): void => {
    setSelectedSpecIndex(index);
    const spec = SAMPLE_GAME_SPECS[index];
    if (!spec) return;

    const newPlayers: MockPlayer[] = [];
    for (let i = 0; i < spec.playerCount; i++) {
      const teamId = spec.hasTeams
        ? String(Math.floor(i / spec.teamSize) + 1)
        : String(i + 1);
      newPlayers.push({
        id: `p${i + 1}`,
        name: `Player ${i + 1}`,
        handicap: 10 + i * 2,
        teamId,
      });
    }
    setPlayers(newPlayers);
    setScores({});
  }, []);

  // Calculate pops for a player on this hole
  const calculatePops = useCallback(
    (handicap: number): number => {
      if (handicap > 0) {
        return handicap >= holeAllocation ? 1 : 0;
      }
      if (handicap < 0) {
        const absHandicap = Math.abs(handicap);
        return holeAllocation > 18 - absHandicap ? -1 : 0;
      }
      return 0;
    },
    [holeAllocation],
  );

  // Calculate results
  const results = useMemo(() => {
    // Build player results
    const playerResults: HoleResultDisplay[] = players.map((player) => {
      const gross = scores[player.id] || 0;
      const pops = calculatePops(player.handicap);
      const net = gross > 0 ? gross - pops : 0;
      const scoreToPar = gross > 0 ? gross - holePar : 0;

      return {
        playerId: player.id,
        playerName: player.name,
        teamId: player.teamId,
        gross,
        pops,
        net,
        scoreToPar,
        rank: 0,
        tieCount: 0,
        junk: [],
        points: 0,
      };
    });

    // Filter to players with scores
    const playersWithScores = playerResults.filter(
      (p: HoleResultDisplay) => p.gross > 0,
    );

    if (playersWithScores.length === 0) {
      return { players: playerResults, teams: [] };
    }

    // Rank players by net
    const ranked = rankWithTies(
      playersWithScores,
      (p: HoleResultDisplay) => p.net,
      "lower",
    );
    for (const { item, rank, tieCount } of ranked) {
      const player = playerResults.find(
        (p: HoleResultDisplay) => p.playerId === item.playerId,
      );
      if (player) {
        player.rank = rank;
        player.tieCount = tieCount;
      }
    }

    // Evaluate player junk
    for (const player of playerResults) {
      if (player.gross === 0) continue;

      for (const junk of selectedSpec.junkOptions) {
        if (junk.scope !== "player") continue;

        // Score-to-par based junk
        if (isScoreToParJunk(junk)) {
          const condition = parseScoreToParCondition(junk.score_to_par);
          if (condition) {
            const scoreToCheck =
              junk.based_on === "net"
                ? player.net - holePar
                : player.scoreToPar;
            let matches = false;
            if (condition.operator === "exactly") {
              matches = scoreToCheck === condition.value;
            } else if (condition.operator === "at_most") {
              matches = scoreToCheck <= condition.value;
            } else if (condition.operator === "at_least") {
              matches = scoreToCheck >= condition.value;
            }
            if (matches) {
              player.junk.push(junk.name);
              player.points += junk.value;
            }
          }
        }

        // Logic-based junk (ranking)
        if (isLogicJunk(junk)) {
          const logicCondition = parseLogicCondition(junk.logic);
          if (
            logicCondition &&
            player.rank === logicCondition.rank &&
            player.tieCount === logicCondition.tieCount
          ) {
            player.junk.push(junk.name);
            player.points += junk.value;
          }
        }
      }
    }

    // Calculate team results
    const teamResults: TeamResultDisplay[] = [];

    if (selectedSpec.hasTeams) {
      const teamIds = [...new Set(players.map((p) => p.teamId))];

      for (const teamId of teamIds) {
        const teamPlayers = playerResults.filter(
          (p: HoleResultDisplay) => p.teamId === teamId,
        );
        const teamNets = teamPlayers
          .filter((p: HoleResultDisplay) => p.net > 0)
          .map((p: HoleResultDisplay) => p.net);

        if (teamNets.length === 0) continue;

        // Simple team calculation - best ball (min) and total (sum)
        const lowBall = Math.min(...teamNets);
        const total = teamNets.reduce((sum, n) => sum + n, 0);

        teamResults.push({
          teamId,
          lowBall,
          total,
          rank: 0,
          tieCount: 0,
          junk: [],
          points: 0,
        });
      }

      // Rank teams by low ball
      if (teamResults.length > 0) {
        const rankedTeams = rankWithTies(
          teamResults,
          (t: TeamResultDisplay) => t.lowBall,
          "lower",
        );
        for (const { item, rank, tieCount } of rankedTeams) {
          const team = teamResults.find(
            (t: TeamResultDisplay) => t.teamId === item.teamId,
          );
          if (team) {
            team.rank = rank;
            team.tieCount = tieCount;
          }
        }

        // Evaluate team junk
        for (const team of teamResults) {
          for (const junk of selectedSpec.junkOptions) {
            if (junk.scope !== "team") continue;

            if (isTeamCalcJunk(junk)) {
              // Low ball junk
              if (junk.calculation === "best_ball") {
                const bestLowBall = Math.min(
                  ...teamResults.map((t: TeamResultDisplay) => t.lowBall),
                );
                if (team.lowBall === bestLowBall) {
                  const tiedCount = teamResults.filter(
                    (t: TeamResultDisplay) => t.lowBall === bestLowBall,
                  ).length;
                  const pointsAwarded = junk.value / tiedCount;
                  team.junk.push(junk.name);
                  team.points += pointsAwarded;
                }
              }

              // Low total junk
              if (junk.calculation === "sum") {
                const bestTotal = Math.min(
                  ...teamResults.map((t: TeamResultDisplay) => t.total),
                );
                if (team.total === bestTotal) {
                  const tiedCount = teamResults.filter(
                    (t: TeamResultDisplay) => t.total === bestTotal,
                  ).length;
                  const pointsAwarded = junk.value / tiedCount;
                  team.junk.push(junk.name);
                  team.points += pointsAwarded;
                }
              }
            }
          }
        }
      }
    }

    return { players: playerResults, teams: teamResults };
  }, [players, scores, holePar, selectedSpec, calculatePops]);

  // Total points
  const totalPoints = useMemo(() => {
    if (selectedSpec.hasTeams) {
      return results.teams.reduce(
        (sum: number, t: TeamResultDisplay) => sum + t.points,
        0,
      );
    }
    return results.players.reduce(
      (sum: number, p: HoleResultDisplay) => sum + p.points,
      0,
    );
  }, [results, selectedSpec.hasTeams]);

  // Get display string for junk condition
  const getJunkCondition = (junk: JunkOption): string => {
    if (isScoreToParJunk(junk)) return junk.score_to_par;
    if (isLogicJunk(junk)) return junk.logic;
    if (isTeamCalcJunk(junk)) return junk.calculation;
    return "--";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scoring Explorer</h2>
          <p className="text-muted-foreground">
            Test and visualize the scoring engine with mock data
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          {/* Game Spec Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Game Spec</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                {SAMPLE_GAME_SPECS.map((spec, index) => (
                  <Button
                    key={spec.name}
                    variant={
                      selectedSpecIndex === index ? "default" : "outline"
                    }
                    className="justify-start"
                    onClick={() => handleSpecChange(index)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{spec.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {spec.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hole Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Hole Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="par">Par</Label>
                  <Input
                    id="par"
                    type="number"
                    value={holePar}
                    onChange={(e) => setHolePar(Number(e.target.value))}
                    min={3}
                    max={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocation">
                    Handicap Allocation (1=hardest)
                  </Label>
                  <Input
                    id="allocation"
                    type="number"
                    value={holeAllocation}
                    onChange={(e) => setHoleAllocation(Number(e.target.value))}
                    min={1}
                    max={18}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Handicap</TableHead>
                    {selectedSpec.hasTeams && <TableHead>Team</TableHead>}
                    <TableHead>Pops</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player, index) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Input
                          value={player.name}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            const target = newPlayers[index];
                            if (target) {
                              target.name = e.target.value;
                              setPlayers(newPlayers);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={player.handicap}
                          onChange={(e) => {
                            const newPlayers = [...players];
                            const target = newPlayers[index];
                            if (target) {
                              target.handicap = Number(e.target.value);
                              setPlayers(newPlayers);
                            }
                          }}
                          className="w-20"
                        />
                      </TableCell>
                      {selectedSpec.hasTeams && (
                        <TableCell>
                          <Badge variant="outline">Team {player.teamId}</Badge>
                        </TableCell>
                      )}
                      <TableCell>{calculatePops(player.handicap)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enter Scores</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    {selectedSpec.hasTeams && <TableHead>Team</TableHead>}
                    <TableHead>Gross</TableHead>
                    <TableHead>Pops</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>To Par</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((player) => {
                    const gross = scores[player.id] || 0;
                    const pops = calculatePops(player.handicap);
                    const net = gross > 0 ? gross - pops : 0;
                    const toPar = gross > 0 ? gross - holePar : 0;

                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          {player.name}
                        </TableCell>
                        {selectedSpec.hasTeams && (
                          <TableCell>
                            <Badge variant="outline">
                              Team {player.teamId}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>
                          <Input
                            type="number"
                            value={gross || ""}
                            onChange={(e) => {
                              setScores({
                                ...scores,
                                [player.id]: Number(e.target.value),
                              });
                            }}
                            placeholder="--"
                            className="w-20"
                            min={1}
                            max={15}
                          />
                        </TableCell>
                        <TableCell>{pops}</TableCell>
                        <TableCell>{net || "--"}</TableCell>
                        <TableCell>
                          {gross > 0 ? (
                            <Badge
                              variant={
                                toPar < 0
                                  ? "default"
                                  : toPar > 0
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {toPar > 0 ? `+${toPar}` : toPar}
                            </Badge>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Set sample scores
                    const sampleScores: Record<string, number> = {};
                    for (let i = 0; i < players.length; i++) {
                      const p = players[i];
                      if (p) {
                        sampleScores[p.id] = holePar + (i % 3) - 1; // Mix of birdie, par, bogey
                      }
                    }
                    setScores(sampleScores);
                  }}
                >
                  Fill Sample Scores
                </Button>
                <Button variant="outline" onClick={() => setScores({})}>
                  Clear Scores
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Player Results */}
          <Card>
            <CardHeader>
              <CardTitle>Player Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Player</TableHead>
                    {selectedSpec.hasTeams && <TableHead>Team</TableHead>}
                    <TableHead>Gross</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Junk</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.players
                    .filter((p) => p.gross > 0)
                    .sort((a, b) => a.rank - b.rank)
                    .map((player) => (
                      <TableRow key={player.playerId}>
                        <TableCell>
                          {player.rank}
                          {player.tieCount > 1 && (
                            <span className="text-muted-foreground text-xs ml-1">
                              (T{player.tieCount})
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {player.playerName}
                        </TableCell>
                        {selectedSpec.hasTeams && (
                          <TableCell>
                            <Badge variant="outline">
                              Team {player.teamId}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell>{player.gross}</TableCell>
                        <TableCell>{player.net}</TableCell>
                        <TableCell>
                          {player.junk.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {player.junk.map((j) => (
                                <Badge key={j} variant="secondary">
                                  {j}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            "--"
                          )}
                        </TableCell>
                        <TableCell className="font-bold">
                          {player.points > 0 ? player.points.toFixed(2) : "--"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Team Results */}
          {selectedSpec.hasTeams && results.teams.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Results</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Low Ball</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Junk</TableHead>
                      <TableHead>Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.teams
                      .sort((a, b) => a.rank - b.rank)
                      .map((team) => (
                        <TableRow key={team.teamId}>
                          <TableCell>
                            {team.rank}
                            {team.tieCount > 1 && (
                              <span className="text-muted-foreground text-xs ml-1">
                                (T{team.tieCount})
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            Team {team.teamId}
                          </TableCell>
                          <TableCell>{team.lowBall}</TableCell>
                          <TableCell>{team.total}</TableCell>
                          <TableCell>
                            {team.junk.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {team.junk.map((j) => (
                                  <Badge key={j} variant="secondary">
                                    {j}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              "--"
                            )}
                          </TableCell>
                          <TableCell className="font-bold">
                            {team.points > 0 ? team.points.toFixed(2) : "--"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    Total Points: {totalPoints.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="debug" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Junk Options</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Scope</TableHead>
                    <TableHead>Condition</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedSpec.junkOptions.map((junk) => (
                    <TableRow key={junk.name}>
                      <TableCell className="font-medium">{junk.name}</TableCell>
                      <TableCell>{junk.value}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{junk.scope}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {getJunkCondition(junk)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Raw Results (JSON)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
