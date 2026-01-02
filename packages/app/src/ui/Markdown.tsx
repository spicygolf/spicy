// biome-ignore lint/style/noRestrictedImports: RNText needed for onPress support
import { Linking, Text as RNText, View } from "react-native";
import {
  type MarkdownNode,
  parseMarkdownWithOptions,
} from "react-native-nitro-markdown";
import { StyleSheet } from "react-native-unistyles";
import { Text } from "./Text";

interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps) {
  const ast = parseMarkdownWithOptions(children, { gfm: true });
  return <MarkdownRenderer node={ast} />;
}

interface RendererProps {
  node: MarkdownNode;
}

function MarkdownRenderer({ node }: RendererProps) {
  const renderChildren = (children: MarkdownNode[] | undefined) =>
    children?.map((child, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: AST nodes don't have stable IDs
      <MarkdownRenderer key={i} node={child} />
    ));

  switch (node.type) {
    case "document":
      return <View>{renderChildren(node.children)}</View>;

    case "heading": {
      const headingStyle = getHeadingStyle(node.level);
      return <Text style={headingStyle}>{renderChildren(node.children)}</Text>;
    }

    case "paragraph":
      return (
        <Text style={styles.paragraph}>{renderChildren(node.children)}</Text>
      );

    case "text":
      return <Text>{node.content}</Text>;

    case "bold":
      return <Text style={styles.bold}>{renderChildren(node.children)}</Text>;

    case "italic":
      return <Text style={styles.italic}>{renderChildren(node.children)}</Text>;

    case "strikethrough":
      return (
        <Text style={styles.strikethrough}>
          {renderChildren(node.children)}
        </Text>
      );

    case "link":
      return (
        <RNText
          style={styles.link}
          onPress={() => node.href && Linking.openURL(node.href)}
        >
          {renderChildren(node.children)}
        </RNText>
      );

    case "code_inline":
      return <Text style={styles.codeInline}>{node.content}</Text>;

    case "code_block":
      return (
        <View style={styles.codeBlock}>
          <Text style={styles.codeBlockText}>{node.content}</Text>
        </View>
      );

    case "blockquote":
      return (
        <View style={styles.blockquote}>{renderChildren(node.children)}</View>
      );

    case "list":
      return <View style={styles.list}>{renderChildren(node.children)}</View>;

    case "list_item":
      return (
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>•</Text>
          <View style={styles.listItemContent}>
            {renderChildren(node.children)}
          </View>
        </View>
      );

    case "task_list_item":
      return (
        <View style={styles.listItem}>
          <Text style={styles.listBullet}>{node.checked ? "☑" : "☐"}</Text>
          <View style={styles.listItemContent}>
            {renderChildren(node.children)}
          </View>
        </View>
      );

    default:
      if (node.children) {
        return <>{renderChildren(node.children)}</>;
      }
      return null;
  }
}

function getHeadingStyle(level: number | undefined) {
  switch (level) {
    case 1:
      return styles.h1;
    case 2:
      return styles.h2;
    case 3:
      return styles.h3;
    case 4:
      return styles.h4;
    case 5:
      return styles.h5;
    case 6:
      return styles.h6;
    default:
      return styles.h1;
  }
}

const styles = StyleSheet.create((theme) => ({
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
    color: theme.colors.primary,
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.gap(1),
    color: theme.colors.primary,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  h4: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  h5: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  h6: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: theme.gap(0.5),
    color: theme.colors.primary,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: theme.gap(1),
    color: theme.colors.primary,
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  strikethrough: {
    textDecorationLine: "line-through",
  },
  link: {
    color: theme.colors.action,
    textDecorationLine: "underline",
  },
  codeInline: {
    fontFamily: "monospace",
    backgroundColor: theme.colors.border,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  codeBlock: {
    backgroundColor: theme.colors.border,
    padding: theme.gap(1),
    borderRadius: 8,
    marginBottom: theme.gap(1),
  },
  codeBlockText: {
    fontFamily: "monospace",
    fontSize: 12,
    color: theme.colors.primary,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.action,
    paddingLeft: theme.gap(1),
    marginLeft: theme.gap(0.5),
    marginBottom: theme.gap(1),
  },
  list: {
    marginBottom: theme.gap(1),
  },
  listItem: {
    flexDirection: "row",
    marginBottom: theme.gap(0.5),
  },
  listBullet: {
    width: 16,
    color: theme.colors.primary,
  },
  listItemContent: {
    flex: 1,
  },
}));
