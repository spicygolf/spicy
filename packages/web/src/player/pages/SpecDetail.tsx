import { useParams, Link } from "react-router-dom";
import { useCoState } from "jazz-tools/react";
import { ArrowLeft } from "lucide-react";
import {
  PlayerAccount,
  type GameCatalog,
  type GameSpec,
  type Option,
  type PlayerAccountProfile,
} from "spicylib/schema";
import { getMetaOption, getSpecField } from "spicylib/scoring";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

/**
 * SpecDetail - Detailed view of a game spec
 *
 * Shows:
 * - Full spec metadata (name, description, aliases, etc.)
 * - All options organized by type (game, junk, multiplier)
 * - Future: customization controls
 */
export function SpecDetail(): React.JSX.Element {
  const { specKey } = useParams<{ specKey: string }>();

  const workerAccountId = import.meta.env.VITE_JAZZ_WORKER_ACCOUNT || "";

  const workerAccount = useCoState(PlayerAccount, workerAccountId, {
    resolve: {
      profile: {
        catalog: {
          specs: { $each: { options: { $each: true } } },
        },
      },
    },
    select: (account) => {
      if (!account?.$isLoaded) return undefined;
      if (!account.profile?.$isLoaded) return undefined;

      const profile = account.profile as PlayerAccountProfile;
      const catalog = profile.catalog;
      if (!catalog?.$isLoaded) return undefined;
      if (!catalog.specs?.$isLoaded) return undefined;

      return account;
    },
  });

  const catalog = workerAccount
    ? ((workerAccount.profile as PlayerAccountProfile).catalog as GameCatalog)
    : undefined;
  const specs = catalog?.specs;

  // Find the spec by key
  const spec = specKey && specs?.$isLoaded ? specs[specKey] : undefined;

  // Loading state
  if (!workerAccount || !specs?.$isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Not found state
  if (!spec?.$isLoaded) {
    return (
      <div className="space-y-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to specs
        </Link>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Game spec not found: {specKey}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <SpecDetailContent spec={spec} />;
}

interface SpecDetailContentProps {
  spec: GameSpec;
}

function SpecDetailContent({
  spec,
}: SpecDetailContentProps): React.JSX.Element {
  // Get metadata from meta options
  const short = getSpecField(spec, "short");
  const aliases = getMetaOption(spec, "aliases");
  const specType = getSpecField(spec, "spec_type") ?? spec.spec_type;
  const minPlayers = getSpecField(spec, "min_players") ?? spec.min_players;
  const maxPlayers = getSpecField(spec, "max_players");
  const status = getSpecField(spec, "status") ?? spec.status;
  const locationType =
    getSpecField(spec, "location_type") ?? spec.location_type;
  const longDescription =
    getSpecField(spec, "long_description") ?? spec.long_description;

  // Collect options by type
  const gameOptions: Option[] = [];
  const junkOptions: Option[] = [];
  const multiplierOptions: Option[] = [];
  const metaOptions: Option[] = [];

  if (spec.options?.$isLoaded) {
    for (const key of Object.keys(spec.options)) {
      if (key.startsWith("$") || key === "_refs") continue;
      if (!spec.options.$jazz.has(key)) continue;
      const opt = spec.options[key];
      if (opt?.$isLoaded) {
        switch (opt.type) {
          case "game":
            gameOptions.push(opt);
            break;
          case "junk":
            junkOptions.push(opt);
            break;
          case "multiplier":
            multiplierOptions.push(opt);
            break;
          case "meta":
            metaOptions.push(opt);
            break;
        }
      }
    }
  }

  // Sort options by seq
  const sortBySeq = (a: Option, b: Option) => (a.seq ?? 999) - (b.seq ?? 999);
  gameOptions.sort(sortBySeq);
  junkOptions.sort(sortBySeq);
  multiplierOptions.sort(sortBySeq);

  // Format player count
  const playerCount =
    minPlayers === maxPlayers
      ? `${minPlayers} players`
      : maxPlayers
        ? `${minPlayers}-${maxPlayers} players`
        : `${minPlayers}+ players`;

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to specs
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{spec.name}</h1>
            {short && (
              <p className="text-lg text-muted-foreground font-mono">{short}</p>
            )}
          </div>
          <div className="flex gap-2">
            {status === "dev" && <Badge variant="secondary">Development</Badge>}
            {status === "test" && <Badge variant="outline">Test</Badge>}
          </div>
        </div>
        {Array.isArray(aliases) && aliases.length > 0 && (
          <p className="text-muted-foreground">
            Also known as: {aliases.join(", ")}
          </p>
        )}
        <div className="flex flex-wrap gap-2 text-sm">
          <Badge variant="outline" className="capitalize">
            {specType}
          </Badge>
          <Badge variant="outline">{playerCount}</Badge>
          {locationType && (
            <Badge variant="outline" className="capitalize">
              {locationType === "local" ? "Same Foursome" : "Virtual"}
            </Badge>
          )}
        </div>
      </div>

      {/* Description */}
      {longDescription && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {longDescription}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Game Options */}
      {gameOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Game Options</CardTitle>
            <CardDescription>
              Configuration settings for this game type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gameOptions.map((opt) => (
                <OptionRow key={opt.name} option={opt} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Junk Options */}
      {junkOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Junk (Points/Skins)</CardTitle>
            <CardDescription>Point values and scoring bonuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {junkOptions.map((opt) => (
                <OptionRow key={opt.name} option={opt} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multiplier Options */}
      {multiplierOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Multipliers</CardTitle>
            <CardDescription>
              Press, double, and other multipliers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {multiplierOptions.map((opt) => (
                <OptionRow key={opt.name} option={opt} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future: Start Game / Customize buttons */}
      <div className="flex gap-4">
        <Button size="lg" disabled>
          Start Game (Coming Soon)
        </Button>
        <Button variant="outline" size="lg" disabled>
          Customize
        </Button>
      </div>
    </div>
  );
}

interface OptionRowProps {
  option: Option;
}

function OptionRow({ option }: OptionRowProps): React.JSX.Element {
  // Display varies by option type
  let valueDisplay: React.ReactNode = null;

  switch (option.type) {
    case "game": {
      const defaultVal = option.defaultValue;
      if (option.valueType === "bool") {
        valueDisplay = defaultVal === "true" ? "Yes" : "No";
      } else if (option.valueType === "menu" && option.choices?.$isLoaded) {
        const choice = option.choices.find(
          (c) => c?.$isLoaded && c.name === defaultVal,
        );
        valueDisplay = choice?.$isLoaded ? choice.disp : defaultVal;
      } else {
        valueDisplay = defaultVal;
      }
      break;
    }
    case "junk":
      valueDisplay = `${option.value} ${option.value === 1 ? "point" : "points"}`;
      break;
    case "multiplier":
      valueDisplay = `${option.value}x`;
      break;
    default:
      valueDisplay = null;
  }

  // teamOnly only exists on GameOption
  const isTeamOnly = option.type === "game" && option.teamOnly;

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div>
        <span className="font-medium">{option.disp}</span>
        {isTeamOnly && (
          <Badge variant="outline" className="ml-2 text-xs">
            Team
          </Badge>
        )}
      </div>
      {valueDisplay && (
        <span className="text-muted-foreground">{valueDisplay}</span>
      )}
    </div>
  );
}
